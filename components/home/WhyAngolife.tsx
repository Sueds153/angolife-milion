import React from 'react';
import { TrendingUp, Zap, Shield } from 'lucide-react';

export const WhyAngolife: React.FC = () => {
  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-white dark:bg-slate-900 border border-orange-500/10 shadow-xl p-6 md:p-12">
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
      <div className="relative z-10">
        <p className="text-[9px] font-black text-brand-gold uppercase tracking-[0.25em] mb-3">A Tua Plataforma de Confiança</p>
        <h2 className="text-fluid-h2 font-black text-slate-900 dark:text-white uppercase tracking-tight mb-8">
          Por que <span className="text-brand-gold">milhares</span> escolhem a Angolife?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          {[
            { icon: TrendingUp, title: '#1 em Angola', desc: 'A plataforma de referência para o mercado angolano', color: 'text-brand-gold' },
            { icon: Zap, title: 'Gratuito Para Sempre', desc: 'Acesso completo a câmbio, vagas e notícias sem pagar nada', color: 'text-green-400' },
            { icon: Shield, title: '100% Seguro', desc: 'Os teus dados protegidos com encriptação de nível bancário', color: 'text-blue-400' },
          ].map((item) => (
            <div key={item.title} className="flex flex-col items-start p-5 rounded-[1.5rem] bg-slate-50 dark:bg-white/5 border border-orange-500/10 hover:border-brand-gold/30 transition-all group">
              <div className={`w-12 h-12 rounded-2xl bg-brand-gold/10 flex items-center justify-center mb-4 ${item.color}`}>
                <item.icon size={22} />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">{item.title}</h3>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
