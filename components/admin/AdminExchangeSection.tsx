
import React from 'react';
import { DollarSign, TrendingUp, Save, ShieldCheck } from 'lucide-react';

interface ExchangeRate {
  currency: string;
  informalBuy: number;
  informalSell: number;
}

interface AdminExchangeSectionProps {
  rates: ExchangeRate[];
  setRates: React.Dispatch<React.SetStateAction<ExchangeRate[]>>;
  loading: boolean;
  handleUpdateRate: (currency: string, buy: number, sell: number) => void;
}

export const AdminExchangeSection: React.FC<AdminExchangeSectionProps> = ({
  rates,
  setRates,
  loading,
  handleUpdateRate
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-orange-500/10 shadow-sm">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-4 mb-8 text-center md:text-left stack-narrow">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
            <DollarSign size={24} />
          </div>
          <div className="w-full md:w-auto">
            <h3 className="font-black text-lg uppercase leading-tight">Gestão de Câmbio</h3>
            <p className="text-xs text-slate-500">Atualiza as taxas de mercado paralelo em tempo real.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {rates.map((rate) => (
            <div key={rate.currency} className="bg-slate-50 dark:bg-white/5 p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                <TrendingUp size={64} className="text-orange-500" />
              </div>
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                    {rate.currency === 'USD' ? '🇺🇸 Dólar (USD)' : '🇪🇺 Euro (EUR)'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Compra (AOA)</label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-orange-500/20"
                      value={rate.informalBuy}
                      onChange={(e) => setRates(prev => prev.map(r => r.currency === rate.currency ? { ...r, informalBuy: Number(e.target.value) } : r))}
                      title="Preço de Compra"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Venda (AOA)</label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-orange-500/20"
                      value={rate.informalSell}
                      onChange={(e) => setRates(prev => prev.map(r => r.currency === rate.currency ? { ...r, informalSell: Number(e.target.value) } : r))}
                      title="Preço de Venda"
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleUpdateRate(rate.currency, rate.informalBuy, rate.informalSell)}
                  disabled={loading}
                  className="w-full bg-slate-900 dark:bg-orange-500 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-orange-500/10"
                >
                  {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <><Save size={16} /> Atualizar {rate.currency}</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-[2rem] flex gap-4 items-start">
        <ShieldCheck className="text-amber-500 shrink-0 mt-1" size={24} />
        <div>
          <h4 className="font-black text-amber-500 uppercase text-xs tracking-widest mb-1">Nota de Segurança</h4>
          <p className="text-[11px] text-amber-600/80 font-medium leading-relaxed">
            As alterações no câmbio informal têm impacto imediato em todas as calculadoras e conversores da aplicação. Certifique-se de validar as taxas antes de guardar.
          </p>
        </div>
      </div>
    </div>
  );
};
