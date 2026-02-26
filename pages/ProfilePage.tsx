import React, { useState, useRef, useEffect } from 'react';
import { User, Briefcase, Tag, Camera, Award, Share2, MessageCircle, CheckCircle2, Bell, BellOff, RefreshCw, DollarSign, ChevronRight, Edit3, Save, Star, History, Download, ShieldCheck, Heart } from 'lucide-react';
import { UserProfile, Job } from '../types';
import { NotificationService } from '../services/notificationService';
import { SupabaseService } from '../services/supabaseService';
import { APP_CONFIG } from '../constants';

interface ProfilePageProps {
  user: UserProfile;
  onLogout: () => void;
  onUpdateUser: (updates: Partial<UserProfile>) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onLogout, onUpdateUser }) => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.fullName || '');
  const [editPhone, setEditPhone] = useState(user.phone || '');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const fetchOrders = async () => {
      if (user.email) {
        setLoading(true);
        const data = await SupabaseService.getUserOrders(user.email);
        setOrders(data);
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user.email]);
  
  const firstName = user.fullName || user.email.split('@')[0];
  const formattedName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  useEffect(() => {
    setNotificationPermission(NotificationService.checkPermission());
  }, []);

  const handleSaveProfile = async () => {
    if (!user.id) return;
    setSaving(true);
    const { error } = await SupabaseService.auth.updateProfile(user.id, {
      full_name: editName,
      phone: editPhone
    });
    
    if (!error) {
      onUpdateUser({ fullName: editName, phone: editPhone });
      setIsEditing(false);
    }
    setSaving(false);
  };

  const calculateProgress = () => {
    let points = 0;
    const total = 4;
    if (user.fullName) points++;
    if (user.phone) points++;
    if (profileImage || user.email) points++; // Simplificado
    if (user.referralCount > 0) points++;
    return Math.round((points / total) * 100);
  };

  const profileProgress = calculateProgress();
  
  useEffect(() => {
    if (progressRef.current) {
      progressRef.current.style.setProperty('--progress-width', `${profileProgress}%`);
    }
  }, [profileProgress]);

  const handleEnableNotifications = async () => {
    const granted = await NotificationService.requestPermission();
    setNotificationPermission(granted ? 'granted' : 'denied');
    if (granted) {
      NotificationService.sendNativeNotification('Notificações Ativadas', 'Você receberá alertas de mercado e vagas urgentes.');
    }
  };

  const stats = [
    { label: 'Guardadas', value: user.savedJobs?.length.toString() || '0', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { label: 'Candidaturas', value: user.applicationHistory?.length.toString() || '0', icon: Briefcase, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Convites', value: user.referralCount.toString(), icon: User, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  const handleShareReferral = async () => {
    const shareText = `Vem para o Angolife! Regista-te com o meu código: ${user.referralCode}`;
    if (navigator.share) {
      await navigator.share({ title: 'Angolife', text: shareText, url: window.location.origin });
    } else {
      navigator.clipboard.writeText(user.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClaimAdReward = () => {
    const message = `Olá Su-Golden! Sou um Embaixador Angolife (${user.email}). Desafio concluído!`;
    window.open(`https://wa.me/${APP_CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-slide-up pb-20 px-4 sm:px-0">
      {/* HEADER PREMIUM & PROGRESS */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl overflow-hidden relative border border-orange-500/10 transition-all">
        <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-br from-orange-500/20 via-orange-500/5 to-transparent dark:from-orange-500/10 dark:via-slate-900"></div>
        
        <div className="p-8 md:p-10 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
            <div className="relative group/avatar" onClick={() => fileInputRef.current?.click()}>
              <div className="w-32 h-32 rounded-[2.5rem] bg-white dark:bg-slate-800 flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-2xl overflow-hidden relative transition-transform group-hover/avatar:scale-105">
                {profileImage ? (
                  <img src={profileImage} alt="Foto de Perfil" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 dark:from-slate-800 dark:to-slate-900">
                    <User size={56} className="text-orange-500" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera size={24} className="text-white" />
                </div>
              </div>
              {user.accountType === 'premium' && (
                <div className="absolute -top-2 -right-2 bg-brand-gold text-slate-900 p-2 rounded-2xl shadow-lg border-2 border-white dark:border-slate-900 animate-pulse">
                  <Award size={18} />
                </div>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" title="Trocar foto de perfil" />
            </div>

            <div className="flex-1 text-center md:text-left space-y-4">
              {isEditing ? (
                <div className="space-y-3 max-w-sm mx-auto md:mx-0 animate-fade-in">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                       type="text" 
                       value={editName}
                       onChange={(e) => setEditName(e.target.value)}
                       placeholder="Teu Nome"
                       className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all dark:text-white"
                    />
                  </div>
                  <div className="relative">
                    <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                       type="tel" 
                       value={editPhone}
                       onChange={(e) => setEditPhone(e.target.value)}
                       placeholder="Teu Telefone (WhatsApp)"
                       className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all dark:text-white"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={handleSaveProfile} disabled={saving} className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all flex items-center justify-center gap-2">
                      {saving ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />} Salvar Dados
                    </button>
                    <button onClick={() => setIsEditing(false)} className="px-6 bg-slate-100 dark:bg-white/5 text-slate-500 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 animate-fade-in">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                    <h1 className="text-4xl font-black text-slate-950 dark:text-white uppercase tracking-tight leading-none">{formattedName}</h1>
                     <button 
                        onClick={() => setIsEditing(true)} 
                        title="Editar Perfil"
                        className="p-2 bg-slate-100 dark:bg-white/5 text-slate-400 rounded-xl hover:text-orange-500 transition-colors"
                     >
                       <Edit3 size={16} />
                     </button>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest opacity-70 flex items-center justify-center md:justify-start gap-2">
                    <ShieldCheck size={12} className="text-orange-500" /> {user.email}
                  </p>
                  <div className="pt-4 flex flex-wrap justify-center md:justify-start gap-3">
                    <div className="px-4 py-2 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-orange-500/20">
                      Progresso: {profileProgress}%
                    </div>
                    {user.phone && (
                       <div className="px-4 py-2 bg-brand-gold/10 text-brand-gold rounded-xl text-[10px] font-black uppercase tracking-widest border border-brand-gold/20 flex items-center gap-2">
                         <MessageCircle size={10} /> {user.phone}
                       </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button onClick={onLogout} className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-black/10 hover:scale-105 transition-all">
              Sair
            </button>
          </div>

          {/* Progress Bar (Gamification) */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
             <div className="flex justify-between items-end">
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Completude do Perfil</span>
               <span className="text-xs font-black text-orange-500 font-mono">{profileProgress}%</span>
             </div>
             <div className="w-full h-2 bg-slate-50 dark:bg-white/5 rounded-full overflow-hidden">
                 <div 
                    ref={progressRef}
                    className="h-full bg-gradient-to-r from-orange-600 to-amber-400 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(249,115,22,0.3)] shadow-bar"
                 />
             </div>
             {profileProgress < 100 && (
               <p className="text-[9px] font-bold text-slate-500 italic uppercase">💡 Dica: Preenche o teu nome e telefone para chegares aos 100% e teres um CV mais profissional.</p>
             )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ÁREA PREMIUM (O Coração do Faturamento) */}
        <div className="bg-gradient-to-br from-brand-gold to-amber-600 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute -bottom-10 -right-10 opacity-20 group-hover:scale-110 transition-transform">
             <ShieldCheck size={200} className="text-white" />
          </div>
          
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white border border-white/20">
                <Star size={24} className="fill-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight leading-none mb-1">Área Premium</h2>
                <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Acesso Exclusivo</p>
              </div>
            </div>

            {user.accountType === 'premium' ? (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                  <h3 className="text-sm font-black text-white uppercase mb-4 flex items-center gap-2">
                    <Download size={16} /> Arquivo de CVs
                  </h3>
                  {user.cvHistory && user.cvHistory.length > 0 ? (
                    <div className="space-y-3">
                      {user.cvHistory.map(cv => (
                        <a key={cv.id} href={cv.url} className="flex items-center justify-between p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors border border-white/5 group">
                           <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                               <Award size={14} className="text-white" />
                             </div>
                             <span className="text-[10px] font-bold text-white uppercase tracking-wider">{cv.name}</span>
                           </div>
                           <Download size={14} className="text-white opacity-50 group-hover:opacity-100 transition-opacity" />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-white/60 font-medium italic">Ainda não geraste nenhum CV profissional.</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 bg-white/10 rounded-2xl border border-white/10 text-center">
                      <p className="text-[8px] font-black text-white/60 uppercase tracking-widest mb-1">Créditos CV</p>
                      <p className="text-2xl font-black text-white">{user.cvCredits}</p>
                   </div>
                   <div className="p-4 bg-white/10 rounded-2xl border border-white/10 text-center">
                      <p className="text-[8px] font-black text-white/60 uppercase tracking-widest mb-1">Assinatura</p>
                      <p className="text-xs font-black text-white uppercase tracking-widest">Mensal</p>
                   </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in">
                <p className="text-sm font-bold text-white/90 leading-relaxed">
                  Desbloqueia o **Gerador de CV Profissional**, remove anúncios e ganha selo de verificação em Angola.
                </p>
                <div className="space-y-3">
                  <button className="w-full bg-slate-950 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] transition-all border border-white/10">
                    Torna-te Premium
                  </button>
                  <p className="text-center text-[9px] font-black text-white/50 uppercase tracking-widest">A partir de 500 Kz/mês</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* NOTIFICAÇÕES & ALERTAS */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-sm border border-orange-500/10 flex flex-col justify-between transition-all">
           <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner ${notificationPermission === 'granted' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 'bg-slate-50 dark:bg-white/5 text-slate-400 border-slate-100 dark:border-white/5'}`}>
                   <Bell size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-950 dark:text-white uppercase tracking-tight leading-none mb-1">Alertas Ativos</h3>
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Inscrições e Vagas</p>
                </div>
              </div>
              
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium leading-relaxed max-w-xs">
                Recebe notificações instantâneas sobre mudanças no Dólar, Euro e novas vagas urgentes próximas de ti.
              </p>
           </div>
           
           <div className="mt-8">
             {notificationPermission === 'granted' ? (
               <div className="bg-emerald-500/5 text-emerald-600 p-5 rounded-2xl flex items-center justify-between border border-emerald-500/20">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={18} className="animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Push Notificações Ativas</span>
                  </div>
                  <span className="bg-emerald-500 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">OK</span>
               </div>
             ) : (
               <button 
                 onClick={handleEnableNotifications}
                 className="w-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
               >
                 <Bell size={18} /> Ativar Alertas de Mercado
               </button>
             )}
           </div>
        </div>
      </div>

      {/* DASHBOARD DE GESTÃO (Favoritos e Candidaturas) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* VAGAS GUARDADAS */}
         <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-sm border border-orange-500/10">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-orange-500/10">
               <div className="flex items-center gap-3">
                  <Heart className="text-rose-500" size={20} />
                  <h2 className="text-xl font-black text-slate-950 dark:text-white uppercase tracking-tight leading-none">Vagas Guardadas</h2>
               </div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{user.savedJobs?.length || 0} Itens</span>
            </div>
            
            {user.savedJobs && user.savedJobs.length > 0 ? (
               <div className="space-y-4">
                  {/* Lista de vagas guardadas (IDs fictícios para exemplo) */}
                  <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 flex items-center justify-between group hover:border-orange-500/30 transition-all cursor-pointer">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                           <Briefcase size={20} />
                        </div>
                        <div>
                           <p className="text-[10px] font-black uppercase dark:text-white">Software Engineer</p>
                           <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Unitel • Luanda</p>
                        </div>
                     </div>
                     <ChevronRight size={16} className="text-slate-300 group-hover:text-orange-500 transition-colors" />
                  </div>
               </div>
            ) : (
               <div className="py-10 text-center space-y-3 opacity-50">
                  <Heart className="mx-auto text-slate-300" size={32} />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Clica no ❤️ das vagas para as guardares aqui.</p>
               </div>
            )}
         </div>

         {/* HISTÓRICO DE CANDIDATURAS */}
         <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-sm border border-orange-500/10">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-orange-500/10">
               <div className="flex items-center gap-3">
                  <History className="text-orange-500" size={20} />
                  <h2 className="text-xl font-black text-slate-950 dark:text-white uppercase tracking-tight leading-none">Candidaturas</h2>
               </div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{user.applicationHistory?.length || 0} Envios</span>
            </div>
            
            {user.applicationHistory && user.applicationHistory.length > 0 ? (
               <div className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <CheckCircle2 className="text-emerald-500" size={16} />
                        <div>
                           <p className="text-[10px] font-black uppercase dark:text-white">Designer Gráfico</p>
                           <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Candidato em 24 Fev</p>
                        </div>
                     </div>
                  </div>
               </div>
            ) : (
               <div className="py-10 text-center space-y-3 opacity-50">
                  <Briefcase className="mx-auto text-slate-300" size={32} />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">O teu log de candidaturas aparecerá aqui.</p>
               </div>
            )}
         </div>
      </div>

      {/* HISTÓRICO DE TRANSAÇÕES (Antigo Histórico de Operações) */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-sm border border-orange-500/10 transition-all overflow-hidden relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 pb-6 border-b border-orange-500/10 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/5">
              <RefreshCw size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-950 dark:text-white uppercase tracking-tight leading-none mb-1">Transações Financeiras</h2>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Subscrições e Câmbio</p>
            </div>
          </div>
          <div className="px-5 py-2.5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 font-black text-[9px] uppercase tracking-[0.2em] text-slate-500">
            {orders.length} Registos
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
             {[1, 2].map(i => (
               <div key={i} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-white/5 rounded-2xl animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                    <div className="space-y-2">
                       <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
                       <div className="h-2 w-24 bg-slate-200 dark:bg-slate-800 rounded opacity-50"></div>
                    </div>
                  </div>
               </div>
             ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center opacity-40">
             <DollarSign size={40} className="text-slate-300 mb-4" />
             <p className="text-[10px] font-black uppercase tracking-[0.2em]">Sem transações registadas</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar-orange">
            {orders.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-black/20 rounded-3xl border border-slate-100 dark:border-white/5 hover:border-orange-500/40 transition-all group shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner ${order.type === 'buy' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'}`}>
                    {order.currency === 'USDT' ? <span className="font-black text-lg">₮</span> : (order.currency === 'EUR' ? <span className="font-black text-lg">€</span> : <DollarSign size={20} />)}
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black text-slate-950 dark:text-white uppercase tracking-tight mb-1">
                      {order.type === 'buy' ? 'Compra' : 'Venda'} {order.amount} {order.currency}
                    </h4>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                       {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-slate-950 dark:text-white font-mono tracking-tighter block mb-2">
                    {order.total_kz?.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                  </span>
                  <span className={`px-3 py-1 rounded-lg text-[7px] font-black uppercase tracking-[0.2em] border ${
                    order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' :
                    order.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' :
                    'bg-red-500/10 text-red-500 border-red-500/30'
                  }`}>
                    {order.status === 'completed' ? 'CONCLUÍDO' : order.status === 'pending' ? 'PENDENTE' : 'CANCELADO'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CHALLENGE EMBAIXADOR - DASHBOARD FINAL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-orange-500/10 shadow-sm hover:shadow-2xl transition-all group overflow-hidden relative">
            <div className="absolute -top-4 -right-4 opacity-[0.03] group-hover:scale-125 transition-transform">
               <stat.icon size={80} />
            </div>
            <div className="relative z-10">
               <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-6 shadow-xl shadow-black/5`}>
                 <stat.icon size={24} />
               </div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
               <p className="text-4xl font-black text-slate-950 dark:text-orange-500 leading-none">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
