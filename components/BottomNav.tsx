import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Briefcase, DollarSign, Tag, FileText } from 'lucide-react';

interface BottomNavProps {
  showStickyAd: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ showStickyAd }) => {
  const navItems = [
    { id: 'home', label: 'Início', icon: Home, path: '/' },
    { id: 'jobs', label: 'Vagas', icon: Briefcase, path: '/vagas' },
    { id: 'cv-builder', label: 'CV', icon: FileText, path: '/cv-criador' },
    { id: 'exchange', label: 'Câmbio', icon: DollarSign, path: '/cambio' },
    { id: 'deals', label: 'Ofertas', icon: Tag, path: '/ofertas' },
  ];

  return (
    <nav 
      className={`fixed ${showStickyAd ? 'bottom-[55px]' : 'bottom-0'} left-0 right-0 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-orange-500/10 z-[120] pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.1)] print:hidden transition-all duration-300`}
    >
      <div className="flex justify-around items-center px-2 py-3">
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className={({ isActive }) => `
              flex flex-col items-center justify-center min-w-[60px] py-1 transition-all active:scale-90
              ${isActive ? 'text-orange-500' : 'text-slate-500 dark:text-slate-400 opacity-70 hover:opacity-100'}
            `}
          >
            {({ isActive }) => (
              <>
                <div className={`relative transition-transform duration-300 ${isActive ? '-translate-y-1' : ''}`}>
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  {isActive && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse md:hidden" />
                  )}
                </div>
                <span className={`text-[9px] font-black uppercase tracking-tighter mt-1 transition-all duration-300 ${isActive ? 'opacity-100 scale-105' : 'opacity-60 scale-100'}`}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
