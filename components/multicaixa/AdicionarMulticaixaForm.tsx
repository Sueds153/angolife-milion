/**
 * @copyright (c) 2024-2026 Resolve.AO by Su-Golden. All rights reserved.
 */

import React, { useState } from "react";
import { CheckCircle2, Loader2, LocateFixed, MapPin, Send, X } from "lucide-react";
import { MulticaixaService } from "../../services/api/multicaixa.service";

interface AdicionarMulticaixaFormProps {
  onAdded: () => void;
}

export const AdicionarMulticaixaForm: React.FC<AdicionarMulticaixaFormProps> = ({ onAdded }) => {
  const [nome, setNome] = useState("");
  const [banco, setBanco] = useState("");
  const [bairro, setBairro] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [localizando, setLocalizando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const usarLocalizacao = () => {
    if (!navigator.geolocation) {
      setErro("Este navegador não suporta geolocalização.");
      return;
    }
    setLocalizando(true);
    setErro(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setLocalizando(false);
      },
      () => {
        setErro("Não foi possível obter a localização.");
        setLocalizando(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const enviar = async () => {
    const latitude = Number(lat);
    const longitude = Number(lng);
    if (!nome.trim()) {
      setErro("Indica o nome do multicaixa.");
      return;
    }
    if (!lat || !lng || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      setErro("Indica a localização (usa o botão ou escreve as coordenadas).");
      return;
    }
    setEnviando(true);
    setErro(null);
    setAviso(null);
    const res = await MulticaixaService.adicionar({
      nome: nome.trim(),
      banco: banco.trim(),
      latitude,
      longitude,
      bairro: bairro.trim() || undefined,
    });
    setEnviando(false);
    if (!res.ok) {
      setErro(res.error || "Não foi possível adicionar.");
      return;
    }
    setAviso(res.aviso ?? null);
    setSucesso(true);
    onAdded();
  };

  if (sucesso) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center shadow-sm border border-orange-500/10">
        <CheckCircle2 size={44} className="mx-auto text-emerald-500 mb-4" />
        <h2 className="text-lg font-black text-slate-950 dark:text-white uppercase tracking-tight mb-1">
          Multicaixa submetido!
        </h2>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest max-w-sm mx-auto">
          A equipa Resolve.AO vai rever e aprovar em breve.
        </p>
        {aviso && (
          <p className="mt-4 text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-3">
            {aviso}
          </p>
        )}
      </div>
    );
  }

  const inputCls =
    "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all dark:text-white";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-orange-500/10">
      <div className="mb-6 pb-4 border-b border-orange-500/10">
        <h2 className="text-lg font-black text-slate-950 dark:text-white uppercase tracking-tight flex items-center gap-2">
          <MapPin size={18} className="text-orange-500" /> Adicionar multicaixa
        </h2>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
          Sabes de um multicaixa que falta aqui? Partilha-o com a comunidade.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Nome *</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Multicaixa Belas Shopping" className={inputCls} />
          </div>
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Banco</label>
            <input value={banco} onChange={(e) => setBanco(e.target.value)} placeholder="Ex.: BAI" className={inputCls} />
          </div>
        </div>

        <div>
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Bairro</label>
          <input value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Ex.: Talatona" className={inputCls} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Localização *</label>
            <button
              onClick={usarLocalizacao}
              disabled={localizando}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 transition-all disabled:opacity-50"
            >
              {localizando ? <Loader2 size={11} className="animate-spin" /> : <LocateFixed size={11} />}
              {localizando ? "A localizar…" : "Usar a minha localização"}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <input
                type="number"
                step="0.000001"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="Latitude"
                className={`${inputCls} pl-4`}
              />
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.000001"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="Longitude"
                className={`${inputCls} pl-4`}
              />
            </div>
          </div>
        </div>

        {erro && (
          <p className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 flex items-center gap-2">
            <X size={13} /> {erro}
          </p>
        )}
        {aviso && (
          <p className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-3">
            {aviso}
          </p>
        )}

        <button
          onClick={enviar}
          disabled={enviando}
          className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white rounded-2xl py-4 font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all disabled:opacity-40"
        >
          {enviando ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          {enviando ? "A submeter…" : "Submeter para revisão"}
        </button>
      </div>
    </div>
  );
};
