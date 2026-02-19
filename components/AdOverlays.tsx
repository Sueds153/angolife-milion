
import React, { useEffect, useState } from 'react';
import { X, Play, Clock, Award } from 'lucide-react';

interface InterstitialAdProps {
  onClose: () => void;
  duration?: number;
}

export const InterstitialAd: React.FC<InterstitialAdProps> = ({ onClose, duration = 5 }) => {
  const [canClose, setCanClose] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    // Reset timer if duration changes or on mount
    setTimeLeft(duration);
    setCanClose(false);
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanClose(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [duration]);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in p-4">
      <div className="absolute top-6 right-6 z-[210]">
        {canClose ? (
          <button 
            onClick={onClose}
            className="bg-white/10 text-white rounded-full p-2.5 hover:bg-white/20 transition-all flex items-center gap-2 px-6 border border-orange-500/20 shadow-xl"
          >
            <span className="text-xs font-black uppercase tracking-widest">Fechar</span>
            <X size={22} />
          </button>
        ) : (
          <div className="text-white/50 text-[10px] font-black uppercase tracking-widest border border-orange-500/20 rounded-full px-5 py-2.5 bg-white/5 backdrop-blur-md">
            Continuar em {timeLeft}s
          </div>
        )}
      </div>

      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden relative flex flex-col gold-border-subtle scale-95 md:scale-100">
        <div className="bg-slate-100 dark:bg-white/[0.03] flex-grow flex flex-col items-center justify-center p-8 md:p-14 text-center">
            <span className="text-[8px] md:text-[9px] uppercase tracking-[0.4em] text-slate-400 mb-8 border gold-border-subtle px-5 py-2.5 rounded-full font-black">Angolife Elite Network</span>
            
            {/* Imagem de Sucesso Negra no anúncio - Atualizada para ser exclusiva */}
            <div className="w-28 h-28 md:w-40 md:h-40 rounded-full overflow-hidden mb-8 border-4 border-brand-gold shadow-2xl transform hover:scale-105 transition-transform duration-500">
               <img src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=500&q=80" className="w-full h-full object-cover" alt="Elite Business" />
            </div>
            
            <h3 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tighter leading-none">Angolife <br/><span className="text-brand-gold">Premium Plus</span></h3>
            <p className="text-slate-500 dark:text-slate-400 mb-10 font-bold text-sm md:text-lg max-w-sm">Junte-se ao círculo dos líderes económicos em Luanda.</p>
            
            <button className="w-full bg-brand-gold text-white py-5 rounded-2xl font-black shadow-[0_20px_40px_rgba(245,158,11,0.3)] uppercase text-xs tracking-[0.2em] active:scale-95 transition-all">
               Visitar Terminal do Anunciante
            </button>
        </div>
        <div className="bg-slate-50 dark:bg-black py-4 text-center text-[8px] md:text-[10px] text-slate-500 uppercase font-black tracking-[0.3em]">
           Patrocinado via Google AdMob Elite
        </div>
      </div>
    </div>
  );
};

interface RewardedAdProps {
  onReward: () => void;
  onClose: () => void;
}

export const RewardedAd: React.FC<RewardedAdProps> = ({ onReward, onClose }) => {
  const DURATION = 15;
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black animate-fade-in">
      <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-center bg-gradient-to-b from-black via-black/80 to-transparent">
        <div className="flex items-center gap-4 text-white">
          <div className={`p-2.5 rounded-lg ${completed ? 'bg-brand-gold text-black' : 'bg-white/10'}`}>
            <Clock size={20} className={completed ? 'animate-bounce' : ''} />
          </div>
          <span className="font-black text-[11px] md:text-sm uppercase tracking-[0.3em]">
            {completed ? "RECOMPENSA DISPONÍVEL" : `MISSÃO EM CURSO: ${timeLeft}s`}
          </span>
        </div>
        {!completed && (
           <button onClick={onClose} className="text-white/40 text-[10px] font-black uppercase tracking-widest hover:text-white border border-orange-500/20 px-5 py-2.5 rounded-xl hover:bg-white/5 transition-all">
             Interromper
           </button>
        )}
      </div>

      <div className="w-full h-full max-w-5xl max-h-[75vh] flex items-center justify-center relative border-y border-orange-500/10 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.05)_0%,transparent_70%)]">
        <div className="text-center p-8 max-w-md">
           <div className="relative inline-block mb-12">
              <div className={`w-32 h-32 md:w-48 md:h-48 rounded-full border-2 overflow-hidden shadow-2xl transition-all duration-1000 ${completed ? 'border-brand-gold scale-110' : 'border-white/10 opacity-30 grayscale'}`}>
                 <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80" className="w-full h-full object-cover" alt="Reward" />
              </div>
              {completed && <Award size={40} className="absolute -top-4 -right-4 text-white bg-brand-gold rounded-full p-2 shadow-2xl border-4 border-black" />}
           </div>
           
           <h2 className="text-2xl md:text-4xl text-white font-black mb-6 uppercase tracking-tight leading-tight">ACEDA À INTELIGÊNCIA <br/><span className="text-brand-gold">SU-GOLDEN AI</span></h2>
           <p className="text-slate-400 text-sm md:text-base font-medium max-w-xs mx-auto mb-12">Desbloqueie agora a visão estratégica que o seu negócio precisa.</p>
           
           <div className="w-full h-1.5 bg-white/10 rounded-full mx-auto overflow-hidden">
              <div 
                className="h-full bg-brand-gold transition-all duration-1000 ease-linear shadow-[0_0_20px_rgba(245,158,11,0.5)]"
                style={{ '--progress-width': `${((DURATION - timeLeft) / DURATION) * 100}%` } as React.CSSProperties}
              >
                 <div className="h-full w-[var(--progress-width)] bg-inherit"></div>
              </div>
           </div>
        </div>
      </div>

      <div className="absolute bottom-16 px-8 w-full flex justify-center">
        {completed ? (
          <button 
            onClick={onReward}
            className="w-full max-w-sm flex items-center justify-center gap-4 bg-brand-gold text-slate-950 px-12 py-6 rounded-3xl text-xs md:text-sm font-black uppercase tracking-[0.25em] shadow-[0_25px_60px_rgba(245,158,11,0.4)] animate-float"
          >
            <Award size={24} />
            REIVINDICAR ACESSO ELITE
          </button>
        ) : (
          <div className="text-slate-600 text-[10px] font-black uppercase tracking-[0.5em] text-center">Conexão Segura Angolife Ads</div>
        )}
      </div>
    </div>
  );
};
