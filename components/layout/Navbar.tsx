import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Menu, X, Briefcase, DollarSign, Tag, Newspaper, UserCog, Sun, Moon, Home, LogOut, User, LogIn, UserPlus, FileText, ShieldCheck, Lock } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { AuthService } from '../../services/core/auth.service';

interface NavbarProps {
  onOpenLegal?: (type: 'privacy' | 'terms' | 'data') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenLegal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { 
    user, isAuthenticated, isDarkMode, toggleTheme, setAuthModal 
  } = useAppStore();


  const handleLogout = async () => {
    await AuthService.signOut();
    useAppStore.getState().setUser(null);
    useAppStore.getState().setIsAuthenticated(false);
    navigate('/');
  };

  const isAdmin = user?.isAdmin || false;

  const navItems = [
    { id: 'home', label: 'Início', icon: Home, path: '/' },
    { id: 'jobs', label: 'Empregos', icon: Briefcase, path: '/vagas' },
    { id: 'cv-builder', label: 'Criar CV', icon: FileText, path: '/cv-criador' },
    { id: 'exchange', label: 'Câmbio', icon: DollarSign, path: '/cambio' },
    { id: 'deals', label: 'Descontos', icon: Tag, path: '/ofertas' },
    { id: 'news', label: 'Notícias', icon: Newspaper, path: '/noticias' },
  ];

  if (isAdmin) {
    navItems.push({ id: 'admin', label: 'Admin', icon: UserCog, path: '/admin' });
  }

  return (
    <>
      <nav className="bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white shadow-sm sticky top-0 z-[100] border-b border-orange-500/20 transition-colors duration-200 backdrop-blur-md pt-safe print:hidden">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Brand Section */}
          <Link
            to="/"
            className="flex items-center gap-3 md:gap-4 cursor-pointer select-none group"
            onClick={() => window.scrollTo(0, 0)}
          >
            <div className="flex flex-col items-center">
              <span className="text-[8px] md:text-[11px] font-black tracking-widest text-orange-500 uppercase border-b border-orange-500/50 pb-0.5 leading-none">
                SU-GOLDEN
              </span>
            </div>
            <div className="flex items-center text-lg md:text-2xl font-bold tracking-tighter">
              <h1 className="flex items-center">
                <span className="text-slate-900 dark:text-white">ANGO</span>
                <span className="text-orange-500 ml-0.5">LIFE</span>
              </h1>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) => 
                  `px-3 py-2 rounded-lg flex items-center space-x-2 text-[11px] font-bold uppercase tracking-wider transition-all ${isActive
                  ? 'text-orange-500 bg-slate-200/50 dark:bg-white/5'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/5'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={14} className={isActive ? 'text-orange-500' : 'text-slate-500 dark:text-slate-400'} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}

            <div className="h-5 w-px bg-orange-500/20 mx-3"></div>

            {/* Auth Buttons / Profile */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <NavLink
                  to="/perfil"
                  className={({ isActive }) => 
                    `p-2.5 rounded-full transition-all flex items-center gap-2 border ${isActive
                    ? 'border-orange-500 text-orange-500 bg-orange-500/10'
                    : 'border-orange-500/20 text-slate-500 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-500 hover:bg-slate-200 dark:hover:bg-white/5'
                    }`
                  }
                  title="Meu Perfil"
                >
                  <User size={18} />
                </NavLink>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <button
                  onClick={() => setAuthModal(true, 'login')}
                  className="text-[11px] font-black uppercase tracking-widest px-4 py-2 text-slate-500 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-500 transition-colors"
                >
                  Entrar
                </button>
                <button
                  onClick={() => setAuthModal(true, 'register')}
                  className="text-[11px] font-black uppercase tracking-widest px-5 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-amber-900/10 border border-orange-500/50"
                >
                  Criar conta
                </button>
              </div>
            )}

            <button
              onClick={toggleTheme}
              className="p-2.5 ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-500 dark:text-slate-400"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          {/* Mobile Menu Action Bar */}
          <div className="lg:hidden flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 dark:text-slate-300"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-slate-500 dark:text-slate-300 bg-slate-200 dark:bg-white/5 rounded-lg active:scale-90 transition-transform"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
    </nav>

      {/* Mobile Menu Overlay - Fully Responsive */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 top-[calc(64px+var(--sat))] bg-slate-950/80 backdrop-blur-sm z-[130] animate-fade-in" onClick={() => setIsOpen(false)}>
          <div
            className="bg-white dark:bg-slate-900 w-full shadow-2xl border-t border-orange-500/20 animate-slide-up max-h-[calc(100vh-64px-var(--sat))] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-6 space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) => 
                    `flex items-center space-x-4 w-full px-5 py-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${isActive ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5'}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon size={20} className={isActive ? 'text-orange-500' : 'text-slate-500 dark:text-slate-400'} />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}

              {/* Mobile Auth Section */}
              <div className="pt-6 mt-6 border-t border-orange-500/20 space-y-3">
                {isAuthenticated ? (
                  <>
                    <NavLink
                      to="/perfil"
                      onClick={() => setIsOpen(false)}
                      className={({ isActive }) => 
                        `flex items-center space-x-4 w-full px-5 py-4 rounded-xl text-sm font-black uppercase tracking-widest ${isActive ? 'bg-orange-500/10 text-orange-500' : 'text-slate-500 dark:text-slate-400'}`
                      }
                    >
                      <User size={20} />
                      <span>Meu Perfil</span>
                    </NavLink>
                    <button
                      onClick={() => { handleLogout(); setIsOpen(false); }}
                      className="flex items-center space-x-4 w-full px-5 py-4 rounded-xl text-sm font-black uppercase tracking-widest text-red-400 hover:bg-red-400/5 transition-colors"
                    >
                      <LogOut size={20} />
                      <span>Terminar Sessão</span>
                    </button>
                  </>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    <button
                      onClick={() => { setAuthModal(true, 'login'); setIsOpen(false); }}
                      className="flex items-center justify-center gap-3 w-full py-4 text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white border border-orange-500/20 rounded-2xl bg-slate-100 dark:bg-white/5"
                    >
                      <LogIn size={18} className="text-orange-500" />
                      Entrar
                    </button>
                    <button
                      onClick={() => { setAuthModal(true, 'register'); setIsOpen(false); }}
                      className="flex items-center justify-center gap-3 w-full py-4 text-xs font-black uppercase tracking-widest bg-orange-500 text-white rounded-2xl shadow-xl shadow-amber-900/20 active:scale-95 transition-all"
                    >
                      <UserPlus size={18} />
                      Criar conta
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Legal & Apoio Section */}
              <div className="pt-6 mt-6 border-t border-orange-500/20">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 px-5">Legal & Apoio</h4>
                <div className="space-y-1">
                  <button
                    onClick={() => { onOpenLegal?.('privacy'); setIsOpen(false); }}
                    className="flex items-center space-x-4 w-full px-5 py-3 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5 transition-all"
                  >
                    <ShieldCheck size={18} />
                    <span>Privacidade</span>
                  </button>
                  <button
                    onClick={() => { onOpenLegal?.('terms'); setIsOpen(false); }}
                    className="flex items-center space-x-4 w-full px-5 py-3 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5 transition-all"
                  >
                    <FileText size={18} />
                    <span>Termos de Uso</span>
                  </button>
                  <button
                    onClick={() => { onOpenLegal?.('data'); setIsOpen(false); }}
                    className="flex items-center space-x-4 w-full px-5 py-3 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5 transition-all"
                  >
                    <Lock size={18} />
                    <span>Dados Pessoais</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
