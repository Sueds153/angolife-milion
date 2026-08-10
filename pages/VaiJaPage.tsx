import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Compass, Car, Radio, LayoutDashboard, Search, LogIn, Users,
  MapPin, ArrowRight, Loader2, RefreshCw, Clock, CheckCircle2, BellRing, X,
  ShieldCheck,
} from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { VaiJaService } from "../services/api/vaija.service";
import { NotificationService } from "../services/integrations/notificationService";
import { useVaiJaRealtime } from "../hooks/useVaiJaRealtime";
import { VaiJaTrajetoCard } from "../components/vaija/VaiJaTrajetoCard";
import { PublicarTrajetoForm } from "../components/vaija/PublicarTrajetoForm";
import { PedirBoleiaForm } from "../components/vaija/PedirBoleiaForm";
import { formatPreco } from "../components/vaija/helpers";
import type { TrajetoAtivo, MotoristaPublico, DriverData, PedidoDemanda, TipoVeiculo, TipoUtilizador, Confirmacao } from "../types";

type Tab = "explorar" | "publicar" | "procurar" | "meus";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "explorar", label: "Explorar", icon: Compass },
  { id: "publicar", label: "Publicar", icon: Car },
  { id: "procurar", label: "Procura", icon: Radio },
  { id: "meus", label: "Os Meus", icon: LayoutDashboard },
];

export const VaiJaPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated, setAuthModal } = useAppStore();

  const tab = (searchParams.get("tab") as Tab) || "explorar";
  const setTab = (t: Tab) => setSearchParams({ tab: t }, { replace: true });

  const temDestinosFrequentes = (user?.destinosFrequentes?.length ?? 0) > 0;
  const [pushDismissed, setPushDismissed] = useState(false);
  const [pushEnabling, setPushEnabling] = useState(false);
  const [pushState, setPushState] = useState<"unknown" | "on" | "off">("unknown");

  useEffect(() => {
    if (!isAuthenticated) return;
    NotificationService.isSubscribed().then((sub) => setPushState(sub ? "on" : "off"));
  }, [isAuthenticated]);

  const ativarPush = async () => {
    if (!user?.id) return;
    setPushEnabling(true);
    try {
      const granted = await NotificationService.requestPermission();
      if (!granted) {
        setPushState("off");
        return;
      }
      await NotificationService.subscribeUser(user.id);
      setPushState("on");
      NotificationService.sendNativeNotification(
        "Notificações do VaiJá ativas",
        "Avisamos-te quando houver trajetos para os teus destinos frequentes.",
        user.id,
      );
    } catch {
      setPushState("off");
    } finally {
      setPushEnabling(false);
    }
  };

  const mostrarBannerPush =
    isAuthenticated &&
    temDestinosFrequentes &&
    pushState === "off" &&
    !pushDismissed;

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-0 pb-20">
      <header className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
          <Car size={26} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-950 dark:text-white uppercase tracking-tight">VaiJá</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Candongueiros e táxis sem o lotador
          </p>
        </div>
      </header>

      {mostrarBannerPush && (
        <div className="relative bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-3xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center text-orange-500 shrink-0">
            <BellRing size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-slate-950 dark:text-white uppercase tracking-tight">
              Avisos para os teus destinos
            </p>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
              Ativa as notificações para saber quando houver trajetos para os teus sítios frequentes.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={ativarPush}
              disabled={pushEnabling}
              className="px-5 py-3 bg-orange-500 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-orange-600 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {pushEnabling ? <Loader2 size={14} className="animate-spin" /> : <BellRing size={14} />}
              Ativar
            </button>
            <button
              onClick={() => setPushDismissed(true)}
              title="Dispensar"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

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
            Entra para apanhar ou publicar boleias
          </h2>
          <p className="text-xs font-bold text-slate-500 mb-6 max-w-sm mx-auto">
            Com a tua conta Resolve.AO já podes confirmar lugares em tempo real, sem depender do lotador.
          </p>
          <button
            onClick={() => setAuthModal(true, "login")}
            className="inline-flex items-center gap-3 bg-orange-500 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:bg-orange-600 transition-all"
          >
            <LogIn size={16} /> Iniciar Sessão
          </button>
        </div>
      ) : tab === "explorar" ? (
        <ExplorerTab onOpen={(id) => navigate(`/vaija/trajeto/${id}`)} destinos={user?.destinosFrequentes || []} />
      ) : tab === "publicar" ? (
        <PublicarTab userId={user.id || ""} onPublished={(id) => navigate(`/vaija/trajeto/${id}`)} onGoProfile={() => navigate("/perfil")} />
      ) : tab === "procurar" ? (
        <ProcurarTab userId={user.id || ""} />
      ) : (
        <MeusTab
          userId={user.id || ""}
          tipoUtilizador={user?.tipoUtilizador || "passageiro"}
          onOpen={(id) => navigate(`/vaija/trajeto/${id}`)}
        />
      )}
    </div>
  );
};

