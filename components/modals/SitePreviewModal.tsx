import React, { useState } from 'react';
import { X, ExternalLink, Globe, ShieldCheck, Image as ImageIcon } from 'lucide-react';

interface SitePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title?: string;
  companyName?: string;
}

export const SitePreviewModal: React.FC<SitePreviewModalProps> = ({
  isOpen,
  onClose,
  url,
  title,
  companyName
}) => {
  const [screenshotError, setScreenshotError] = useState(false);

  if (!isOpen || !url) return null;

  const targetUrl = url.startsWith('http') ? url : `https://${url}`;
  // thum.io generates a high-quality screenshot — raw URL in path, no encodeURIComponent
  const screenshotUrl = `https://image.thum.io/get/width/1200/crop/628/${targetUrl}`;

  const handleOpenSite = () => {
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-3 md:p-6 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 w-full max-w-4xl h-[85vh] rounded-[2.5rem] overflow-hidden border border-orange-500/30 shadow-2xl flex flex-col">
        
        {/* Header Browser Bar */}
        <div className="p-4 md:p-5 bg-slate-950 border-b border-white/10 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-orange-500/20 rounded-xl text-orange-400">
              <Globe size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xs md:text-sm font-black uppercase text-white truncate">
                  {companyName || title || 'Pré-Visualização do Anúncio'}
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-wider shrink-0">
                  <ShieldCheck size={10} /> Seguro
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate font-mono mt-0.5">
                {targetUrl}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleOpenSite}
              className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white px-4 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg transition-all"
            >
              Abrir Site <ExternalLink size={14} />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all"
              aria-label="Fechar Pré-Visualização"
              title="Fechar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Screenshot Preview Container */}
        <div className="flex-1 w-full h-full bg-slate-950 relative overflow-hidden">
          {!screenshotError ? (
            <>
              {/* Live screenshot via thum.io */}
              <img
                src={screenshotUrl}
                alt={`Pré-visualização de ${companyName || targetUrl}`}
                className="w-full h-full object-cover object-top"
                onError={() => setScreenshotError(true)}
              />
              {/* Subtle "click to open" overlay */}
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-center pb-8 cursor-pointer group"
                onClick={handleOpenSite}
              >
                <button className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-2xl opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  <ExternalLink size={16} /> Abrir Site Completo
                </button>
              </div>
            </>
          ) : (
            /* Fallback when screenshot service is unavailable */
            <div className="w-full h-full flex flex-col items-center justify-center gap-6 p-8 text-center">
              <div className="p-5 bg-orange-500/10 rounded-3xl border border-orange-500/20">
                <ImageIcon size={48} className="text-orange-400" />
              </div>
              <div className="space-y-2">
                <h4 className="text-white font-black text-lg uppercase tracking-tight">
                  {companyName || title || 'Anúncio'}
                </h4>
                <p className="text-slate-400 text-sm font-medium max-w-sm">
                  A pré-visualização não está disponível para este site.
                  Clique no botão abaixo para visitar directamente.
                </p>
                <p className="text-slate-600 text-xs font-mono truncate max-w-xs mx-auto">
                  {targetUrl}
                </p>
              </div>
              <button
                onClick={handleOpenSite}
                className="inline-flex items-center gap-2 px-8 py-4 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-2xl text-sm font-black uppercase tracking-wider shadow-xl transition-all"
              >
                <ExternalLink size={18} /> Abrir Site
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

