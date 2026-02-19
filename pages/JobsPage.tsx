
import React, { useEffect, useState } from 'react';
import { MapPin, Building, Clock, Search, X, CheckCircle2, Award, Mail, ChevronRight, Settings, Plus, Share2, AlertTriangle, ShieldCheck, HardHat, Briefcase, Store } from 'lucide-react';
import { SupabaseService } from '../services/supabaseService';
import { Job } from '../types';
import { ShareButton } from '../components/ShareButton';
import { AdBanner } from '../components/AdBanner';

interface JobsPageProps {
  isAuthenticated: boolean;
  isAdmin?: boolean;
  onNavigate?: (page: any) => void;
  onRequireAuth: () => void;
  onRequestReward?: (onSuccess: () => void, onCancel: () => void) => void;
  onShowInterstitial?: (callback: () => void) => void;
  subscribedCategories?: string[];
  onToggleSubscription?: (category: string) => void;
}

const PROVINCES = [
  'Todas', 'Hoje 🔥', 'Últimas 48h', 'Luanda', 'Benguela', 'Huambo', 'Huíla', 'Cabinda', 'Namibe', 'Cuanza Sul', 'Cuanza Norte', 
  'Malanje', 'Uíge', 'Zaire', 'Lunda Norte', 'Lunda Sul', 'Moxico', 'Bié', 'Cuando Cubango', 'Cunene', 'Bengo'
];

