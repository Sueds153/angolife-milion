import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, Volume2, VolumeX } from 'lucide-react';

interface HeroBannerSliderProps {
  heroBanners: any[];
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
}

export const HeroBannerSlider: React.FC<HeroBannerSliderProps> = ({ heroBanners, isMuted, setIsMuted }) => {
  const navigate = useNavigate();
  const [heroImageIndex, setHeroImageIndex] = useState(0);

  useEffect(() => {
    if (heroBanners.length === 0) return;
    const heroDuration = (heroBanners[heroImageIndex]?.duration_seconds || 6) * 1000;
    const heroInterval = setInterval(() => {
      setHeroImageIndex((prev) => (prev + 1) % heroBanners.length);
    }, heroDuration);
    return () => clearInterval(heroInterval);
  }, [heroBanners.length, heroImageIndex, heroBanners]);

  return (
    <div className="relative rounded-[1.5rem] md:rounded-[3rem] overflow-hidden bg-slate-950 shadow-2xl min-h-[380px] md:min-h-[600px] flex items-center group gold-border-subtle">
      <div className="absolute inset-0 z-0">
        {heroBanners.map((banner, idx) => (
          (banner.mediaType === 'video' || banner.media_type === 'video') ? (
            <video 
              key={idx}
              src={banner.videoUrl || banner.video_url} 
              poster={banner.imageUrl || banner.image_url}
              autoPlay 
              muted={isMuted}
              loop 
              playsInline
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-[3000ms] ease-in-out ${heroImageIndex === idx ? 'opacity-40 scale-110' : 'opacity-0 scale-100'}`}
            />
          ) : (
            <img 
              key={idx}
              src={banner.imageUrl || banner.image_url} 
              alt={banner.title || 'Banner'} 
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-[3000ms] ease-in-out ${heroImageIndex === idx ? 'opacity-40 scale-110 translate-x-0' : 'opacity-0 scale-100 translate-x-4'}`}
            />
          )
        ))}
        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent"></div>

        {heroBanners[heroImageIndex]?.mediaType === 'video' && (
          <button 
            onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
            className="absolute bottom-6 right-6 z-30 p-3 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white border border-white/20 transition-all active:scale-95"
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        )}
      </div>
      
      <div className="relative z-10 p-6 md:p-24 max-w-5xl w-full">
        <div className="inline-flex items-center gap-2 bg-brand-gold/20 border border-brand-gold/40 backdrop-blur-xl px-4 py-2 rounded-full text-brand-gold text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-6 md:mb-12 shadow-lg">
          <Activity size={10} className="animate-pulse" />
          MERCADO EM TEMPO REAL
        </div>
        
        <h1 className="text-fluid-h1 font-black text-white mb-4 md:mb-8 tracking-tighter leading-[1.1] md:leading-[0.85] uppercase">
          Angolife <br/>
          <span className="text-brand-gold">Su-Golden</span>
        </h1>
        
        <p className="text-fluid-p text-slate-100 font-bold max-w-md mb-6 md:mb-12 opacity-90 uppercase tracking-tight">
          Lidere a economia nacional com inteligência de mercado e oportunidades exclusivas em Angola.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => navigate('/cambio')}
            className="w-full sm:w-auto bg-brand-gold hover:bg-amber-600 text-white font-black py-4 px-8 rounded-xl md:rounded-2xl transition-all flex items-center justify-center shadow-xl active:scale-95 text-[10px] md:text-sm uppercase tracking-widest border border-brand-gold/50 min-h-[56px]"
          >
            Consultar Câmbio <ArrowRight size={16} className="ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};
