import React from 'react';
import { Info, Sparkles } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { PARTNER_ADS } from '../constants/ads';

interface AdBannerProps {
  format: 'leaderboard' | 'rectangle' | 'skyscraper' | 'sticky-footer';
}

export const AdBanner: React.FC<AdBannerProps> = ({ format }) => {
  const { systemSettings } = useAppStore();
  
  // Use settings from Supabase if available, otherwise fallback to static constants
  const adsConfig = systemSettings?.google_ads || PARTNER_ADS.googleAds;
  const isGoogleEnabled = adsConfig.enabled;
  const adSlot = adsConfig.slots[format as keyof typeof adsConfig.slots];

  const getStyles = () => {
    switch (format) {
      case 'leaderboard': return 'h-24 w-full max-w-[728px] mx-auto my-2 rounded-xl'; 
      case 'rectangle': return 'h-[250px] w-full max-w-[300px] mx-auto my-4 rounded-3xl'; 
      case 'skyscraper': return 'h-[600px] w-[160px] my-4 rounded-2xl hidden md:flex'; 
      case 'sticky-footer': return 'w-full h-[50px] md:h-[60px]'; // Padrão Mobile AdMob
      default: return 'h-24 w-full';
    }
  };

  const isSticky = format === 'sticky-footer';

  // Se o Google Ads estiver ativo, injeta o script/ins (simulado aqui para frontend)
  if (isGoogleEnabled && adSlot) {
    return (
      <div className={`flex items-center justify-center overflow-hidden ${getStyles()}`}>
        <ins className="adsbygoogle block"
             data-ad-client={PARTNER_ADS.googleAds.client}
             data-ad-slot={adSlot}
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden transition-all ${getStyles()} ${!isSticky ? 'gold-border-subtle shadow-lg' : ''} backdrop-blur-sm`}>
      {/* Etiqueta AdMob obrigatória */}
      <div className="absolute top-0 right-0 bg-slate-100 dark:bg-white/10 border-b border-l gold-border-subtle px-1.5 py-0.5 z-10 rounded-bl-lg">
        <div className="flex items-center gap-1">
          <span className="text-[6px] text-slate-500 font-black uppercase tracking-tighter">AD</span>
          <Info size={6} className="text-slate-500" />
        </div>
      </div>

      <div className="w-full h-full flex items-center justify-between px-4 group cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
         <div className="flex items-center gap-3">
            <div className="p-1.5 bg-brand-gold/10 rounded-lg text-brand-gold">
              <Sparkles size={isSticky ? 12 : 18} />
            </div>
            <div className="flex flex-col">
              <span className={`font-black text-brand-gold uppercase tracking-tighter ${isSticky ? 'text-[9px]' : 'text-sm'}`}>
                Publicidade Premium
              </span>
              <p className={`text-slate-400 font-bold ${isSticky ? 'text-[7px]' : 'text-[9px] mt-0.5'}`}>
                Toque para explorar ofertas exclusivas
              </p>
            </div>
         </div>
         
         {!isSticky && (
           <div className="bg-brand-gold text-white px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest">
             Saber Mais
           </div>
         )}
      </div>
      
      {/* Efeito visual de varredura para aumentar Cliques (CTR) */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-gold/5 to-transparent -translate-x-full animate-[drift_12s_linear_infinite] pointer-events-none"></div>
    </div>
  );
};
