import React from 'react';
import { TrendingUp } from 'lucide-react';
import { ExchangeRate } from '../../types';

interface ExchangeRatesGridProps {
  rates: ExchangeRate[];
}

export const ExchangeRatesGrid: React.FC<ExchangeRatesGridProps> = ({ rates }) => {
  return (
    <div className="w-full">
      <div className="grid-adaptive">
        {rates.map(rate => (
          <div key={rate.currency} className="bg-white dark:bg-slate-900 rounded-[1.5rem] md:rounded-[2rem] border border-orange-500/20 p-6 md:p-10 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-center mb-6 md:mb-10">
              <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{rate.currency} / AOA</h3>
              <TrendingUp size={24} className="text-orange-500 opacity-20 group-hover:opacity-40 transition-opacity" />
            </div>
            <div className="grid grid-cols-2 gap-4 md:gap-8">
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">OFICIAL</span>
                <div className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white leading-none">
                  {rate.formalSell.toFixed(0)}
                  <span className="text-[10px] md:text-sm font-bold text-slate-400 ml-1">Kz</span>
                </div>
              </div>
              <div className="space-y-2 pl-4 md:pl-8 border-l border-orange-500/10">
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 block">RUA</span>
                <div className="text-2xl md:text-4xl font-black text-orange-500 leading-none">
                  {rate.informalSell.toFixed(0)}
                  <span className="text-[10px] md:text-sm font-bold text-orange-500/60 ml-1">Kz</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
