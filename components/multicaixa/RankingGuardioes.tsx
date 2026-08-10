/**
 * @copyright (c) 2024-2026 Resolve.AO by Su-Golden. All rights reserved.
 */

import React, { useEffect, useState } from "react";
import { Crown, Loader2, Trophy } from "lucide-react";
import type { RankingGuardiao } from "../../types";
import { MulticaixaService } from "../../services/api/multicaixa.service";
import { nivelClasses, nivelEmoji, nivelLabel } from "./helpers";

interface RankingGuardioesProps {
  bairro: string | null;
  onBairroChange: (bairro: string | null) => void;
  bairros: string[];
}

const MEDALHA = ["🥇", "🥈", "🥉"];

const iniciais = (nome: string): string =>
  nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";

export const RankingGuardioes: React.FC<RankingGuardioesProps> = ({ bairro, onBairroChange, bairros }) => {
  const [ranking, setRanking] = useState<RankingGuardiao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ativo = true;
    MulticaixaService.getRanking(bairro).then((r) => {
      if (!ativo) return;
      setRanking(r);
      setLoading(false);
    });
    return () => {
      ativo = false;
    };
  }, [bairro]);

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-orange-500/10">
        <div className="flex items-center justify-between gap-3 mb-1">
          <h2 className="text-[10px] font-black text-slate-950 dark:text-white uppercase tracking-widest flex items-center gap-2">
            <Crown size={14} className="text-orange-500" /> Guardiões do mês
          </h2>
          <select
            value={bairro ?? ""}
            onChange={(e) => onBairroChange(e.target.value || null)}
            className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-[9px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-orange-500 text-slate-600 dark:text-slate-300"
          >
            <option value="">Todos os bairros</option>
            {bairros.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
          Quem mais ajudou a comunidade a encontrar dinheiro este mês.
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center animate-pulse">
          <Loader2 className="mx-auto text-orange-500 animate-spin" size={26} />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3">A carregar ranking…</p>
        </div>
      ) : ranking.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center shadow-sm border border-orange-500/10">
          <Trophy size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Ainda sem guardiões este mês.
          </p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">
            Reporta o estado de um multicaixa e entra para o ranking.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {ranking.map((g, i) => (
            <div
              key={g.user_id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-sm border border-orange-500/10 flex items-center gap-3"
            >
              <div className="w-8 text-center shrink-0 text-lg font-black">
                {i < 3 ? MEDALHA[i] : <span className="text-[11px] font-black text-slate-400">{i + 1}</span>}
              </div>
              <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 text-[11px] font-black shrink-0 overflow-hidden">
                {g.avatar_url ? (
                  <img src={g.avatar_url} alt={g.full_name} className="w-full h-full object-cover" />
                ) : (
                  iniciais(g.full_name)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-slate-950 dark:text-white uppercase tracking-tight truncate">
                  {g.full_name}
                </p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  {g.bairro || "—"} · {g.reportes_mes} reportes
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${nivelClasses(g.nivel)}`}>
                  {nivelEmoji(g.nivel)} {nivelLabel(g.nivel)}
                </span>
                <p className="text-[10px] font-black text-slate-500 mt-1">{g.pontos_guardiao} pts</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
