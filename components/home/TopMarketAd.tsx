import React, { useState, useEffect } from 'react';
import { MessageCircle, Volume2, VolumeX } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { APP_CONFIG } from '../../constants/app';

interface TopMarketAdProps {
  adBanners: any[];
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
}

export const TopMarketAd: React.FC<TopMarketAdProps> = ({ adBanners, isMuted, setIsMuted }) => {
  const { systemSettings } = useAppStore();
  const [adImageIndex, setAdImageIndex] = useState(0);

  useEffect(() => {
    if (adBanners.length === 0) return;
    const adDuration = (adBanners[adImageIndex]?.duration_seconds || 5) * 1000;
    const adInterval = setInterval(() => {
      setAdImageIndex((prev) => (prev + 1) % adBanners.length);
    }, adDuration);
    return () => clearInterval(adInterval);
  }, [adBanners.length, adImageIndex, adBanners]);

  const handleWhatsAppContact = () => {
    const phone = systemSettings?.contact_info?.whatsapp || APP_CONFIG.WHATSAPP_NUMBER; 
    const message = "Olá! Gostaria de saber mais sobre as opções de publicidade premium no Angolife para o meu negócio.";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="relative rounded-[1.5rem] md:rounded-[4rem] overflow-hidden bg-black shadow-2xl group transition-all gold-border-subtle min-h-[400px] md:min-h-[500px] flex items-center">
      <div className="absolute inset-0 z-0">
        {adBanners.map((banner, idx) => (
          (banner.mediaType === 'video' || banner.media_type === 'video') ? (
            <video 
              key={idx}
              src={banner.videoUrl || banner.video_url} 
              poster={banner.imageUrl || banner.image_url}
              autoPlay 
              muted={isMuted}
              loop 
              playsInline
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-[4000ms] ${adImageIndex === idx ? 'opacity-60 scale-105 blur-none' : 'opacity-0 scale-100'}`}
            />
          ) : (
            <img 
              key={idx}
              src={banner.imageUrl || banner.image_url} 
              alt={banner.companyName || banner.company_name || 'Partner Ad'} 
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-[4000ms] ${adImageIndex === idx ? 'opacity-60 scale-105 blur-none' : 'opacity-0 scale-100'}`}
            />
          )
        ))}
        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black via-black/85 to-transparent"></div>
        
        {adBanners[adImageIndex]?.mediaType === 'video' && (
          <button 
            onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
            className="absolute bottom-6 right-6 z-30 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white border border-white/10 transition-all active:scale-95"
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        )}
      </div>

      <div className="relative z-10 p-6 md:p-24 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 w-full text-center md:text-left stack-narrow">
        <div className="max-w-3xl">
          <p className="text-brand-gold text-[8px] md:text-sm font-black uppercase tracking-[0.2em] mb-4 drop-shadow-md animate-pulse">
            Anuncie e veja o seu negócio crescer
          </p>
          
          <h2 className="text-fluid-h2 font-black text-white uppercase mb-6">
            ALCANCE O <br/>
            <span className="text-brand-gold">TOPO</span> DO MERCADO
          </h2>
          
          <div className="block border-l-2 md:border-l-4 border-brand-gold pl-4 md:pl-6 py-2 mb-6 md:mb-0">
            <p className="text-fluid-p text-slate-200 font-bold">
              Alcance o topo do mercado angolano. Anuncie na rede exclusiva de empresários e investidores da Angolife.
            </p>
          </div>
        </div>

        <div className="w-full md:w-auto">
          <button 
            onClick={handleWhatsAppContact}
            className="w-full md:w-auto bg-brand-gold px-10 py-5 rounded-2xl font-black text-slate-950 uppercase tracking-[0.2em] text-[10px] md:text-sm transition-all active:scale-95 flex items-center justify-center gap-3 shadow-[0_15px_40px_rgba(245,158,11,0.3)]"
          >
            <MessageCircle size={20} />
            <span>ANUNCIAR AGORA</span>
          </button>
        </div>
      </div>
    </div>
  );
};
