import React, { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronRight, AlertTriangle, ShieldCheck, Clock, Sparkles, FileText, Plus, Flame } from 'lucide-react';
import { JobsService } from '../services/api/jobs.service';
import { Job, UserProfile } from '../types';
import { AdBanner } from '../components/ads/AdBanner';
import { useAppStore } from '../store/useAppStore';
import { useAds } from '../hooks/useAds';
import { JobCard } from '../components/jobs/JobCard';
import { JobDetailsModal } from '../components/jobs/JobDetailsModal';
import { SubmitJobModal } from '../components/jobs/SubmitJobModal';
import { ServiceUtils } from '../services/utils/utils';
import { Helmet } from 'react-helmet-async';

interface JobsPageProps {
  onNavigate?: (page: any) => void;
  onRequestReward?: (onSuccess: () => void, onCancel: () => void) => void;
  onShowInterstitial?: (callback: () => void) => void;
  subscribedCategories?: string[];
  onToggleSubscription?: (category: string) => void;
}

const PROVINCES = [
  'Todas', 'Urgentes', 'Últimas 48h', 'Luanda', 'Benguela', 'Huambo', 'Huíla', 'Cabinda', 'Namibe', 'Cuanza Sul', 'Cuanza Norte',
  'Malanje', 'Uíge', 'Zaire', 'Lunda Norte', 'Lunda Sul', 'Moxico', 'Bié', 'Cuando Cubango', 'Cunene', 'Bengo'
];

export const JobsPage: React.FC<JobsPageProps> = ({ 
  onNavigate,
  onRequestReward, 
  onShowInterstitial, 
  subscribedCategories = [], 
  onToggleSubscription 
}) => {
  const { user, setUser, isAuthenticated, setAuthModal } = useAppStore();
  const isAdmin = user?.isAdmin || false;
  const onRequireAuth = () => setAuthModal(true, 'login');
  const onUpdateUser = (updates: Partial<UserProfile>) => user && setUser({ ...user, ...updates });
  
  const { data: jobs = [], isLoading: loading, refetch: loadJobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => JobsService.getJobs(false),
  });

  const [filter, setFilter] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('Todas');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
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

  // Interest-based Notification Logic
  useEffect(() => {
    if (jobs.length > 0) {
      const savedInterests = JSON.parse(localStorage.getItem('user_interests') || '[]');
      if (savedInterests.length > 0) {
        const now = new Date();
        const twoHoursAgo = now.getTime() - (2 * 60 * 60 * 1000);

        const matches = jobs.filter(job => {
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
  }, [jobs]);

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
      const appLink = "https://angolife.app";
      const text = `Vaga de Elite: ${job.title}\nEmpresa: ${job.company}\nLocal: ${job.location}\n\nCandidate-se agora na AngoLife. Sê o primeiro a garantir esta oportunidade.\n\nBaixa aqui o app e vê mais: ${appLink}`;
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
      loadJobs(); // Refetch to update counts
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

  const filteredJobs = useMemo(() => jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(filter.toLowerCase()) ||
      job.company.toLowerCase().includes(filter.toLowerCase());

    const postDate = new Date(job.postedAt);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));

    let matchesTimeline = true;
    if (selectedProvince === 'Urgentes') {
      matchesTimeline = diffInHours < 24;
    } else if (selectedProvince === 'Últimas 48h') {
      matchesTimeline = diffInHours < 48;
    }

    const matchesProvince = selectedProvince === 'Todas' ||
      selectedProvince === 'Urgentes' ||
      selectedProvince === 'Últimas 48h' ||
      job.location.toLowerCase().includes(selectedProvince.toLowerCase());

    return matchesSearch && matchesProvince && matchesTimeline;
  }), [jobs, filter, selectedProvince]);

  const totalPages = Math.ceil(filteredJobs.length / JOBS_PER_PAGE);
  const paginatedJobs = filteredJobs.slice((currentPage - 1) * JOBS_PER_PAGE, currentPage * JOBS_PER_PAGE);

  return (
    <div className="space-y-6 md:space-y-8 animate-slide-up relative">
      <Helmet>
        <title>Vagas de Emprego em Angola | Angolife Su-Golden</title>
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
        <div className="w-full md:w-auto flex flex-col md:flex-row md:items-center gap-4">
          <div>
            <h2 className="text-fluid-h2 font-black text-orange-500 tracking-tight uppercase leading-tight">Vagas de Emprego</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-[10px] md:text-sm mt-1 leading-relaxed">Conectando talentos às maiores empresas de Angola.</p>
          </div>
          <button 
            onClick={() => isAuthenticated ? setShowSubmitModal(true) : onRequireAuth()}
            className="md:ml-4 px-6 py-3 bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Plus size={16} /> Publicar Vaga
          </button>
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
            className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border flex items-center gap-2 ${selectedProvince === province
              ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-orange-500/10 hover:border-orange-500/30'
              }`}
          >
            {province === 'Urgentes' && <Flame size={12} className={selectedProvince === 'Urgentes' ? 'text-white' : 'text-orange-500'} />}
            {province}
          </button>
        ))}
      </div>

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
            {['Motorista', 'Contabilidade', 'TI', 'Vendas', 'Engenharia'].map(cat => (
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

      {/* PERSUASIVE CV CTA CARD */}
      <div 
        onClick={() => onNavigate?.('cv-builder')}
        className="group cursor-pointer bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-800 p-6 md:p-8 rounded-[2.5rem] shadow-xl border border-indigo-400/20 relative overflow-hidden transition-all hover:shadow-2xl hover:shadow-indigo-500/20 active:scale-[0.99]"
      >
        {/* Decorative elements */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/15 transition-all"></div>
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-400/10 rounded-full blur-2xl group-hover:bg-indigo-400/20 transition-all"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-8">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform duration-500">
            <div className="relative">
              <FileText size={40} className="text-white" />
              <Sparkles size={20} className="absolute -top-2 -right-2 text-yellow-400 animate-pulse" />
            </div>
          </div>
          
          <div className="flex-grow text-center md:text-left">
            <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight mb-2">
              O Teu Próximo Emprego Começa Aqui
            </h3>
            <p className="text-indigo-100/80 text-xs md:text-sm font-bold uppercase tracking-widest leading-relaxed max-w-xl">
              Destaque-se da concorrência com um CV profissional criado por <span className="text-yellow-400">Inteligência Artificial</span> em apenas 2 minutos.
            </p>
          </div>
          
          <div className="bg-white text-indigo-700 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg flex items-center gap-3 group-hover:bg-yellow-400 group-hover:text-indigo-900 transition-all shrink-0">
            CRIAR MEU CV AGORA <ChevronRight size={18} />
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
                    <AdBanner format="leaderboard" />
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
        <AdBanner format="leaderboard" />
      </div>

      <JobDetailsModal 
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        onApply={handleApplyClick}
        onShare={handleShareWhatsApp}
      />

      <SubmitJobModal 
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onSuccess={() => {
          alert('Vaga submetida com sucesso! Será revista pela nossa equipa em breve.');
          loadJobs();
        }}
      />
    </div>
  );
};
