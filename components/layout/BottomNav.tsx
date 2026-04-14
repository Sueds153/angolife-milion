import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Briefcase, DollarSign, Newspaper, FileText } from 'lucide-react';

interface BottomNavProps {
  showStickyAd: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ showStickyAd }) => {
  const navItems = [
    { id: 'home', label: 'Início', icon: Home, path: '/' },
    { id: 'jobs', label: 'Vagas', icon: Briefcase, path: '/vagas' },
    { id: 'cv-builder', label: 'CV', icon: FileText, path: '/cv-criador' },
    { id: 'exchange', label: 'Câmbio', icon: DollarSign, path: '/cambio' },
    { id: 'news', label: 'Notícias', icon: Newspaper, path: '/noticias' },
  ];

  return (
    <nav
      className={`fixed ${showStickyAd ? 'bottom-[55px]' : 'bottom-0'} left-0 right-0 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-orange-500/10 z-[120] pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.1)] print:hidden transition-all duration-200`}
    >
      <div className="flex justify-around items-center px-1 py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className={({ isActive }) => `
              flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl mx-0.5 transition-all duration-200 active:scale-90 active:bg-orange-500/10
              ${isActive ? 'text-orange-500' : 'text-slate-500 dark:text-slate-400'}
            `}
          >
            {({ isActive }) => (
              <>
                <div className={`relative transition-transform duration-200 ${isActive ? '-translate-y-0.5' : ''}`}>
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  {isActive && (
                    <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-orange-500 rounded-full" />
                  )}
                </div>
                <span className={`text-[8px] xs:text-[9px] font-black uppercase tracking-tighter mt-1 leading-none transition-all duration-200 ${isActive ? 'opacity-100' : 'opacity-50'}`}>
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-orange-500 rounded-full" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
