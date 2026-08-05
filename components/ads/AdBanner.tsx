import React, { useEffect, useState } from 'react';
import { Info, Sparkles, ExternalLink } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { PARTNER_ADS } from '../../constants/ads';
import { AdsService, Ad } from '../../services/api/ads.service';
import { VideoUtils } from '../../services/utils/videoUtils';
import { SitePreviewModal } from '../modals/SitePreviewModal';

interface AdBannerProps {
  format: 'leaderboard' | 'rectangle' | 'skyscraper' | 'sticky-footer';
  customLocation?: 'home' | 'jobs' | 'exchange' | 'all';
}

export const AdBanner: React.FC<AdBannerProps> = ({ format, customLocation = 'all' }) => {
  const { systemSettings, activeAds, setActiveAds } = useAppStore();
  const [partnerAd, setPartnerAd] = useState<Ad | null>(null);
  
  // Site Preview Modal State
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewModalUrl, setPreviewModalUrl] = useState<string>('');

  // Load ads into store if not loaded yet
  useEffect(() => {
    if (activeAds.length === 0) {
      AdsService.getAds()
        .then(data => {
          if (data && data.length > 0) setActiveAds(data);
        })
        .catch(() => {});
    }
  }, [activeAds.length, setActiveAds]);

  // Pick an active partner ad matching location & format
  useEffect(() => {
    if (activeAds.length > 0) {
      const matching = activeAds.filter(a => 
        a.is_active && 
        (a.location === customLocation || a.location === 'all') && 
        (a.format === 'banner' || a.format === (format === 'sticky-footer' ? 'banner' : format))
      );

      if (matching.length > 0) {
        const randomAd = matching[Math.floor(Math.random() * matching.length)];
        setPartnerAd(randomAd);
      }
    }
  }, [activeAds, format, customLocation]);

  const adsConfig = systemSettings?.google_ads || PARTNER_ADS.googleAds;
  const isGoogleEnabled = adsConfig.enabled && !partnerAd;
  const adSlot = adsConfig.slots[format as keyof typeof adsConfig.slots];

  const getStyles = () => {
    switch (format) {
      case 'leaderboard': return 'h-24 w-full max-w-[728px] mx-auto my-2 rounded-2xl'; 
      case 'rectangle': return 'h-[250px] w-full max-w-[300px] mx-auto my-4 rounded-3xl'; 
      case 'skyscraper': return 'h-[600px] w-[160px] my-4 rounded-2xl hidden md:flex'; 
      case 'sticky-footer': return 'w-full h-[50px] md:h-[60px]';
      default: return 'h-24 w-full';
    }
  };

  const isSticky = format === 'sticky-footer';

  // --- 1. Custom Partner Ad Rendered (Image or Video) ---
  if (partnerAd) {
    const isVideo = partnerAd.media_type === 'video';
    const embedInfo = isVideo ? VideoUtils.getEmbedUrl(partnerAd.video_url) : { isEmbed: false, embedUrl: null };

    const handleAdClick = () => {
      if (partnerAd.link) {
        setPreviewModalUrl(partnerAd.link);
        setShowPreviewModal(true);
      }
    };

    return (
      <>
        <div 
          onClick={handleAdClick}
          className={`relative overflow-hidden cursor-pointer group flex items-center justify-center ${getStyles()} bg-slate-950 border border-orange-500/20 shadow-xl transition-all hover:border-orange-500/50`}
        >
          {/* Media Background */}
          {isVideo && embedInfo.isEmbed && embedInfo.embedUrl ? (
            <iframe
              src={embedInfo.embedUrl}
              className="absolute inset-0 w-full h-full border-0 pointer-events-none opacity-80 group-hover:scale-105 transition-transform duration-700"
              title={partnerAd.title || 'Anúncio'}
            />
          ) : isVideo && partnerAd.video_url ? (
            <video
              src={partnerAd.video_url}
              poster={partnerAd.image_url}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
            />
          ) : partnerAd.image_url ? (
            <img
              src={partnerAd.image_url}
              alt={partnerAd.company_name || partnerAd.title || 'Publicidade'}
              className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
            />
          ) : null}

          {/* Overlay Banner Bar */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent p-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 backdrop-blur-md rounded-xl text-orange-400 border border-orange-500/30">
                <Sparkles size={16} />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase text-orange-400 tracking-widest">
                  {partnerAd.company_name || 'Patrocinado'}
                </p>
                <h4 className="text-xs font-extrabold text-white leading-tight truncate max-w-[220px] md:max-w-[400px]">
                  {partnerAd.title || 'Ver Oferta Exclusiva'}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg">
                Ver Site / Oferta <ExternalLink size={12} />
              </span>
            </div>
          </div>

          {/* AD Badge Tag */}
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md border border-white/10 px-2 py-0.5 z-20 rounded-md">
            <span className="text-[7px] text-slate-300 font-black uppercase tracking-tighter">ANÚNCIO</span>
          </div>
        </div>

        {/* In-App Site Preview Modal */}
        <SitePreviewModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          url={previewModalUrl}
          title={partnerAd.title}
          companyName={partnerAd.company_name}
        />
      </>
    );
  }

  // --- 2. Google AdSense Fallback ---
  if (isGoogleEnabled && adSlot) {
    return (
      <div className={`flex items-center justify-center overflow-hidden ${getStyles()}`}>
        <ins className="adsbygoogle block"
             data-ad-client={adsConfig.client}
             data-ad-slot={adSlot}
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
      </div>
    );
  }

  // --- 3. Default AngoLife Ad Fallback ---
  return (
    <div className={`bg-slate-900 border border-orange-500/20 flex flex-col items-center justify-center relative overflow-hidden transition-all ${getStyles()} ${!isSticky ? 'shadow-lg' : ''} backdrop-blur-sm`}>
      <div className="absolute top-0 right-0 bg-white/10 border-b border-l border-white/10 px-2 py-0.5 z-10 rounded-bl-lg">
        <div className="flex items-center gap-1">
          <span className="text-[7px] text-slate-400 font-black uppercase tracking-tighter">PUBLICIDADE</span>
          <Info size={8} className="text-slate-400" />
        </div>
      </div>

      <div 
        className="w-full h-full flex items-center justify-between px-5 group cursor-pointer hover:bg-white/[0.03] transition-colors"
        onClick={() => {
          if (format === 'leaderboard') window.location.href = '/vagas';
          if (format === 'rectangle') window.location.href = '/cambio';
        }}
      >
         <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-xl text-orange-400 border border-orange-500/20">
              <Sparkles size={isSticky ? 14 : 18} />
            </div>
            <div className="flex flex-col">
              <span className={`font-black text-white uppercase tracking-tight ${isSticky ? 'text-[10px]' : 'text-xs'}`}>
                {format === 'leaderboard' ? 'Publica a tua Vaga no Angolife' : 
                 format === 'rectangle' ? 'Câmbio em Tempo Real' : 
                 'Publicidade AngoLife'}
              </span>
              <p className={`text-slate-400 font-bold ${isSticky ? 'text-[8px]' : 'text-[10px] mt-0.5'}`}>
                {format === 'leaderboard' ? 'Alcança milhares de candidatos qualificados em Angola' : 
                 format === 'rectangle' ? 'Acompanha a taxa formal e informal ao minuto' : 
                 'Anuncie a sua marca para milhares de empresários'}
              </p>
            </div>
         </div>
         
         {!isSticky && (
           <div className="bg-orange-500 hover:bg-orange-600 text-white px-3.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md">
             Saber Mais
           </div>
         )}
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/5 to-transparent -translate-x-full animate-[drift_12s_linear_infinite] pointer-events-none" />
    </div>
  );
};
