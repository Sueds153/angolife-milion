import React, { useState, useEffect } from 'react';
import { TrendingUp, UserCheck, Megaphone, Briefcase, Gem, Sparkles } from 'lucide-react';

const TICKER_MESSAGES = [
  { icon: TrendingUp, text: 'AO VIVO • 247 pessoas a consultar o câmbio agora', label: 'Câmbio', color: 'from-orange-500 to-red-600' },
  { icon: UserCheck, text: 'João M. acabou de se candidatar a uma vaga em Luanda', label: 'Vagas', color: 'from-blue-500 to-indigo-600' },
  { icon: Megaphone, text: '3 novas notícias publicadas nos últimos 30 minutos', label: 'Notícias', color: 'from-emerald-500 to-teal-600' },
  { icon: Briefcase, text: 'Nova vaga de Diretor Financeiro em Talatona', label: 'Elite', color: 'from-amber-400 to-brand-gold' },
  { icon: Gem, text: 'Taxa USD hoje é a melhor da semana no mercado informal', label: 'Destaque', color: 'from-purple-500 to-pink-600' },
  { icon: Sparkles, text: 'Pedro S. criou o CV e passou na entrevista hoje', label: 'Sucesso', color: 'from-cyan-500 to-blue-600' },
];

export const LiveMarketTicker: React.FC = () => {
  const [tickerIndex, setTickerIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % TICKER_MESSAGES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-premium rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden">
      <div className="flex flex-col md:flex-row items-stretch">
        <div className="flex-1 flex items-center gap-4 p-4 md:p-6 border-b md:border-b-0 md:border-r border-white/5">
          <div className="flex-shrink-0 flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-full animate-pulse-gold">
            <span className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest whitespace-nowrap">AO VIVO</span>
          </div>
          
          <div className="flex-1 overflow-hidden h-8 flex items-center">
            <div
              key={tickerIndex}
              className="flex items-center gap-3 animate-slide-up w-full"
            >
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${TICKER_MESSAGES[tickerIndex].color} flex items-center justify-center text-white shadow-lg`}>
                {React.createElement(TICKER_MESSAGES[tickerIndex].icon as any, { size: 18 })}
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-brand-gold uppercase tracking-widest leading-none mb-1">
                  {TICKER_MESSAGES[tickerIndex].label}
                </span>
                <span className="text-[11px] md:text-xs font-bold text-white uppercase tracking-wide truncate max-w-[200px] md:max-w-none">
                  {TICKER_MESSAGES[tickerIndex].text}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 md:p-6 bg-white/5 overflow-x-auto no-scrollbar scroll-x-touch">
          {TICKER_MESSAGES.map((msg, i) => (
            <button
              key={i}
              onClick={() => setTickerIndex(i)}
              className={`relative flex-shrink-0 group transition-all duration-300 touch-none-min ${i === tickerIndex ? 'scale-110' : 'scale-100 opacity-60 hover:opacity-100'}`}
              aria-label={msg.label}
            >
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full p-1 border-2 transition-all ${i === tickerIndex ? 'border-brand-gold rotate-12 shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'border-white/10 grayscale hover:grayscale-0'}`}>
                <div className={`w-full h-full rounded-full bg-gradient-to-br ${msg.color} flex items-center justify-center text-white shadow-inner`}>
                  {React.createElement(msg.icon as any, { size: 24 })}
                </div>
              </div>
              {i === tickerIndex && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-brand-gold text-[7px] font-black px-1.5 py-0.5 rounded-sm uppercase text-slate-950 shadow-sm animate-bounce">
                  Ler
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
