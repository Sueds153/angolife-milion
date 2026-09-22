"""
compare_engines.py — Relatório de avaliação: ScrapeGraphAI vs BeautifulSoup
============================================================================
Lê o JSONL gerado pelo sgai_news_scraper.py e compara com uma execução
 SOMENTE-LEITURA do motor tradicional (mesmos seletores do news_scraper.py).

Uso:
    python scraper/compare_engines.py                     # mais recente + baseline BS4 (listagem)
    python scraper/compare_engines.py --full              # inclui detalhe BS4 (mais lento)
    python scraper/compare_engines.py --jsonl scraper/sgai_results/sgai_XXX.jsonl
    python scraper/compare_engines.py --sites "Expansão,ANGOP"
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests
from bs4 import BeautifulSoup

SCRAPER_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRAPER_DIR))

from news_scraper import AngoNewsScraper, SITES_CONFIG  # noqa: E402

# ─────────────────────────────────────────────
# SGAI (JSONL)
# ─────────────────────────────────────────────
def load_sgai(path: Optional[Path]) -> Dict[str, Any]:
    if path is None:
        results = sorted((SCRAPER_DIR / "sgai_results").glob("sgai_*_summary.json"))
        if results:
            summary = json.loads(results[-1].read_text(encoding="utf-8"))
            path = Path(summary.get("jsonl", ""))
        else:
            jsonls = sorted((SCRAPER_DIR / "sgai_results").glob("sgai_*.jsonl"))
            if not jsonls:
                raise SystemExit("❌ Nenhum JSONL em scraper/sgai_results/ — rode o sgai_news_scraper.py primeiro.")
            path = jsonls[-1]

    records = [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]
    per_site: Dict[str, Dict[str, Any]] = defaultdict(
        lambda: {"articles": 0, "ok": 0, "listing_fail": 0, "titulo_ok": 0, "corpo_ok": 0, "imagem_ok": 0, "data_ok": 0, "dup": 0, "errors": 0, "seconds": []}
    )
    for r in records:
        site = r.get("site", "?")
        st = per_site[site]
        if r.get("stage") == "listing" and not r.get("ok"):
            st["listing_fail"] += 1
            st["errors"] += 1
            continue
        if r.get("duplicate"):
            st["dup"] += 1
            continue
        if r.get("stage") == "article":
            st["articles"] += 1
            if r.get("ok"):
                st["ok"] += 1
                for f in ("titulo_ok", "corpo_ok", "imagem_ok", "data_ok"):
                    if r.get(f):
                        st[f] += 1
                if r.get("seconds"):
                    st["seconds"].append(float(r["seconds"]))
            else:
                st["errors"] += 1
    return {"path": str(path), "sites": dict(per_site)}


# ─────────────────────────────────────────────
# BS4 (baseline somente leitura)
# ─────────────────────────────────────────────
def fetch_html(url: str, extra_headers: dict = None, verify: bool = True) -> Optional[str]:
    headers = dict(AngoNewsScraper.DEFAULT_HEADERS)
    if extra_headers:
        headers.update(extra_headers)
    try:
        resp = requests.get(url, headers=headers, timeout=20, verify=verify)
        resp.raise_for_status()
        return resp.text
    except Exception as e:
        print(f"    ⚠️ Fetch falhou: {e}")
        return None


def run_bs4_baseline(sites: Dict[str, dict], full: bool, max_per_site: int) -> Dict[str, Dict[str, Any]]:
    out: Dict[str, Dict[str, Any]] = {}
    for site_name, cfg in sites.items():
        print(f"\n🌐 BS4 baseline: {site_name} | {cfg['list_url']}")
        st = {
            "listing_found": 0,
            "listing_ok": False,
            "articles": 0,
            "titulo_ok": 0,
            "corpo_ok": 0,
            "imagem_ok": 0,
            "data_ok": 0,  # BS4 atual NÃO extrai data — sempre 0
            "errors": 0,
            "seconds": [],
        }
        t0 = time.time()
        html = fetch_html(cfg["list_url"], cfg.get("extra_headers"), cfg.get("verify_ssl", True))
        if not html:
            st["errors"] += 1
            out[site_name] = st
            continue

        soup = BeautifulSoup(html, "html.parser")
        articles = soup.select(cfg["article_selector"])
        st["listing_found"] = len(articles)
        st["listing_ok"] = len(articles) > 0
        st["seconds"].append(round(time.time() - t0, 2))

        if not full:
            out[site_name] = st
            continue

        processed = 0
        for art in articles:
            if processed >= max_per_site:
                break
            try:
                if cfg["link_selector"] == ".":
                    raw_url = art.get("href", "")
                else:
                    link = art.select_one(cfg["link_selector"])
                    raw_url = link.get("href", "") if link else ""
                if not raw_url and art.name == "a":
                    raw_url = art.get("href", "")
                url = AngoNewsScraper.normalize_url(None, raw_url, cfg["base_url"]) if False else _norm(raw_url, cfg["base_url"])
                if not url or url.rstrip("/") == cfg["base_url"].rstrip("/"):
                    continue

                if cfg["title_selector"] == ".":
                    title = art.get_text(strip=True)
                else:
                    tt = art.select_one(cfg["title_selector"])
                    title = tt.get_text(strip=True) if tt else ""

                t1 = time.time()
                dhtml = fetch_html(url, cfg.get("extra_headers"), cfg.get("verify_ssl", True))
                if not dhtml:
                    st["errors"] += 1
                    continue
                dsoup = BeautifulSoup(dhtml, "html.parser")

                dt = dsoup.select_one("h1, .entry-title, .article-title")
                final_title = dt.get_text(strip=True) if dt else title
                titulo_ok = bool(final_title and len(final_title) >= 5)

                body = dsoup.select_one(
                    "article, .entry-content, .post-content, .content-body, "
                    ".article-content, .td-post-content, main"
                )
                corpo_ok = bool(body and len(body.get_text(strip=True)) > 40)

                og = dsoup.find("meta", property="og:image")
                imagem_ok = bool(og and og.get("content"))

                st["articles"] += 1
                if titulo_ok:
                    st["titulo_ok"] += 1
                if corpo_ok:
                    st["corpo_ok"] += 1
                if imagem_ok:
                    st["imagem_ok"] += 1
                st["seconds"].append(round(time.time() - t1, 2))
                processed += 1
                time.sleep(1.0)
            except Exception as e:
                st["errors"] += 1
                print(f"    ⚠️ {e}")

        out[site_name] = st
    return out


def _norm(url: str, base: str) -> str:
    from urllib.parse import urljoin

    if not url:
        return ""
    if url.startswith("http"):
        return url
    if url.startswith("//"):
        return "https:" + url
    return urljoin(base, url)


# ─────────────────────────────────────────────
# RELATÓRIO
# ─────────────────────────────────────────────
def pct(ok: int, total: int) -> str:
    if not total:
        return "  —"
    return f"{100 * ok / total:.0f}%"


def print_report(sgai: Dict[str, Any], bs4: Dict[str, Dict[str, Any]], full: bool) -> None:
    print("\n" + "=" * 92)
    print("  RELATÓRIO DE AVALIAÇÃO — ScrapeGraphAI (LLM) vs BeautifulSoup (seletores)")
    print(f"  JSONL SGAI: {sgai['path']}")
    print(f"  Baseline BS4: {'listagem + detalhe' if full else 'listagem (use --full p/ detalhe)'}")
    print("=" * 92)

    header = (
        f"{'SITE':<16} │ {'SGAI list':>9} │ {'SGAI corpo':>10} {'SGAI img':>8} {'SGAI data':>9} "
        f"│ {'BS4 list':>8} │ {'BS4 corpo':>9} {'BS4 img':>8} │ {'sgai s/art':>10}"
    )
    print(header)
    print("─" * len(header))

    all_sites = sorted(set(sgai["sites"]) | set(bs4))
    sgai_totals = {"articles": 0, "titulo_ok": 0, "corpo_ok": 0, "imagem_ok": 0, "data_ok": 0}
    bs4_totals = {"articles": 0, "titulo_ok": 0, "corpo_ok": 0, "imagem_ok": 0}

    for site in all_sites:
        s = sgai["sites"].get(site, {})
        b = bs4.get(site, {})
        arts_s = s.get("articles", 0)
        arts_b = b.get("articles", 0)
        avg_s = (
            f"{sum(s.get('seconds', [])) / max(len(s.get('seconds', [])), 1):.1f}s"
            if s.get("seconds")
            else "—"
        )
        sgai_list = "FALHOU" if s.get("listing_fail") else f"{arts_s}art"
        bs4_list = f"{b.get('listing_found', 0)}el" + ("" if b.get("listing_ok") else " ✗")

        print(
            f"{site[:16]:<16} │ {sgai_list:>9} │ "
            f"{pct(s.get('corpo_ok', 0), arts_s):>10} {pct(s.get('imagem_ok', 0), arts_s):>8} "
            f"{pct(s.get('data_ok', 0), arts_s):>9} │ "
            f"{bs4_list:>8} │ "
            f"{pct(b.get('corpo_ok', 0), arts_b):>9} {pct(b.get('imagem_ok', 0), arts_b):>8} │ "
            f"{avg_s:>10}"
        )
        for k in sgai_totals:
            sgai_totals[k] += s.get(k, 0)
        for k in bs4_totals:
            bs4_totals[k] += b.get(k, 0)

    print("─" * len(header))
    st, bt = sgai_totals, bs4_totals
    print(
        f"{'TOTAL':<16} │ {st['articles']:>6}art │ "
        f"{pct(st['corpo_ok'], st['articles']):>10} {pct(st['imagem_ok'], st['articles']):>8} "
        f"{pct(st['data_ok'], st['articles']):>9} │ "
        f"{bt['articles']:>5}art │ "
        f"{pct(bt['corpo_ok'], bt['articles']):>9} {pct(bt['imagem_ok'], bt['articles']):>8} │"
    )
    print("=" * 92)

    # Veredito simples
    sgai_listing_fails = sum(1 for s in sgai["sites"].values() if s.get("listing_fail"))
    bs4_listing_fails = sum(1 for b in bs4.values() if not b.get("listing_ok"))
    print("\n📌 SÍNTESE:")
    print(f"   • SGAI: {st['articles']} artigos extraídos | corpo {pct(st['corpo_ok'], st['articles'])} "
          f"| imagem {pct(st['imagem_ok'], st['articles'])} | data {pct(st['data_ok'], st['articles'])} "
          f"| sites com listagem falhada: {sgai_listing_fails}")
    print(f"   • BS4:  {bt['articles']} artigos{' (amostra)' if not full else ''} | "
          f"corpo {pct(bt['corpo_ok'], bt['articles'])} | imagem {pct(bt['imagem_ok'], bt['articles'])} "
          f"| data — (não extrai) | sites sem elementos: {bs4_listing_fails}")
    if full:
        if st["articles"] and st["corpo_ok"] >= bt["corpo_ok"]:
            print("   • ➡️  SGAI igualou/superou o BS4 na extração de corpo.")
        else:
            print("   • ➡️  BS4 ainda igualou/superou o SGAI na extração de corpo.")
    else:
        print("   • ➡️  Rode com --full para comparar extração de detalhe (corpo/imagem).")
    print()


def main() -> None:
    p = argparse.ArgumentParser(description="Compara SGAI vs BS4")
    p.add_argument("--jsonl", type=str, default="", help="Caminho para JSONL do SGAI")
    p.add_argument("--full", action="store_true", help="Baseline BS4 com detalhe (lento)")
    p.add_argument("--sites", type=str, default="", help='Restringir fontes (ex.: "Expansão,ANGOP")')
    p.add_argument("--max-per-site", type=int, default=3, help="Artigos por site no baseline --full")
    args = p.parse_args()

    sites = dict(SITES_CONFIG)
    if args.sites:
        wanted = {w.strip().lower() for w in args.sites.split(",") if w.strip()}
        sites = {k: v for k, v in sites.items() if k.strip().lower() in wanted}

    sgai = load_sgai(Path(args.jsonl) if args.jsonl else None)
    bs4 = run_bs4_baseline(sites, full=args.full, max_per_site=args.max_per_site)
    print_report(sgai, bs4, full=args.full)


if __name__ == "__main__":
    main()
