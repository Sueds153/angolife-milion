"""
SGAI News Scraper — Camada de avaliação ScrapeGraphAI + Gemini
==============================================================
Motor candidato baseado em LLM (sem seletores CSS fixos). Roda em PARALELO
ao scraper tradicional (BeautifulSoup) sem tocar no Supabase por padrão.

Uso:
    python scraper/sgai_news_scraper.py                          # dry-run → JSONL
    python scraper/sgai_news_scraper.py --sites "Expansão,ANGOP"
    python scraper/sgai_news_scraper.py --max-per-site 5
    python scraper/sgai_news_scraper.py --commit                 # insere em news_articles
    python scraper/sgai_news_scraper.py --model google_generativeai/gemini-2.5-flash

Requer:
    pip install -r scraper/requirements-sgai.txt
    playwright install chromium
    GEMINI_API_KEY preenchido no .env.local
"""

from __future__ import annotations

import argparse
import html
import json
import os
import re
import sys
import time
import traceback
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib.parse import urljoin

from dotenv import load_dotenv
from pydantic import BaseModel, Field

# ─────────────────────────────────────────────
# REUTILIZA o scraper tradicional (cliente Supabase, fontes, placeholders)
# ─────────────────────────────────────────────
SCRAPER_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRAPER_DIR))

from news_scraper import (  # noqa: E402
    AngoNewsScraper,
    CULTURE_KEYWORDS,
    ECONOMY_KEYWORDS,
    OPPORTUNITY_KEYWORDS,
    PRIORITY_KEYWORDS,
    RESOLVEAO_PLACEHOLDER,
    SITES_CONFIG,
    SupabaseRestClient,
    is_junk_url,
)

try:
    import urllib3

    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
except Exception:
    pass

# Só importa após definir paths — scrapegraphai é pesado
try:
    from scrapegraphai.graphs import SmartScraperGraph
except ImportError:
    print("❌ scrapegraphai não instalado. Rode: pip install -r scraper/requirements-sgai.txt")
    sys.exit(1)


def log(msg: str) -> None:
    try:
        print(msg, flush=True)
    except UnicodeEncodeError:
        enc = getattr(sys.stdout, "encoding", None) or "utf-8"
        print(msg.encode(enc, errors="replace").decode(enc, errors="replace"), flush=True)


# Console Windows (cp125) quebra com blocos/emoji — força UTF-8 quando possível
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[attr-defined]
    except Exception:
        pass


# ─────────────────────────────────────────────
# SCHEMAS (saída estruturada do LLM)
# ─────────────────────────────────────────────
class ListingItem(BaseModel):
    titulo: str = Field(description="Titulo completo da noticia")
    url: str = Field(description="URL absoluta da noticia")


class ListingResult(BaseModel):
    articles: List[ListingItem] = Field(description="Lista de artigos da pagina")


class DetailResult(BaseModel):
    titulo: str = Field(description="Titulo final da noticia")
    corpo: str = Field(default="", description="Corpo textual da noticia")
    imagem_url: str = Field(default="", description="URL absoluta da imagem de destaque")
    data_publicacao: str = Field(default="", description="Data de publicacao visivel ou vazio")


# ─────────────────────────────────────────────
# CLASSIFICACAO (espelho da logica do scraper tradicional)
# ─────────────────────────────────────────────
def classify(title: str, fixed_category: str) -> tuple:
    t = title or ""
    is_priority = any(kw.lower() in t.lower() for kw in PRIORITY_KEYWORDS)
    if any(kw.lower() in t.lower() for kw in OPPORTUNITY_KEYWORDS):
        return "Oportunidades", is_priority
    if any(kw.lower() in t.lower() for kw in ECONOMY_KEYWORDS):
        return "Economia", is_priority
    if any(kw.lower() in t.lower() for kw in CULTURE_KEYWORDS):
        return "Cultura", is_priority
    return fixed_category or "Geral", is_priority


def make_summary(text: str, max_len: int = 220) -> str:
    clean = re.sub(r"\s+", " ", text or "").strip()
    return (clean[:max_len] + "...") if len(clean) > max_len else clean


