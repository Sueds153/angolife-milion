import React from 'react';
import { Calculator, ChevronDown, ArrowRightLeft, Sparkles } from 'lucide-react';
import { ExchangeRate } from '../types';
import { LockedOverlay } from './LockedOverlay';

interface ConversionSimulatorProps {
  isAuthenticated: boolean;
  onRequireAuth: () => void;
  rates: ExchangeRate[];
  baseAmount: number;
  setBaseAmount: (amount: number) => void;
  isOfficial: boolean;
  setIsOfficial: (official: boolean) => void;
  baseCurrency: 'AOA' | 'USD' | 'EUR';
  setBaseCurrency: (currency: 'AOA' | 'USD' | 'EUR') => void;
  targetCurrency: 'AOA' | 'USD' | 'EUR';
  setTargetCurrency: (currency: 'AOA' | 'USD' | 'EUR') => void;
  openDropdown: 'base' | 'target' | null;
  setOpenDropdown: (dropdown: 'base' | 'target' | null) => void;
}

export const ConversionSimulator: React.FC<ConversionSimulatorProps> = ({
  isAuthenticated,
  onRequireAuth,
  rates,
  baseAmount,
  setBaseAmount,
  isOfficial,
  setIsOfficial,
  baseCurrency,
  setBaseCurrency,
  targetCurrency,
  setTargetCurrency,
  openDropdown,
  setOpenDropdown
}) => {
  const calculateConversion = () => {
    if (!rates.length) return '0.00';
    const foreignCurrency = baseCurrency === 'AOA' ? targetCurrency : baseCurrency;
    const rateData = rates.find(r => r.currency === foreignCurrency);
    if (!rateData) return '0.00';
    const rate = isOfficial ? rateData.formalSell : rateData.informalSell;
    if (!rate) return '0.00';
    const result = baseCurrency === 'AOA' ? baseAmount / rate : baseAmount * rate;
    return result.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="bg-slate-100 dark:bg-slate-900 rounded-[2.5rem] border border-orange-500/20 p-10 shadow-sm relative overflow-hidden transition-colors">
      {!isAuthenticated && <LockedOverlay title="Simulador Elite" onRequireAuth={onRequireAuth} />}
      <div className={!isAuthenticated ? 'blur-md pointer-events-none' : ''}>
        <div className="flex items-center gap-3 mb-10">
          <Calculator className="text-[orange-500]" size={28} />
          <h3 className="text-2xl font-black uppercase text-white tracking-widest">SIMULADOR DE CONVERSÃO</h3>
        </div>

        <div className="flex justify-center mb-10">
          <div className="bg-slate-200 dark:bg-black p-1.5 rounded-2xl flex border border-orange-500/10 shadow-inner">
            <button onClick={() => setIsOfficial(true)} className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${isOfficial ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>BANCOS (BNA)</button>
            <button onClick={() => setIsOfficial(false)} className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${!isOfficial ? 'bg-[orange-500] text-white shadow-lg' : 'text-slate-500 dark:text-slate-400'}`}>MERCADO INFORMAL</button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-black p-6 md:p-8 rounded-[2rem] border border-orange-500/20 shadow-sm">
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 block">VOCÊ ENVIA</span>
            <div className="flex items-center gap-4">
              <input type="number" value={baseAmount} onChange={e => setBaseAmount(Number(e.target.value))} className="w-full bg-transparent text-3xl md:text-5xl font-black text-slate-900 dark:text-white outline-none" title="Enviar" />
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === 'base' ? null : 'base'); }}
                  className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 px-5 py-3 rounded-2xl border border-orange-500/20 shadow-xl"
                  title={`Trocar moeda de envio (${baseCurrency})`}
                  aria-label={`Moeda de envio atual: ${baseCurrency}`}
                >
                  <img src={`https://flagcdn.com/${baseCurrency === 'AOA' ? 'ao' : baseCurrency === 'USD' ? 'us' : 'eu'}.svg`} className="w-6 h-6 rounded-full" alt={`${baseCurrency} flag`} />
                  <span className="font-black text-sm text-slate-900 dark:text-white">{baseCurrency}</span>
                  <ChevronDown size={16} className="text-slate-400" />
                </button>

                {openDropdown === 'base' && (
                  <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 border border-orange-500/20 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-fade-in">
                    {(['AOA', 'USD', 'EUR'] as const).map(cur => (
                      <button
                        key={cur}
                        onClick={() => { setBaseCurrency(cur); setOpenDropdown(null); }}
                        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-100 dark:hover:bg-white/5 transition-all text-left"
                      >
                        <img src={`https://flagcdn.com/${cur === 'AOA' ? 'ao' : cur === 'USD' ? 'us' : 'eu'}.svg`} className="w-4 h-4 rounded-full" alt={cur} />
                        <span className={`font-black text-xs uppercase tracking-widest ${baseCurrency === cur ? 'text-orange-500' : 'text-slate-500 dark:text-slate-400'}`}>{cur}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-center -my-8 relative z-10">
            <button
              onClick={() => { setBaseCurrency(targetCurrency); setTargetCurrency(baseCurrency); }}
              className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-orange-500/20 shadow-lg text-[orange-500] active:scale-95 transition-all"
              title="Inverter Moedas"
              aria-label="Inverter moedas de envio e recebimento"
            >
              <ArrowRightLeft size={24} />
            </button>
          </div>

          <div className="bg-white dark:bg-black p-6 md:p-8 rounded-[2rem] border border-orange-500/20 shadow-sm">
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 block">VOCÊ RECEBE</span>
            <div className="flex items-center gap-4">
              <div className="w-full text-3xl md:text-5xl font-black text-[orange-500]">{calculateConversion()}</div>
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === 'target' ? null : 'target'); }}
                  className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 px-5 py-3 rounded-2xl border border-orange-500/20 shadow-xl"
                  title={`Trocar moeda de recebimento (${targetCurrency})`}
                  aria-label={`Moeda de recebimento atual: ${targetCurrency}`}
                >
                  <img src={`https://flagcdn.com/${targetCurrency === 'AOA' ? 'ao' : targetCurrency === 'USD' ? 'us' : 'eu'}.svg`} className="w-6 h-6 rounded-full" alt={`${targetCurrency} flag`} />
                  <span className="font-black text-sm text-slate-900 dark:text-white">{targetCurrency}</span>
                  <ChevronDown size={16} className="text-slate-400" />
                </button>

                {openDropdown === 'target' && (
                  <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 border border-orange-500/20 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-fade-in">
                    {(['AOA', 'USD', 'EUR'] as const).map(cur => (
                      <button
                        key={cur}
                        onClick={() => { setTargetCurrency(cur); setOpenDropdown(null); }}
                        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-100 dark:hover:bg-white/5 transition-all text-left"
                      >
                        <img src={`https://flagcdn.com/${cur === 'AOA' ? 'ao' : cur === 'USD' ? 'us' : 'eu'}.svg`} className="w-4 h-4 rounded-full" alt={cur} />
                        <span className={`font-black text-xs uppercase tracking-widest ${targetCurrency === cur ? 'text-orange-500' : 'text-slate-500 dark:text-slate-400'}`}>{cur}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-orange-500/20 flex justify-between items-center px-4">
          <div className="flex items-center gap-2 text-[orange-500] text-[10px] font-black uppercase tracking-widest">
            <Sparkles size={14} /> Melhor taxa garantida
          </div>
          <span className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest">1 USD = {(isOfficial ? rates.find(r => r.currency === 'USD')?.formalSell : rates.find(r => r.currency === 'USD')?.informalSell)?.toLocaleString('pt-AO')} Kz</span>
        </div>
      </div>
    </div>
  );
};
