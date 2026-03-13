
import React, { useEffect, useState } from 'react';
import { Bell, X, TrendingUp, Briefcase, Zap } from 'lucide-react';
import { AppNotification } from '../../types';

interface NotificationToastProps {
  notification: AppNotification;
  onClose: () => void;
  onOpen: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onClose, onOpen }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for exit animation
    }, 6000); // 6 seconds display

    return () => clearTimeout(timer);
  }, [notification, onClose]);

  const getIcon = () => {
    switch (notification.type) {
      case 'market': return <TrendingUp size={20} className="text-brand-gold" />;
      case 'job': return <Briefcase size={20} className="text-blue-400" />;
      default: return <Bell size={20} className="text-white" />;
    }
  };

  const getBgGlow = () => {
    switch (notification.type) {
      case 'market': return 'shadow-[0_0_30px_rgba(245,158,11,0.2)] border-brand-gold/30';
      case 'job': return 'shadow-[0_0_30px_rgba(96,165,250,0.2)] border-blue-500/30';
      default: return 'shadow-xl border-white/10';
    }
  };

  return (
    <div 
      className={`fixed top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-[200] transition-all duration-500 transform ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0 pointer-events-none'}`}
    >
      <div 
        onClick={onOpen}
        className={`bg-slate-900/90 backdrop-blur-xl p-4 rounded-2xl flex items-start gap-4 border cursor-pointer group ${getBgGlow()}`}
      >
        <div className="bg-white/5 p-2.5 rounded-xl shrink-0">
          {getIcon()}
        </div>
        
        <div className="flex-1 pt-0.5">
          <div className="flex justify-between items-start">
            <h4 className="text-sm font-black text-white uppercase tracking-tight leading-none mb-1">
              {notification.title}
            </h4>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <Zap size={8} className="text-brand-gold" /> Agora
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium leading-relaxed line-clamp-2">
            {notification.message}
          </p>
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); setIsVisible(false); setTimeout(onClose, 300); }}
          className="text-slate-500 hover:text-white transition-colors p-1"
          title="Fechar Notificação"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