def normalize_url(url: str, base_url: str) -> str:
    if not url:
        return ""
    url = url.strip()
    if url.startswith("http"):
        return url
    if url.startswith("//"):
        return "https:" + url
    return urljoin(base_url, url)


def is_junk_title(title: str) -> bool:
    t = (title or "").strip()
    if len(t) < 5:
        return True
    s = t.lower()
    if re.search(r"(página inicial|pagina inicial|não encontrado|nao encontrado|error 404)", s):
        return True
    if s in {"home", "início", "inicio", "notícias", "noticias", "últimas", "ultimas", "404"}:
        return True
    return False


# ─────────────────────────────────────────────
# PARSING TOLERANTE DE RESULTADOS DO LLM
# ─────────────────────────────────────────────
def as_listing(result: Any) -> List[Dict[str, str]]:
    if isinstance(result, list):
        return [x for x in result if isinstance(x, dict)]
    if isinstance(result, dict):
        for key in ("articles", "items", "noticias", "artigos", "result", "data"):
            v = result.get(key)
            if isinstance(v, list):
                return [x for x in v if isinstance(x, dict)]
        # Um único objeto solto também serve
        if "titulo" in result or "title" in result or "url" in result:
            return [result]
    return []


def as_detail(result: Any) -> Dict[str, str]:
    if not isinstance(result, dict):
        return {}
    return {
        "titulo": str(result.get("titulo") or result.get("title") or ""),
        "corpo": str(result.get("corpo") or result.get("content") or result.get("body") or ""),
        "imagem_url": str(
            result.get("imagem_url") or result.get("image_url") or result.get("imagem") or ""
        ),
        "data_publicacao": str(
            result.get("data_publicacao") or result.get("date") or result.get("data") or ""
        ),
    }


def corpo_to_html(corpo: str) -> str:
    """news_articles.corpo guarda HTML; se o LLM devolver texto puro, embrulha em <p>."""
    if not corpo:
        return ""
    if "<p" in corpo or "<div" in corpo or "<br" in corpo:
        return corpo
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n|\r\n\r\n", corpo) if p.strip()]
    if len(paragraphs) <= 1:
        paragraphs = [p.strip() for p in corpo.split("\n") if p.strip()] or [corpo.strip()]
    return "".join(f"<p>{html.escape(p)}</p>" for p in paragraphs)


# ─────────────────────────────────────────────
# CONFIG LLM
# ─────────────────────────────────────────────
def build_graph_config(model: str, api_key: str, verbose: bool = False) -> Dict[str, Any]:
    return {
        "llm": {
            "model": model,
            "api_key": api_key,
            "temperature": 0,
            "model_tokens": 8192,
        },
        "verbose": verbose,
        "headless": True,
        "browser_type": "chromium",
    }


LIST_PROMPT = """\
Esta e a pagina de listagem de noticias de {site}. Extrai TODOS os artigos/noticias visiveis.
Para cada um devolve:
- titulo: texto completo do titulo da noticia
- url: URL ABSOLUTA da noticia (resolve caminhos relativos usando {base})
Ignora menus, rodapes, publicidade, tags, links de categorias e compartilhamento.
Sem texto fora do JSON."""

DETAIL_PROMPT = """\
Esta e a pagina de uma noticia de {site}. Extrai:
- titulo: titulo final da noticia
- corpo: corpo completo do texto da noticia (apenas paragrafos do artigo; sem menus, rodapes, comentarios ou publicidade)
- imagem_url: URL absoluta da imagem de destaque (og:image ou primeira imagem do artigo); string vazia se nao houver
- data_publicacao: data de publicacao visivel na pagina; string vazia se nao houver
Sem texto fora do JSON."""


