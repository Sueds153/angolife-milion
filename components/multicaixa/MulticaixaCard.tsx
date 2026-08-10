/**
 * @copyright (c) 2024-2026 Resolve.AO by Su-Golden. All rights reserved.
 */

import React from "react";
import { Banknote, Navigation, MapPin, Clock, ShieldCheck, Share2 } from "lucide-react";
import type { EstadoMulticaixa } from "../../types";
import { EstadoBadge } from "./EstadoBadge";
import {
  formatarDistancia,
  formatarFiabilidade,
  formatarTempoRelativo,
  googleMapsUrl,
} from "./helpers";

interface MulticaixaCardProps {
  atm: EstadoMulticaixa;
  onReport: (atm: EstadoMulticaixa) => void;
}

export const MulticaixaCard: React.FC<MulticaixaCardProps> = ({ atm, onReport }) => {
  const temCoordenadas = atm.latitude !== null && atm.longitude !== null;
  const fiabilidade = formatarFiabilidade(atm.fiabilidade_30d);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-orange-500/10 hover:border-orange-500/30 transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
            <Banknote size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-black text-slate-950 dark:text-white uppercase tracking-tight leading-tight truncate">
              {atm.nome}
            </p>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
              {atm.banco_operador || "Banco"} {atm.bairro ? `· ${atm.bairro}` : ""}
            </p>
          </div>
        </div>
        <EstadoBadge estado={atm.estado} confirmado={atm.confirmado} />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-4">
        {atm.distancia_km !== null && atm.distancia_km !== undefined && (
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
            <Navigation size={11} className="text-orange-500" /> {formatarDistancia(atm.distancia_km)}
          </span>
        )}
        {fiabilidade && (
          <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1">
            <ShieldCheck size={11} /> Fiável {fiabilidade}
          </span>
        )}
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
          <Clock size={11} /> {formatarTempoRelativo(atm.min_ultimo_report)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onReport(atm)}
          className="flex-1 flex items-center justify-center gap-2 bg-orange-500 text-white rounded-2xl py-3 font-black text-[9px] uppercase tracking-widest hover:bg-orange-600 transition-all active:scale-95"
        >
          <Share2 size={13} /> Reportar
        </button>
        {temCoordenadas && atm.latitude !== null && atm.longitude !== null && (
          <a
            href={googleMapsUrl(atm.latitude, atm.longitude)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 rounded-2xl py-3 px-4 font-black text-[9px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-all active:scale-95"
          >
            <MapPin size={13} /> Rota
          </a>
        )}
      </div>
    </div>
  );
};
