import React, { useEffect, useState } from "react";
import { Car, Route, Loader2, ChevronDown, MapPin } from "lucide-react";
import { VaiJaService } from "../../services/api/vaija.service";
import type { Corredor, ModoTrajeto } from "../../types";
import { formatPreco } from "./helpers";

interface PublicarTrajetoFormProps {
  motoristaId: string;
  onPublished: (trajetoId: string) => void;
}

const MODOS: { value: ModoTrajeto; label: string; desc: string }[] = [
  { value: "trajeto", label: "Trajeto único", desc: "Vou agora, fecha em 20 min" },
  { value: "corredor", label: "Corredor fixo", desc: "Estou na rota, renovável 2h" },
];

export const PublicarTrajetoForm: React.FC<PublicarTrajetoFormProps> = ({ motoristaId, onPublished }) => {
  const [modo, setModo] = useState<ModoTrajeto>("trajeto");
  const [corredores, setCorredores] = useState<Corredor[]>([]);
  const [corredorId, setCorredorId] = useState<string>("");
  const [pontoPartida, setPontoPartida] = useState("");
  const [pontoDestino, setPontoDestino] = useState("");
  const [preco, setPreco] = useState<string>("");
  const [lugares, setLugares] = useState<string>("4");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (modo === "corredor") {
      VaiJaService.getCorredores().then(setCorredores);
    }
  }, [modo]);

  const selectCorredor = (id: string) => {
    setCorredorId(id);
    const c = corredores.find((x) => x.id === id);
    if (c) {
      setPontoPartida(c.partida);
      setPontoDestino(c.destino);
      if (c.precoReferencia) setPreco(String(c.precoReferencia));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pontoPartida.trim() || !pontoDestino.trim()) {
      setError("Indica a partida e o destino.");
      return;
    }
    const precoNum = Number(preco);
    if (!precoNum || precoNum <= 0) {
      setError("Indica um preço válido (Kz).");
      return;
    }
    setSaving(true);
    setError(null);

    const corredor = corredores.find((c) => c.id === corredorId);
    const { id, error: err } = await VaiJaService.publicarTrajeto({
      motoristaId,
      modo,
      corredorId: modo === "corredor" ? corredorId || null : undefined,
      pontoPartida: pontoPartida.trim(),
      partidaLat: corredor?.partidaLat ?? null,
      partidaLng: corredor?.partidaLng ?? null,
      pontoDestino: pontoDestino.trim(),
      destinoLat: corredor?.destinoLat ?? null,
      destinoLng: corredor?.destinoLng ?? null,
      lugaresTotais: Math.max(1, Number(lugares) || 4),
      preco: precoNum,
    });
    setSaving(false);

    if (err || !id) {
      setError(err || "Não foi possível publicar. Tenta novamente.");
      return;
    }
    onPublished(id);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {MODOS.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setModo(m.value)}
            className={`p-4 rounded-2xl border text-left transition-all ${modo === m.value
              ? "border-orange-500 bg-orange-500/10 shadow-lg"
              : "border-slate-200 dark:border-white/10 hover:border-orange-500/40"}`}
          >
            <div className="flex items-center gap-2 mb-1">
              {m.value === "corredor" ? <Route size={16} className="text-orange-500" /> : <Car size={16} className="text-orange-500" />}
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">{m.label}</p>
            </div>
            <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400">{m.desc}</p>
          </button>
        ))}
      </div>

      {modo === "corredor" && (
        <div className="relative">
          <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Rota (corredor)</label>
          <div className="relative">
            <Route size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={corredorId}
              onChange={(e) => selectCorredor(e.target.value)}
              className="w-full appearance-none bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3 pl-12 pr-10 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all dark:text-white"
            >
              <option value="">Escolhe um corredor…</option>
              {corredores.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}{c.precoReferencia ? ` — ${formatPreco(c.precoReferencia)}` : ""}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Partida</label>
          <div className="relative">
            <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={pontoPartida}
              onChange={(e) => setPontoPartida(e.target.value)}
              placeholder="Ex: Maianga"
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all dark:text-white"
            />
          </div>
        </div>
        <div>
          <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Destino</label>
          <div className="relative">
            <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={pontoDestino}
              onChange={(e) => setPontoDestino(e.target.value)}
              placeholder="Ex: Mutamba"
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all dark:text-white"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Preço (Kz)</label>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
            placeholder="500"
            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3 px-4 text-sm font-black font-mono focus:ring-2 focus:ring-orange-500 outline-none transition-all dark:text-white"
          />
        </div>
        <div>
          <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Lugares</label>
          <input
            type="number"
            min="1"
            max="12"
            inputMode="numeric"
            value={lugares}
            onChange={(e) => setLugares(e.target.value)}
            placeholder="4"
            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3 px-4 text-sm font-black font-mono focus:ring-2 focus:ring-orange-500 outline-none transition-all dark:text-white"
          />
        </div>
      </div>

      {error && (
        <p className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-500/10 border border-red-500/20 rounded-xl p-3">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-orange-500 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-orange-500/20 hover:bg-orange-600 active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
      >
        {saving ? <Loader2 size={18} className="animate-spin" /> : <Car size={18} />}
        Publicar Trajeto
      </button>
    </form>
  );
};
