
import React from 'react';
import { Share2, ShieldCheck, FileText, ChevronRight, Lock } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: any) => void;
  onOpenLegal: (type: 'privacy' | 'terms' | 'data') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenLegal }) => {
  const handleShareApp = async () => {
    const shareData = {
      title: 'Angolife Su-Golden',
      text: 'Descubra o Angolife: A plataforma de elite para Câmbio, Empregos e Negócios em Angola.',
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
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="max-w-md mx-auto relative z-10 flex flex-col gap-10">

        {/* 1. BRANDING SECTION */}
        <div className="space-y-5">
          <div className="flex flex-col items-start gap-1 select-none">
            <span className="text-[9px] font-black tracking-[0.3em] text-orange-500 uppercase border-b border-orange-500/50 pb-1 mb-1">
              SU-GOLDEN
            </span>
            <span className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none">
              ANGO<span className="text-slate-400 dark:text-slate-600">LIFE</span>
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium leading-relaxed max-w-[280px]">
            Liderança, transparência e inteligência de mercado. A sua fonte definitiva para economia e negócios de alto padrão em Angola.
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
              <button onClick={() => onNavigate('exchange')} className="group flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-xs font-bold w-fit">
                <ChevronRight size={12} className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" /> Câmbio Real
              </button>
              <button onClick={() => onNavigate('jobs')} className="group flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-xs font-bold w-fit">
                <ChevronRight size={12} className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" /> Oportunidades
              </button>
              <button onClick={() => onNavigate('deals')} className="group flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-xs font-bold w-fit">
                <ChevronRight size={12} className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" /> Descontos
              </button>
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
              <span className="block text-white text-xs font-black uppercase tracking-wide">Partilhar Angolife</span>
              <span className="block text-slate-500 text-[10px] font-bold">Convide amigos e ganhe estatuto</span>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-600 group-hover:text-white transition-colors" />
        </button>

        {/* 4. COPYRIGHT (Simplificado) */}
        <div className="pt-6 border-t border-orange-500/10 flex flex-col md:flex-row justify-center md:justify-start items-center gap-4">
          <div className="space-y-1 text-center md:text-left">
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">
              © 2024 ANGOLIFE BY SU-GOLDEN.
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
};
