import React, { useState, useEffect } from 'react';
import { X, Zap, Play, Loader2, MessageCircle } from 'lucide-react';

interface RewardedAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardEarned: () => string | void;
  onSkip: () => void;
  whatsappLink?: string | null;
  onFinalize?: () => void;
}

/**
 * Rewarded Ad Modal
 * Offers users priority support in exchange for watching a 15s ad
 */
export const RewardedAdModal: React.FC<RewardedAdModalProps> = ({
  isOpen,
  onClose,
  onRewardEarned,
  onSkip,
  whatsappLink,
  onFinalize
}) => {
  const [isWatchingRewardAd, setIsWatchingRewardAd] = useState(false);
  const [showRedirectButton, setShowRedirectButton] = useState(false);

  // Interstitial States
  // 'idle': Initial state
  // 'loading': User clicked "Continue", waiting for ad
  // 'ready': Ad pre-loaded (simulated)
  // 'showing': Ad is playing
  const [interstitialState, setInterstitialState] = useState<'idle' | 'loading' | 'ready' | 'showing'>('idle');
  const [interstitialTimer, setInterstitialTimer] = useState(5);
  const [rewardTimer, setRewardTimer] = useState(15);

  // Test ID for Interstitial
  const ADMOB_INTERSTITIAL_ID = 'ca-app-pub-3940256069387121/1033173712';

  const handleFinalRedirect = (overrideLink?: string | null) => {
    const finalLink = overrideLink || whatsappLink;
    if (finalLink) {
      const openedWindow = window.open(finalLink, '_blank');
      
      // If window.open was blocked, show the manual button as fallback
      if (!openedWindow) {
        setShowRedirectButton(true);
      } else {
        if (onFinalize) onFinalize();
        onClose();
      }
    }
  };

  const handleWatchRewardAd = async () => {
    setIsWatchingRewardAd(true);
    let timeLeft = 15;
    const timer = setInterval(() => {
      timeLeft -= 1;
      setRewardTimer(timeLeft);
      if (timeLeft <= 0) {
        clearInterval(timer);
        setIsWatchingRewardAd(false);
        const newLink = onRewardEarned();
        handleFinalRedirect(typeof newLink === 'string' ? newLink : undefined);
      }
    }, 1000);

    // Salvamos o timer para limpar se o modal fechar bruscamente
    (window as any)._rewardTimer = timer;
  };

  useEffect(() => {
    return () => {
      if ((window as any)._rewardTimer) clearInterval((window as any)._rewardTimer);
    };
  }, []);

  const handleContinueWithoutPriority = () => {
    if (interstitialState === 'ready') {
      setInterstitialState('showing');
    } else {
      setInterstitialState('loading');
      setTimeout(() => {
        if (interstitialState !== 'showing') {
          setInterstitialState('idle');
          handleFinalRedirect();
        }
      }, 2000);
    }
  };

  // Simulate Pre-load on mount/open
  useEffect(() => {
    if (isOpen) {
      setInterstitialState('idle'); // Reset on open
      setInterstitialTimer(5);
      setShowRedirectButton(false);

      // Simulate Pre-load taking 1-2 seconds
      const preloadTime = Math.random() * 1000 + 500;
      const timer = setTimeout(() => {
        setInterstitialState(prev => prev === 'idle' ? 'ready' : prev);
      }, preloadTime);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Ref for onSkip to avoid effect dependency re-runs
  const onSkipRef = React.useRef(onSkip);
  useEffect(() => {
    onSkipRef.current = onSkip;
  }, [onSkip]);

  // UseEffect for Interstitial Timer (Strict 1s decrement)
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (interstitialState === 'showing') {
      interval = setInterval(() => {
        setInterstitialTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0; // Ensures it hits exactly 0
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [interstitialState]);

  // Sovereign Trigger: When timer hits 0, execute skip (which opens WhatsApp)
  useEffect(() => {
    if (interstitialState === 'showing' && interstitialTimer === 0) {
      handleFinalRedirect();
    }
  }, [interstitialTimer, interstitialState, whatsappLink]);

  // Effect to catch late load if user is waiting
  useEffect(() => {
    let raceTimer: NodeJS.Timeout;
    if (interstitialState === 'loading') {
      // In real implementation, we would check if ad is loaded. 
      // Here, we just simulate that if we were loading, we might get lucky and it loads in 500ms
      raceTimer = setTimeout(() => {
        setInterstitialState('showing');
      }, 1000); // Guarantees ad shows after 1s of waiting
    }
    return () => {
      if (raceTimer) clearTimeout(raceTimer);
    };
  }, [interstitialState]);

  if (!isOpen) return null;



  // INTERSTITIAL OVERLAY
  if (interstitialState === 'showing') {
    return (
      <div className="fixed inset-0 bg-black z-[300] flex flex-col items-center justify-center p-6 animate-fade-in">
        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center text-white/50 text-[10px] font-mono">
          <span>Angolife AdSystem</span>
          <span>Test ID: {ADMOB_INTERSTITIAL_ID.slice(0, 20)}...</span>
        </div>

        <div className="text-center space-y-8 max-w-sm">
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-full border-4 border-orange-500 flex items-center justify-center animate-pulse">
              <span className="text-4xl font-black text-white">{interstitialTimer}</span>
            </div>
            <div className="absolute -bottom-2 w-full text-center">
              <span className="bg-orange-500 text-black text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider">Segundos</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-black text-white uppercase tracking-widest animate-pulse">
              A validar taxas de mercado...
            </h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
              Por favor aguarde um momento
            </p>
          </div>

          <div className="w-full bg-slate-800 h-1 mt-8 rounded-full overflow-hidden">
            <div
              className="bg-[#F59E0B] h-full transition-all duration-1000 ease-linear"
              style={{ '--progress-width': `${((5 - interstitialTimer) / 5) * 100}%` } as React.CSSProperties}
            >
              <div className="h-full w-[var(--progress-width)] bg-inherit"></div>
            </div>
          </div>
        </div>
      </div>
    );
  } else if (showRedirectButton) {
    return (
      <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[400] flex flex-col items-center justify-center p-6 animate-fade-in">
        <div className="bg-slate-900 border border-orange-500/30 p-10 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-8 max-w-sm w-full text-center">
          <div className="w-20 h-20 rounded-full bg-[#F59E0B]/10 flex items-center justify-center border-2 border-[#F59E0B]/20">
            <MessageCircle size={40} className="text-orange-500" />
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-black text-white uppercase tracking-tight">PEDIDO PRONTO!</h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">
              Clique abaixo para ser reencaminhado ao WhatsApp com o seu ticket de atendimento.
            </p>
          </div>
          <button
            onClick={handleFinalRedirect}
            className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <MessageCircle size={20} /> ABRIR WHATSAPP
          </button>
        </div>
      </div>
    );
  } else if (isWatchingRewardAd) {
    return (
      <div className="fixed inset-0 bg-black z-[500] flex flex-col items-center justify-center p-6 animate-fade-in">
        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center text-white/50 text-[10px] font-mono">
          <span>Angolife Network | REWARDED VIDEO</span>
          <div className="flex items-center gap-2">
            <Zap size={10} className="text-orange-500" />
            <span>AD ID: REW-{Math.random().toString(36).substring(7).toUpperCase()}</span>
          </div>
        </div>

        <div className="text-center space-y-10 max-w-sm">
          <div className="relative inline-block">
             {/* Progress Circle Visual */}
             <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-slate-800"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={364}
                  style={{ '--dash-offset': 364 - (364 * (15 - rewardTimer)) / 15 } as React.CSSProperties}
                  className="text-orange-500 transition-all duration-1000 ease-linear [stroke-dashoffset:var(--dash-offset)]"
                />
             </svg>
             <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-white">{rewardTimer}</span>
                <span className="text-[10px] font-black text-orange-500 uppercase">Seg</span>
             </div>
          </div>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full">
               <Zap size={14} className="text-orange-500 animate-pulse" />
               <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em]">Bónus de Prioridade Ativo</span>
            </div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">
              A PREPARAR O TEU<br />LUGAR NA FILA...
            </h3>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest px-8">
              O seu atendimento será priorizado após este breve vídeo explicativo.
            </p>
          </div>

          <div className="flex items-center gap-3 justify-center text-slate-600">
             <div className="h-px w-8 bg-slate-800"></div>
             <span className="text-[9px] font-black uppercase tracking-widest">Publicidade Angolife</span>
             <div className="h-px w-8 bg-slate-800"></div>
          </div>
        </div>
      </div>
    );
  } else if (interstitialState === 'loading') {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[300] flex flex-col items-center justify-center p-6 animate-fade-in">
        <Loader2 className="text-[#F59E0B] animate-spin mb-4" size={48} />
        <p className="text-white font-black uppercase tracking-widest text-sm">A preparar o seu link de atendimento...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in">
      {/* Modal Container */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border-2 border-orange-500/30 max-w-md w-full shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="bg-orange-500/10 border-b border-orange-500/20 p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#F59E0B]/20 rounded-xl">
              <Zap size={24} className="text-[#F59E0B]" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-black text-white uppercase tracking-tight">
                Alta Demanda!
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Ganhe prioridade no atendimento
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white"
            disabled={isWatchingRewardAd}
            title="Fechar"
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 flex flex-col gap-6">
          {/* Explanation */}
          <div className="flex flex-col gap-3">
            <p className="text-sm text-slate-300 leading-relaxed">
              Temos muitos pedidos neste momento. Assista a um anúncio de <span className="text-[#F59E0B] font-bold">15 segundos</span> para dar prioridade ao seu pedido no WhatsApp.
            </p>

            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
              <div className="flex items-center gap-3">
                <Zap size={16} className="text-[#F59E0B]" />
                <span className="text-xs text-slate-400">
                  A sua mensagem será marcada como <span className="text-[#F59E0B] font-bold">⚡ PRIORITÁRIA</span>
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleWatchRewardAd}
              disabled={isWatchingRewardAd}
              className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${isWatchingRewardAd
                ? 'bg-slate-700 text-slate-500 cursor-wait'
                : 'bg-orange-500 text-black hover:bg-amber-600 hover:scale-105'
                }`}
            >
              {isWatchingRewardAd ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  AGUARDE {rewardTimer}S...
                </>
              ) : (
                <>
                  <Play size={18} />
                  ASSISTIR E GANHAR PRIORIDADE
                </>
              )}
            </button>

            <button
              onClick={handleContinueWithoutPriority}
              disabled={isWatchingRewardAd}
              className="w-full py-3 rounded-2xl bg-transparent border-2 border-slate-700 hover:border-slate-600 text-slate-400 hover:text-white font-black text-xs uppercase tracking-widest transition-all hover:bg-white/5 active:scale-95"
            >
              Continuar sem prioridade
            </button>
          </div>

          {/* Info */}
          <p className="text-[9px] text-slate-600 text-center uppercase tracking-wider">
            O anúncio ajuda-nos a manter o serviço gratuito
          </p>
        </div>
      </div>
    </div>
  );
};
