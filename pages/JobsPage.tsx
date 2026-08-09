import React, { useEffect, useMemo, useState } from 'react';
import { Search, ChevronRight, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';
import { JobsService } from '../services/api/jobs.service';
import { Job, UserProfile } from '../types';
import { AdBanner } from '../components/ads/AdBanner';
import { useAppStore } from '../store/useAppStore';
import { useAds } from '../hooks/useAds';
import { JobCard } from '../components/jobs/JobCard';
import { JobDetailsModal } from '../components/jobs/JobDetailsModal';
import { ServiceUtils } from '../services/utils/utils';
import { JobUtils } from '../services/utils/jobUtils';
import { Helmet } from 'react-helmet-async';

interface JobsPageProps {
  onRequestReward?: (onSuccess: () => void, onCancel: () => void) => void;
  onShowInterstitial?: (callback: () => void) => void;
  subscribedCategories?: string[];
  onToggleSubscription?: (category: string) => void;
}

const PROVINCES = [
  'Todas', 'Hoje 🔥', 'Últimas 48h', 'Luanda', 'Benguela', 'Huambo', 'Huíla', 'Cabinda', 'Namibe', 'Cuanza Sul', 'Cuanza Norte',
  'Malanje', 'Uíge', 'Zaire', 'Lunda Norte', 'Lunda Sul', 'Moxico', 'Bié', 'Cuando Cubango', 'Cunene', 'Bengo'
];

export const JobsPage: React.FC<JobsPageProps> = ({ 
  onRequestReward, 
  onShowInterstitial, 
  subscribedCategories = [], 
  onToggleSubscription 
}) => {
  const { user, setUser, isAuthenticated, setAuthModal } = useAppStore();
  const onRequireAuth = () => setAuthModal(true, 'login');
  const onUpdateUser = (updates: Partial<UserProfile>) => user && setUser({ ...user, ...updates });
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('Todas');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFlagged, setShowFlagged] = useState(false);
  const JOBS_PER_PAGE = 12;

  const { 
    isAdLoading, 
    isProcessing, 
    executeWithRewardAd, 
    executeWithInterstitial 
  } = useAds({ onShowInterstitial, onRequestReward });

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, selectedProvince]);

  // Pesquisa server-side com debounce (evita 1 request por tecla)
  useEffect(() => {
    const term = filter.trim();
    if (term.length < 2) {
      loadJobs();
      return;
    }
    const timer = setTimeout(() => loadJobs(term), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async (searchTerm?: string) => {
    setLoading(true);
    const data = await JobsService.getJobs(false, searchTerm ? { search: searchTerm } : {});
    setJobs(data);
    setLoading(false);

    // Interest-based Notification Logic
    if (data.length > 0) {
      const savedInterests = JSON.parse(localStorage.getItem('user_interests') || '[]');
      if (savedInterests.length > 0) {
        // Find jobs posted in the last 2 hours that match interests
        const now = new Date();
        const twoHoursAgo = now.getTime() - (2 * 60 * 60 * 1000);

        const matches = data.filter(job => {
          const postDate = new Date(job.postedAt).getTime();
          if (postDate < twoHoursAgo) return false;

          return savedInterests.some((interest: string) =>
            job.title.toLowerCase().includes(interest.toLowerCase())
          );
        });

        if (matches.length > 0) {
          const match = matches[0];
          import('../services/integrations/notificationService').then(({ NotificationService }) => {
            NotificationService.sendNativeNotification(
              `Nova vaga de ${match.category || 'Emprego'} disponível!`,
              `${match.title} @ ${match.company}. Clica para ver.`
            );
          });
        }
      }
    }
  };

  const handleOpenDetails = (job: Job) => {
    if (!isAuthenticated) {
      if (onShowInterstitial) {
        onShowInterstitial(() => onRequireAuth());
      } else {
        onRequireAuth();
      }
      return;
    }

    executeWithRewardAd(() => {
      setSelectedJob(job);
    });
  };

  const handleShareWhatsApp = (e: React.MouseEvent, job: Job) => {
    e.stopPropagation();

    const executeShare = () => {
      const appLink = "https://resolveao.vercel.app";
      const text = `🚀 *Vaga Imperdível:* ${job.title}\n🏢 *Empresa:* ${job.company}\n📍 *Local:* ${job.location}\n\nOlha esta vaga que encontrei na Resolve.AO! Sê o primeiro a candidatar-te.\n\nBaixa aqui o app e vê mais: ${appLink}`;
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    };

    executeWithInterstitial(executeShare);
  };

  const handleToggleSave = async (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    if (!user || !onUpdateUser) return;

    const newList = await JobsService.toggleSaveJob(user.id || '', user.savedJobs || [], jobId);
    onUpdateUser({ savedJobs: newList });
  };

  const handleApplyClick = async (job: Job) => {
    const executeApply = async () => {
      // 1. Increment global count
      await JobsService.incrementApplicationCount(job.id);

      // 2. Save to user history if authenticated
      if (user && onUpdateUser) {
        const newHistory = await JobsService.submitJobApplication(user.id || '', user.applicationHistory || [], job);
        onUpdateUser({ applicationHistory: newHistory });
      }

      window.open(`mailto:${job.applicationEmail}?subject=Candidatura: ${job.title}`, '_blank');
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, applicationCount: (j.applicationCount || 0) + 1 } : j));
    };

    executeWithInterstitial(executeApply);
  };

  const handleReport = async (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    if (!confirm('Deseja denunciar esta vaga como falsa ou suspeita?')) return;

    await JobsService.reportJob(jobId);
    alert('Obrigado! A denúncia foi registada. Vagas com muitas denúncias são revistas pela nossa equipa.');
    loadJobs();
  };

  // Deduplicação + separação de vagas não confirmadas (notícias / Empresa Confidencial)
  const { visibleJobs, flaggedJobs } = useMemo(() => {
    const deduped = JobUtils.dedupeJobs(jobs);
    return {
      visibleJobs: deduped.filter(job => !JobUtils.isFlaggedJob(job)),
      flaggedJobs: deduped.filter(job => JobUtils.isFlaggedJob(job)),
    };
  }, [jobs]);

  const displayJobs = showFlagged ? [...visibleJobs, ...flaggedJobs] : visibleJobs;

  const filteredJobs = displayJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(filter.toLowerCase()) ||
      job.company.toLowerCase().includes(filter.toLowerCase());

    // URGENCY FILTERS
    const postDate = new Date(job.postedAt);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));

    let matchesTimeline = true;
    if (selectedProvince === 'Hoje 🔥') {
      matchesTimeline = diffInHours < 24;
    } else if (selectedProvince === 'Últimas 48h') {
      matchesTimeline = diffInHours < 48;
    }

    const matchesProvince = selectedProvince === 'Todas' ||
      selectedProvince === 'Hoje 🔥' ||
      selectedProvince === 'Últimas 48h' ||
      JobUtils.detectProvince(job.location) === selectedProvince;

    return matchesSearch && matchesProvince && matchesTimeline;
  });

  const totalPages = Math.ceil(filteredJobs.length / JOBS_PER_PAGE);
  const paginatedJobs = filteredJobs.slice((currentPage - 1) * JOBS_PER_PAGE, currentPage * JOBS_PER_PAGE);

  // Categorias dos alertas alinhadas às realmente presentes nas vagas
  const alertCategories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const job of jobs) {
      const cat = job.category?.trim();
      if (cat) counts.set(cat, (counts.get(cat) || 0) + 1);
    }
    const cats = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).map(([c]) => c);
    return cats.length > 0 ? cats : ['Tecnologia', 'Gestão', 'Vendas & Marketing', 'Geral'];
  }, [jobs]);

  return (
    <div className="space-y-6 md:space-y-8 animate-slide-up relative">
      <Helmet>
        <title>Vagas de Emprego em Angola | Resolve.AO Su-Golden</title>
        <meta name="description" content="Encontre as melhores oportunidades de emprego em Angola. Vagas atualizadas diariamente em Luanda, Benguela e todas as províncias." />
        <meta name="keywords" content="emprego angola, buscar trabalho angola, vagas de emprego luanda, recrutamento angola" />
      </Helmet>
      {/* AD LOADING OVERLAY */}
      {isAdLoading && (
        <div className="fixed inset-0 z-[180] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fade-in">
          <div className="bg-slate-900 border border-orange-500/30 p-10 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-6 max-w-xs w-full text-center">
            <div className="w-16 h-16 rounded-full border-t-2 border-orange-500 animate-spin"></div>
            <div className="space-y-2">
              <h3 className="text-white font-black uppercase tracking-widest text-sm">Carregando detalhes...</h3>
              <p className="text-orange-500 text-[9px] font-black uppercase tracking-[0.2em] animate-pulse">(Acesso gratuito via anúncio)</p>
            </div>
          </div>
        </div>
      )}

      {/* PROCESSING OVERLAY (0.5s) */}
      {isProcessing && (
        <div className="fixed inset-0 z-[190] bg-black/40 backdrop-blur-sm flex items-center justify-center animate-fade-in">
          <div className="bg-white dark:bg-slate-900 px-8 py-5 rounded-2xl shadow-2xl border border-orange-500/20 flex items-center gap-4">
            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent animate-spin rounded-full"></div>
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">A processar...</span>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 stack-narrow">
        <div className="w-full md:w-auto">
          <h2 className="text-fluid-h2 font-black text-orange-500 tracking-tight uppercase leading-tight">Vagas de Emprego</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-[10px] md:text-sm mt-1 leading-relaxed">Conectando talentos às maiores empresas de Angola.</p>
        </div>
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Cargo ou empresa..."
            className="w-full pl-10 pr-4 py-3.5 border border-orange-500/20 bg-white dark:bg-slate-900 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-orange-500/40 text-orange-500 transition-all shadow-sm focus:shadow-md placeholder:text-slate-400 dark:placeholder:text-slate-500"
            value={filter}
            onChange={(e) => {
              const val = e.target.value;
              setFilter(val);
              if (val.length > 3) {
                const interests = JSON.parse(localStorage.getItem('user_interests') || '[]');
                if (!interests.includes(val)) {
                  localStorage.setItem('user_interests', JSON.stringify([...interests, val].slice(-10)));
                }
              }
            }}
          />
          <Search className="absolute left-3.5 top-3.5 text-orange-500" size={16} />
        </div>
      </div>

      <div className="scroll-x-touch flex flex-nowrap-shrink-0 gap-2 pb-4 -mx-4 px-4">
        {PROVINCES.map((province) => (
          <button
            key={province}
            onClick={() => setSelectedProvince(province)}
            className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${selectedProvince === province
              ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-orange-500/10 hover:border-orange-500/30'
              }`}
          >
            {province}
          </button>
        ))}
      </div>

      {flaggedJobs.length > 0 && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-500/20">
          <p className="text-[9px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest leading-tight">
            {flaggedJobs.length} vaga{flaggedJobs.length > 1 ? 's' : ''} sem confirmação
          </p>
          <button
            onClick={() => setShowFlagged(v => !v)}
            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${showFlagged
              ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20'
              : 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:border-amber-500/60'
              }`}
          >
            {showFlagged ? '✓ A mostrar' : 'Mostrar'}
          </button>
        </div>
      )}

      <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-orange-500 dark:to-orange-600 p-6 md:p-8 rounded-[2.5rem] shadow-xl border border-orange-500/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
          <Clock size={80} className="text-white dark:text-slate-950" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 dark:bg-slate-950 flex items-center justify-center text-white dark:text-orange-500">
              <ShieldCheck size={20} />
            </div>
            <h3 className="text-xl font-black text-white dark:text-slate-950 uppercase tracking-tight">Alertas de Vagas</h3>
          </div>
          <p className="text-slate-400 dark:text-slate-900/70 text-xs font-bold uppercase tracking-widest mb-6 max-w-md leading-relaxed">
            Recebe uma notificação assim que surgir uma vaga na tua área. Escolhe as categorias:
          </p>
          <div className="flex flex-wrap gap-2">
            {alertCategories.map(cat => (
              <button
                key={cat}
                onClick={() => onToggleSubscription?.(cat)}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${subscribedCategories.includes(cat)
                  ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/40'
                  : 'bg-white/5 dark:bg-black/5 text-white dark:text-slate-900 border-white/10 dark:border-black/10 hover:border-orange-500/50'
                  }`}
              >
                {subscribedCategories.includes(cat) ? '✓ ' : '+ '} {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-slate-900 h-32 rounded-3xl animate-pulse gold-border-subtle"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedJobs.length > 0 ? (
            paginatedJobs.map((job, index) => (
              <React.Fragment key={job.id}>
                <JobCard 
                  job={job}
                  isSaved={user?.savedJobs?.includes(job.id) || false}
                  onOpenDetails={handleOpenDetails}
                  onToggleSave={handleToggleSave}
                  onReport={handleReport}
                  onShareWhatsApp={handleShareWhatsApp}
                  formatRelativeDate={ServiceUtils.formatRelativeDate}
                />
                {(index + 1) % 6 === 0 && (
                  <div className="col-span-full py-4">
                    <AdBanner format="leaderboard" customLocation="jobs" />
                  </div>
                )}
              </React.Fragment>
            ))
          ) : (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 py-20 px-6 bg-white dark:bg-slate-900 rounded-[3rem] border border-orange-500/10 text-center animate-fade-in shadow-sm">
               <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-500">
                  <AlertTriangle size={40} />
               </div>
               <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Sem resultados encontrados</h3>
               <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xs mx-auto text-sm leading-relaxed">
                  Não encontrámos vagas para "{selectedProvince}" com o termo "{filter}". Tenta pesquisar noutra província ou categoria.
               </p>
               <button onClick={() => { setFilter(''); setSelectedProvince('Todas'); }} className="mt-8 px-8 py-3 bg-orange-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 active:scale-95 transition-all">
                  VER TODAS AS VAGAS
               </button>
            </div>
          )}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-12 pb-8">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            aria-label="Página Anterior"
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border border-orange-500/10 text-slate-500 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:border-orange-500/30"
          >
            <ChevronRight className="rotate-180" size={20} />
          </button>
          
          <div className="flex items-center gap-1.5 px-6 py-3 bg-white dark:bg-slate-900 rounded-3xl border border-orange-500/10 shadow-sm">
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{currentPage}</span>
            <span className="text-[10px] font-bold text-slate-400">/</span>
            <span className="text-[10px] font-bold text-slate-400">{totalPages}</span>
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            aria-label="Próxima Página"
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border border-orange-500/10 text-slate-500 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:border-orange-500/30"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      <div className="pt-12 pb-24 md:pb-12">
        <AdBanner format="leaderboard" customLocation="jobs" />
      </div>

      <JobDetailsModal 
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        onApply={handleApplyClick}
        onShare={handleShareWhatsApp}
      />
    </div>
  );
};
