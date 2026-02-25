import React from 'react';
import { Activity } from 'lucide-react';
import { ExchangeRate } from '../types';

interface TradeTerminalProps {
  rates: ExchangeRate[];
  tradeType: 'buy' | 'sell';
  setTradeType: (type: 'buy' | 'sell') => void;
  terminalAmount: string;
  setTerminalAmount: (amount: string) => void;
  handleContactOperator: (sourceTab?: 'view' | 'trade') => void;
}

export const TradeTerminal: React.FC<TradeTerminalProps> = ({
  rates,
  tradeType,
  setTradeType,
  terminalAmount,
  setTerminalAmount,
  handleContactOperator
}) => {
  const estimatedTotal = Math.round(((parseFloat(terminalAmount) || 0) * (tradeType === 'buy' ? (rates.find(r => r.currency === 'USD')?.informalSell || 0) : (rates.find(r => r.currency === 'USD')?.informalBuy || 0))) * 100) / 100;
  const estimatedTotalFormatted = estimatedTotal.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });

  return (
    <div className="sticky top-24 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-orange-500/20 p-8 shadow-sm">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-orange-500/10">
        <div className="flex items-center gap-3">
          <Activity size={20} className="text-[orange-500]" />
          <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tighter">Terminal</h3>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[9px] font-black uppercase animate-pulse border border-green-500/20">LIVE</div>
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 dark:bg-black rounded-2xl border border-orange-500/20 shadow-inner">
          <button onClick={() => setTradeType('buy')} className={`py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tradeType === 'buy' ? 'bg-[#22c55e] text-white shadow-xl shadow-green-500/20' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>COMPRAR</button>
          <button onClick={() => setTradeType('sell')} className={`py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tradeType === 'sell' ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>VENDER</button>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-2" htmlFor="terminalAmount">MONTANTE (USD)</label>
          <input
            id="terminalAmount"
            type="number"
            value={terminalAmount}
            onChange={e => setTerminalAmount(e.target.value)}
            className="w-full bg-white dark:bg-black border border-orange-500/20 p-5 rounded-2xl text-slate-900 dark:text-white font-mono font-black text-lg outline-none focus:border-[orange-500] transition-all"
            title="Montante para Câmbio"
            aria-label="Montante em Dólares"
          />
        </div>

        <div className="bg-slate-100 dark:bg-black p-6 rounded-2xl space-y-2 border border-orange-500/20 shadow-inner">
          <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">TOTAL ESTIMADO (A PAGAR)</span>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-[orange-500] tracking-tight">{estimatedTotalFormatted}</span>
          </div>
        </div>

        <button onClick={() => handleContactOperator('view')} className="w-full py-6 rounded-2xl bg-[#22c55e] hover:bg-green-600 text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-green-500/40 active:scale-95 transition-all">
          CONFIRMAR COMPRA
        </button>
        <p className="text-[9px] text-center text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest italic opacity-50">*Transação sujeita a verificação e disponibilidade.</p>
      </div>
    </div>
  );
};
