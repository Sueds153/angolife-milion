
import React from 'react';
import { Link } from 'react-router-dom';
import { Share2, ShieldCheck, FileText, ChevronRight, Lock } from 'lucide-react';

interface FooterProps {
  onOpenLegal: (type: 'privacy' | 'terms' | 'data') => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenLegal }) => {
  const handleShareApp = async () => {
    const shareData = {
      title: 'Resolve.AO',
      text: 'Câmbio, vagas de emprego, notícias e descontos em Angola, num só lugar.',
      url: window.location.origin,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareData.text}\n${shareData.url}`)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  return (
    <footer className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white pt-16 pb-32 px-6 mt-12 relative overflow-hidden border-t border-orange-500/20 transition-colors duration-300">

      <div className="max-w-md mx-auto relative z-10 flex flex-col gap-10">

        {/* 1. BRANDING SECTION */}
        <div className="space-y-5">
          <div className="flex flex-col items-start gap-1 select-none">
            <span className="text-2xl md:text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
              Resolve<span className="text-brand-gold">.AO</span>
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed max-w-[300px]">
            Câmbio, vagas de emprego, notícias e descontos em Angola, atualizados todos os dias. Feito por quem vive cá.
          </p>
        </div>

        <div className="h-px bg-orange-500/10 w-full"></div>

        {/* 2. NAVIGATION & LEGAL GRID */}
        <div className="grid grid-cols-2 gap-8">
          {/* Coluna Plataforma */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-2">
              Plataforma
            </h4>
            <div className="flex flex-col space-y-3">
              <Link 
                to="/cambio" 
                onClick={() => window.scrollTo(0, 0)}
                className="group flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-xs font-bold w-fit"
              >
                <ChevronRight size={12} className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" /> Câmbio Real
              </Link>
              <Link 
                to="/vagas" 
                onClick={() => window.scrollTo(0, 0)}
                className="group flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-xs font-bold w-fit"
              >
                <ChevronRight size={12} className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" /> Oportunidades
              </Link>
              <Link 
                to="/ofertas" 
                onClick={() => window.scrollTo(0, 0)}
                className="group flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-xs font-bold w-fit"
              >
                <ChevronRight size={12} className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" /> Descontos
              </Link>
              <Link 
                to="/multicaixa" 
                onClick={() => window.scrollTo(0, 0)}
                className="group flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-xs font-bold w-fit"
              >
                <ChevronRight size={12} className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" /> Multicaixa
              </Link>
            </div>
          </div>

          {/* Coluna Legal (Essencial para AdMob) */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              Legal & Apoio
            </h4>
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => onOpenLegal('privacy')}
                className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-xs font-medium w-fit"
              >
                <ShieldCheck size={14} /> Privacidade
              </button>
              <button
                onClick={() => onOpenLegal('terms')}
                className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-xs font-medium w-fit"
              >
                <FileText size={14} /> Termos de Uso
              </button>
              <button
                onClick={() => onOpenLegal('data')}
                className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-xs font-medium w-fit"
              >
                <Lock size={14} /> Dados Pessoais
              </button>
            </div>
          </div>
        </div>

        {/* 3. SHARE BUTTON (Call to Action) */}
        <button
          onClick={handleShareApp}
          className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 flex items-center justify-between group transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="bg-orange-500/20 p-2 rounded-lg text-orange-500">
              <Share2 size={18} />
            </div>
            <div className="text-left">
              <span className="block text-slate-900 dark:text-white text-xs font-bold">Partilhar Resolve.AO</span>
              <span className="block text-slate-500 text-[10px] font-medium">Ajuda alguém que anda à procura de oportunidades</span>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-600 group-hover:text-white transition-colors" />
        </button>

        {/* 4. COPYRIGHT (Simplificado) */}
        <div className="pt-6 border-t border-orange-500/10 flex flex-col md:flex-row justify-center md:justify-start items-center gap-4">
          <div className="space-y-1 text-center md:text-left">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              © 2026 Resolve.AO. Feito em Angola.
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
};
