import React, { useState } from 'react';
import { HardHat, Store, Briefcase } from 'lucide-react';

interface JobLogoProps {
  src?: string;
  company: string;
  category?: string;
  size?: number;
}

export const JobLogo: React.FC<JobLogoProps> = ({ src, company, category, size = 60 }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const getFallbackIcon = () => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('constru') || cat.includes('engenh')) return <HardHat className="text-orange-500" size={size * 0.5} />;
    if (cat.includes('venda') || cat.includes('comercial')) return <Store className="text-orange-500" size={size * 0.5} />;
    return <Briefcase className="text-orange-500" size={size * 0.5} />;
  };

  return (
    <div
      className={`relative flex items-center justify-center bg-white dark:bg-slate-800 rounded-2xl border border-orange-500/10 overflow-hidden shrink-0 shadow-sm ${size === 60 ? 'job-logo-60' : (size === 80 ? 'job-logo-80' : 'job-logo-60')}`}
    >
      {loading && !error && src && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-800 animate-pulse z-10">
          <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {(!src || error) ? (
        <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-900 group-hover:scale-110 transition-transform">
          <div className="bg-brand-gold/10 w-full h-full flex items-center justify-center">
            {company ? (
              <span className="text-brand-gold font-black text-xl uppercase">{company.charAt(0)}</span>
            ) : (
              getFallbackIcon()
            )}
          </div>
        </div>
      ) : (
        <img
          src={src}
          alt={company}
          className={`w-full h-full object-contain p-2 transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => setLoading(false)}
          onError={() => {
            setError(true);
            setLoading(false);
          }}
        />
      )}
    </div>
  );
};
