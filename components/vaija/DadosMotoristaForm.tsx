import React, { useState } from "react";
import { Car, Upload, Loader2, CheckCircle2 } from "lucide-react";
import { VaiJaService } from "../../services/api/vaija.service";
import type { DriverData, TipoVeiculo } from "../../types";

interface DadosMotoristaFormProps {
  userId: string;
  initial?: DriverData | null;
  onSaved: (data: DriverData | null) => void;
}

export const DadosMotoristaForm: React.FC<DadosMotoristaFormProps> = ({ userId, initial, onSaved }) => {
  const [tipoVeiculo, setTipoVeiculo] = useState<TipoVeiculo>(initial?.tipoVeiculo || "candongueiro");
  const [matricula, setMatricula] = useState(initial?.matricula || "");
  const [fotoDocumentoUrl, setFotoDocumentoUrl] = useState(initial?.fotoDocumentoUrl || "");
  const [docName, setDocName] = useState(initial?.fotoDocumentoUrl ? "Documento enviado" : "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = await VaiJaService.uploadDriverDocument(userId, file);
    setUploading(false);
    if (path) {
      setFotoDocumentoUrl(path);
      setDocName(file.name);
    } else {
      setError("Não foi possível enviar o documento. Tenta novamente.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const { error: err } = await VaiJaService.saveDriverData({
      userId,
      matricula: matricula.trim() || undefined,
      tipoVeiculo,
      fotoDocumentoUrl: fotoDocumentoUrl || undefined,
    });
    setSaving(false);

    if (err) {
      setError(err);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    onSaved({
      userId,
      matricula: matricula.trim(),
      tipoVeiculo,
      fotoDocumentoUrl: fotoDocumentoUrl || undefined,
      verificado: initial?.verificado ?? false,
      statusConta: initial?.statusConta ?? "ativo",
      trajetosFantasmaCount: initial?.trajetosFantasmaCount ?? 0,
    });
  };

  const inputCls =
    "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all dark:text-white";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Tipo de veículo</label>
        <div className="grid grid-cols-2 gap-3">
          {(["candongueiro", "taxi"] as TipoVeiculo[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipoVeiculo(t)}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl border text-left text-xs font-black uppercase tracking-widest transition-all ${tipoVeiculo === t
                ? "border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                : "border-slate-200 dark:border-white/10 text-slate-500 hover:border-orange-500/40"}`}
            >
              <Car size={15} /> {t === "taxi" ? "Táxi" : "Candongueiro"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Matrícula (opcional)</label>
        <div className="relative">
          <Car size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={matricula}
            onChange={(e) => setMatricula(e.target.value)}
            placeholder="Ex: LD-45-21-AB"
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
          BI ou carta de condução <span className="normal-case opacity-70">(opcional — verificação futura)</span>
        </label>
        <label className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/15 rounded-2xl cursor-pointer hover:border-orange-500/50 transition-all">
          <Upload size={18} className="text-orange-500" />
          <div className="flex-1">
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
              {uploading ? "A enviar…" : docName || "Escolher documento"}
            </p>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Imagem do BI ou carta</p>
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
      </div>

      {error && (
        <p className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-500/10 border border-red-500/20 rounded-xl p-3">
          {error}
        </p>
      )}
      {saved && (
        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2">
          <CheckCircle2 size={14} /> Dados de motorista guardados.
        </p>
      )}

      <button
        type="submit"
        disabled={saving || uploading}
        className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:bg-orange-600 active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
        Guardar Dados de Motorista
      </button>
    </form>
  );
};
