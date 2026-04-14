import React from 'react';
import { Quote, Star, CheckCircle } from 'lucide-react';

export const Testimonials: React.FC = () => {
  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-slate-50 dark:bg-slate-900/60 border border-orange-500/10 p-6 md:p-12">
      <div className="text-center mb-8">
        <p className="text-[9px] font-black text-brand-gold uppercase tracking-[0.25em] mb-2">Histórias Reais</p>
        <h2 className="text-fluid-h2 font-black text-slate-900 dark:text-white uppercase tracking-tight">
          O que dizem os nossos <span className="text-brand-gold">utilizadores</span>
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            quote: 'Consegui o meu emprego em 3 dias após ver a vaga aqui. Nunca pensei que fosse tão fácil.',
            name: 'Carlos M.',
            city: 'Luanda',
            role: 'Engenheiro Civil',
            stars: 5,
          },
          {
            quote: 'Poupei mais de 15 000 Kz por semana só por acompanhar a taxa informal pelo app.',
            name: 'Ana F.',
            city: 'Benguela',
            role: 'Empresária',
            stars: 5,
          },
          {
            quote: 'O CV que criei aqui com a IA foi o que me fez passar na entrevista. Recomendo a todos.',
            name: 'Pedro S.',
            city: 'Huambo',
            role: 'Técnico de TI',
            stars: 5,
          },
        ].map((t) => (
          <div key={t.name} className="bg-white dark:bg-slate-800/80 rounded-[1.5rem] p-6 border border-orange-500/10 shadow-sm hover:shadow-md transition-all">
            <Quote size={20} className="text-brand-gold mb-4 opacity-60" />
            <p className="text-[12px] font-medium text-slate-700 dark:text-slate-300 leading-relaxed mb-5 italic">&ldquo;{t.quote}&rdquo;</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wide">{t.name}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t.role} · {t.city}</p>
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} size={12} className="fill-brand-gold text-brand-gold" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 border-t border-orange-500/10">
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
          <CheckCircle size={16} className="text-green-400" /> Acesso gratuito imediato
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
          <CheckCircle size={16} className="text-green-400" /> Sem cartão de crédito
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
          <CheckCircle size={16} className="text-green-400" /> Cancela quando quiseres
        </div>
      </div>
    </div>
  );
};
