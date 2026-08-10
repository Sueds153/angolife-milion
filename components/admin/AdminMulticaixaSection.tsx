/**
 * @copyright (c) 2024-2026 Resolve.AO by Su-Golden. All rights reserved.
 */

import React, { useCallback, useEffect, useState } from "react";
import { Banknote, Check, Loader2, MapPin, RefreshCw, X } from "lucide-react";
import type { Multicaixa } from "../../types";
import { MulticaixaService } from "../../services/api/multicaixa.service";

export const AdminMulticaixaSection: React.FC = () => {
  const [pendentes, setPendentes] = useState<Multicaixa[]>([]);
  const [loading, setLoading] = useState(true);
  const [operandoId, setOperandoId] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setPendentes(await MulticaixaService.getPendentes());
    setLoading(false);
  }, []);

  useEffect(() => {
    void Promise.resolve().then(carregar);
  }, [carregar]);

  const aprovar = async (id: string) => {
    if (!window.confirm("Aprovar este multicaixa?")) return;
    setOperandoId(id);
    const res = await MulticaixaService.aprovar(id);
    setOperandoId(null);
    if (res.ok) {
      setPendentes((prev) => prev.filter((m) => m.id !== id));
    } else {
      window.alert(res.error || "Erro ao aprovar.");
    }
  };

  const rejeitar = async (id: string) => {
    if (!window.confirm("Rejeitar este multicaixa?")) return;
    setOperandoId(id);
    const res = await MulticaixaService.rejeitar(id);
    setOperandoId(null);
    if (res.ok) {
      setPendentes((prev) => prev.filter((m) => m.id !== id));
    } else {
      window.alert(res.error || "Erro ao rejeitar.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-slate-950 dark:text-white uppercase tracking-tight flex items-center gap-2">
            <Banknote size={18} className="text-orange-500" /> Multicaixas a rever
          </h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
            Contribuições da comunidade à espera de aprovação.
          </p>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            carregar();
          }}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-orange-500 transition-colors"
          title="Atualizar"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center animate-pulse">
          <Loader2 className="mx-auto text-orange-500 animate-spin" size={26} />
        </div>
      ) : pendentes.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center shadow-sm border border-orange-500/10">
          <Banknote size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Sem multicaixas pendentes.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendentes.map((m) => (
            <div
              key={m.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-orange-500/10 flex items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
                  <Banknote size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-slate-950 dark:text-white uppercase tracking-tight truncate">
                    {m.nome}
                  </p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    {m.banco_operador || "Banco"} {m.bairro ? `· ${m.bairro}` : ""}
                  </p>
                  {m.latitude !== null && m.longitude !== null && (
                    <a
                      href={`https://www.google.com/maps?q=${m.latitude},${m.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[9px] font-black text-orange-500 uppercase tracking-widest mt-1.5 hover:underline"
                    >
                      <MapPin size={10} /> Ver no mapa
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => aprovar(m.id)}
                  disabled={operandoId === m.id}
                  className="flex items-center gap-1.5 bg-emerald-500 text-white rounded-2xl px-4 py-3 font-black text-[9px] uppercase tracking-widest hover:bg-emerald-600 transition-all disabled:opacity-50"
                >
                  {operandoId === m.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  Aprovar
                </button>
                <button
                  onClick={() => rejeitar(m.id)}
                  disabled={operandoId === m.id}
                  className="flex items-center gap-1.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl px-4 py-3 font-black text-[9px] uppercase tracking-widest hover:bg-red-500/20 transition-all disabled:opacity-50"
                >
                  <X size={12} /> Rejeitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
