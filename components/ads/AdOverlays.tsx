
import React, { useEffect, useState } from 'react';
import { X, Clock, Award, ExternalLink } from 'lucide-react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { PLACEHOLDER_IMAGE } from '../../constants/placeholders';
import { VideoUtils } from '../../services/utils/videoUtils';
import { safeHttpUrl } from '../../services/utils/safeUrl';
import { openExternal } from '../../services/core/openExternal';

/** Creative fields shared by DB-backed interstitial/rewarded ads */
export interface OverlayCreative {
  image_url?: string;
  title?: string;
  company_name?: string;
  video_url?: string;
  media_type?: 'image' | 'video';
  link?: string;
  duration_seconds?: number;
}

const hasRealImage = (creative?: OverlayCreative | null): boolean =>
  !!creative?.image_url && creative.image_url !== PLACEHOLDER_IMAGE;

/**
 * Renderiza o media de um anúncio da BD: vídeo (embed ou mp4), imagem real,
 * ou fallback tipográfico com título/empresa. Placeholder "RESOLVE.AO" só
 * quando não há creative algum.
 */
export const AdCreativeMedia: React.FC<{
  creative?: OverlayCreative | null;
  className?: string;
}> = ({ creative, className = '' }) => {
  if (!creative) {
    return (
      <img
        src={PLACEHOLDER_IMAGE}
        className={`w-full h-full object-cover ${className}`}
        alt="Publicidade"
      />
    );
  }

  const isVideo = creative.media_type === 'video' && !!creative.video_url;
  if (isVideo) {
    const { isEmbed, embedUrl } = VideoUtils.getEmbedUrl(creative.video_url);
    if (isEmbed && embedUrl) {
      return (
        <iframe
          src={embedUrl}
          className={`w-full h-full border-0 pointer-events-none ${className}`}
          title={creative.title || 'Publicidade'}
          allow="autoplay; encrypted-media; picture-in-picture"
        />
      );
    }
    return (
      <video
        src={creative.video_url}
        poster={hasRealImage(creative) ? creative.image_url : undefined}
        autoPlay
        loop
        muted
        playsInline
        className={`w-full h-full object-cover ${className}`}
      />
    );
  }

  if (hasRealImage(creative)) {
    return (
      <img
        src={creative.image_url}
        className={`w-full h-full object-cover ${className}`}
        alt={creative.title || 'Publicidade'}
      />
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center text-center p-5 bg-slate-800 ${className}`}>
      <span className="text-[9px] font-black uppercase tracking-[0.35em] text-brand-gold mb-2">Publicidade</span>
      <span className="text-lg font-black text-white uppercase leading-tight break-words">
        {creative.title || creative.company_name || 'Resolve.AO'}
      </span>
      {creative.company_name && creative.title && creative.title !== creative.company_name && (
        <span className="text-[11px] font-bold text-slate-400 mt-1.5">{creative.company_name}</span>
      )}
    </div>
  );
};

interface InterstitialAdProps {
  onClose: () => void;
  duration?: number;
  creative?: OverlayCreative | null;
}

export const InterstitialAd: React.FC<InterstitialAdProps> = ({ onClose, duration = 5, creative }) => {
  const [canClose, setCanClose] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [prevDuration, setPrevDuration] = useState(duration);

  useScrollLock(true);

  // Ajusta o estado quando o prop `duration` muda (padrão React recomendado)
  if (prevDuration !== duration) {
    setPrevDuration(duration);
    setTimeLeft(duration);
    setCanClose(false);
  }

  useEffect(() => {
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
  }, []);

  const visitAd = async () => {
    const safe = creative?.link ? safeHttpUrl(creative.link) : null;
    if (safe) await openExternal(safe);
  };

  const adLink = creative?.link ? safeHttpUrl(creative.link) : null;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Anúncio interstitial"
    >
      <div className="absolute top-6 right-6 z-[210]">
        {canClose ? (
          <button 
            onClick={onClose}
            className="bg-white/10 text-white rounded-full p-2.5 hover:bg-white/20 transition-all flex items-center gap-2 px-6 border border-orange-500/20 shadow-xl"
            aria-label="Fechar anúncio"
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
            <span className="text-[8px] md:text-[9px] uppercase tracking-[0.4em] text-slate-400 mb-8 border gold-border-subtle px-5 py-2.5 rounded-full font-black">Resolve.AO</span>
            
            <div className="w-full max-w-xs md:max-w-sm aspect-[4/3] rounded-3xl overflow-hidden mb-8 border-4 border-brand-gold shadow-2xl">
               <AdCreativeMedia creative={creative} />
            </div>
            
            <h3 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tighter leading-none break-words">
              {creative?.title || creative?.company_name || 'Resolve.AO'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-8 font-bold text-sm md:text-lg max-w-sm">
              {creative?.company_name && creative?.title
                ? `Patrocinado por ${creative.company_name}`
                : 'O teu portal de câmbio, empregos e oportunidades em Angola.'}
            </p>

            <div className="w-full max-w-sm flex flex-col gap-3">
              {adLink && (
                <button
                  onClick={visitAd}
                  className="w-full bg-brand-gold text-slate-950 py-4 rounded-2xl font-black shadow-[0_20px_40px_rgba(245,158,11,0.3)] uppercase text-xs tracking-[0.2em] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <ExternalLink size={14} /> Ver site / oferta
                </button>
              )}
              <button 
                onClick={onClose}
                className="w-full bg-brand-gold text-white py-5 rounded-2xl font-black shadow-[0_20px_40px_rgba(245,158,11,0.3)] uppercase text-xs tracking-[0.2em] active:scale-95 transition-all"
              >
                 Continuar
              </button>
            </div>
        </div>
        <div className="bg-slate-50 dark:bg-black py-4 text-center text-[8px] md:text-[10px] text-slate-500 uppercase font-black tracking-[0.3em]">
           Publicidade
        </div>
      </div>
    </div>
  );
};

interface RewardedAdProps {
  onReward: () => void;
  onClose: () => void;
  creative?: OverlayCreative | null;
}

export const RewardedAd: React.FC<RewardedAdProps> = ({ onReward, onClose, creative }) => {
  const DURATION = creative?.duration_seconds && creative.duration_seconds > 0
    ? creative.duration_seconds
    : 15;
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [completed, setCompleted] = useState(false);

  useScrollLock(true);

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

  const visitAd = async () => {
    const safe = creative?.link ? safeHttpUrl(creative.link) : null;
    if (safe) await openExternal(safe);
  };

  const adLink = creative?.link ? safeHttpUrl(creative.link) : null;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black animate-fade-in overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Anúncio com recompensa"
    >
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
           <button onClick={onClose} aria-label="Interromper anúncio" className="text-white/40 text-[10px] font-black uppercase tracking-widest hover:text-white border border-orange-500/20 px-5 py-2.5 rounded-xl hover:bg-white/5 transition-all">
             Interromper
           </button>
        )}
      </div>

      <div className="w-full h-full max-w-5xl max-h-[75vh] flex items-center justify-center relative border-y border-orange-500/10 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.05)_0%,transparent_70%)] px-4">
        <div className="text-center p-6 md:p-8 max-w-md w-full">
           <div className={`relative inline-block mb-8 w-full max-w-xs aspect-[4/3] rounded-3xl overflow-hidden border-2 transition-all duration-1000 ${completed ? 'border-brand-gold scale-105 shadow-[0_25px_60px_rgba(245,158,11,0.35)]' : 'border-white/10 opacity-75'}`}>
              <AdCreativeMedia creative={creative} />
             {completed && <Award size={36} className="absolute -top-3 -right-3 text-white bg-brand-gold rounded-full p-1.5 shadow-2xl border-4 border-black" />}
           </div>

           <div className="mb-3">
             <span className="text-[9px] font-black uppercase tracking-[0.35em] text-brand-gold">
               Publicidade{creative?.company_name ? ` · ${creative.company_name}` : ''}
             </span>
           </div>
           <h2 className="text-2xl md:text-3xl text-white font-black mb-3 uppercase tracking-tight leading-tight break-words">
             {creative?.title
               ? creative.title
               : <>RECOMPENSA <span className="text-brand-gold">EM BREVE</span></>}
           </h2>
           <p className="text-slate-400 text-sm md:text-base font-medium max-w-xs mx-auto mb-8">
             Obrigado por apoiares o Resolve.AO. A tua recompensa está pronta.
           </p>

           <div className="w-full h-1.5 bg-white/10 rounded-full mx-auto overflow-hidden">
               <svg className="w-full h-full">
                 <rect 
                   x="0" 
                   y="0" 
                   height="100%" 
                   width={`${((DURATION - timeLeft) / DURATION) * 100}%`} 
                   className="fill-brand-gold transition-all duration-1000 ease-linear"
                 />
               </svg>
           </div>
        </div>
      </div>

      <div className="absolute bottom-16 px-8 w-full flex flex-col items-center gap-4">
        {completed ? (
          <>
            <button 
              onClick={onReward}
              aria-label="Obter recompensa"
              className="w-full max-w-sm flex items-center justify-center gap-4 bg-brand-gold text-slate-950 px-12 py-6 rounded-3xl text-xs md:text-sm font-black uppercase tracking-[0.25em] shadow-[0_25px_60px_rgba(245,158,11,0.4)] animate-float"
            >
              <Award size={24} />
              OBTER RECOMPENSA
            </button>
            {adLink && (
              <button
                onClick={visitAd}
                className="flex items-center gap-2 text-white/60 hover:text-white text-[10px] font-black uppercase tracking-[0.3em] transition-colors"
              >
                <ExternalLink size={12} /> Ver site do anunciante
              </button>
            )}
          </>
        ) : (
          <div className="text-slate-600 text-[10px] font-black uppercase tracking-[0.5em] text-center">Resolve.AO Ads</div>
        )}
      </div>
    </div>
  );
};