// ── EXPLORAR ────────────────────────────────────────────────
const ExplorerTab: React.FC<{ onOpen: (id: string) => void; destinos?: string[] }> = ({ onOpen, destinos = [] }) => {
  const [trajetos, setTrajetos] = useState<TrajetoAtivo[]>([]);
  const [motoristas, setMotoristas] = useState<Record<string, MotoristaPublico>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<TipoVeiculo | "todos">("todos");
  const [ordenarPreco, setOrdenarPreco] = useState(false);
  const [soMeusDestinos, setSoMeusDestinos] = useState(false);

  const destinosNorm = useMemo(
    () => destinos.map((d) => d.trim().toLowerCase()).filter(Boolean),
    [destinos],
  );
  const correspondeDestino = useMemo(
    () => (t: TrajetoAtivo) =>
      destinosNorm.some(
        (d) =>
          t.pontoDestino.toLowerCase().includes(d) ||
          t.pontoPartida.toLowerCase().includes(d),
      ),
    [destinosNorm],
  );

  const load = async () => {
    const ts = await VaiJaService.getTrajetosAtivos();
    const ids = [...new Set(ts.map((t) => t.motoristaId))];
    const ms = await VaiJaService.getMotoristasPublico(ids);
    setMotoristas(Object.fromEntries(ms.map((m) => [m.userId, m])));
    setTrajetos(ts);
    setLoading(false);
  };

  useEffect(() => {
    void Promise.resolve().then(load);
  }, []);
  useVaiJaRealtime("trajetos_ativos", load);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = trajetos.filter((t) => {
      const matchesTipo = tipoFiltro === "todos" || (motoristas[t.motoristaId]?.tipoVeiculo ?? undefined) === tipoFiltro;
      const matchesQuery =
        !q ||
        t.pontoPartida.toLowerCase().includes(q) ||
        t.pontoDestino.toLowerCase().includes(q);
      return matchesTipo && matchesQuery;
    });
    if (soMeusDestinos) list = list.filter(correspondeDestino);
    if (ordenarPreco) list = [...list].sort((a, b) => a.preco - b.preco);
    return list;
  }, [trajetos, motoristas, query, tipoFiltro, ordenarPreco, soMeusDestinos, correspondeDestino]);

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-orange-500/10 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Procurar por bairro ou destino…"
            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all dark:text-white"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(["todos", "candongueiro", "taxi"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTipoFiltro(t)}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                tipoFiltro === t
                  ? "bg-orange-500 text-white"
                  : "bg-slate-50 dark:bg-white/5 text-slate-500 border border-slate-200 dark:border-white/10"
              }`}
            >
              {t === "todos" ? "Todos" : t === "taxi" ? "Táxi" : "Candongueiro"}
            </button>
          ))}
          <button
            onClick={() => setOrdenarPreco((v) => !v)}
            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
              ordenarPreco
                ? "bg-emerald-500 text-white"
                : "bg-slate-50 dark:bg-white/5 text-slate-500 border border-slate-200 dark:border-white/10"
            }`}
          >
            {ordenarPreco ? "Preço: ↑ asc" : "Ordenar por preço"}
          </button>
          {destinosNorm.length > 0 && (
            <button
              onClick={() => setSoMeusDestinos((v) => !v)}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                soMeusDestinos
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                  : "bg-slate-50 dark:bg-white/5 text-slate-500 border border-slate-200 dark:border-white/10"
              }`}
            >
              <MapPin size={11} className="inline mr-1" />
              Para mim
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center animate-pulse">
          <Loader2 className="mx-auto text-orange-500 animate-spin" size={28} />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3">A procurar trajetos…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center shadow-sm border border-orange-500/10">
          <Compass size={36} className="mx-auto text-slate-300 mb-3" />
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">
            {trajetos.length === 0 ? "Ainda não há trajetos ativos agora." : "Sem resultados para estes filtros."}
          </p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">
            Sê o primeiro a publicar ou a pedir boleia.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((t) => (
            <VaiJaTrajetoCard
              key={t.id}
              trajeto={t}
              motorista={motoristas[t.motoristaId]}
              onOpen={() => onOpen(t.id)}
              destaque={correspondeDestino(t) ? "Para ti" : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ── PUBLICAR ────────────────────────────────────────────────
const PublicarTab: React.FC<{ userId: string; onPublished: (id: string) => void; onGoProfile: () => void }> = ({ userId, onPublished, onGoProfile }) => {
  const [driverData, setDriverData] = useState<DriverData | null | undefined>(undefined);

  useEffect(() => {
    VaiJaService.getDriverData(userId).then(setDriverData);
  }, [userId]);

  if (driverData === undefined) {
    return (
      <div className="py-20 text-center animate-pulse">
        <Loader2 className="mx-auto text-orange-500 animate-spin" size={28} />
      </div>
    );
  }

  if (!driverData) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center shadow-sm border border-orange-500/10">
        <Car size={40} className="mx-auto text-orange-500 mb-4" />
        <h2 className="text-xl font-black text-slate-950 dark:text-white uppercase tracking-tight mb-2">
          Ativa o modo motorista
        </h2>
        <p className="text-xs font-bold text-slate-500 mb-6 max-w-sm mx-auto">
          Vai ao teu perfil, liga o "modo motorista" e preenche a matrícula e o tipo de veículo. Leva menos de 1 minuto.
        </p>
        <button
          onClick={onGoProfile}
          className="inline-flex items-center gap-3 bg-orange-500 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:bg-orange-600 transition-all"
        >
          Configurar no Perfil
        </button>
      </div>
    );
  }

  if (driverData.statusConta === "suspenso") {
    return (
      <div className="bg-red-500/5 rounded-3xl p-10 text-center border border-red-500/20">
        <p className="text-xl font-black text-red-500 uppercase tracking-tight">Conta suspensa</p>
        <p className="text-xs font-bold text-slate-500 mt-2">
          O teu modo motorista está suspenso por trajetos sem passageiros. Contacta a equipa Resolve.AO.
        </p>
      </div>
    );
  }

  const semDocumento = !driverData.fotoDocumentoUrl;
  const porVerificar = !semDocumento && driverData.verificado !== true;

  if (semDocumento || porVerificar) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center shadow-sm border border-orange-500/10">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 mb-4">
          <ShieldCheck size={26} />
        </div>
        <h2 className="text-xl font-black text-slate-950 dark:text-white uppercase tracking-tight mb-2">
          {semDocumento ? "Identifica-te para publicar" : "Verificação em curso"}
        </h2>
        <p className="text-xs font-bold text-slate-500 mb-6 max-w-sm mx-auto">
          {semDocumento
            ? "Para publicar trajetos, submete o teu BI ou carta de condução no perfil. A equipa Resolve.AO valida em menos de 24h."
            : "Já recebemos o teu documento e está a ser analisado pela equipa. Assim que for aprovado, podes começar a publicar."}
        </p>
        {semDocumento && (
          <button
            onClick={onGoProfile}
            className="inline-flex items-center gap-3 bg-orange-500 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:bg-orange-600 transition-all"
          >
            Submeter no Perfil
          </button>
        )}
        {porVerificar && (
          <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 font-black text-[9px] uppercase tracking-widest">
            <Clock size={14} /> Aprovação normalmente em menos de 24h
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-orange-500/10">
      <div className="mb-6 pb-4 border-b border-orange-500/10 flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-950 dark:text-white uppercase tracking-tight">Publicar trajeto</h2>
        <span className="px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
          {driverData.matricula || "Sem matrícula"}
        </span>
      </div>
      <PublicarTrajetoForm motoristaId={userId} onPublished={onPublished} />
    </div>
  );
};

// ── PROCURA (demanda) ───────────────────────────────────────
const ProcurarTab: React.FC<{ userId: string }> = ({ userId }) => {
  const [pedidos, setPedidos] = useState<PedidoDemanda[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setPedidos(await VaiJaService.getPedidosDemanda());
    setLoading(false);
  };

  useEffect(() => {
    void Promise.resolve().then(load);
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-orange-500/10">
        <div className="mb-5">
          <h2 className="text-lg font-black text-slate-950 dark:text-white uppercase tracking-tight flex items-center gap-2">
            <Radio size={18} className="text-orange-500" /> Precisas de boleia?
          </h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
            Publica a tua procura — os motoristas da rota veem-na antes de sair.
          </p>
        </div>
        <PedirBoleiaForm passageiroId={userId} onCreated={load} />
      </div>

      <div>
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
          Procura recente
        </h3>
        {loading ? (
          <div className="py-10 text-center animate-pulse">
            <Loader2 className="mx-auto text-orange-500 animate-spin" size={22} />
          </div>
        ) : pedidos.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center shadow-sm border border-orange-500/10">
            <MapPin size={30} className="mx-auto text-slate-300 mb-3" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Sem pedidos abertos agora.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pedidos.map((p) => (
              <div key={p.id} className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-orange-500/10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Users size={16} className="text-orange-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-black text-slate-950 dark:text-white uppercase tracking-tight truncate">
                      {p.pontoPartida} → {p.pontoDestino}
                    </p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                      {new Date(p.criadoEm).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── OS MEUS (motorista + passageiro) ────────────────────────
const MeusTab: React.FC<{ userId: string; tipoUtilizador: TipoUtilizador; onOpen: (id: string) => void }> = ({ userId, tipoUtilizador, onOpen }) => {
  const [ativos, setAtivos] = useState<TrajetoAtivo[]>([]);
  const [historico, setHistorico] = useState<TrajetoAtivo[]>([]);
  const [minhasViagens, setMinhasViagens] = useState<{ confirmacao: Confirmacao; trajeto: TrajetoAtivo | null }[]>([]);
  const [loading, setLoading] = useState(true);

  const isMotorista = tipoUtilizador === "motorista" || tipoUtilizador === "ambos";

  const load = async () => {
    if (isMotorista) {
      const [a, h] = await Promise.all([
        VaiJaService.getMeusTrajetos(userId),
        VaiJaService.getMeuHistorico(userId),
      ]);
      setAtivos(a);
      setHistorico(h);
    }
    setMinhasViagens(await VaiJaService.getMinhasViagens(userId));
    setLoading(false);
  };

  useEffect(() => {
    void Promise.resolve().then(load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
  useVaiJaRealtime("trajetos_ativos", load);
  useVaiJaRealtime("confirmacoes", load);

  if (loading) {
    return (
      <div className="py-20 text-center animate-pulse">
        <Loader2 className="mx-auto text-orange-500 animate-spin" size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
          <Users size={12} className="text-orange-500" /> As minhas viagens ({minhasViagens.length})
        </h3>
        {minhasViagens.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center shadow-sm border border-orange-500/10">
            <Users size={30} className="mx-auto text-slate-300 mb-3" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Ainda não confirmaste nenhuma viagem.
            </p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">
              Vai ao Explorar e apanha uma boleia.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {minhasViagens.map(({ confirmacao, trajeto }) => {
              if (!trajeto) return null;
              return (
                <div
                  key={confirmacao.id}
                  onClick={() => onOpen(trajeto.id)}
                  className="group bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-orange-500/10 hover:border-orange-500/30 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                      confirmacao.status === "embarcado"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20"
                    }`}>
                      {confirmacao.status === "embarcado" ? "Embarcado" : "Confirmado"}
                    </span>
                    <span className="text-[10px] font-black text-slate-500 font-mono">
                      {formatPreco(confirmacao.precoAcordado ?? trajeto.preco)}
                    </span>
                  </div>
                  <p className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-tight truncate">
                    {trajeto.pontoPartida} <ArrowRight size={12} className="inline text-orange-500" /> {trajeto.pontoDestino}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Clock size={12} /> Fecha às {new Date(trajeto.expiraEm).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">Abrir →</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isMotorista && (
      <>
      <div>
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
          <Car size={12} className="text-orange-500" /> Trajetos ativos ({ativos.length})
        </h3>
        {ativos.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center shadow-sm border border-orange-500/10">
            <Car size={30} className="mx-auto text-slate-300 mb-3" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Nenhum trajeto ativo. Publica na aba "Publicar".
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ativos.map((t) => (
              <div key={t.id} onClick={() => onOpen(t.id)} className="group bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-orange-500/10 hover:border-orange-500/30 cursor-pointer transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                    {t.status === "lotado" ? "Lotado" : "Ativo"}
                  </span>
                  <span className="text-[10px] font-black text-slate-500 font-mono">{formatPreco(t.preco)}</span>
                </div>
                <p className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-tight truncate">
                  {t.pontoPartida} <ArrowRight size={12} className="inline text-orange-500" /> {t.pontoDestino}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Users size={12} /> {t.lugaresDisponiveis}/{t.lugaresTotais}
                  </span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Clock size={12} /> Fecha às {new Date(t.expiraEm).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
          <RefreshCw size={12} className="text-orange-500" /> Histórico
        </h3>
        {historico.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center shadow-sm border border-orange-500/10">
            <CheckCircle2 size={28} className="mx-auto text-slate-300 mb-3" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sem histórico ainda.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {historico.map((t) => (
              <div key={t.id} className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-white/5 flex items-center justify-between gap-4">
                <p className="text-[11px] font-black text-slate-950 dark:text-white uppercase tracking-tight truncate">
                  {t.pontoPartida} → {t.pontoDestino}
                </p>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[9px] font-black font-mono text-slate-500">{formatPreco(t.preco)}</span>
                  <span className={`px-2.5 py-1 rounded-lg text-[7px] font-black uppercase tracking-widest ${
                    t.status === "finalizado" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500"
                  }`}>
                    {t.status === "finalizado" ? "Finalizado" : "Expirado"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
};
