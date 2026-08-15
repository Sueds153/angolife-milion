import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface NativeAdProps {
  className?: string;
}

/**
 * Native Ad Component
 * Styled to match Resolve.AO's premium aesthetic
 * Appears as a "Sponsored Tip" card
 */
export const NativeAd: React.FC<NativeAdProps> = ({ className = '' }) => {
  const activeAds = useAppStore((state) => state.activeAds);
  const [rotIndex, setRotIndex] = useState(0);

  // Usa um anúncio real (location all/exchange, formato banner/all) com rotação simples
  const matching = activeAds.filter(
    (a) =>
      a.is_active &&
      (a.location === 'exchange' || a.location === 'all') &&
      (a.format === 'banner' || a.format === 'all')
  );

  useEffect(() => {
    if (matching.length <= 1) return;
    const interval = setInterval(() => setRotIndex((i) => i + 1), 15000);
    return () => clearInterval(interval);
  }, [matching.length]);

  const ad = matching.length > 0
    ? matching[rotIndex % matching.length]
    : null;

  // Fallback factual do próprio Resolve.AO (nunca inventa marcas nem links falsos)
  const adData = ad
    ? {
        title: ad.title || 'Publicidade',
        description: ad.company_name || 'Anúncio patrocinado no Resolve.AO',
        sponsor: ad.company_name || 'Patrocinado',
        ctaText: 'Visitar',
        ctaUrl: ad.link || '#'
      }
    : {
        title: 'Encontra as Melhores Oportunidades',
        description: 'Câmbio, empregos e notícias atualizadas no Resolve.AO. Tudo gratuito, num só lugar.',
        sponsor: 'Resolve.AO',
        ctaText: 'Explorar',
        ctaUrl: '/'
      };

  return (
    <div className={`relative bg-gradient-to-br from-slate-900/50 to-slate-800/30 rounded-[2rem] border border-slate-700/50 p-6 shadow-xl backdrop-blur-sm ${className}`}>
      {/* Sponsored Label */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={12} className="text-[#F59E0B]/50" />
        <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">
          PATROCINADO
        </span>
      </div>

      {/* Ad Content - Using Flexbox with gap */}
      <div className="flex flex-col gap-3">
        {/* Title */}
        <h3 className="text-lg font-black text-white leading-tight">
          {adData.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-slate-400 leading-relaxed">
          {adData.description}
        </p>

        {/* CTA + Sponsor - Using Flexbox with gap */}
        <div className="flex items-center justify-between gap-4 mt-2">
          <span className="text-[10px] font-bold text-slate-600 uppercase">
            {adData.sponsor}
          </span>

          <a
            href={adData.ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20 border border-[#F59E0B]/30 rounded-xl text-[10px] font-black text-[#F59E0B] uppercase tracking-widest transition-all hover:scale-105"
            onClick={() => {
              if (ad) console.log('📊 Native ad clicked');
            }}
          >
            {adData.ctaText}
          </a>
        </div>
      </div>

      {/* Subtle decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#F59E0B]/5 rounded-full blur-3xl -z-10" />
    </div>
  );
};
