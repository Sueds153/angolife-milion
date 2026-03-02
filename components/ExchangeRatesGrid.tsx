import React from 'react';
import { TrendingUp } from 'lucide-react';
import { ExchangeRate } from '../types';

interface ExchangeRatesGridProps {
  rates: ExchangeRate[];
}

export const ExchangeRatesGrid: React.FC<ExchangeRatesGridProps> = ({ rates }) => {
  return (
    <div className="scroll-x-touch pb-4 -mx-4 px-4 no-scrollbar lg:mx-0 lg:px-0 lg:pb-0">
      <div className="flex flex-nowrap lg:grid lg:grid-cols-2 gap-6">
        {rates.map(rate => (
          <div key={rate.currency} className="min-w-[280px] lg:min-w-0 bg-white dark:bg-slate-900 rounded-[2rem] border border-orange-500/20 p-8 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{rate.currency} / AOA</h3>
              <TrendingUp size={24} className="text-[orange-500] opacity-50" />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">OFICIAL (BNA)</span>
                <div className="text-3xl font-black text-[orange-500]">{rate.formalSell.toFixed(0)} <span className="text-sm font-medium">Kz</span></div>
              </div>
              <div className="space-y-1 pl-6 border-l border-orange-500/10">
                <span className="text-[10px] font-black uppercase tracking-widest text-[orange-500]">RUA (SU-GOLDEN)</span>
                <div className="text-3xl font-black text-[orange-500]">{rate.informalSell.toFixed(0)} <span className="text-sm font-medium">Kz</span></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
