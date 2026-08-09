import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Users, Share2, ShieldCheck,
  CheckCircle2, XCircle, Loader2, Clock, LogIn, Car, RefreshCw, MessageCircle,
} from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { VaiJaService } from "../services/api/vaija.service";
import { useVaiJaRealtime } from "../hooks/useVaiJaRealtime";
import { formatPreco, tipoVeiculoLabel, formatExpira, buildWhatsAppShare, isLotado } from "../components/vaija/helpers";
import type { TrajetoAtivo, MotoristaPublico, Confirmacao } from "../types";

interface PassageiroRow {
  confirmacaoId: string;
  passageiroId: string;
  status: string;
  precoAcordado?: number | null;
  fullName?: string;
  phone?: string;
}

export const VaiJaTrajetoPage: React.FC = () => {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, setAuthModal } = useAppStore();

  const [trajeto, setTrajeto] = useState<TrajetoAtivo | null | undefined>(undefined);
  const [motorista, setMotorista] = useState<MotoristaPublico | null>(null);
  const [minhasConfirmacoes, setMinhasConfirmacoes] = useState<Confirmacao[]>([]);
  const [passageiros, setPassageiros] = useState<PassageiroRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "erro"; text: string } | null>(null);

  const load = async () => {
    const t = await VaiJaService.getTrajetoById(id);
    setTrajeto(t);
    if (t) {
      const ms = await VaiJaService.getMotoristasPublico([t.motoristaId]);
      setMotorista(ms[0] ?? null);
      if (user?.id && user.id === t.motoristaId) {
        setPassageiros(await VaiJaService.getPassageirosDoTrajeto(id));
      }
    }
    if (user?.id) {
      setMinhasConfirmacoes((await VaiJaService.getMinhasConfirmacoes(user.id)).filter((c) => c.trajetoId === id));
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  useVaiJaRealtime("trajetos_ativos", load, `id=eq.${id}`);
  useVaiJaRealtime("confirmacoes", load, `trajeto_id=eq.${id}`);

  if (trajeto === undefined) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center animate-pulse">
        <Loader2 className="mx-auto text-orange-500 animate-spin" size={30} />
      </div>
    );
  }

  if (trajeto === null) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center">
        <Clock size={44} className="mx-auto text-slate-300 mb-4" />
        <h2 className="text-xl font-black text-slate-950 dark:text-white uppercase tracking-tight mb-2">
          Trajeto terminado
        </h2>
        <p className="text-xs font-bold text-slate-500 mb-6">
          Este trajeto já foi finalizado ou expirou.
        </p>
        <button
          onClick={() => navigate("/vaija")}
          className="inline-flex items-center gap-3 bg-orange-500 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all"
        >
          <ArrowLeft size={16} /> Voltar ao VaiJá
        </button>
      </div>
    );
  }

  const isOwner = user?.id === trajeto.motoristaId;
  const lotado = isLotado(trajeto);
  const minhaConfirmacao = minhasConfirmacoes.find((c) => c.status === "confirmado" || c.status === "embarcado");
  const pct = trajeto.lugaresTotais > 0 ? Math.round((trajeto.lugaresDisponiveis / trajeto.lugaresTotais) * 100) : 0;

  const acao = async (fn: () => Promise<{ ok: boolean; error: string | null }>, sucesso: string) => {
    setBusy(true);
    setMessage(null);
    const res = await fn();
    setBusy(false);
    setMessage(res.ok ? { type: "ok", text: sucesso } : { type: "erro", text: res.error || "Erro." });
    load();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 px-4 sm:px-0 pb-20">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-orange-500 transition-colors"
      >
        <ArrowLeft size={14} /> Voltar
      </button>

      {message && (
        <div className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${
          message.type === "ok"
            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
            : "bg-red-500/10 text-red-500 border-red-500/20"
        }`}>
          {message.text}
        </div>
      )}

      {/* Rota + preço */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-orange-500/10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
              <Car size={22} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                {trajeto.modo === "corredor" ? "Corredor fixo" : "Trajeto"}
              </p>
              <h1 className="text-lg font-black text-slate-950 dark:text-white uppercase tracking-tight">
                {trajeto.pontoPartida} <ArrowRight size={14} className="inline text-orange-500" /> {trajeto.pontoDestino}
              </h1>
            </div>
          </div>
          <button
            onClick={() => window.open(buildWhatsAppShare(trajeto), "_blank")}
            title="Partilhar no WhatsApp"
            className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all shrink-0"
          >
            <Share2 size={18} />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl text-center">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Preço</p>
            <p className="text-base font-black text-orange-600 dark:text-orange-400 font-mono">{formatPreco(trajeto.preco)}</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl text-center">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Lugares</p>
            <p className="text-base font-black text-slate-950 dark:text-white font-mono">
              {trajeto.lugaresDisponiveis}<span className="text-xs text-slate-400">/{trajeto.lugaresTotais}</span>
            </p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl text-center">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha às</p>
            <p className="text-base font-black text-slate-950 dark:text-white font-mono">{formatExpira(trajeto.expiraEm)}</p>
          </div>
        </div>

        <div className="mt-4 h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${lotado ? "bg-red-500" : "bg-gradient-to-r from-orange-500 to-amber-400"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Motorista */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-orange-500/10 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center text-orange-500 border border-orange-500/10 font-black uppercase">
          {motorista?.fullName?.charAt(0) || "M"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-tight truncate">
            {motorista?.fullName || "Motorista"}
          </p>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            {tipoVeiculoLabel(motorista?.tipoVeiculo)}
            {motorista?.matricula && <span>• {motorista.matricula}</span>}
            {motorista?.avaliacaoMedia && <span>• ⭐ {motorista.avaliacaoMedia.toFixed(1)}</span>}
          </p>
        </div>
        {motorista?.verificado && (
          <span className="px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <ShieldCheck size={11} /> Verificado
          </span>
        )}
      </div>

      {/* Ações */}
      {!isAuthenticated ? (
        <button
          onClick={() => setAuthModal(true, "login")}
          className="w-full bg-orange-500 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-orange-500/20 hover:bg-orange-600 transition-all flex items-center justify-center gap-3"
        >
          <LogIn size={18} /> Iniciar sessão para confirmar
        </button>
      ) : isOwner ? (
        <OwnerActions
          trajeto={trajeto}
          passageiros={passageiros}
          busy={busy}
          onEmbarcar={(cid) => acao(() => VaiJaService.marcarEmbarcado(cid), "Passageiro marcado como embarcado.")}
          onFinalizar={() => acao(() => VaiJaService.finalizarTrajeto(trajeto.id), "Trajeto finalizado.")}
          onRenovar={() => acao(() => VaiJaService.renovarTrajeto(trajeto.id), "Janela renovada.")}
        />
      ) : minhaConfirmacao ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-orange-500/10 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="text-emerald-500 animate-pulse" />
            <div>
              <p className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-tight">
                Confirmado — lugar guardado
              </p>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <Users size={10} /> {trajeto.lugaresDisponiveis}/{trajeto.lugaresTotais} lugares livres agora
              </p>
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-500 leading-relaxed">
            Preço combinado: <span className="font-black text-orange-600 dark:text-orange-400">{formatPreco(minhaConfirmacao.precoAcordado ?? trajeto.preco)}</span>.
            Fica atento — o motorista marca-te como embarcado quando chegarem.
          </p>
          <button
            onClick={() => acao(() => VaiJaService.cancelarConfirmacao(trajeto.id), "Confirmação cancelada.")}
            disabled={busy}
            className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-red-500/30 text-red-500 hover:bg-red-500/5 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />} Cancelar Confirmação
          </button>
        </div>
      ) : (
        <button
          onClick={() => acao(() => VaiJaService.confirmarLugar(trajeto.id), "Lugar confirmado!")}
          disabled={busy || lotado}
          className="w-full bg-orange-500 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-orange-500/20 hover:bg-orange-600 active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? <Loader2 size={18} className="animate-spin" /> : lotado ? <Users size={18} /> : <CheckCircle2 size={18} />}
          {lotado ? "Trajeto Lotado" : "Vou Apanhar Este"}
        </button>
      )}
    </div>
  );
};

// ── Ações do motorista (dono do trajeto) ───────────────────
const OwnerActions: React.FC<{
  trajeto: TrajetoAtivo;
  passageiros: PassageiroRow[];
  busy: boolean;
  onEmbarcar: (confirmacaoId: string) => void;
  onFinalizar: () => void;
  onRenovar: () => void;
}> = ({ trajeto, passageiros, busy, onEmbarcar, onFinalizar, onRenovar }) => {
  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-orange-500/10">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
          <Users size={12} className="text-orange-500" /> Passageiros ({passageiros.length})
        </h3>
        {passageiros.length === 0 ? (
          <p className="text-[10px] font-bold text-slate-500 italic">Ninguém confirmou ainda. Partilha no WhatsApp.</p>
        ) : (
          <div className="space-y-3">
            {passageiros.map((p) => (
              <div key={p.confirmacaoId} className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-2xl">
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-slate-950 dark:text-white uppercase tracking-tight truncate">
                    {p.fullName || p.passageiroId.slice(0, 8)}
                  </p>
                  {p.phone && (
                    <a href={`tel:${p.phone}`} className="text-[9px] font-bold text-orange-500 uppercase tracking-widest flex items-center gap-1">
                      <MessageCircle size={10} /> {p.phone}
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2.5 py-1 rounded-lg text-[7px] font-black uppercase tracking-widest ${
                    p.status === "embarcado" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                  }`}>
                    {p.status === "embarcado" ? "Embarcado" : "Confirmado"}
                  </span>
                  {p.status === "confirmado" && (
                    <button
                      onClick={() => onEmbarcar(p.confirmacaoId)}
                      disabled={busy}
                      className="px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest bg-emerald-500 text-white hover:bg-emerald-600 transition-all disabled:opacity-50"
                    >
                      Embarcou
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {trajeto.modo === "corredor" && (
          <button
            onClick={onRenovar}
            disabled={busy}
            className="flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-slate-950 dark:bg-white text-white dark:text-slate-950 hover:scale-[1.01] transition-all disabled:opacity-50"
          >
            <RefreshCw size={15} /> Renovar (+2h)
          </button>
        )}
        <button
          onClick={onFinalizar}
          disabled={busy}
          className="flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-emerald-500 text-white hover:bg-emerald-600 transition-all disabled:opacity-50"
        >
          <CheckCircle2 size={15} /> Finalizar Viagem
        </button>
      </div>
    </div>
  );
};
