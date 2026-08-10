import React, { useCallback, useEffect, useState } from "react";
import { Car, Check, Loader2, RefreshCw, ShieldCheck, X, User } from "lucide-react";
import { VaiJaService } from "../../services/api/vaija.service";

interface MotoristaPendente {
  userId: string;
  nome?: string;
  phone?: string;
  matricula?: string;
  tipoVeiculo?: string;
  fotoDocumentoUrl?: string;
  criadoEm?: string;
}

export const AdminVaiJaSection: React.FC = () => {
  const [pendentes, setPendentes] = useState<MotoristaPendente[]>([]);
  const [loading, setLoading] = useState(true);
  const [operandoId, setOperandoId] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setPendentes(await VaiJaService.getMotoristasPorVerificar());
    setLoading(false);
  }, []);

  useEffect(() => {
    void Promise.resolve().then(carregar);
  }, [carregar]);

  const verDocumento = async (e: React.MouseEvent, m: MotoristaPendente) => {
    e.preventDefault();
    if (!m.fotoDocumentoUrl) return;
    const url = await VaiJaService.verDocumento(m.fotoDocumentoUrl);
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      window.alert("Não foi possível abrir o documento. Verifica se ainda existe no Storage.");
    }
  };

  const aprovar = async (userId: string) => {
    if (!window.confirm("Aprovar a identidade deste motorista?")) return;
    setOperandoId(userId);
    const res = await VaiJaService.verificarMotorista(userId, true);
    setOperandoId(null);
    if (res.ok) {
      setPendentes((prev) => prev.filter((m) => m.userId !== userId));
    } else {
      window.alert(res.error || "Erro ao aprovar.");
    }
  };

  const rejeitar = async (userId: string) => {
    if (!window.confirm("Rejeitar este motorista? O documento será removido e ele terá de o reenviar.")) return;
    setOperandoId(userId);
    const res = await VaiJaService.verificarMotorista(userId, false);
    setOperandoId(null);
    if (res.ok) {
      setPendentes((prev) => prev.filter((m) => m.userId !== userId));
    } else {
      window.alert(res.error || "Erro ao rejeitar.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-slate-950 dark:text-white uppercase tracking-tight flex items-center gap-2">
            <ShieldCheck size={18} className="text-orange-500" /> Motoristas por verificar
          </h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
            Confirma a identidade antes de deixar publicar trajetos.
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
          <Car size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Sem motoristas a aguardar verificação.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendentes.map((m) => (
            <div
              key={m.userId}
              className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-orange-500/10 flex items-center justify-between gap-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
                  <User size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-slate-950 dark:text-white uppercase tracking-tight truncate">
                    {m.nome || "Motorista"}
                  </p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
                    {m.phone || "Sem telefone"}
                    {m.matricula ? ` · ${m.matricula}` : ""} · {m.tipoVeiculo === "taxi" ? "Táxi" : "Candongueiro"}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {m.fotoDocumentoUrl ? (
                      <a
                        href="#"
                        onClick={(e) => verDocumento(e, m)}
                        className="inline-flex items-center gap-1 text-[9px] font-black text-orange-500 uppercase tracking-widest hover:underline"
                      >
                        Ver documento
                      </a>
                    ) : (
                      <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Sem documento</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => aprovar(m.userId)}
                  disabled={operandoId === m.userId}
                  className="flex items-center gap-1.5 bg-emerald-500 text-white rounded-2xl px-4 py-3 font-black text-[9px] uppercase tracking-widest hover:bg-emerald-600 transition-all disabled:opacity-50"
                >
                  {operandoId === m.userId ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  Aprovar
                </button>
                <button
                  onClick={() => rejeitar(m.userId)}
                  disabled={operandoId === m.userId}
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

export default AdminVaiJaSection;