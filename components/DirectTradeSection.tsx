import React from 'react';
import { ArrowDownCircle, ArrowUpCircle, MessageCircle } from 'lucide-react';
import { ExchangeRate } from '../types';
import { LockedOverlay } from './LockedOverlay';

interface DirectTradeSectionProps {
  isAuthenticated: boolean;
  onRequireAuth: () => void;
  rates: ExchangeRate[];
  tradeAction: 'buy' | 'sell';
  setTradeAction: (action: 'buy' | 'sell') => void;
  tradeCurrency: 'USD' | 'EUR';
  setTradeCurrency: (currency: 'USD' | 'EUR') => void;
  tradeAmount: string;
  setTradeAmount: (amount: string) => void;
  handleContactOperator: (sourceTab?: 'view' | 'trade') => void;
}

export const DirectTradeSection: React.FC<DirectTradeSectionProps> = ({
  isAuthenticated,
  onRequireAuth,
  rates,
  tradeAction,
  setTradeAction,
  tradeCurrency,
  setTradeCurrency,
  tradeAmount,
  setTradeAmount,
  handleContactOperator
}) => {
  const currentRateValue = tradeAction === 'buy' ? (rates.find(r => r.currency === tradeCurrency)?.informalSell || 0) : (rates.find(r => r.currency === tradeCurrency)?.informalBuy || 0);
  const totalKz = Math.round(((parseFloat(tradeAmount) || 0) * currentRateValue) * 100) / 100;
  const totalKzFormatted = totalKz.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });

  return (
    <div className="animate-slide-up bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-orange-500/20 md:p-20 p-8 shadow-2xl relative overflow-hidden text-center">
      {!isAuthenticated && <LockedOverlay title="Negociação Direta" onRequireAuth={onRequireAuth} />}
      <div className={!isAuthenticated ? 'blur-md pointer-events-none' : 'max-w-4xl mx-auto space-y-16'}>
        <div className="space-y-4">
          <h3 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight">NEGOCIAÇÃO DIRETA</h3>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-sm tracking-widest uppercase opacity-60">Intermediação segura de câmbio informal.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button onClick={() => setTradeAction('buy')} className={`p-10 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-6 group hover:scale-[1.02] ${tradeAction === 'buy' ? 'bg-[orange-500]/10 border-[orange-500] shadow-2xl shadow-[orange-500]/20' : 'bg-slate-100 dark:bg-slate-800/20 border-orange-500/20 opacity-50'}`}>
            <div className={`p-5 rounded-full ${tradeAction === 'buy' ? 'bg-[orange-500] text-black' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
              <ArrowDownCircle size={32} />
            </div>
            <span className="font-black uppercase tracking-widest text-sm text-slate-900 dark:text-white">QUERO COMPRAR</span>
          </button>
          <button onClick={() => setTradeAction('sell')} className={`p-10 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-6 group hover:scale-[1.02] ${tradeAction === 'sell' ? 'bg-[orange-500]/10 border-[orange-500] shadow-2xl shadow-[orange-500]/20' : 'bg-slate-100 dark:bg-slate-800/20 border-orange-500/20 opacity-50'}`}>
            <div className={`p-5 rounded-full ${tradeAction === 'sell' ? 'bg-[orange-500] text-black' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
              <ArrowUpCircle size={32} />
            </div>
            <span className="font-black uppercase tracking-widest text-sm text-slate-900 dark:text-white">QUERO VENDER</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-left">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4">MOEDA</label>
            <div className="flex gap-4">
              {['USD', 'EUR'].map(cur => (
                <button key={cur} onClick={() => setTradeCurrency(cur as any)} className={`flex-1 py-6 rounded-2xl font-black text-lg border-2 transition-all ${tradeCurrency === cur ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-orange-500/30 shadow-2xl shadow-orange-500/10' : 'bg-slate-100 dark:bg-slate-800/50 border-orange-500/10 text-slate-500'}`}>{cur}</button>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4" htmlFor="tradeAmount">MONTANTE ({tradeCurrency})</label>
            <input
              id="tradeAmount"
              type="number"
              value={tradeAmount}
              onChange={e => setTradeAmount(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800/50 border-2 border-orange-500/20 p-6 rounded-2xl font-black text-2xl text-[orange-500] outline-none focus:border-[orange-500] transition-all"
              title={`Montante em ${tradeCurrency}`}
              aria-label={`Montante em ${tradeCurrency}`}
            />
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-[#020617] p-12 rounded-[3rem] border-2 border-orange-500/20 flex flex-col md:flex-row justify-between items-center gap-10 shadow-inner">
          <div className="text-left space-y-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">TOTAL ESTIMADO EM KWANZAS</span>
            <div className="text-6xl font-black text-[orange-500]">{totalKzFormatted}</div>
          </div>
          <button onClick={() => handleContactOperator('trade')} className="w-full md:w-auto bg-[#10b981] hover:bg-[#059669] text-white px-14 py-7 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/40 active:scale-95 transition-all flex items-center justify-center gap-4">
            <MessageCircle size={28} /> FALAR NO WHATSAPP
          </button>
        </div>

        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] opacity-40">* OPERAÇÃO SUJEITA A CONFIRMAÇÃO DE STOCK E DISPONIBILIDADE.</p>
      </div>
    </div>
  );
};