def meta_fallback(article_url: str) -> Dict[str, str]:
    """Preenche imagem/data com meta tags (og:image, time) — sem LLM."""
    out: Dict[str, str] = {}
    try:
        import requests as _rq
        from bs4 import BeautifulSoup as _BS

        headers = dict(AngoNewsScraper.DEFAULT_HEADERS)
        resp = _rq.get(article_url, headers=headers, timeout=15, verify=False)
        resp.raise_for_status()
        soup = _BS(resp.text, "html.parser")
        og = soup.find("meta", property="og:image")
        if og and og.get("content"):
            img = og["content"].strip()
            # Sites angolanos por vezes emitem "https:/dominio" (barra em falta)
            img = re.sub(r"^https:/([^/])", r"https://\1", img)
            if img.startswith("http"):
                out["imagem_url"] = img
            elif img.startswith("//"):
                out["imagem_url"] = "https:" + img
        if not out.get("imagem_url"):
            tw = soup.find("meta", attrs={"name": "twitter:image"})
            if tw and tw.get("content"):
                timg = re.sub(r"^https:/([^/])", r"https://\1", tw["content"].strip())
                if timg.startswith("http"):
                    out["imagem_url"] = timg
        pub = (
            soup.find("meta", property="article:published_time")
            or soup.find("meta", attrs={"name": "date"})
            or soup.find("time", datetime=True)
        )
        if pub:
            val = (pub.get("content") or pub.get("datetime") or "").strip()
            # Unix timestamp (ex.: ANGOP) → ISO legível
            if val.isdigit() and len(val) == 10:
                try:
                    val = datetime.fromtimestamp(int(val), tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
                except Exception:
                    pass
            if val:
                out.setdefault("data_publicacao", val[:40])
    except Exception:
        pass
    return out


def sgai_listing(site_name: str, cfg: dict, graph_cfg: dict, max_listing: int = 12) -> List[Dict[str, str]]:
    """Listagem via LLM — reutilizável pelo fallback do scraper BS4."""
    prompt = LIST_PROMPT.format(site=site_name, base=cfg["base_url"])
    graph = SmartScraperGraph(
        prompt=prompt,
        source=cfg["list_url"],
        config=graph_cfg,
        schema=ListingResult,
    )
    raw = graph.run()
    items = as_listing(raw)
    cleaned: List[Dict[str, str]] = []
    for it in items:
        titulo = re.sub(r"\s+", " ", str(it.get("titulo") or it.get("title") or "")).strip()
        url = normalize_url(str(it.get("url") or it.get("link") or ""), cfg["base_url"])
        if not url or url.rstrip("/") in {
            cfg["base_url"].rstrip("/"),
            cfg["list_url"].rstrip("/"),
        }:
            continue
        if is_junk_url(url):
            continue
        if is_junk_title(titulo):
            continue
        cleaned.append({"titulo": titulo, "url": url})
    seen = set()
    uniq = []
    for it in cleaned:
        if it["url"] in seen:
            continue
        seen.add(it["url"])
        uniq.append(it)
    return uniq[:max_listing]


def sgai_detail(site_name: str, article_url: str, graph_cfg: dict) -> Dict[str, str]:
    """Detalhe via LLM + fallback meta-tag — reutilizável pelo scraper BS4."""
    prompt = DETAIL_PROMPT.format(site=site_name)
    graph = SmartScraperGraph(
        prompt=prompt,
        source=article_url,
        config=graph_cfg,
        schema=DetailResult,
    )
    raw = graph.run()
    detail = as_detail(raw)
    if not (detail.get("imagem_url") or "").strip() or not (detail.get("data_publicacao") or "").strip():
        meta = meta_fallback(article_url)
        if not (detail.get("imagem_url") or "").strip() and meta.get("imagem_url"):
            detail["imagem_url"] = meta["imagem_url"]
        if not (detail.get("data_publicacao") or "").strip() and meta.get("data_publicacao"):
            detail["data_publicacao"] = meta["data_publicacao"]
    return detail


# ─────────────────────────────────────────────
# SCRAPER SGAI
# ─────────────────────────────────────────────
class SgaiNewsScraper:
    def __init__(self, args: argparse.Namespace):
        self.args = args
        self.db: Optional[SupabaseRestClient] = None
        if args.commit:
            url = os.getenv("VITE_SUPABASE_URL")
            key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")
            if not url or not key:
                raise SystemExit("❌ --commit requer VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local")
            self.db = SupabaseRestClient(url, key)
        elif os.getenv("VITE_SUPABASE_URL") and (
            os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")
        ):
            # Dedup online mesmo em dry-run (não insere, só consulta)
            self.db = SupabaseRestClient(
                os.getenv("VITE_SUPABASE_URL"),
                os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY"),
            )

        self.graph_cfg = build_graph_config(args.model, args.api_key, verbose=args.verbose)
        self.records: List[Dict[str, Any]] = []
        self.stats = {
            "sites": 0,
            "listing_ok": 0,
            "listing_fail": 0,
            "processed": 0,
            "saved": 0,
            "skipped_dup": 0,
            "errors": 0,
            "titulo_ok": 0,
            "corpo_ok": 0,
            "imagem_ok": 0,
            "data_ok": 0,
        }

    # ── Dedup ─────────────────────────────────────────────────────────
    def is_duplicate(self, url: str) -> bool:
        if not self.db:
            return False
        try:
            res = self.db.select("news_articles", filters={"url_origem": f"eq.{url}"}, columns="id")
            return len(res) > 0
        except Exception as e:
            log(f"  ⚠️ Dedup falhou (seguindo): {e}")
            return False

    # ── Listagem ──────────────────────────────────────────────────────
    def fetch_listing(self, site_name: str, cfg: dict) -> List[Dict[str, str]]:
        return sgai_listing(site_name, cfg, self.graph_cfg, max_listing=self.args.max_listing)

    def fetch_detail(self, site_name: str, article_url: str) -> Dict[str, str]:
        return sgai_detail(site_name, article_url, self.graph_cfg)

    # ── Registro / gravação ──────────────────────────────────────────
    def record(self, rec: Dict[str, Any]) -> None:
        self.records.append(rec)

    def build_payload(
        self, site_name: str, cfg: dict, article_url: str, title: str, detail: Dict[str, str]
    ) -> Dict[str, Any]:
        final_title = (detail.get("titulo") or title or "").strip()
        if is_junk_title(final_title):
            final_title = title
        corpo_html = corpo_to_html(detail.get("corpo") or "")
        summary = make_summary(re.sub(r"<[^>]+>", " ", corpo_html) or title, 220)
        image = detail.get("imagem_url") or RESOLVEAO_PLACEHOLDER
        if not image.startswith("http"):
            image = RESOLVEAO_PLACEHOLDER
        categoria, is_priority = classify(final_title, cfg.get("fixed_category", "Geral"))
        payload: Dict[str, Any] = {
            "titulo": final_title[:500],
            "resumo": (summary or "")[:1000],
            "corpo": corpo_html[:50000],
            "imagem_url": image,
            "categoria": categoria or "Geral",
            "fonte": site_name,
            "url_origem": article_url,
            "is_priority": bool(is_priority),
            "status": "pendente",
        }
        # Data de publicação → coluna published_at (timestamptz)
        raw_date = (detail.get("data_publicacao") or "").strip()
        if raw_date:
            iso_date = AngoNewsScraper._to_iso(raw_date)
            if iso_date:
                payload["published_at"] = iso_date
        return payload

    # ── Site ──────────────────────────────────────────────────────────
    def scrape_site(self, site_name: str, cfg: dict) -> None:
        self.stats["sites"] += 1
        log(f"\n{'═' * 60}\n🌐 SITE (SGAI): {site_name} | {cfg['list_url']}\n{'═' * 60}")
        t0 = time.time()
        try:
            items = self.fetch_listing(site_name, cfg)
        except Exception as e:
            log(f"  ❌ Listagem falhou: {e}")
            traceback.print_exc(limit=2)
            self.stats["listing_fail"] += 1
            self.stats["errors"] += 1
            self.record(
                {
                    "engine": "scrapegraphai",
                    "site": site_name,
                    "stage": "listing",
                    "ok": False,
                    "error": str(e)[:300],
                    "seconds": round(time.time() - t0, 2),
                    "ts": datetime.now(timezone.utc).isoformat(),
                }
            )
            return

        self.stats["listing_ok"] += 1
        log(f"  📋 {len(items)} artigos na listagem (LLM)")

        saved_here = 0
        for item in items:
            if saved_here >= self.args.max_per_site:
                break
            if self.args.dry_run_max and self.stats["processed"] >= self.args.dry_run_max:
                log("  ⏹️  Limite --dry-run-max atingido")
                break

            article_url = item["url"]
            title = item["titulo"]

            if self.is_duplicate(article_url):
                log(f"  ⏭️  Já existe: {article_url[:70]}")
                self.stats["skipped_dup"] += 1
                self.record(
                    {
                        "engine": "scrapegraphai",
                        "site": site_name,
                        "stage": "dedup",
                        "url": article_url,
                        "titulo": title,
                        "ok": False,
                        "duplicate": True,
                        "ts": datetime.now(timezone.utc).isoformat(),
                    }
                )
                continue

            self.stats["processed"] += 1
            log(f"  ✨ [{self.stats['processed']}] {title[:65]}...")
            ta = time.time()
            try:
                detail = self.fetch_detail(site_name, article_url)
                secs = round(time.time() - ta, 2)

                titulo_ok = bool(detail.get("titulo")) and not is_junk_title(detail["titulo"])
                corpo_ok = bool((detail.get("corpo") or "").strip())
                imagem_ok = bool((detail.get("imagem_url") or "").strip())
                data_ok = bool((detail.get("data_publicacao") or "").strip())
                if titulo_ok:
                    self.stats["titulo_ok"] += 1
                if corpo_ok:
                    self.stats["corpo_ok"] += 1
                if imagem_ok:
                    self.stats["imagem_ok"] += 1
                if data_ok:
                    self.stats["data_ok"] += 1

                payload = self.build_payload(site_name, cfg, article_url, title, detail)

                saved = False
                if self.args.commit and self.db:
                    saved = self.db.insert("news_articles", payload)
                    if saved:
                        self.stats["saved"] += 1
                        saved_here += 1

                self.record(
                    {
                        "engine": "scrapegraphai",
                        "site": site_name,
                        "stage": "article",
                        "ok": True,
                        "url": article_url,
                        "titulo": payload["titulo"],
                        "titulo_ok": titulo_ok,
                        "corpo_ok": corpo_ok,
                        "imagem_ok": imagem_ok,
                        "data_ok": data_ok,
                        "categoria": payload["categoria"],
                        "is_priority": payload["is_priority"],
                        "committed": saved,
                        "seconds": secs,
                        "ts": datetime.now(timezone.utc).isoformat(),
                    }
                )
                mark = "💾" if saved else "📝"
                log(
                    f"    {mark} {'Guardada' if saved else 'Dry-run'} | "
                    f"corpo={'✓' if corpo_ok else '✗'} img={'✓' if imagem_ok else '✗'} "
                    f"data={'✓' if data_ok else '✗'} | {secs}s"
                )
                time.sleep(self.args.delay)

            except Exception as e:
                log(f"  ⚠️ Erro no artigo: {e}")
                traceback.print_exc(limit=2)
                self.stats["errors"] += 1
                self.record(
                    {
                        "engine": "scrapegraphai",
                        "site": site_name,
                        "stage": "article",
                        "ok": False,
                        "url": article_url,
                        "titulo": title,
                        "error": str(e)[:300],
                        "seconds": round(time.time() - ta, 2),
                        "ts": datetime.now(timezone.utc).isoformat(),
                    }
                )

        time.sleep(2)

    # ── Main ──────────────────────────────────────────────────────────
    def run(self) -> Path:
        sites = self.select_sites()
        mode = "COMMIT → news_articles" if self.args.commit else "DRY-RUN (JSONL)"
        log(f"\n{'█' * 60}")
        log(f"  SGAI News Scraper — ScrapeGraphAI + Gemini")
        log(f"  Modo: {mode}")
        log(f"  Modelo: {self.args.model}")
        log(f"  Fontes: {len(sites)} | máx/site: {self.args.max_per_site}")
        log(f"  {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
        log(f"{'█' * 60}\n")

        started = time.time()
        for site_name, cfg in sites.items():
            try:
                self.scrape_site(site_name, cfg)
            except KeyboardInterrupt:
                log("\n⏹️  Interrompido pelo utilizador.")
                break
            except Exception as e:
                log(f"❌ SITE FALHADO: {site_name} | {e}")
                traceback.print_exc(limit=2)
                self.stats["errors"] += 1

        elapsed = round(time.time() - started, 1)
        out_dir = SCRAPER_DIR / "sgai_results"
        out_dir.mkdir(exist_ok=True)
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        jsonl_path = out_dir / f"sgai_{stamp}.jsonl"
        with open(jsonl_path, "w", encoding="utf-8") as f:
            for rec in self.records:
                f.write(json.dumps(rec, ensure_ascii=False) + "\n")

        summary = {
            "engine": "scrapegraphai",
            "model": self.args.model,
            "mode": "commit" if self.args.commit else "dry-run",
            "elapsed_sec": elapsed,
            "stats": self.stats,
            "jsonl": str(jsonl_path),
            "finished_at": datetime.now(timezone.utc).isoformat(),
        }
        summary_path = out_dir / f"sgai_{stamp}_summary.json"
        summary_path.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")

        s = self.stats
        proc = s["processed"] or 0
        log(f"\n{'█' * 60}")
        log(f"  ✅ CONCLUÍDO em {elapsed}s")
        log(f"  🌐 Sites: {s['sites']} | listagem OK: {s['listing_ok']} | falhou: {s['listing_fail']}")
        log(f"  📰 Processados: {proc} | Guardados: {s['saved']} | Duplicados: {s['skipped_dup']}")
        if proc:
            log(
                f"  📊 Completude: título {s['titulo_ok']}/{proc} | corpo {s['corpo_ok']}/{proc} | "
                f"imagem {s['imagem_ok']}/{proc} | data {s['data_ok']}/{proc}"
            )
        log(f"  ❌ Erros: {s['errors']}")
        log(f"  💾 JSONL: {jsonl_path}")
        log(f"  💾 Resumo: {summary_path}")
        log(f"{'█' * 60}\n")
        return jsonl_path

    def select_sites(self) -> Dict[str, dict]:
        if not self.args.sites:
            return dict(SITES_CONFIG)
        wanted = {w.strip().lower() for w in self.args.sites.split(",") if w.strip()}
        selected = {k: v for k, v in SITES_CONFIG.items() if k.strip().lower() in wanted}
        missing = wanted - {k.strip().lower() for k in selected}
        if missing:
            log(f"⚠️  Fontes não encontradas: {', '.join(sorted(missing))}")
            log(f"   Disponíveis: {', '.join(SITES_CONFIG)}")
        if not selected:
            raise SystemExit("❌ Nenhuma fonte selecionada.")
        return selected


# ─────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────
def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="SGAI News Scraper (avaliação ScrapeGraphAI + Gemini)")
    p.add_argument("--sites", type=str, default="", help='Lista separada por vírgulas (ex.: "Expansão,ANGOP")')
    p.add_argument("--max-per-site", type=int, default=5, help="Artigos novos por site (default 5)")
    p.add_argument("--max-listing", type=int, default=12, help="Máx de itens da listagem (default 12)")
    p.add_argument(
        "--model",
        type=str,
        default=os.getenv("SGAI_GEMINI_MODEL", "google_genai/gemini-3.6-flash"),
        help="Modelo LLM (default google_genai/gemini-3.6-flash)",
    )
    p.add_argument("--commit", action="store_true", help="Insere em news_articles (senão: dry-run)")
    p.add_argument("--delay", type=float, default=1.0, help="Pausa entre artigos (s)")
    p.add_argument("--dry-run-max", type=int, default=0, help="Parar após N artigos processados (0 = sem limite)")
    p.add_argument("--verbose", action="store_true", help="Verbose do ScrapeGraphAI")
    return p.parse_args()


def main() -> None:
    args = parse_args()
    env_path = SCRAPER_DIR.parent / ".env.local"
    load_dotenv(dotenv_path=env_path)

    args.api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not args.api_key:
        print(f"❌ GEMINI_API_KEY vazia. Preencha em: {env_path}")
        print("   (use o mesmo valor do secret GEMINI_API_KEY do Supabase)")
        sys.exit(1)

    scraper = SgaiNewsScraper(args)
    scraper.run()


if __name__ == "__main__":
    main()
