/**
 * @copyright (c) 2024-2026 Resolve.AO by Su-Golden. All rights reserved.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Banknote,
  List,
  Loader2,
  LogIn,
  Map as MapIcon,
  Navigation,
  Plus,
  RefreshCw,
  Search,
  Trophy,
  Users,
} from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { MulticaixaService } from "../services/api/multicaixa.service";
import { useMulticaixaRealtime } from "../hooks/useMulticaixaRealtime";
import { MulticaixaCard } from "../components/multicaixa/MulticaixaCard";
import { MulticaixaMap } from "../components/multicaixa/MulticaixaMap";
import { ReporteModal } from "../components/multicaixa/ReporteModal";
import { RankingGuardioes } from "../components/multicaixa/RankingGuardioes";
import { AdicionarMulticaixaForm } from "../components/multicaixa/AdicionarMulticaixaForm";
import { ProximoAtmSuggestion } from "../components/multicaixa/ProximoAtmSuggestion";
import {
  LUANDA_CENTER,
  filtrarPorEstado,
  type FiltroEstado,
} from "../components/multicaixa/helpers";
import type { EstadoMulticaixa } from "../types";

type Tab = "explorar" | "rank" | "adicionar";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "explorar", label: "Explorar", icon: MapIcon },
  { id: "rank", label: "Ranking", icon: Trophy },
  { id: "adicionar", label: "Adicionar", icon: Plus },
];

const FILTROS: { id: FiltroEstado; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "tem_dinheiro", label: "💰 Tem dinheiro" },
  { id: "sem_dinheiro", label: "🚫 Sem dinheiro" },
  { id: "avariado", label: "🔧 Avariado" },
  { id: "desconhecido", label: "❓ Desconhecido" },
];

export const MulticaixaPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, setAuthModal } = useAppStore();

  const tab = (searchParams.get("tab") as Tab) || "explorar";
  const setTab = (t: Tab) => setSearchParams({ tab: t }, { replace: true });

  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [atms, setAtms] = useState<EstadoMulticaixa[]>([]);
  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  const base = pos ?? LUANDA_CENTER;

  const load = useCallback(async () => {
    const estados = await MulticaixaService.getEstados(base.lat, base.lng);
    setAtms(estados);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) =>
        setPos({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => setPos(null),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  useMulticaixaRealtime("reportes_multicaixa", load);
  useMulticaixaRealtime("multicaixas", load);

  const atualizar = async () => {
    setAtualizando(true);
    await load();
    setAtualizando(false);
  };

  const bairros = useMemo(
    () => [...new Set(atms.map((a) => a.bairro).filter((b): b is string => !!b))].sort(),
    [atms],
  );

  const [filtro, setFiltro] = useState<FiltroEstado>("todos");
  const [query, setQuery] = useState("");
  const [verMapa, setVerMapa] = useState(false);
  const [verSugestao, setVerSugestao] = useState(false);
  const [reportando, setReportando] = useState<EstadoMulticaixa | null>(null);
  const [bairroRank, setBairroRank] = useState<string | null>(null);

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    const porTexto = q
      ? atms.filter(
          (a) =>
            a.nome.toLowerCase().includes(q) ||
            (a.banco_operador ?? "").toLowerCase().includes(q) ||
            (a.bairro ?? "").toLowerCase().includes(q),
        )
      : atms;
    return filtrarPorEstado(porTexto, filtro);
  }, [atms, query, filtro]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-0 pb-20">
      <header className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
          <Banknote size={26} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-950 dark:text-white uppercase tracking-tight">Multicaixa</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Sabes onde há dinheiro? Nós dizemos.
          </p>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar-orange">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${
              tab === t.id
                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                : "bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-white/10"
            }`}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {!isAuthenticated ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center shadow-sm border border-orange-500/10">
          <Users size={40} className="mx-auto text-orange-500 mb-4" />
          <h2 className="text-xl font-black text-slate-950 dark:text-white uppercase tracking-tight mb-2">
            Entra para ver e reportar ATMs
          </h2>
          <p className="text-xs font-bold text-slate-500 mb-6 max-w-sm mx-auto">
            Com a tua conta Resolve.AO descobres onde há dinheiro, reportas o estado em segundos e ganhas pontos de
            guardião.
          </p>
          <button
            onClick={() => setAuthModal(true, "login")}
            className="inline-flex items-center gap-3 bg-orange-500 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:bg-orange-600 transition-all"
          >
            <LogIn size={16} /> Iniciar Sessão
          </button>
        </div>
      ) : tab === "explorar" ? (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-orange-500/10 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black text-slate-950 dark:text-white uppercase tracking-tight">
                Estás na fila e o ATM está vazio?
              </p>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                Descobre o multicaixa com dinheiro mais próximo.
              </p>
            </div>
            <button
              onClick={() => setVerSugestao((v) => !v)}
              className="flex items-center gap-2 bg-emerald-500 text-white rounded-2xl px-5 py-3 font-black text-[9px] uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95 shrink-0"
            >
              <Navigation size={13} /> Leva-me
            </button>
          </div>

          {verSugestao && (
            <ProximoAtmSuggestion
              lat={base.lat}
              lng={base.lng}
              titulo="Multicaixa com dinheiro mais próximo"
            />
          )}

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-orange-500/10 space-y-3">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Procurar por nome, banco ou bairro…"
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all dark:text-white"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {FILTROS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFiltro(f.id)}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                    filtro === f.id
                      ? "bg-orange-500 text-white"
                      : "bg-slate-50 dark:bg-white/5 text-slate-500 border border-slate-200 dark:border-white/10"
                  }`}
                >
                  {f.label}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => setVerMapa((v) => !v)}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${
                    verMapa
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                      : "bg-slate-50 dark:bg-white/5 text-slate-500 border border-slate-200 dark:border-white/10"
                  }`}
                >
                  {verMapa ? <List size={11} /> : <MapIcon size={11} />}
                  {verMapa ? "Lista" : "Mapa"}
                </button>
                <button
                  onClick={atualizar}
                  disabled={atualizando}
                  title="Atualizar"
                  className="p-2 rounded-xl text-slate-400 hover:text-orange-500 transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={14} className={atualizando ? "animate-spin" : ""} />
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center animate-pulse">
              <Loader2 className="mx-auto text-orange-500 animate-spin" size={28} />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3">A procurar ATMs…</p>
            </div>
          ) : verMapa ? (
            <MulticaixaMap atms={filtrados} center={base} onReport={setReportando} />
          ) : filtrados.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center shadow-sm border border-orange-500/10">
              <Banknote size={36} className="mx-auto text-slate-300 mb-3" />
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">
                Sem multicaixas com estes filtros.
              </p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                Ajuda a comunidade: adiciona um multicaixa na aba "Adicionar".
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {filtrados.length} {filtrados.length === 1 ? "multicaixa" : "multicaixas"} encontrados
              </p>
              {filtrados.map((atm) => (
                <MulticaixaCard key={atm.id} atm={atm} onReport={setReportando} />
              ))}
            </div>
          )}
        </div>
      ) : tab === "rank" ? (
        <RankingGuardioes key={bairroRank} bairro={bairroRank} onBairroChange={setBairroRank} bairros={bairros} />
      ) : (
        <AdicionarMulticaixaForm onAdded={atualizar} />
      )}

      {reportando && (
        <ReporteModal atm={reportando} onClose={() => setReportando(null)} onReported={atualizar} />
      )}
    </div>
  );
};