// Helper Component for Job Logo with fallback and loading logic
const JobLogo: React.FC<{ src?: string; company: string; category?: string; size?: number }> = ({ src, company, category, size = 60 }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const getFallbackIcon = () => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('constru') || cat.includes('engenh')) return <HardHat className="text-orange-500" size={size * 0.5} />;
    if (cat.includes('venda') || cat.includes('comercial')) return <Store className="text-orange-500" size={size * 0.5} />;
    return <Briefcase className="text-orange-500" size={size * 0.5} />;
  };

  return (
    <div 
      className={`relative flex items-center justify-center bg-white dark:bg-slate-800 rounded-2xl border border-orange-500/10 overflow-hidden shrink-0 shadow-sm ${size === 60 ? 'job-logo-60' : (size === 80 ? 'job-logo-80' : 'job-logo-60')}`}
    >
      {loading && !error && src && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-800 animate-pulse z-10">
           <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {(!src || error) ? (
        <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-900 group-hover:scale-110 transition-transform">
           <div className="bg-brand-gold/10 w-full h-full flex items-center justify-center">
              {company ? (
                <span className="text-brand-gold font-black text-xl uppercase">{company.charAt(0)}</span>
              ) : (
                getFallbackIcon()
              )}
           </div>
        </div>
      ) : (
        <img 
          src={src} 
          alt={company} 
          className={`w-full h-full object-contain p-2 transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => setLoading(false)}
          onError={() => {
            setError(true);
            setLoading(false);
          }}
        />
      )}
    </div>
  );
};

export const JobsPage: React.FC<JobsPageProps> = ({ 
  isAuthenticated, 
  isAdmin, 
  onNavigate,
  onRequireAuth, 
  onRequestReward, 
  onShowInterstitial,
  subscribedCategories = [],
  onToggleSubscription
}) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('Todas');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [viewCount, setViewCount] = useState<number>(() => {
    return Number(sessionStorage.getItem('jobs_view_count')) || 0;
  });

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    const data = await SupabaseService.getJobs(false);
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
          import('../services/notificationService').then(({ NotificationService }) => {
            NotificationService.sendNativeNotification(
              `Nova vaga de ${match.category || 'Emprego'} disponível!`,
              `${match.title} @ ${match.company}. Clica para ver.`
            );
          });
        }
      }
    }
  };

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Agora mesmo';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `Há ${diffInMinutes}m`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Há ${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Ontem';
    if (diffInDays < 7) return `Há ${diffInDays} dias`;
    return date.toLocaleDateString('pt-AO');
  };

  const [isAdLoading, setIsAdLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleOpenDetails = (job: Job) => {
    if (!isAuthenticated) {
      if (onShowInterstitial) {
        onShowInterstitial(() => onRequireAuth());
      } else {
        onRequireAuth();
      }
      return;
    }

    const currentCount = Number(sessionStorage.getItem('jobs_view_count')) || 0;
    const newCount = currentCount + 1;

    // RULE: Every 2 clicks (1st and 2nd OK), the 3rd click triggers an ad.
    if (newCount >= 3) {
      if (onRequestReward) {
        setIsAdLoading(true);
        // Delay of 1 second before showing the ad to ensure the "Loading" UI is seen but doesn't feel stuck
        setTimeout(() => {
          onRequestReward(
            () => {
              setIsAdLoading(false);
              // Success Callback: Reset counter and show details
              sessionStorage.setItem('jobs_view_count', '0');
              setViewCount(0);
              setSelectedJob(job);
            },
            () => {
              setIsAdLoading(false);
              // Cancel Callback: Show error message
              alert('Assista ao vídeo completo para desbloquear os detalhes desta vaga.');
            }
          );
        }, 1000);
      } else {
        // Fallback if prop is missing
        setSelectedJob(job);
        sessionStorage.setItem('jobs_view_count', '0');
        setViewCount(0);
      }
    } else {
      // Normal flow for 1st and 2nd clicks
      sessionStorage.setItem('jobs_view_count', newCount.toString());
      setViewCount(newCount);
      setSelectedJob(job);
    }
  };

  const handleShareWhatsApp = (e: React.MouseEvent, job: Job) => {
    e.stopPropagation();
    
    const executeShare = () => {
      const appLink = "https://angolife.app";
      const text = `🚀 *Vaga Imperdível:* ${job.title}\n🏢 *Empresa:* ${job.company}\n📍 *Local:* ${job.location}\n\nOlha esta vaga que encontrei na AngoLife! Sê o primeiro a candidatar-te.\n\nBaixa aqui o app e vê mais: ${appLink}`;
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    };

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      if (onShowInterstitial) {
        onShowInterstitial(executeShare);
      } else {
        executeShare();
      }
    }, 500);
  };

  const handleApplyClick = async (job: Job) => {
    const executeApply = async () => {
      await SupabaseService.incrementApplicationCount(job.id);
      window.open(`mailto:${job.applicationEmail}?subject=Candidatura: ${job.title}`, '_blank');
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, applicationCount: (j.applicationCount || 0) + 1 } : j));
    };

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      if (onShowInterstitial) {
        onShowInterstitial(executeApply);
      } else {
        executeApply();
      }
    }, 500);
  };

  const handleReport = async (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    if (!confirm('Deseja denunciar esta vaga como falsa ou suspeita?')) return;
    
    await SupabaseService.reportJob(jobId);
    alert('Obrigado! A denúncia foi registada. Vagas com muitas denúncias são revistas pela nossa equipa.');
    loadJobs();
  };

  const filteredJobs = jobs.filter(job => {
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
                           job.location.toLowerCase().includes(selectedProvince.toLowerCase());
                           
    return matchesSearch && matchesProvince && matchesTimeline;
  });

  return (
    <div className="space-y-6 md:space-y-8 animate-slide-up relative">
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
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-orange-500 tracking-tight uppercase">Vagas de Emprego</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-xs md:text-sm mt-1">Conectando talentos às maiores empresas de Angola.</p>
        </div>
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Cargo ou empresa..."
            className="w-full pl-10 pr-4 py-3.5 border border-orange-500/20 bg-white dark:bg-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-orange-500/20 text-orange-500 transition-all shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
            value={filter}
            onChange={(e) => {
              const val = e.target.value;
              setFilter(val);
              // Save search as interest if it's long enough
              if (val.length > 3) {
                const interests = JSON.parse(localStorage.getItem('user_interests') || '[]');
                if (!interests.includes(val)) {
                  localStorage.setItem('user_interests', JSON.stringify([...interests, val].slice(-10))); // Keep last 10
                }
              }
            }}
          />
          <Search className="absolute left-3.5 top-3.5 text-orange-500" size={16} />
        </div>
      </div>

      {/* PROVINCE & URGENCY FILTERS */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none no-scrollbar -mx-4 px-4">
        {PROVINCES.map((province) => (
          <button
            key={province}
            onClick={() => setSelectedProvince(province)}
            className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
              selectedProvince === province 
                ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20' 
                : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-orange-500/10 hover:border-orange-500/30'
            }`}
          >
            {province}
          </button>
        ))}
      </div>

      {/* JOB ALERTS SUBSCRIPTION SECTION */}
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
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                  subscribedCategories.includes(cat)
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
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job, index) => (
              <React.Fragment key={job.id}>
                <div onClick={() => handleOpenDetails(job)} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-sm border border-orange-500/10 hover:border-orange-500/50 transition-all cursor-pointer group flex flex-col h-full hover:shadow-xl hover:-translate-y-1 relative group">
                  <div className="flex items-start gap-4 mb-4">
                    <JobLogo src={job.imageUrl} company={job.company} category={job.category} size={60} />
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center gap-1.5 mb-1">
                          <h3 className="font-black text-slate-900 dark:text-white leading-tight group-hover:text-orange-500 transition-colors line-clamp-2 uppercase text-sm">{job.title}</h3>
                          {job.isVerified && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 rounded-lg border border-amber-500/20">
                               <ShieldCheck size={14} className="text-amber-500" fill="currentColor" fillOpacity={0.2} />
                               <span className="text-[8px] font-black text-amber-600 uppercase tracking-tighter">
                                 {job.source ? `Via ${job.source}` : 'Verificada'}
                               </span>
                            </div>
                          )}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest truncate">{job.company}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4 flex-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-white/5 text-[9px] font-black uppercase tracking-tight text-slate-500 border border-slate-200/50 dark:border-white/5">
                      <MapPin size={12} className="text-orange-500" />
                      {job.location}
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-white/5 text-[9px] font-black uppercase tracking-tight text-slate-500 border border-slate-200/50 dark:border-white/5">
                      <Clock size={12} className="text-orange-500" />
                      {job.type}
                    </div>
                  </div>

                  {(job.applicationCount || 0) > 0 && (
                    <div className="flex items-center gap-2 mb-6 animate-pulse">
                        <div className="flex -space-x-2">
                          {[1,2,3].map(i => <div key={i} className="w-5 h-5 rounded-full border border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700"></div>)}
                        </div>
                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-tighter italic">🔥 {job.applicationCount} pessoas candidataram-se</span>
                    </div>
                  )}
                  
                  <div className="pt-5 border-t border-orange-500/10 flex items-center justify-between">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{formatRelativeDate(job.postedAt)}</span>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => handleReport(e, job.id)}
                          title="Denunciar Vaga"
                          className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <AlertTriangle size={14} />
                        </button>
                        <button 
                          onClick={(e) => handleShareWhatsApp(e, job)}
                          title="Partilhar no WhatsApp"
                          className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-all"
                        >
                          <Share2 size={14} />
                        </button>
                      </div>
                  </div>
                </div>
                {/* INLINE BANNER: Every 6 items */}
                {(index + 1) % 6 === 0 && (
                  <div className="col-span-full py-4">
                    <AdBanner format="leaderboard" />
                  </div>
                )}
              </React.Fragment>
            ))
          ) : (
            <div className="col-span-full py-24 text-center bg-slate-50 dark:bg-white/5 rounded-[3rem] border border-dashed border-orange-500/20">
              <div className="bg-orange-500/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-500">
                <Search size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Nenhuma vaga nesta zona</h3>
              <p className="text-slate-500 text-sm mt-2 mb-8">Tente mudar a província ou o termo de pesquisa.</p>
              
              {/* EMPTY STATE AD */}
              <div className="max-w-md mx-auto opacity-80 hover:opacity-100 transition-opacity">
                 <AdBanner format="leaderboard" />
                 <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-3 italic">Publicidade</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ADAPTIVE FOOTER BANNER */}
      <div className="pt-12 pb-24 md:pb-12">
         <AdBanner format="leaderboard" />
      </div>

      {/* ADMIN FLOATING BUTTON */}
      {isAdmin && onNavigate && (
        <div className="fixed bottom-24 right-6 z-[120] flex flex-col gap-3 md:bottom-10 md:right-10">
          <button 
            onClick={() => onNavigate('admin')}
            className="bg-slate-900 dark:bg-white text-white dark:text-slate-950 p-4 rounded-2xl shadow-2xl flex items-center gap-3 font-black text-xs uppercase tracking-widest border border-orange-500/30 hover:scale-105 active:scale-95 transition-all group"
          >
            <Settings className="text-orange-500 group-hover:rotate-90 transition-transform" size={20} />
            <span className="hidden md:block">Painel Admin</span>
          </button>
          <button 
            onClick={() => onNavigate('admin')}
            className="bg-orange-500 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 font-black text-xs uppercase tracking-widest shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={20} />
            <span className="hidden md:block">Nova Vaga</span>
          </button>
        </div>
      )}

      {/* JOB DETAILS MODAL */}
      {selectedJob && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-md p-0 md:p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl h-full md:h-auto md:rounded-[3rem] shadow-2xl border border-orange-500/20 relative overflow-hidden flex flex-col">
            
            {/* Header Cover */}
            <div className="h-32 md:h-56 bg-gradient-to-r from-slate-950 to-slate-800 relative shrink-0">
               <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
               <button 
                onClick={() => setSelectedJob(null)}
                className="absolute top-6 right-6 z-30 bg-black/50 text-white p-3 rounded-full hover:bg-orange-500 transition-all backdrop-blur-md"
                aria-label="Fechar Detalhes"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto px-6 md:px-12 pb-24 md:pb-12 -mt-10 relative z-10">
               <div className="flex flex-col md:flex-row items-end gap-6 mb-8">
                  <div className="w-24 h-24 md:w-32 md:h-32 bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl flex items-center justify-center text-orange-500 border-4 md:border-8 border-orange-500/10 shrink-0 overflow-hidden">
                    <JobLogo src={selectedJob.imageUrl} company={selectedJob.company} category={selectedJob.category} size={128} />
                  </div>
                  <div className="pb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-2xl md:text-5xl font-black text-orange-500 leading-none">{selectedJob.title}</h3>
                      {selectedJob.isVerified && (
                        <ShieldCheck size={28} className="text-amber-500 hidden md:block drop-shadow-sm" fill="currentColor" fillOpacity={0.3} />
                      )}
                    </div>
                    <p className="text-slate-500 dark:text-slate-300 font-black uppercase text-[10px] md:text-sm tracking-[0.2em]">{selectedJob.company} • {selectedJob.location}</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className="lg:col-span-2 space-y-10">
                    <section>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 border-b border-orange-500/10 pb-2">Sobre a Vaga</h4>
                      <div className="text-slate-600 dark:text-slate-300 text-base md:text-lg leading-relaxed font-medium whitespace-pre-line">
                        {selectedJob.description}
                      </div>
                    </section>
                    
                    {/* SOCIAL PROOF IN MODAL */}
                    {(selectedJob.applicationCount || 0) > 0 && (
                      <div className="p-6 bg-orange-500/5 rounded-[2rem] border border-orange-500/10 flex items-center gap-4">
                         <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                            <Plus size={24} />
                         </div>
                         <div>
                            <p className="text-lg font-black text-slate-900 dark:text-white uppercase leading-tight italic">🔥 Urgente!</p>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{selectedJob.applicationCount} pessoas já mostraram interesse.</p>
                         </div>
                      </div>
                    )}

                    {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                      <section>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 border-b border-orange-500/10 pb-2">Requisitos</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {selectedJob.requirements.map((req, i) => (
                            <div key={i} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-orange-500/20">
                               <Award className="text-orange-500 shrink-0" size={16} />
                               <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight">{req}</span>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>

                  <div className="space-y-6">
                     <div className="bg-slate-900 dark:bg-orange-500 p-8 rounded-[2.5rem] shadow-2xl text-white dark:text-slate-950">
                        <h4 className="text-[10px] font-black uppercase tracking-widest mb-6 opacity-60">Candidatura Oficial</h4>
                        <div className="space-y-4">
                           <div className="p-4 bg-white/10 dark:bg-black/10 rounded-2xl border border-white/5">
                              <span className="block text-[8px] font-black uppercase opacity-60 mb-1">E-mail para Envio:</span>
                              <span className="text-sm md:text-base font-black break-all">{selectedJob.applicationEmail}</span>
                           </div>
                           <button 
                             onClick={() => handleApplyClick(selectedJob)}
                             className="w-full bg-orange-500 dark:bg-slate-950 text-white dark:text-orange-500 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                           >
                             <Mail size={18} /> Candidatar-se
                           </button>
                        </div>
                     </div>
                     
                     <div className="hidden md:block p-8 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] border gold-border-subtle">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Dicas Angolife</p>
                        <p className="text-xs font-medium text-slate-500 leading-relaxed italic">
                          "Destaque o seu percurso profissional e anexe sempre o CV em formato PDF para garantir a leitura do RH."
                        </p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Mobile Sticky CTA */}
            <div className="md:hidden fixed bottom-0 left-0 w-full p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t gold-border-t-subtle z-[40] flex gap-3">
               <button 
                 onClick={() => handleApplyClick(selectedJob)}
                 className="flex-1 bg-orange-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl"
               >
                 Candidatar Agora
               </button>
               <div className="bg-slate-100 dark:bg-white/5 p-4 rounded-2xl flex items-center justify-center">
                 <button 
                   onClick={(e) => selectedJob && handleShareWhatsApp(e, selectedJob)}
                   title="Partilhar no WhatsApp"
                   className="p-4 text-orange-500 flex items-center justify-center"
                 >
                   <Share2 size={24} />
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
