import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Briefcase, FileText, Newspaper, Tag, Users, ArrowRight } from 'lucide-react';

export const FeatureShowcase: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div>
      <div className="text-center mb-8">
        <p className="text-[9px] font-black text-brand-gold uppercase tracking-[0.25em] mb-2">Tudo num só lugar</p>
        <h2 className="text-fluid-h2 font-black text-slate-900 dark:text-white uppercase tracking-tight">
          O que podes fazer <span className="text-brand-gold">agora</span>
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            icon: DollarSign,
            label: 'Câmbio em Tempo Real',
            desc: 'Acompanha a taxa formal e informal ao minuto. Compra ou vende divisas com segurança.',
            cta: 'Ver taxas agora',
            path: '/cambio',
            badge: 'AO VIVO',
            highlight: true,
          },
          {
            icon: Briefcase,
            label: 'Vagas de Elite',
            desc: 'As melhores ofertas de emprego em Angola, de Luanda a todas as províncias.',
            cta: 'Explorar vagas',
            path: '/vagas',
            badge: 'NOVO',
            highlight: false,
          },
          {
            icon: FileText,
            label: 'Criar CV com IA',
            desc: 'Cria um CV profissional em minutos com a ajuda da nossa inteligência artificial.',
            cta: 'Criar o meu CV',
            path: '/cv-criador',
            badge: 'INTELIGÊNCIA',
            highlight: false,
          },
          {
            icon: Newspaper,
            label: 'Notícias Angola',
            desc: 'Fica a par do que acontece em Angola antes de toda a gente.',
            cta: 'Ler notícias',
            path: '/noticias',
            badge: 'HOJE',
            highlight: false,
          },
          {
            icon: Tag,
            label: 'Descontos Exclusivos',
            desc: 'Promoções e ofertas das melhores marcas e lojas de Angola — por tempo limitado.',
            cta: 'Ver promoções',
            path: '/ofertas',
            badge: 'LIMITADO',
            highlight: false,
          },
          {
            icon: Users,
            label: 'Comunidade Elite',
            desc: 'Faz parte da rede exclusiva de angolanos que lideram o mercado nacional.',
            cta: 'Criar conta grátis',
            path: '/perfil',
            badge: 'GRÁTIS',
            highlight: false,
          },
        ].map((feature) => (
          <div
            key={feature.path}
            onClick={() => navigate(feature.path)}
            className={`group relative cursor-pointer rounded-[2rem] p-6 border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl active:scale-95 ${
              feature.highlight
                ? 'bg-slate-900 dark:bg-black border-brand-gold/30 shadow-xl shadow-amber-500/10'
                : 'bg-white dark:bg-slate-900 border-orange-500/10 hover:border-brand-gold/30 shadow-lg'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:rotate-12 ${
                feature.highlight ? 'bg-brand-gold text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'bg-brand-gold/10 text-brand-gold'
              }`}>
                <feature.icon size={22} />
              </div>
              <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                feature.highlight
                  ? 'border-brand-gold/40 text-brand-gold bg-brand-gold/10'
                  : 'border-orange-500/20 text-orange-400 bg-orange-500/5'
              }`}>
                {feature.badge}
              </span>
            </div>
            <h3 className={`text-sm font-black uppercase tracking-tight mb-2 ${
              feature.highlight ? 'text-white' : 'text-slate-900 dark:text-white'
            }`}>{feature.label}</h3>
            <p className={`text-[11px] font-medium leading-relaxed mb-4 ${
              feature.highlight ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'
            }`}>{feature.desc}</p>
            <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${
              feature.highlight ? 'text-brand-gold' : 'text-orange-500'
            } group-hover:gap-3 transition-all`}>
              {feature.cta} <ArrowRight size={12} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
