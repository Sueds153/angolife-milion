import React from 'react';
import { Sparkles } from 'lucide-react';

interface NativeAdProps {
  className?: string;
}

/**
 * Native Ad Component
 * Styled to match AngoLife's premium aesthetic
 * Appears as a "Sponsored Tip" card
 */
export const NativeAd: React.FC<NativeAdProps> = ({ className = '' }) => {
  // PLACEHOLDER: Replace with actual ad content from provider
  const adData = {
    title: 'Proteja o Seu Futuro Financeiro',
    description: 'Descubra como investir em AOA e USD com segurança. Consultoria gratuita disponível.',
    sponsor: 'Banco Atlântico',
    ctaText: 'Saiba Mais',
    ctaUrl: '#'
  };

  return (
    <div className={`bg-gradient-to-br from-slate-900/50 to-slate-800/30 rounded-[2rem] border border-slate-700/50 p-6 shadow-xl backdrop-blur-sm ${className}`}>
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
            onClick={(e) => {
              // PLACEHOLDER: Track ad click
              console.log('📊 Native ad clicked');
              // In production, report to ad provider
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
