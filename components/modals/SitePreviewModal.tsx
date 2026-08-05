import React from 'react';
import { X, ExternalLink, Globe, ShieldCheck } from 'lucide-react';

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
  if (!isOpen || !url) return null;

  const targetUrl = url.startsWith('http') ? url : `https://${url}`;

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
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-wider">
                  <ShieldCheck size={10} /> Seguro
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate font-mono mt-0.5">
                {targetUrl}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white px-4 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg transition-all"
            >
              Abrir Site <ExternalLink size={14} />
            </a>
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

        {/* Live Iframe or Preview Container */}
        <div className="flex-1 w-full h-full bg-white relative">
          <iframe
            src={targetUrl}
            title={title || 'Preview do Site'}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
};
