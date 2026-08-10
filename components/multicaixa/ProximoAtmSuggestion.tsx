/**
 * @copyright (c) 2024-2026 Resolve.AO by Su-Golden. All rights reserved.
 */

import React, { useEffect, useState } from "react";
import { Banknote, Map as MapIcon, Navigation, Sparkles } from "lucide-react";
import { MulticaixaService, type AtmProximo } from "../../services/api/multicaixa.service";
import {
  formatarDistancia,
  formatarTempoRelativo,
  googleMapsUrl,
} from "./helpers";

interface ProximoAtmSuggestionProps {
  lat: number;
  lng: number;
  titulo?: string;
  onAbrirMulticaixa?: () => void;
}

export const ProximoAtmSuggestion: React.FC<ProximoAtmSuggestionProps> = ({
  lat,
  lng,
  titulo = "Multicaixa com dinheiro perto",
  onAbrirMulticaixa,
}) => {
  const [atm, setAtm] = useState<AtmProximo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ativo = true;
    MulticaixaService.getMaisProximoComDinheiro(lat, lng).then((res) => {
      if (!ativo) return;
      setAtm(res);
      setLoading(false);
    });
    return () => {
      ativo = false;
    };
  }, [lat, lng]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-orange-500/10 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-white/10" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 bg-slate-200 dark:bg-white/10 rounded-lg" />
            <div className="h-2 w-1/2 bg-slate-200 dark:bg-white/10 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!atm || !atm.encontrado || !atm.id) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-emerald-500/10 to-orange-500/10 border border-emerald-500/20 rounded-3xl p-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 shrink-0">
          <Banknote size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
            <Sparkles size={11} /> {titulo}
          </p>
          <p className="text-[11px] font-black text-slate-950 dark:text-white uppercase tracking-tight truncate">
            {atm.nome}
          </p>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
            {atm.banco_operador || "Banco"} {atm.bairro ? `· ${atm.bairro}` : ""}
            {atm.distancia_km !== null && atm.distancia_km !== undefined
              ? ` · ${formatarDistancia(atm.distancia_km)}`
              : ""}
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        {atm.latitude !== null && atm.longitude !== null && (
          <a
            href={googleMapsUrl(atm.latitude, atm.longitude)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white rounded-2xl py-3 font-black text-[9px] uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95"
          >
            <Navigation size={13} /> Ir agora
          </a>
        )}
        {onAbrirMulticaixa && (
          <button
            onClick={onAbrirMulticaixa}
            className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-emerald-500/30 text-slate-600 dark:text-slate-300 rounded-2xl py-3 font-black text-[9px] uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-white/5 transition-all active:scale-95"
          >
            <MapIcon size={13} /> Ver na Multicaixa
          </button>
        )}
      </div>
      {atm.min_ultimo_report !== null && atm.min_ultimo_report !== undefined && (
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2.5">
          Reportado {formatarTempoRelativo(atm.min_ultimo_report)} · Confirma antes de ires.
        </p>
      )}
    </div>
  );
};
