import React, { useState } from "react";
import { MapPin, Loader2, Radio } from "lucide-react";
import { VaiJaService } from "../../services/api/vaija.service";

interface PedirBoleiaFormProps {
  passageiroId: string;
  onCreated?: () => void;
}

export const PedirBoleiaForm: React.FC<PedirBoleiaFormProps> = ({ passageiroId, onCreated }) => {
  const [partida, setPartida] = useState("");
  const [destino, setDestino] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partida.trim() || !destino.trim()) {
      setError("Indica a partida e o destino.");
      return;
    }
    setSaving(true);
    setError(null);
    const { id, error: err } = await VaiJaService.criarPedido({
      passageiroId,
      pontoPartida: partida.trim(),
      pontoDestino: destino.trim(),
    });
    setSaving(false);

    if (err || !id) {
      setError(err || "Não foi possível criar o pedido.");
      return;
    }
    setPartida("");
    setDestino("");
    setSucesso(true);
    setTimeout(() => setSucesso(false), 3000);
    onCreated?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={partida}
          onChange={(e) => setPartida(e.target.value)}
          placeholder="Onde estás? Ex: Futungo"
          className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all dark:text-white"
        />
      </div>
      <div className="relative">
        <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={destino}
          onChange={(e) => setDestino(e.target.value)}
          placeholder="Para onde vais? Ex: Mutamba"
          className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all dark:text-white"
        />
      </div>

      {error && (
        <p className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-500/10 border border-red-500/20 rounded-xl p-3">
          {error}
        </p>
      )}
      {sucesso && (
        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
          Pedido publicado. Os motoristas desta rota vão ver a tua procura.
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Radio size={16} className="text-orange-500" />}
        Pedir Boleia
      </button>
    </form>
  );
};
