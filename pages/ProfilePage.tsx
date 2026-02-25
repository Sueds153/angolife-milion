import React, { useState, useRef, useEffect } from 'react';
import { User, Briefcase, Tag, Camera, Award, Share2, MessageCircle, CheckCircle2, Bell, BellOff, RefreshCw, DollarSign } from 'lucide-react';
import { UserProfile } from '../types';
import { NotificationService } from '../services/notificationService';
import { SupabaseService } from '../services/supabaseService';
import { APP_CONFIG } from '../constants';

interface ProfilePageProps {
  user: UserProfile;
  onLogout: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onLogout }) => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
  
  const formattedName = user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1);

  useEffect(() => {
    setNotificationPermission(NotificationService.checkPermission());
  }, []);

  const handleEnableNotifications = async () => {
    const granted = await NotificationService.requestPermission();
    setNotificationPermission(granted ? 'granted' : 'denied');
    if (granted) {
      NotificationService.sendNativeNotification('Notificações Ativadas', 'Você receberá alertas de mercado e vagas urgentes.');
    }
  };

  const stats = [
    { label: 'Vagas', value: '12', icon: Briefcase, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Ofertas', value: '45', icon: Tag, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Convites', value: user.referralCount.toString(), icon: User, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  const handleShareReferral = async () => {
    const shareText = `Vem para o Angolife! Regista-te com o meu código: ${user.referralCode}`;
    if (navigator.share) await navigator.share({ title: 'Angolife', text: shareText, url: window.location.origin });
  };

  const handleClaimAdReward = () => {
    const message = `Olá Su-Golden! Sou um Embaixador Angolife (${user.email}). Desafio concluído!`;
    window.open(`https://wa.me/${APP_CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-slide-up">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-10 shadow-sm overflow-hidden relative border border-orange-500/20 transition-colors">
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="relative" onClick={() => fileInputRef.current?.click()}>
            <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-4 border-orange-500/20 shadow-xl overflow-hidden">
              {profileImage ? <img src={profileImage} alt="Foto de Perfil" className="w-full h-full object-cover" /> : <User size={40} className="text-orange-500" />}
            </div>
            <button title="Alterar Foto" className="absolute bottom-0 right-0 bg-orange-500 text-white p-2 rounded-full shadow-lg"><Camera size={12} /></button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" title="Upload de Foto" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-black text-orange-500 tracking-tight">{formattedName}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-bold">{user.email}</p>
          </div>
          <button onClick={onLogout} className="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl font-bold text-sm border border-orange-500/20 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Sair</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-black rounded-[2rem] p-10 shadow-sm border border-orange-500/20 relative overflow-hidden transition-colors">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <Award className="text-orange-500" size={24} />
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Challenge Embaixador</h2>
            </div>
            <div className="space-y-6">
              <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <svg className="w-full h-full">
                  <rect 
                    x="0" 
                    y="0" 
                    height="100%" 
                    width={`${Math.min((user.referralCount / 3) * 100, 100)}%`} 
                    className="fill-orange-500 transition-all duration-1000"
                  />
                </svg>
              </div>
              <div className="bg-slate-50 dark:bg-white/5 border border-orange-500/20 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <span className="text-orange-500 font-mono text-xl font-black">{user.referralCode}</span>
                <button onClick={handleShareReferral} className="bg-orange-500 text-white px-6 py-3 rounded-lg font-black text-xs uppercase shadow-lg active:scale-95">Convidar</button>
              </div>
              {user.referralCount >= 3 && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 gold-border-subtle">
                  <button onClick={handleClaimAdReward} className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg font-bold text-sm gold-border-subtle w-full justify-center">
                    <MessageCircle size={18} /> Resgatar Prémio
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Configuração de Notificações */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-sm border border-orange-500/20 flex flex-col justify-center transition-colors">
           <div className="flex items-center gap-3 mb-4">
             <Bell className={notificationPermission === 'granted' ? 'text-orange-500' : 'text-slate-400'} size={24} />
             <h3 className="text-lg font-black text-orange-500 uppercase tracking-tight">Alertas de Mercado</h3>
           </div>
           <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-6 leading-relaxed">
             Receba notificações instantâneas sobre mudanças bruscas no Dólar, Euro e novas vagas urgentes na sua área.
           </p>
           
           {notificationPermission === 'granted' ? (
             <div className="bg-emerald-500/10 text-emerald-600 p-4 rounded-xl flex items-center gap-3 border border-emerald-500/20">
                <CheckCircle2 size={20} />
                <span className="text-xs font-black uppercase tracking-widest">Notificações Ativas</span>
             </div>
           ) : notificationPermission === 'denied' ? (
             <div className="bg-red-500/10 text-red-500 p-4 rounded-xl flex items-center gap-3 border border-red-500/20">
                <BellOff size={20} />
                <span className="text-xs font-black uppercase tracking-widest">Bloqueado no Navegador</span>
             </div>
           ) : (
             <button 
               onClick={handleEnableNotifications}
               className="w-full bg-slate-900 dark:bg-orange-500 text-white dark:text-slate-900 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
             >
               <Bell size={16} /> Ativar Notificações
             </button>
           )}
        </div>
      </div>

      {/* Histórico de Operações */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-10 shadow-sm border border-orange-500/20 transition-colors">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-orange-500/10">
          <div className="flex items-center gap-3">
            <RefreshCw className="text-orange-500" size={24} />
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Histórico de Operações</h2>
          </div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{orders.length} Transações</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
             <RefreshCw className="text-orange-500 animate-spin" size={40} />
             <p className="text-xs font-black text-slate-500 uppercase tracking-widest">A carregar registos...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center border-2 border-dashed border-orange-500/20">
              <DollarSign className="text-slate-400" size={32} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide">Ainda não realizou trocas</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Suas transações aparecerão aqui.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-black/40 rounded-2xl border border-orange-500/10 hover:border-orange-500/30 transition-all group">
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border border-orange-500/20 shadow-inner ${order.type === 'buy' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-500'}`}>
                    {order.currency === 'USDT' ? <span className="font-black text-xl">₮</span> : (order.currency === 'EUR' ? <span className="font-black text-xl">€</span> : <DollarSign size={24} />)}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                      {order.type === 'buy' ? 'Compra de' : 'Venda de'} {order.amount} {order.currency}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                       {new Date(order.created_at).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' })} • {order.payment_method}
                    </p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <span className="text-sm font-black text-orange-500 font-mono">
                    {order.total_kz?.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                    order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' :
                    order.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' :
                    'bg-red-500/10 text-red-500 border-red-500/30'
                  }`}>
                    {order.status === 'completed' ? 'Concluído' : order.status === 'pending' ? 'Pendente' : 'Cancelado'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-orange-500/20 shadow-sm">
            <stat.icon size={20} className={`${stat.color} mb-3`} />
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <p className="text-3xl font-black text-orange-500">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
