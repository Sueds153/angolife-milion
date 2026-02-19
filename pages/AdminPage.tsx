
import React, { useState, useEffect } from 'react';
import { SupabaseService } from '../services/supabaseService';
import { UserProfile, Job, NewsArticle } from '../types';
import { Check, X, Lock, Plus, Briefcase, Clock, MapPin, Send, Trash2, ChevronLeft, Building, Mail, ShieldCheck, DollarSign, TrendingUp, Save, Newspaper, ExternalLink, RefreshCw, HardHat, Store } from 'lucide-react';

interface AdminPageProps {
  user: UserProfile | null;
  onNavigate: (page: any) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ user, onNavigate }) => {
  // Helper Component for Job Logo inside Admin
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
          <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-900">
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

  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'news' | 'exchange'>('overview');
  const [pendingJobs, setPendingJobs] = useState<Job[]>([]);
  const [pendingNews, setPendingNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [showNewNewsModal, setShowNewNewsModal] = useState(false);
  const [showEditNewsModal, setShowEditNewsModal] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsArticle | null>(null);
  
  // Form State
  const [newJob, setNewJob] = useState({
    title: '',
    company: '',
    location: '',
    type: 'Tempo Inteiro',
    applicationEmail: '',
    description: '',
    requirements: [] as string[],
    newRequirement: ''
  });

  const [newNews, setNewNews] = useState({
    title: '',
    category: 'Utilidade',
    body: '',
    imageUrl: '',
    summary: ''
  });

  useEffect(() => {
    // Carregar dados iniciais ao montar o componente
    loadPendingJobs();
    loadPendingNews();
    loadExchangeRates();
  }, []);

  useEffect(() => {
    if (activeTab === 'jobs') {
      loadPendingJobs();
    } else if (activeTab === 'news') {
      loadPendingNews();
    } else if (activeTab === 'exchange') {
      loadExchangeRates();
    }
  }, [activeTab]);

  const [rates, setRates] = useState<any[]>([]);
  const loadExchangeRates = async () => {
    setLoading(true);
    const data = await SupabaseService.getRates();
    setRates(data);
    setLoading(false);
  };

  const handleUpdateRate = async (currency: 'USD' | 'EUR', buy: number, sell: number) => {
    setLoading(true);
    const success = await SupabaseService.updateInformalRate(currency, buy, sell);
    if (success) {
      alert(`Taxa de ${currency} atualizada com sucesso!`);
      loadExchangeRates();
    } else {
      alert('Erro ao atualizar taxa.');
    }
    setLoading(false);
  };

  const loadPendingJobs = async () => {
    setLoading(true);
    const data = await SupabaseService.getPendingJobs();
    console.log('🔍 [Admin/Jobs] Dados Recebidos:', data);
    setPendingJobs(data);
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Deseja publicar esta vaga na AngoLife?')) return;
    setLoading(true);
    console.log('✅ Tentando aprovar vaga:', id);
    const success = await SupabaseService.approveJob(id, true);
    if (success) {
      setPendingJobs(prev => prev.filter(job => job.id !== id));
      alert('Vaga publicada com sucesso!');
    } else {
      alert('Erro ao publicar vaga. Verifique a consola para mais detalhes.');
    }
    setLoading(false);
  };

  const handleApproveAll = async () => {
    if (!confirm(`Deseja publicar TODAS as ${pendingJobs.length} vagas pendentes?`)) return;
    setLoading(true);
    const success = await SupabaseService.approveAllJobs();
    if (success) {
      setPendingJobs([]);
      alert('Todas as vagas foram publicadas com sucesso!');
    } else {
      alert('Erro ao publicar todas as vagas.');
      loadPendingJobs(); // Tentativa de recuperar estado consistente
    }
    setLoading(false);
  };

  const handleToggleVerification = async (id: string, currentStatus: boolean) => {
    const success = await SupabaseService.toggleJobVerification(id, !currentStatus);
    if (success) {
      setPendingJobs(prev => prev.map(job => 
        job.id === id ? { ...job, isVerified: !currentStatus } : job
      ));
    } else {
      alert('Erro ao atualizar verificação.');
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Deseja remover esta vaga permanentemente?')) return;
    setLoading(true);
    const success = await SupabaseService.approveJob(id, false);
    if (success) {
      setPendingJobs(prev => prev.filter(job => job.id !== id));
    } else {
      alert('Erro ao rejeitar vaga.');
    }
    setLoading(false);
  };

  const loadPendingNews = async () => {
    setLoading(true);
    const data = await SupabaseService.getPendingNews();
    console.log('🔍 [Admin/News] Dados Recebidos:', data);
    setPendingNews(data);
    setLoading(false);
  };

  const handleApproveNews = async (id: string) => {
    setLoading(true);
    console.log('✅ Tentando aprovar notícia:', id);
    const success = await SupabaseService.approveNews(id, true);
    if (success) {
      setPendingNews(prev => prev.filter(news => news.id !== id));
      alert('Notícia publicada com sucesso na AngoLife!');
    } else {
      alert('Erro ao publicar notícia.');
    }
    setLoading(false);
  };

  const handleApproveAllNews = async () => {
    if (!confirm(`Deseja publicar TODAS as ${pendingNews.length} notícias pendentes?`)) return;
    setLoading(true);
    const success = await SupabaseService.approveAllNews();
    if (success) {
      setPendingNews([]);
      alert('Todas as notícias foram publicadas com sucesso!');
    } else {
      alert('Erro ao publicar todas as notícias.');
      loadPendingNews();
    }
    setLoading(false);
  };

  const handleRejectNews = async (id: string) => {
    if (!confirm('Deseja remover esta notícia?')) return;
    setLoading(true);
    const success = await SupabaseService.approveNews(id, false);
    if (success) {
      setPendingNews(prev => prev.filter(news => news.id !== id));
    } else {
      alert('Erro ao rejeitar notícia.');
    }
    setLoading(false);
  };

  const handleEditNews = (news: NewsArticle) => {
    setEditingNews(news);
    setShowEditNewsModal(true);
  };

  const handleUpdateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNews) return;
    setLoading(true);
    const success = await SupabaseService.updateNews(editingNews.id, editingNews);
    if (success) {
      alert('Notícia atualizada com sucesso!');
      setShowEditNewsModal(false);
      loadPendingNews();
    } else {
      alert('Erro ao atualizar notícia.');
    }
    setLoading(false);
  };

  const handleDeleteNews = async (id: string) => {
    if (!confirm('Deseja eliminar esta notícia permanentemente?')) return;
    setLoading(true);
    const success = await SupabaseService.deleteNews(id);
    if (success) {
      setPendingNews(prev => prev.filter(news => news.id !== id));
      alert('Notícia eliminada com sucesso.');
    } else {
      alert('Erro ao eliminar notícia.');
    }
    setLoading(false);
  };

  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNews.title || !newNews.body) {
      alert('Preencha o título e o corpo da notícia.');
      return;
    }
    setLoading(true);
    const summary = newNews.summary || newNews.body.substring(0, 150) + '...';
    const success = await SupabaseService.createNews({
      title: newNews.title,
      summary: summary,
      category: newNews.category,
      imageUrl: newNews.imageUrl,
      body: newNews.body
    } as any);

    if (success) {
      alert(`Notícia sobre ${newNews.category} publicada com sucesso!`);
      setShowNewNewsModal(false);
      setNewNews({ title: '', category: 'Utilidade', body: '', imageUrl: '', summary: '' });
      loadPendingNews();
    } else {
      alert('Erro ao criar notícia.');
    }
    setLoading(false);
  };

  const handleSyncNews = async () => {
    setLoading(true);
    const count = await SupabaseService.triggerNewsScraper();
    if (count > 0) {
      alert(`${count} novas notícias adicionadas para revisão!`);
      loadPendingNews();
    } else {
      alert('Nenhuma notícia nova encontrada (ou erro na sincronização).');
    }
    setLoading(false);
  };

  const handleSyncJobs = async () => {
    setLoading(true);
    const count = await SupabaseService.triggerJobScraper();
    if (count > 0) {
      alert(`${count} novas vagas adicionadas para revisão!`);
      loadPendingJobs();
    } else {
      alert('Nenhuma vaga nova encontrada (ou erro na sincronização).');
    }
    setLoading(false);
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJob.title || !newJob.company || !newJob.applicationEmail) {
      alert('Por favor preencha os campos obrigatórios.');
      return;
    }

    setLoading(true);
    const success = await SupabaseService.createJob({
      title: newJob.title,
      company: newJob.company,
      location: newJob.location,
      type: newJob.type,
      applicationEmail: newJob.applicationEmail,
      description: newJob.description,
      requirements: newJob.requirements
    });

    if (success) {
      alert('Vaga publicada com sucesso na AngoLife!');
      setShowNewJobModal(false);
      setNewJob({
        title: '',
        company: '',
        location: '',
        type: 'Tempo Inteiro',
        applicationEmail: '',
        description: '',
        requirements: [],
        newRequirement: ''
      });
    } else {
      alert('Erro ao criar vaga.');
    }
    setLoading(false);
  };

  const addRequirement = () => {
    if (newJob.newRequirement.trim()) {
      setNewJob({
        ...newJob,
        requirements: [...newJob.requirements, newJob.newRequirement.trim()],
        newRequirement: ''
      });
    }
  };

  const removeRequirement = (index: number) => {
    setNewJob({
      ...newJob,
      requirements: newJob.requirements.filter((_, i) => i !== index)
    });
  };

  if (!user?.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-orange-500/30">
        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
            <Lock className="text-amber-500" size={32} />
        </div>
        <h2 className="text-xl font-black mb-4 text-slate-900 dark:text-white uppercase tracking-tight">Acesso Restrito</h2>
        <p className="text-slate-500 text-center max-w-xs mb-6">Esta área é reservada para administradores da AngoLife.</p>
        <button 
          onClick={() => onNavigate('home')} 
          className="bg-slate-900 dark:bg-amber-500 text-white px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-widest transition-all active:scale-95"
          title="Voltar ao Início"
        >
          Voltar ao Início
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-up pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-orange-500 uppercase tracking-tight">Painel Admin</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Gerindo a AngoLife com precisão.</p>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'bg-orange-500 text-white shadow-lg' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}
            title="Ver Visão Geral"
           >
            Geral
           </button>
           <button 
            onClick={() => setActiveTab('jobs')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'jobs' ? 'bg-orange-500 text-white shadow-lg' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}
            title="Gerir Vagas"
           >
            Vagas
           </button>
           <button 
            onClick={() => setActiveTab('news')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'news' ? 'bg-orange-500 text-white shadow-lg' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}
            title="Gerir Notícias"
           >
            Notícias
           </button>
           <button 
            onClick={() => setActiveTab('exchange')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'exchange' ? 'bg-orange-500 text-white shadow-lg' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}
            title="Gerir Câmbio"
           >
            Câmbio
           </button>
        </div>
      </div>

      {activeTab === 'jobs' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-orange-500/10 shadow-sm flex justify-between items-center">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <Briefcase size={24} />
               </div>
               <div>
                  <h3 className="font-black text-lg uppercase">Gestão de Empregos</h3>
                  <p className="text-xs text-slate-500">{pendingJobs.length} vagas pendentes de aprovação.</p>
               </div>
            </div>
            <div className="flex gap-2">
               <button 
                 onClick={handleApproveAll}
                 disabled={loading || pendingJobs.length === 0}
                 title="Publicar Todas as Vagas Pendentes"
                 className="bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
               >
                 <Check size={18} /> Publicar Tudo
               </button>
               <button 
                 onClick={() => setShowNewJobModal(true)}
                 title="Criar Nova Vaga Manualmente"
                 className="bg-slate-900 dark:bg-white text-white dark:text-slate-950 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
               >
                 <Plus size={18} /> Nova Vaga
               </button>
             </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : pendingJobs.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {pendingJobs.map(job => (
                <div key={job.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-orange-500/10 shadow-sm flex flex-col gap-6 hover:border-orange-500/40 transition-all group lg:p-10">
                   <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
                      <div className="flex-1 space-y-8 w-full">
                         {/* Cabeçalho da Vaga */}
                         <div className="flex items-center gap-4">
                            <h4 className="font-black text-2xl text-slate-900 dark:text-white uppercase tracking-tight leading-none">{job.title}</h4>
                            <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase tracking-widest border border-amber-500/20 whitespace-nowrap">Pendente</span>
                         </div>

                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            <div className="space-y-8">
                               {/* Secção: Empresa e Base */}
                               <div className="space-y-4">
                                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-l-4 border-orange-500 pl-3">Identificação e Regime</h5>
                                  <div className="flex flex-wrap gap-3">
                                     <span className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 px-4 py-2.5 rounded-2xl text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-tight">
                                        <Building size={16} className="text-orange-500" /> {job.company}
                                     </span>
                                     <span className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 px-4 py-2.5 rounded-2xl text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-tight">
                                        <MapPin size={16} className="text-orange-500" /> {job.location}
                                     </span>
                                     <span className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 px-4 py-2.5 rounded-2xl text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-tight">
                                        <Clock size={16} className="text-orange-500" /> {job.type}
                                     </span>
                                  </div>
                               </div>

                               {/* Secção: E-mail de Candidatura */}
                               <div className="space-y-4">
                                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-l-4 border-orange-500 pl-3">Canal de Candidatura</h5>
                                  <div className="bg-slate-900 dark:bg-orange-500/5 p-5 rounded-2xl border border-orange-500/20 flex items-center justify-between group/email overflow-hidden">
                                     <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                                           <Mail size={20} />
                                        </div>
                                        <div>
                                           <span className="block text-[8px] font-black uppercase text-slate-500 mb-0.5 tracking-widest">Enviar CV para:</span>
                                           <span className="text-sm font-black text-white dark:text-orange-500 break-all">{job.applicationEmail}</span>
                                        </div>
                                     </div>
                                  </div>
                               </div>

                               {/* Secção: Requisitos */}
                               {job.requirements && job.requirements.length > 0 && (
                                  <div className="space-y-4">
                                     <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-l-4 border-orange-500 pl-3">Requisitos Chave</h5>
                                     <div className="flex flex-wrap gap-2">
                                        {job.requirements.map((req, i) => (
                                           <span key={i} className="px-3 py-2 bg-slate-50 dark:bg-white/10 rounded-xl text-[10px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/5 uppercase tracking-tighter">
                                              • {req}
                                           </span>
                                        ))}
                                     </div>
                                  </div>
                               )}
                            </div>

                            {/* Secção: Descrição */}
                            <div className="space-y-4">
                               <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-l-4 border-orange-500 pl-3">Descrição da Oferta</h5>
                               <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-[2.5rem] border border-orange-500/5 max-h-[350px] overflow-y-auto custom-scrollbar-orange">
                                  <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed italic font-medium">
                                     {job.description}
                                  </p>
                               </div>
                            </div>
                         </div>
                      </div>

                      {/* Botões de Ação */}
                      <div className="flex flex-row lg:flex-col gap-3 shrink-0 w-full lg:w-auto lg:pt-14">
                         <div className="flex gap-2">
                           <button 
                             onClick={() => handleToggleVerification(job.id, job.isVerified || false)}
                             className={`p-2 rounded-xl transition-all ${job.isVerified ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}
                             title={job.isVerified ? "Remover Verificação" : "Verificar Empresa"}
                           >
                             <ShieldCheck size={16} />
                           </button>
                          <button 
                            onClick={() => handleApprove(job.id)}
                            disabled={loading}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex-1 lg:flex-none"
                            title="✅ Publicar Vaga Agora"
                          >
                            <Check size={20} /> ✅ Publicar
                          </button>
                        </div>
                        <button 
                            onClick={() => handleReject(job.id)}
                            className="bg-slate-100 dark:bg-white/5 text-slate-400 hover:bg-red-500 hover:text-white px-8 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 flex-1 lg:flex-none border border-slate-200 dark:border-white/5"
                            title="Rejeitar Vaga Permanentemente"
                         >
                            <X size={20} /> Rejeitar
                         </button>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center bg-slate-50 dark:bg-white/5 rounded-[3rem] border border-dashed border-orange-500/20">
               <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4 text-orange-500 opacity-40">
                  <Check size={32} />
               </div>
               <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Tudo limpo! Sem vagas pendentes.</p>
            </div>
          )}
        </div>
      )}
      {activeTab === 'news' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-orange-500/10 shadow-sm flex justify-between items-center">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <Newspaper size={24} />
               </div>
               <div>
                  <h3 className="font-black text-lg uppercase">Gestão de Notícias</h3>
                  <p className="text-xs text-orange-500 font-bold uppercase tracking-widest">Tens {pendingNews.length} notícias pendentes para revisão.</p>
               </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleApproveAllNews}
                disabled={loading || pendingNews.length === 0}
                title="Publicar Todas as Notícias Pendentes"
                className="bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
              >
                <Check size={18} /> Publicar Tudo
              </button>
              <button 
                onClick={() => setShowNewNewsModal(true)}
                title="Criar Notícia Urgente"
                className="bg-orange-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-orange-600 active:scale-95 transition-all shadow-lg shadow-orange-500/20"
              >
                <Plus size={18} /> Criar Notícia Urgente
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : pendingNews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingNews.map(news => (
                <div key={news.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border border-orange-500/10 shadow-sm hover:border-orange-500/30 transition-all flex flex-col group">
                   <div className="h-40 relative overflow-hidden">
                      {news.imageUrl ? (
                        <img src={news.imageUrl} alt={news.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-600">
                          <Newspaper size={32} />
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <span className="bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg">
                          {news.category}
                        </span>
                      </div>
                   </div>
                   
                   <div className="p-6 flex flex-col flex-1">
                      <div className="mb-4">
                        <h4 className="font-black text-sm uppercase leading-tight line-clamp-2 text-slate-900 dark:text-white group-hover:text-orange-500 transition-colors">{news.title}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-60">Fonte: {news.source}</p>
                      </div>
                      
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 italic mb-6">
                        {news.summary}
                      </p>

                      <div className="mt-auto grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 dark:border-white/5">
                        <button 
                          onClick={() => handleApproveNews(news.id)}
                          className="bg-emerald-500 text-white p-3 rounded-xl hover:bg-emerald-600 transition-all active:scale-95"
                          title="✅ Publicar"
                        >
                          <Check size={16} className="mx-auto" />
                        </button>
                        <button 
                          onClick={() => handleEditNews(news)}
                          className="bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-orange-500 p-3 rounded-xl transition-all active:scale-95"
                          title="✏️ Editar"
                        >
                          <TrendingUp size={16} className="mx-auto" />
                        </button>
                        <button 
                          onClick={() => handleDeleteNews(news.id)}
                          className="bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-red-500 p-3 rounded-xl transition-all active:scale-95"
                          title="🗑️ Eliminar"
                        >
                          <Trash2 size={16} className="mx-auto" />
                        </button>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center bg-slate-50 dark:bg-white/5 rounded-[3rem] border border-dashed border-orange-500/20">
               <p className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Sem notícias pendentes.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="bg-slate-50 dark:bg-white/5 p-12 rounded-[3rem] text-center border border-orange-500/10">
           <h3 className="text-xl font-black uppercase mb-4">Bem-vindo ao Painel de Controlo</h3>
           <p className="text-slate-500 text-sm max-w-sm mx-auto">Utilize as abas acima para gerir os diferentes departamentos da AngoLife.</p>
        </div>
      )}

      {activeTab === 'exchange' && (
        <div className="space-y-6">
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-orange-500/10 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <DollarSign size={24} />
                 </div>
                 <div>
                    <h3 className="font-black text-lg uppercase">Gestão de Câmbio Informal</h3>
                    <p className="text-xs text-slate-500">Atualiza as taxas de mercado paralelo em tempo real.</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {rates.map((rate) => (
                  <div key={rate.currency} className="bg-slate-50 dark:bg-white/5 p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                        <TrendingUp size={64} className="text-orange-500" />
                     </div>
                     <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-2">
                           <span className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                              {rate.currency === 'USD' ? '🇺🇸 Dólar (USD)' : '🇪🇺 Euro (EUR)'}
                           </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Compra (AOA)</label>
                              <input 
                                type="number" 
                                className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-orange-500/20"
                                value={rate.informalBuy}
                                onChange={(e) => setRates(prev => prev.map(r => r.currency === rate.currency ? {...r, informalBuy: Number(e.target.value)} : r))}
                                title="Preço de Compra"
                              />
                           </div>
                           <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Venda (AOA)</label>
                              <input 
                                type="number" 
                                className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-orange-500/20"
                                value={rate.informalSell}
                                onChange={(e) => setRates(prev => prev.map(r => r.currency === rate.currency ? {...r, informalSell: Number(e.target.value)} : r))}
                                title="Preço de Venda"
                              />
                           </div>
                        </div>

                        <button 
                          onClick={() => handleUpdateRate(rate.currency, rate.informalBuy, rate.informalSell)}
                          disabled={loading}
                          className="w-full bg-slate-900 dark:bg-orange-500 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-orange-500/10"
                        >
                          {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <><Save size={16} /> Atualizar {rate.currency}</>}
                        </button>
                     </div>
                  </div>
                ))}
              </div>
           </div>

           <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-[2rem] flex gap-4 items-start">
              <ShieldCheck className="text-amber-500 shrink-0 mt-1" size={24} />
              <div>
                 <h4 className="font-black text-amber-500 uppercase text-xs tracking-widest mb-1">Nota de Segurança</h4>
                 <p className="text-[11px] text-amber-600/80 font-medium leading-relaxed">
                   As alterações no câmbio informal têm impacto imediato em todas as calculadoras e conversores da aplicação. Certifique-se de validar as taxas antes de guardar.
                 </p>
              </div>
           </div>
        </div>
      )}

      {/* NEW JOB MODAL */}
      {showNewJobModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
           <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-orange-500/30 overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-8 border-b border-orange-500/10 flex justify-between items-center text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/50">
                 <div>
                   <h3 className="text-2xl font-black uppercase tracking-tight">Publicação Manual</h3>
                   <p className="text-xs text-orange-500 font-bold uppercase tracking-widest mt-1">Criar nova vaga na hora</p>
                 </div>
                 <button onClick={() => setShowNewJobModal(false)} className="bg-white dark:bg-slate-800 p-3 rounded-full shadow-lg text-slate-400 hover:text-orange-500 transition-all" title="Fechar Modal">
                    <X size={20} />
                 </button>
              </div>

              <div className="p-8 overflow-y-auto flex-1 space-y-6">
                 <form id="new-job-form" onSubmit={handleCreateJob} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="job-title" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Título da Vaga *</label>
                      <input 
                        id="job-title"
                        required
                        type="text" 
                        placeholder="Ex: Engenheiro de Software"
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-orange-500/10 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-900 dark:text-white"
                        value={newJob.title}
                        onChange={e => setNewJob({...newJob, title: e.target.value})}
                        title="Título do Cargo"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="job-company" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Empresa *</label>
                      <input 
                        id="job-company"
                        required
                        type="text" 
                        placeholder="Ex: Sonangol"
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-orange-500/10 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-900 dark:text-white"
                        value={newJob.company}
                        onChange={e => setNewJob({...newJob, company: e.target.value})}
                        title="Nome da Entidade"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="job-location" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Localização</label>
                      <input 
                        id="job-location"
                        type="text" 
                        placeholder="Ex: Luanda, Talatona"
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-orange-500/10 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-900 dark:text-white"
                        value={newJob.location}
                        onChange={e => setNewJob({...newJob, location: e.target.value})}
                        title="Localidade"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="job-type" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Regime</label>
                      <select 
                        id="job-type"
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-orange-500/10 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-900 dark:text-white appearance-none"
                        value={newJob.type}
                        onChange={e => setNewJob({...newJob, type: e.target.value})}
                        title="Regime de Trabalho"
                      >
                         <option value="Tempo Inteiro">Tempo Inteiro</option>
                         <option value="Remoto">Remoto</option>
                         <option value="Híbrido">Híbrido</option>
                         <option value="Estágio">Estágio</option>
                         <option value="Freelance">Freelance</option>
                      </select>
                    </div>
                    <div className="col-span-full space-y-1">
                      <label htmlFor="job-email" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">E-mail para Candidatura *</label>
                      <input 
                        id="job-email"
                        required
                        type="email" 
                        placeholder="rh@empresa.ao"
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-orange-500/10 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-900 dark:text-white"
                        value={newJob.applicationEmail}
                        onChange={e => setNewJob({...newJob, applicationEmail: e.target.value})}
                        title="Canal de Candidatura"
                      />
                    </div>
                    <div className="col-span-full space-y-1">
                      <label htmlFor="job-desc" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Descrição</label>
                      <textarea 
                        id="job-desc"
                        rows={4}
                        placeholder="Descreva as responsabilidades da vaga..."
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-orange-500/10 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-900 dark:text-white resize-none"
                        value={newJob.description}
                        onChange={e => setNewJob({...newJob, description: e.target.value})}
                        title="Descrição Detalhada"
                      />
                    </div>

                    <div className="col-span-full space-y-3">
                       <label htmlFor="job-req-input" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Requisitos</label>
                       <div className="flex gap-2">
                          <input 
                            id="job-req-input"
                            type="text" 
                            placeholder="Adicionar requisito..."
                            className="flex-1 px-5 py-4 bg-slate-50 dark:bg-white/5 border border-orange-500/10 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-900 dark:text-white"
                            value={newJob.newRequirement}
                            onChange={e => setNewJob({...newJob, newRequirement: e.target.value})}
                            onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                            title="Novo Requisito"
                          />
                          <button 
                            type="button"
                            onClick={addRequirement}
                            title="Adicionar Requisito à Lista"
                            className="bg-slate-900 dark:bg-white text-white dark:text-slate-950 p-4 rounded-2xl active:scale-95 transition-all"
                          >
                             <Plus size={20} />
                          </button>
                       </div>
                       <div className="flex flex-wrap gap-2">
                          {newJob.requirements.map((req, i) => (
                            <div key={i} className="flex items-center gap-2 bg-orange-500/10 text-orange-500 px-3 py-1.5 rounded-lg border border-orange-500/20 text-[10px] font-black uppercase tracking-tight">
                               <span>{req}</span>
                               <button type="button" onClick={() => removeRequirement(i)} title="Remover Requisito" className="hover:text-red-500"><X size={12} /></button>
                            </div>
                          ))}
                       </div>
                    </div>
                 </form>
              </div>

              <div className="p-8 border-t border-orange-500/10 bg-slate-50/50 dark:bg-slate-800/30 flex gap-3">
                 <button 
                    onClick={() => setShowNewJobModal(false)}
                    className="flex-1 py-4 text-slate-500 font-black uppercase text-[10px] tracking-[0.2em]"
                    title="Descartar Alterações"
                 >
                    Cancelar
                 </button>
                 <button 
                    form="new-job-form"
                    disabled={loading}
                    type="submit"
                    className="flex-1 bg-orange-500 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                    title="Guardar e Publicar Vaga"
                 >
                    {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <><Send size={16} /> Publicar Agora</>}
                 </button>
              </div>
           </div>
        </div>
      )}
      {/* NEW NEWS MODAL */}
      {showNewNewsModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-fade-in overflow-y-auto">
           <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-2xl border border-orange-500/20 overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-8 border-b border-orange-500/10 flex justify-between items-center bg-slate-50 dark:bg-slate-800/20">
                 <div>
                   <h3 className="text-2xl font-black uppercase tracking-tight">Notícia Urgente</h3>
                   <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest mt-1">Publicação Instantânea AngoLife</p>
                 </div>
                 <button onClick={() => setShowNewNewsModal(false)} className="p-3 rounded-full hover:bg-red-500 hover:text-white transition-all" title="Fechar Modal">
                    <X size={20} />
                 </button>
              </div>

              <div className="p-8 overflow-y-auto flex-1">
                 <form id="new-news-form" onSubmit={handleCreateNews} className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Título da Notícia</label>
                       <input 
                         required
                         className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-orange-500/10 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/30"
                         value={newNews.title}
                         onChange={e => setNewNews({...newNews, title: e.target.value})}
                         title="Título da Notícia"
                         placeholder="Ex: Novo investimento em Angola"
                       />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Categoria</label>
                        <select 
                          className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-orange-500/10 rounded-2xl outline-none appearance-none"
                          value={newNews.category}
                          onChange={e => setNewNews({...newNews, category: e.target.value})}
                          title="Selecionar Categoria"
                        >
                           <option value="Economia">Economia</option>
                           <option value="Oportunidades">Oportunidades</option>
                           <option value="Utilidade">Utilidade</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="news-image-url" className="text-[10px] font-black uppercase tracking-widest text-slate-400">URL da Imagem</label>
                        <input 
                          id="news-image-url"
                          placeholder="https://..."
                          className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-orange-500/10 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/30"
                          value={newNews.imageUrl}
                          onChange={e => setNewNews({...newNews, imageUrl: e.target.value})}
                          title="URL da Imagem de Capa"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Resumo (Visto no Feed)</label>
                       <textarea 
                         rows={2}
                         className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-orange-500/10 rounded-2xl outline-none resize-none"
                         value={newNews.summary}
                         onChange={e => setNewNews({...newNews, summary: e.target.value})}
                         title="Resumo da Notícia"
                         placeholder="Breve resumo para o feed..."
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Corpo da Notícia (Markdown ou HTML)</label>
                       <textarea 
                         required
                         rows={6}
                         className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-orange-500/10 rounded-2xl outline-none resize-none font-medium"
                         value={newNews.body}
                         onChange={e => setNewNews({...newNews, body: e.target.value})}
                         title="Conteúdo da Notícia"
                         placeholder="Escreva aqui o conteúdo completo..."
                       />
                    </div>
                 </form>
              </div>

              <div className="p-8 border-t border-orange-500/10 flex gap-3">
                 <button 
                  onClick={() => setShowNewNewsModal(false)} 
                  className="flex-1 font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                  title="Cancelar e Fechar"
                 >
                   Cancelar
                 </button>
                 <button 
                  form="new-news-form"
                  className="flex-1 bg-orange-500 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-orange-500/20 active:scale-95 transition-all"
                  title="Publicar Notícia Urgente"
                 >
                   Publicar Agora
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* EDIT NEWS MODAL */}
      {showEditNewsModal && editingNews && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-fade-in">
           <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[3rem] shadow-2xl border border-orange-500/20 overflow-hidden flex flex-col">
              <div className="p-8 border-b border-orange-500/10 flex justify-between items-center bg-slate-50 dark:bg-slate-800/20">
                 <h3 className="text-xl font-black uppercase tracking-tight">Editar Notícia</h3>
                 <button 
                  onClick={() => setShowEditNewsModal(false)} 
                  className="p-2 rounded-full text-slate-400 hover:bg-red-500 hover:text-white transition-all"
                  title="Fechar Modal"
                 >
                    <X size={20} />
                 </button>
              </div>

              <div className="p-8">
                 <form id="edit-news-form" onSubmit={handleUpdateNews} className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Título</label>
                       <input 
                         required
                         className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-orange-500/10 rounded-2xl outline-none"
                         value={editingNews.title}
                         onChange={e => setEditingNews({...editingNews, title: e.target.value})}
                         title="Título da Notícia"
                         placeholder="Título da notícia..."
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Resumo</label>
                       <textarea 
                         rows={4}
                         className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-orange-500/10 rounded-2xl outline-none resize-none"
                         value={editingNews.summary}
                         onChange={e => setEditingNews({...editingNews, summary: e.target.value})}
                         title="Resumo da Notícia"
                         placeholder="Resumo da notícia..."
                       />
                    </div>
                 </form>
              </div>

              <div className="p-8 border-t border-orange-500/10 flex gap-3">
                 <button 
                  onClick={() => setShowEditNewsModal(false)} 
                  className="flex-1 font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                  title="Descartar Alterações"
                 >
                   Descartar
                 </button>
                 <button 
                  form="edit-news-form"
                  className="flex-1 bg-emerald-500 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
                  title="Guardar Alterações"
                 >
                   Guardar Alterações
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
