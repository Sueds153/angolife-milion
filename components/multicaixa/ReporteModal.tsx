/**
 * @copyright (c) 2024-2026 Resolve.AO by Su-Golden. All rights reserved.
 */

import React, { useState } from "react";
import { Banknote, CheckCircle2, Loader2, X } from "lucide-react";
import type { EstadoMulticaixa, StatusDinheiro, StatusFila, TipoNotas } from "../../types";
import { MulticaixaService } from "../../services/api/multicaixa.service";
import { nivelEmoji, nivelLabel } from "./helpers";

interface ReporteModalProps {
  atm: EstadoMulticaixa;
  onClose: () => void;
  onReported: () => void;
}

const OPCOES_DINHEIRO: { id: StatusDinheiro; label: string; emoji: string }[] = [
  { id: "tem_dinheiro", label: "Tem dinheiro", emoji: "💰" },
  { id: "sem_dinheiro", label: "Sem dinheiro", emoji: "🚫" },
  { id: "avariado", label: "Avariado", emoji: "🔧" },
];

const OPCOES_FILA: { id: StatusFila; label: string }[] = [
  { id: "sem_fila", label: "Sem fila" },
  { id: "fila_pequena", label: "Fila pequena" },
  { id: "fila_grande", label: "Fila grande" },
  { id: "nao_informado", label: "Não sei" },
];

const OPCOES_NOTAS: { id: TipoNotas; label: string }[] = [
  { id: "notas_pequenas", label: "Notas pequenas" },
  { id: "so_notas_grandes", label: "Só notas grandes" },
  { id: "nao_informado", label: "Não sei" },
];

const VALORES_RAPIDOS = [1000, 5000, 10000, 20000];

export const ReporteModal: React.FC<ReporteModalProps> = ({ atm, onClose, onReported }) => {
  const [dinheiro, setDinheiro] = useState<StatusDinheiro | null>(null);
  const [fila, setFila] = useState<StatusFila>("nao_informado");
  const [notas, setNotas] = useState<TipoNotas>("nao_informado");
  const [valor, setValor] = useState<number | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<{ pontos: number; nivel: string } | null>(null);

  const podeEnviar = dinheiro !== null && !enviando && !sucesso;

  const enviar = async () => {
    if (!dinheiro) return;
    setEnviando(true);
    setErro(null);
    const res = await MulticaixaService.reportar({
      multicaixaId: atm.id,
      statusDinheiro: dinheiro,
      tipoNotas: notas,
      valorMaximo: valor,
      statusFila: fila,
    });
    setEnviando(false);
    if (!res.ok || !res.resultado) {
      setErro(res.error || "Não foi possível reportar.");
      return;
    }
    setSucesso({
      pontos: res.resultado.pontos ?? 0,
      nivel: res.resultado.nivel ?? "novato",
    });
    onReported();
  };

  const valorFormatado = valor === null ? "" : String(valor);

  return (
    <div className="fixed inset-0 z-[140] flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
              <Banknote size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-tight truncate">
                Reportar estado
              </h2>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">{atm.nome}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {sucesso ? (
          <div className="text-center py-8">
            <CheckCircle2 size={44} className="mx-auto text-emerald-500 mb-4" />
            <p className="text-lg font-black text-slate-950 dark:text-white uppercase tracking-tight mb-1">
              Reporte enviado!
            </p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">
              Obrigado por ajudares a comunidade.
            </p>
            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-orange-500/10 border border-orange-500/20">
              <span className="text-xl">{nivelEmoji(sucesso.nivel)}</span>
              <div className="text-left">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  Nível {nivelLabel(sucesso.nivel)}
                </p>
                <p className="text-sm font-black text-orange-600 dark:text-orange-400">
                  {sucesso.pontos} pontos de guardião
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="mt-6 w-full bg-orange-500 text-white rounded-2xl py-4 font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all"
            >
              Fechar
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Estado do dinheiro *</p>
              <div className="grid grid-cols-3 gap-2">
                {OPCOES_DINHEIRO.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setDinheiro(o.id)}
                    className={`rounded-2xl py-3 px-2 text-[9px] font-black uppercase tracking-widest border transition-all ${
                      dinheiro === o.id
                        ? "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20"
                        : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-300"
                    }`}
                  >
                    <span className="block text-base mb-1">{o.emoji}</span>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Fila</p>
              <div className="flex flex-wrap gap-2">
                {OPCOES_FILA.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setFila(o.id)}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                      fila === o.id
                        ? "bg-orange-500 text-white border-orange-500"
                        : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-300"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Tipos de notas</p>
              <div className="flex flex-wrap gap-2">
                {OPCOES_NOTAS.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setNotas(o.id)}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                      notas === o.id
                        ? "bg-orange-500 text-white border-orange-500"
                        : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-300"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Valor máximo que levantaste (Kz, opcional)
              </p>
              <div className="flex flex-wrap gap-2 mb-2">
                {VALORES_RAPIDOS.map((v) => (
                  <button
                    key={v}
                    onClick={() => setValor(v)}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                      valor === v
                        ? "bg-orange-500 text-white border-orange-500"
                        : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-300"
                    }`}
                  >
                    {v.toLocaleString("pt-AO")}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min={0}
                max={500000}
                value={valorFormatado}
                onChange={(e) => setValor(e.target.value === "" ? null : Number(e.target.value))}
                placeholder="0"
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all dark:text-white"
              />
            </div>

            {erro && (
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3">
                {erro}
              </p>
            )}

            <button
              onClick={enviar}
              disabled={!podeEnviar}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white rounded-2xl py-4 font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {enviando && <Loader2 size={14} className="animate-spin" />}
              {enviando ? "A enviar…" : "Enviar reporte"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
