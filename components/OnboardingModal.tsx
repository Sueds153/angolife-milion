import React, { useState, useEffect } from 'react';
import { X, ChevronRight, Briefcase, DollarSign, Newspaper, Sparkles, CheckCircle2 } from 'lucide-react';

export const OnboardingModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('angolife_onboarding_seen');
    if (!hasSeenOnboarding) {
      setTimeout(() => setIsOpen(true), 2000); // Show after 2 seconds
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('angolife_onboarding_seen', 'true');
    setIsOpen(false);
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
    else handleClose();
  };

  if (!isOpen) return null;

  const steps = [
    {
      title: "Bem-vindo ao AngoLife",
      description: "O teu super aplicativo para tudo o que precisas em Angola. Empregos, Câmbio e Notícias num só lugar.",
      icon: <Sparkles className="text-orange-500" size={40} />,
      color: "from-orange-500/20 to-amber-500/20"
    },
    {
      title: "Encontra o teu Emprego",
      description: "Cria o teu CV profissional em minutos e recebe alertas de vagas personalizadas para a tua área.",
      icon: <Briefcase className="text-blue-500" size={40} />,
      color: "from-blue-500/20 to-indigo-500/20"
    },
    {
      title: "Câmbio em Tempo Real",
      description: "Acompanha as taxas de câmbio formal e informal (mercado de rua) atualizadas ao minuto.",
      icon: <DollarSign className="text-green-500" size={40} />,
      color: "from-green-500/20 to-emerald-500/20"
    }
  ];

  const current = steps[step - 1];

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-orange-500/20 animate-slide-up">
        {/* Header Image/Icon Area */}
        <div className={`h-48 bg-gradient-to-br ${current.color} flex items-center justify-center relative`}>
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-xl flex items-center justify-center animate-bounce-slow">
            {current.icon}
          </div>
          <button 
            onClick={handleClose}
            aria-label="Fechar"
            className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/40 rounded-full transition-colors text-slate-800 dark:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-8 text-center">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4 leading-tight">
            {current.title}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed mb-8">
            {current.description}
          </p>

          {/* Step Indicators */}
          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3].map(i => (
              <div 
                key={i} 
                className={`h-1.5 transition-all rounded-full ${i === step ? 'w-8 bg-orange-500' : 'w-2 bg-slate-200 dark:bg-slate-800'}`} 
              />
            ))}
          </div>

          <button 
            onClick={nextStep}
            className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 hover:bg-orange-600 active:scale-95 transition-all"
          >
            {step === 3 ? 'Começar Agora' : 'Próximo'}
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
