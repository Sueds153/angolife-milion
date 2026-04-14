import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, DollarSign, Briefcase, ShoppingBag } from 'lucide-react';
import { ExchangeRate, Job, ProductDeal } from '../../types';

interface StatsDashboardProps {
  usdRate?: ExchangeRate;
  featuredJobs: Job[];
  featuredDeals: ProductDeal[];
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ usdRate, featuredJobs, featuredDeals }) => {
  const navigate = useNavigate();

  return (
    <div className="grid-adaptive">
      <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] p-5 md:p-10 shadow-xl cursor-pointer group gold-border-subtle active:scale-[0.98] transition-all" onClick={() => navigate('/cambio')}>
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <div className="w-10 h-10 md:w-14 md:h-14 bg-brand-gold/5 rounded-xl text-brand-gold flex items-center justify-center">
            <DollarSign className="w-5 h-5 md:w-7 md:h-7" />
          </div>
          <ChevronRight size={16} className="text-slate-300" />
        </div>
        <span className="text-[8px] md:text-[11px] text-slate-400 font-black uppercase tracking-widest block mb-1">Câmbio Rua</span>
        <span className="text-2xl md:text-5xl font-black text-brand-gold">{usdRate?.informalSell.toFixed(0) || '-'} <span className="text-xs md:text-sm font-bold text-brand-gold">Kz</span></span>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] p-5 md:p-10 shadow-xl cursor-pointer group gold-border-subtle active:scale-[0.98] transition-all" onClick={() => navigate('/vagas')}>
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <div className="w-10 h-10 md:w-14 md:h-14 bg-brand-gold/5 rounded-xl text-brand-gold flex items-center justify-center">
            <Briefcase className="w-5 h-5 md:w-7 md:h-7" />
          </div>
          <ChevronRight size={16} className="text-slate-300" />
        </div>
        <span className="text-[8px] md:text-[11px] text-slate-400 font-black uppercase tracking-widest block mb-1">Vagas de Elite</span>
        <span className="text-2xl md:text-5xl font-black text-brand-gold">{featuredJobs.length}+ <span className="text-xs md:text-sm font-bold text-slate-400">Abertas</span></span>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] p-5 md:p-10 shadow-xl cursor-pointer group gold-border-subtle active:scale-[0.98] transition-all" onClick={() => navigate('/ofertas')}>
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <div className="w-10 h-10 md:w-14 md:h-14 bg-brand-gold/10 rounded-xl text-brand-gold flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 md:w-7 md:h-7" />
          </div>
          <ChevronRight size={16} className="text-slate-300" />
        </div>
        <span className="text-[8px] md:text-[11px] text-slate-400 font-black uppercase tracking-widest block mb-1">Promoções</span>
        <span className="text-2xl md:text-5xl font-black text-brand-gold">{featuredDeals.length} <span className="text-xs md:text-sm font-bold text-slate-400">Destaques</span></span>
      </div>
    </div>
  );
};
