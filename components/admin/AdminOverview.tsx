
import React, { useEffect, useState } from 'react';
import { Briefcase, Newspaper, Tag, Crown, TrendingUp } from 'lucide-react';
import { JobsService } from '../../services/api/jobs.service';
import { NewsService } from '../../services/api/news.service';
import { DealsService } from '../../services/api/deals.service';
import { SubscriptionService } from '../../services/api/subscription.service';

export const AdminOverview: React.FC = () => {
  const [metrics, setMetrics] = useState({
    totalJobs: 0,
    pendingJobs: 0,
    totalNews: 0,
    pendingNews: 0,
    totalDeals: 0,
    pendingDeals: 0,
    cvSubscriptions: 0,
    pendingCVSubs: 0,
  });

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const [allJobs, pendingJobs, allNews, pendingNews, allDeals, pendingDeals, cvSubs] = await Promise.all([
          JobsService.getJobs(true),
          JobsService.getPendingJobs(),
          NewsService.getNews(true),
          NewsService.getPendingNews(),
          DealsService.getDeals(true),
          DealsService.getPendingDeals(),
          SubscriptionService.getCVSubscriptions(),
        ]);

        setMetrics({
          totalJobs: allJobs.length,
          pendingJobs: pendingJobs.length,
          totalNews: allNews.length,
          pendingNews: pendingNews.length,
          totalDeals: allDeals.length,
          pendingDeals: pendingDeals.length,
          cvSubscriptions: cvSubs.length,
          pendingCVSubs: cvSubs.filter(s => s.status === 'pending').length,
        });
      } catch (error) {
        console.error('Error loading admin metrics:', error);
      }
    };

    loadMetrics();
  }, []);

  const metricCards = [
    { label: 'Total de Vagas', value: metrics.totalJobs, pending: metrics.pendingJobs, icon: Briefcase, color: 'bg-orange-500/10 text-orange-500', bg: 'bg-slate-50 dark:bg-white/5' },
    { label: 'Total de Notícias', value: metrics.totalNews, pending: metrics.pendingNews, icon: Newspaper, color: 'bg-blue-500/10 text-blue-500', bg: 'bg-slate-50 dark:bg-white/5' },
    { label: 'Total de Descontos', value: metrics.totalDeals, pending: metrics.pendingDeals, icon: Tag, color: 'bg-emerald-500/10 text-emerald-500', bg: 'bg-slate-50 dark:bg-white/5' },
    { label: 'Subscrições CV', value: metrics.cvSubscriptions, pending: metrics.pendingCVSubs, icon: Crown, color: 'bg-amber-500/10 text-amber-500', bg: 'bg-slate-50 dark:bg-white/5' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-slate-50 dark:bg-white/5 p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] text-center border border-orange-500/10">
        <h3 className="text-xl font-black uppercase mb-4">Bem-vindo ao Painel de Controlo</h3>
        <p className="text-slate-500 text-sm max-w-sm mx-auto">Utilize as abas acima para gerir os diferentes departamentos da AngoLife.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card, i) => (
          <div key={i} className={`${card.bg} p-6 rounded-[2rem] border border-orange-500/10 shadow-sm space-y-3`}>
            <div className="flex items-center justify-between">
              <div className={`w-12 h-12 rounded-2xl ${card.color} flex items-center justify-center`}>
                <card.icon size={24} />
              </div>
              <span className={`text-[8px] font-black uppercase tracking-widest ${card.color.replace('bg-', 'text-').replace('/10', '')}`}>{card.pending > 0 ? `${card.pending} pendentes` : 'Tudo em dia'}</span>
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{card.value}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-[2rem] flex gap-4 items-start">
        <TrendingUp className="text-amber-500 shrink-0 mt-1" size={24} />
        <div>
          <h4 className="font-black text-amber-500 uppercase text-xs tracking-widest mb-1">Ações Rápidas</h4>
          <p className="text-[11px] text-amber-600/80 font-medium leading-relaxed">
            Verifique as abas "Vagas", "Notícias" e "Descontos" para aprovar conteúdos pendentes. 
            Sincronize com a IA para capturar novas oportunidades automaticamente.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
