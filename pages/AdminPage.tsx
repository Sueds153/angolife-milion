
import React, { useState, useEffect } from 'react';
import { SupabaseService } from '../services/supabaseService';
import { NotificationService } from '../services/notificationService';
import { UserProfile, Job, NewsArticle, ProductDeal } from '../types';
import { Lock } from 'lucide-react';
import { AdminJobsSection } from '../components/admin/AdminJobsSection';
import { AdminNewsSection } from '../components/admin/AdminNewsSection';
import { AdminDealsSection } from '../components/admin/AdminDealsSection';
import { AdminExchangeSection } from '../components/admin/AdminExchangeSection';
import { AdminCVSection } from '../components/admin/AdminCVSection';
import { AdminOverview } from '../components/admin/AdminOverview';
import { AdminDiagnostic } from '../components/admin/AdminDiagnostic';
import { AdminNewJobModal } from '../components/admin/AdminNewJobModal';
import { AdminNewNewsModal } from '../components/admin/AdminNewNewsModal';
import { AdminEditNewsModal } from '../components/admin/AdminEditNewsModal';
import { AdminNewDealModal } from '../components/admin/AdminNewDealModal';
import { AdminEditDealModal } from '../components/admin/AdminEditDealModal';


interface AdminPageProps {
  user: UserProfile | null;
  onNavigate: (page: any) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ user, onNavigate }) => {


  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'news' | 'exchange' | 'deals' | 'cv'>('overview');
  const [pendingJobs, setPendingJobs] = useState<Job[]>([]);
  const [pendingNews, setPendingNews] = useState<NewsArticle[]>([]);
  const [pendingDeals, setPendingDeals] = useState<ProductDeal[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [showNewNewsModal, setShowNewNewsModal] = useState(false);
  const [showEditNewsModal, setShowEditNewsModal] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsArticle | null>(null);
  const [showEditDealModal, setShowEditDealModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<ProductDeal | null>(null);
  const [showNewDealModal, setShowNewDealModal] = useState(false);
  const [cvSubscriptions, setCvSubscriptions] = useState<any[]>([]);
  const [isLoadingCvSubs, setIsLoadingCvSubs] = useState(false);

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

  const [newDeal, setNewDeal] = useState({
    title: '', store: '', storeNumber: '', originalPrice: 0, discountPrice: 0, location: '', description: '', category: 'Alimentação'
  });
  const [dealImageFile, setDealImageFile] = useState<File | null>(null);
  const [dealImagePreview, setDealImagePreview] = useState<string | null>(null);
  const dealFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDealImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 1000;
        if (width > height && width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
        else if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/webp', 0.8);
        setDealImagePreview(dataUrl);
        canvas.toBlob((blob) => {
          if (blob) {
            setDealImageFile(new File([blob], `deal-${Date.now()}.webp`, { type: 'image/webp' }));
          }
        }, 'image/webp', 0.8);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };



  useEffect(() => {
    // Carregar dados iniciais ao montar o componente
    loadPendingJobs();
    loadPendingNews();
    loadPendingDeals();
    loadExchangeRates();

    // Ativação de Realtime para atualizações automáticas
    const channel = SupabaseService.getSupabaseInstance().channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => loadPendingJobs())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news_articles' }, () => loadPendingNews())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_deals' }, () => loadPendingDeals())
      .subscribe();

    return () => {
      SupabaseService.getSupabaseInstance().removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'jobs') {
      loadPendingJobs();
    } else if (activeTab === 'news') {
      loadPendingNews();
    } else if (activeTab === 'deals') {
      loadPendingDeals();
    } else if (activeTab === 'exchange') {
      loadExchangeRates();
    } else if (activeTab === 'cv') {
      loadCvSubscriptions();
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
    try {
      setLoading(true);
      const data = await SupabaseService.getPendingJobs();
      console.log('🔍 [Admin/Jobs] Dados Recebidos:', data);
      setPendingJobs(data);
    } catch (error) {
      console.error('❌ [Admin/Jobs] Erro crítico ao carregar vagas:', error);
      alert('Erro inesperado ao carregar vagas pendentes.');
    } finally {
      setLoading(false);
    }
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

  const loadPendingDeals = async () => {
    try {
      setLoading(true);
      const data = await SupabaseService.getPendingDeals();
      console.log('🔍 [Admin/Deals] Dados Recebidos:', data);
      setPendingDeals(data);
    } catch (error) {
      console.error('❌ [Admin/Deals] Erro crítico ao carregar descontos:', error);
      alert('Erro inesperado ao carregar descontos pendentes.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDeal = async (id: string, dealToApprove?: ProductDeal) => {
    if (!confirm('Deseja publicar este desconto ativando a notificação global?')) return;
    setLoading(true);
    let success = false;

    // Se vier do Modal Edit
    if (dealToApprove) {
      // Simular um mock Update pois não criámos 'updateDeal' no SupabaseService, entao reprovamos e criamos um aprovado.
      await SupabaseService.approveDeal(id, false);
      await SupabaseService.submitDeal({
        ...dealToApprove,
        status: 'approved',
        verified: true,
        is_admin: true
      } as any);
      success = true;
      setShowEditDealModal(false);
    } else {
      await SupabaseService.approveDeal(id, true);
      success = true;
    }

    if (success) {
      setPendingDeals(prev => prev.filter(deal => deal.id !== id));
      NotificationService.sendNativeNotification('🔥 Novo Desconto!', 'Acabou de ser publicada uma nova promoção bombástica. Corre antes que esgote!');
    }
    setLoading(false);
  };

  const handleRejectDeal = async (id: string) => {
    if (!confirm('Deseja rejeitar este desconto?')) return;
    setLoading(true);
    await SupabaseService.approveDeal(id, false);
    setPendingDeals(prev => prev.filter(deal => deal.id !== id));
    setLoading(false);
  };

  const handleCreateDealFast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeal.title || !newDeal.store || newDeal.discountPrice <= 0) return;

    setLoading(true);
    let uploadedUrl = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80';
    if (dealImageFile) {
      uploadedUrl = await SupabaseService.uploadDiscountImage(dealImageFile) || uploadedUrl;
    }

    await SupabaseService.submitDeal({
      title: newDeal.title,
      store: newDeal.store,
      storeNumber: newDeal.storeNumber,
      originalPrice: newDeal.originalPrice || newDeal.discountPrice,
      discountPrice: newDeal.discountPrice,
      location: newDeal.location,
      description: newDeal.description || `Oferta imperdível de ${newDeal.title}`,
      category: newDeal.category,
      imagePlaceholder: uploadedUrl,
      imageUrl: uploadedUrl,
      submittedBy: 'Admin',
      status: 'approved',
      verified: true,
      is_admin: true
    } as any);

    alert('Oferta publicada diretamente pelo Painel Admin!');
    setShowNewDealModal(false);
    setNewDeal({ title: '', store: '', storeNumber: '', originalPrice: 0, discountPrice: 0, location: '', description: '', category: 'Alimentação' });
    setDealImageFile(null);
    setDealImagePreview(null);
    setLoading(false);
    NotificationService.sendNativeNotification('🔥 Novo Desconto Admin!', `Foi publicada uma nova Super Oferta de ${newDeal.title}. Corre!`);
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
    try {
      setLoading(true);
      const data = await SupabaseService.getPendingNews();
      console.log('🔍 [Admin/News] Dados Recebidos:', data);
      setPendingNews(data);
    } catch (error) {
      console.error('❌ [Admin/News] Erro crítico ao carregar notícias:', error);
      alert('Erro inesperado ao carregar notícias pendentes.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveNews = async (id: string) => {
    try {
      setLoading(true);
      console.log('✅ Tentando aprovar notícia:', id);
      const result = await SupabaseService.approveNews(id, true);
      if (result.success) {
        setPendingNews(prev => prev.filter(news => news.id !== id));
        // Apenas Toast no futuro, por agora alert discreto
        console.log('Notícia publicada com sucesso!');
      } else {
        alert('Erro ao publicar: ' + (result.error || 'Erro desconhecido'));
      }
    } catch (err) {
      console.error('Erro na aprovação:', err);
      alert('Falha na comunicação com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAllNews = async () => {
    if (!confirm(`Deseja publicar TODAS as ${pendingNews.length} notícias pendentes?`)) return;
    try {
      setLoading(true);
      const result = await SupabaseService.approveAllNews();
      if (result.success) {
        setPendingNews([]);
        alert('Todas as notícias foram publicadas com sucesso!');
      } else {
        alert('Erro ao publicar todas: ' + (result.error || 'Erro desconhecido'));
        loadPendingNews();
      }
    } catch (err) {
      console.error('Erro na aprovação em massa:', err);
      alert('Falha na comunicação com o servidor.');
    } finally {
      setLoading(false);
    }
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

  const loadCvSubscriptions = async () => {
    setIsLoadingCvSubs(true);
    const data = await SupabaseService.getCVSubscriptions();
    setCvSubscriptions(data);
    setIsLoadingCvSubs(false);
  };

  const handleApproveCvSub = async (id: string, userId: string) => {
    const confirmed = window.confirm("Aprovar este pagamento e libertar Premium?");
    if (!confirmed) return;

    const success = await SupabaseService.approveCVSubscription(id, userId);
    if (success) {
      alert("Pagamento aprovado! Utilizador agora é Premium.");
      loadCvSubscriptions();
    } else {
      alert("Erro ao aprovar pagamento.");
    }
  };

  const handleRejectCvSub = async (id: string) => {
    const confirmed = window.confirm("Rejeitar este comprovativo de pagamento?");
    if (!confirmed) return;

    try {
      const { error } = await SupabaseService.getSupabaseInstance()
        .from('cv_subscriptions')
        .update({ status: 'rejeitado' })
        .eq('id', id);

      if (error) throw error;
      alert("Comprovativo rejeitado.");
      loadCvSubscriptions();
    } catch (error) {
      console.error("Erro ao rejeitar CV:", error);
      alert("Erro ao rejeitar comprovativo.");
    }
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
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 stack-narrow">
        <div className="pt-safe w-full md:w-auto">
          <h2 className="text-fluid-h2 font-black text-orange-500 uppercase tracking-tight leading-tight">Painel Admin</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-[10px] md:text-sm uppercase tracking-widest mt-1">Gerindo a AngoLife com precisão.</p>
          
          <AdminDiagnostic user={user} />
        </div>
        <div className="scroll-x-touch flex flex-nowrap-shrink-0 gap-2 pb-4 -mx-4 px-4 scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'overview' ? 'bg-orange-500 text-white shadow-lg' : 'bg-white dark:bg-white/5 text-slate-500 border border-orange-500/10'}`}
            title="Ver Visão Geral"
          >
            Geral
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'jobs' ? 'bg-orange-500 text-white shadow-lg' : 'bg-white dark:bg-white/5 text-slate-500 border border-orange-500/10'}`}
            title="Gerir Vagas"
          >
            Vagas
          </button>
          <button
            onClick={() => setActiveTab('news')}
            className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'news' ? 'bg-orange-500 text-white shadow-lg' : 'bg-white dark:bg-white/5 text-slate-500 border border-orange-500/10'}`}
            title="Gerir Notícias"
          >
            Notícias
          </button>
          <button
            onClick={() => setActiveTab('deals')}
            className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'deals' ? 'bg-orange-500 text-white shadow-lg' : 'bg-white dark:bg-white/5 text-slate-500 border border-orange-500/10'}`}
            title="Gerir Descontos"
          >
            Descontos
          </button>
          <button
            onClick={() => setActiveTab('exchange')}
            className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'exchange' ? 'bg-orange-500 text-white shadow-lg' : 'bg-white dark:bg-white/5 text-slate-500 border border-orange-500/10'}`}
            title="Gerir Câmbio"
          >
            Câmbio
          </button>
          <button
            onClick={() => setActiveTab('cv')}
            className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'cv' ? 'bg-orange-500 text-white shadow-lg' : 'bg-white dark:bg-white/5 text-slate-500 border border-orange-500/10'}`}
            title="Validar CVs"
          >
            CVs
          </button>
        </div>
      </div>

      {activeTab === 'jobs' && (
        <AdminJobsSection
          pendingJobs={pendingJobs}
          loading={loading}
          handleApproveAll={handleApproveAll}
          handleSyncJobs={handleSyncJobs}
          setShowNewJobModal={setShowNewJobModal}
          handleToggleVerification={handleToggleVerification}
          handleApprove={handleApprove}
          handleReject={handleReject}
        />
      )}


      {activeTab === 'deals' && (
        <AdminDealsSection
          pendingDeals={pendingDeals}
          loading={loading}
          handleSyncDeals={async () => {
            setLoading(true);
            const count = await SupabaseService.triggerDealsScraper();
            if (count > 0) {
              alert(`${count} novas ofertas capturadas pela IA para sua revisão!`);
              loadPendingDeals();
            } else {
              alert('Nenhuma oferta nova encontrada no momento.');
            }
            setLoading(false);
          }}
          setShowNewDealModal={setShowNewDealModal}
          setEditingDeal={setEditingDeal}
          setShowEditDealModal={setShowEditDealModal}
          handleApproveDeal={handleApproveDeal}
          handleRejectDeal={handleRejectDeal}
        />
      )}


      <AdminNewDealModal
        isOpen={showNewDealModal}
        onClose={() => setShowNewDealModal(false)}
        handleCreateDealFast={handleCreateDealFast}
        newDeal={newDeal}
        setNewDeal={setNewDeal}
        dealFileInputRef={dealFileInputRef}
        handleDealImageChange={handleDealImageChange}
        dealImagePreview={dealImagePreview}
        loading={loading}
      />


      <AdminEditDealModal
        isOpen={showEditDealModal}
        onClose={() => setShowEditDealModal(false)}
        handleApproveDeal={handleApproveDeal}
        editingDeal={editingDeal}
        setEditingDeal={setEditingDeal}
        loading={loading}
      />

      {activeTab === 'news' && (
        <AdminNewsSection
          pendingNews={pendingNews}
          loading={loading}
          handleApproveAllNews={handleApproveAllNews}
          handleSyncNews={handleSyncNews}
          setShowNewNewsModal={setShowNewNewsModal}
          handleApproveNews={handleApproveNews}
          handleEditNews={handleEditNews}
          handleDeleteNews={handleDeleteNews}
        />
      )}

      {activeTab === 'overview' && <AdminOverview />}

      {activeTab === 'exchange' && (
        <AdminExchangeSection
          rates={rates}
          setRates={setRates}
          loading={loading}
          handleUpdateRate={handleUpdateRate}
        />
      )}


      <AdminNewJobModal
        isOpen={showNewJobModal}
        onClose={() => setShowNewJobModal(false)}
        loading={loading}
        handleCreateJob={handleCreateJob}
        newJob={newJob}
        setNewJob={setNewJob}
        addRequirement={addRequirement}
        removeRequirement={removeRequirement}
      />

      <AdminNewNewsModal
        isOpen={showNewNewsModal}
        onClose={() => setShowNewNewsModal(false)}
        handleCreateNews={handleCreateNews}
        newNews={newNews}
        setNewNews={setNewNews}
      />


      <AdminEditNewsModal
        isOpen={showEditNewsModal}
        onClose={() => setShowEditNewsModal(false)}
        handleUpdateNews={handleUpdateNews}
        editingNews={editingNews}
        setEditingNews={setEditingNews}
      />

      {/* CV SUBSCRIPTIONS TAB */}
      {activeTab === 'cv' && (
        <AdminCVSection
          cvSubscriptions={cvSubscriptions}
          isLoadingCvSubs={isLoadingCvSubs}
          loadCvSubscriptions={loadCvSubscriptions}
          handleApproveCvSub={handleApproveCvSub}
          handleRejectCvSub={handleRejectCvSub}
        />
      )}

    </div >
  );
};
