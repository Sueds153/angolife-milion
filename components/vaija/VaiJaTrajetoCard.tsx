import React from "react";
import { ArrowRight, Share2, Users, MapPin, ShieldCheck, Clock } from "lucide-react";
import type { TrajetoAtivo, MotoristaPublico } from "../../types";
import {
  formatPreco,
  tipoVeiculoLabel,
  vehicleIcon,
  formatExpira,
  isLotado,
  buildWhatsAppShare,
} from "./helpers";

interface VaiJaTrajetoCardProps {
  trajeto: TrajetoAtivo;
  motorista?: MotoristaPublico | null;
  onOpen?: () => void;
  destaque?: string;
}

export const VaiJaTrajetoCard: React.FC<VaiJaTrajetoCardProps> = ({ trajeto, motorista, onOpen, destaque }) => {
  const lotado = isLotado(trajeto);
  const pct = trajeto.lugaresTotais > 0
    ? Math.round((trajeto.lugaresDisponiveis / trajeto.lugaresTotais) * 100)
    : 0;

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(buildWhatsAppShare(trajeto), "_blank");
  };

  return (
    <div
      onClick={onOpen}
      className="group bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-orange-500/10 hover:border-orange-500/30 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-orange-500/10 transition-all" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{vehicleIcon(motorista?.tipoVeiculo)}</span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              {trajeto.modo === "corredor" ? "Corredor fixo" : "Trajeto"}
              {motorista?.verificado && (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck size={11} /> Verificado
                </span>
              )}
              {destaque && (
                <span className="inline-flex items-center gap-1 text-orange-500 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-lg">
                  <MapPin size={10} /> {destaque}
                </span>
              )}
            </p>
            <p className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-tight">
              {motorista?.fullName || "Motorista"}
            </p>
          </div>
        </div>
        <button
          onClick={handleShare}
          title="Partilhar no WhatsApp"
          className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all"
        >
          <Share2 size={16} />
        </button>
      </div>

      <div className="mt-5 space-y-3">
        <div className="flex items-center gap-3">
          <MapPin size={16} className="text-orange-500 shrink-0" />
          <p className="text-sm font-black text-slate-950 dark:text-white truncate">{trajeto.pontoPartida}</p>
        </div>
        <div className="flex items-center gap-3">
          <ArrowRight size={16} className="text-orange-500/50 shrink-0 rotate-90 ml-0.5" />
          <p className="text-sm font-black text-slate-950 dark:text-white truncate">{trajeto.pontoDestino}</p>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            {trajeto.modo === "corredor" && motorista?.tipoVeiculo ? tipoVeiculoLabel(motorista.tipoVeiculo) : tipoVeiculoLabel(motorista?.tipoVeiculo)}
          </p>
          <div className="flex items-center gap-2">
            <Users size={13} className="text-slate-400" />
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {trajeto.lugaresDisponiveis}/{trajeto.lugaresTotais} lugares
            </span>
          </div>
        </div>

        <div className="text-right space-y-1">
          <p className="text-lg font-black text-orange-600 dark:text-orange-400 font-mono tracking-tighter">
            {formatPreco(trajeto.preco)}
          </p>
          <p className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1 justify-end ${lotado ? "text-red-500" : "text-slate-400"}`}>
            <Clock size={10} /> {lotado ? "Lotado" : `Fecha às ${formatExpira(trajeto.expiraEm)}`}
          </p>
        </div>
      </div>

      <div className="mt-4 h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${lotado ? "bg-red-500" : "bg-gradient-to-r from-orange-500 to-amber-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
