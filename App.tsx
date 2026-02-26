
import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Background } from './components/Background';
import { HomePage } from './pages/HomePage';
import { JobsPage } from './pages/JobsPage';
import { ExchangePage } from './pages/ExchangePage';
import { DealsPage } from './pages/DealsPage';
import { NewsPage } from './pages/NewsPage';
import { AdminPage } from './pages/AdminPage';
import { ProfilePage } from './pages/ProfilePage';
import { CVBuilderPage } from './pages/CVBuilderPage'; // Importado
import { DealDetailPage } from './pages/DealDetailPage';
import { AdBanner } from './components/AdBanner';
import { InterstitialAd, RewardedAd } from './components/AdOverlays';
import { AuthModal } from './components/AuthModal';
import { NotificationToast } from './components/NotificationToast';
import { NotificationService } from './services/notificationService';
import { SupabaseService } from './services/supabaseService';
import { UserProfile, AppNotification, ProductDeal } from './types';
import { Home, Briefcase, DollarSign, Tag, Newspaper, FileText, ShieldCheck } from 'lucide-react'; // Added FileText, ShieldCheck
import { LegalModals } from './components/LegalModals';

type Page = 'home' | 'jobs' | 'exchange' | 'deals' | 'news' | 'admin' | 'profile' | 'cv-builder';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedDeal, setSelectedDeal] = useState<ProductDeal | null>(null);

  // User Data
  const [user, setUser] = useState<UserProfile | null>(null);

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [showAuthModal, setShowAuthModal] = useState<'login' | 'register' | null>(null);
  const [showRewardAd, setShowRewardAd] = useState(false);
  const [rewardCallback, setRewardCallback] = useState<(() => void) | null>(null);

  // Theme Toggle
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  // Check system preference on load
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Navigation Handler
  const navigateTo = (page: string) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  // Auth Listener
  useEffect(() => {
    const fetchProfile = async (sessionUser: any) => {
      if (!sessionUser) {
        setUser(null);
        setIsAuthenticated(false);
        setIsAuthLoading(false);
        return;
      }

      const { data, error } = await SupabaseService.auth.getProfile(sessionUser.id);

      if (data && !error) {
        setUser({
          id: sessionUser.id,
          email: data.email,
          referralCount: data.referral_count || 0,
          isPremium: data.is_premium || false,
          referralCode: `ANGO-${data.id.substring(0, 6).toUpperCase()}`,
          isAdmin: data.is_admin || sessionUser.email === 'suedjosue@gmail.com', // Stronger fallback
          cvCredits: data.cv_credits || 0,
          fullName: data.full_name,
          phone: data.phone,
          location: data.location,
          savedJobs: data.saved_jobs || [],
          applicationHistory: data.application_history || [],
          cvHistory: data.cv_history || [],
          accountType: data.account_type || 'free',
        });
        setIsAuthenticated(true);
      } else {
        // Fallback or error handling
        console.error("Error fetching profile:", error);
        // Create emergency fallback based on auth
        setUser({
          id: sessionUser.id,
          email: sessionUser.email,
          referralCount: 0,
          isPremium: false,
          referralCode: `ANGO-${sessionUser.id.substring(0, 6).toUpperCase()}`,
          isAdmin: sessionUser.email === 'suedjosue@gmail.com',
          cvCredits: 0,
        });
        setIsAuthenticated(true);
      }
      setIsAuthLoading(false);
    };

    const { data: { subscription } } = SupabaseService.auth.onAuthStateChange(
      (event, session) => {
        fetchProfile(session?.user);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await SupabaseService.auth.signOut();
    setIsAuthenticated(false);
    setUser(null);
    navigateTo('home');
  };

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const [showInterstitial, setShowInterstitial] = useState(false);
  const [interstitialDuration, setInterstitialDuration] = useState(5);
  const [interstitialCallback, setInterstitialCallback] = useState<(() => void) | null>(null);
  const [onAdCancel, setOnAdCancel] = useState<(() => void) | null>(null);
  const [lastInterstitialTime, setLastInterstitialTime] = useState(0);
  const [subscribedCategories, setSubscribedCategories] = useState<string[]>([]);

  // Simulação de Push Notification (Demo)
  useEffect(() => {
    const simulatePush = () => {
      const isJob = Math.random() > 0.6;
      let mockNotification: AppNotification;

      if (isJob) {
        const category = subscribedCategories.length > 0
          ? subscribedCategories[Math.floor(Math.random() * subscribedCategories.length)]
          : 'Premium';

        mockNotification = {
          id: Date.now().toString(),
          title: `Nova Vaga: ${category}`,
          message: `Há uma nova oportunidade para ${category} em Luanda. Candidata-te já!`,
          type: 'job',
          timestamp: Date.now()
        };
      } else {
        mockNotification = {
          id: Date.now().toString(),
          title: 'Alerta de Câmbio',
          message: 'O Dólar teve uma ligeira queda no mercado informal. Melhor hora para comprar!',
          type: 'market',
          timestamp: Date.now()
        };
      }

      setActiveNotification(mockNotification);
      NotificationService.sendNativeNotification(mockNotification.title, mockNotification.message);
    };

    const timer = setTimeout(simulatePush, 12000); // Slightly longer for better UX
    return () => clearTimeout(timer);
  }, [subscribedCategories]);

  const [showRewarded, setShowRewarded] = useState(false);
  const [pendingAdPage, setPendingAdPage] = useState<Page>('home');
  // const [rewardCallback, setRewardCallback] = useState<(() => void) | null>(null); // This was already defined above

  // Notification State
  const [activeNotification, setActiveNotification] = useState<AppNotification | null>(null);

  // Legal Modals State
  const [showLegalModal, setShowLegalModal] = useState<boolean>(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | 'data'>('terms');

  const openLegalModal = (type: 'privacy' | 'terms' | 'data') => {
    setLegalModalType(type);
    setShowLegalModal(true);
  };


  const handleLoginSuccess = (email: string) => {
    // With real auth, the onAuthStateChange listener will detect the login 
    // and automatically fetch the profile and update the state.
    // So we just close the modal here.
    setIsAuthModalOpen(false);
  };

  const handleUpgradeToPremium = (plan: 'pack3' | 'monthly' | 'yearly') => {
    if (!user) return;

    let updatedUser = { ...user };
    const now = Date.now();

    if (plan === 'pack3') {
      updatedUser.cvCredits = (updatedUser.cvCredits || 0) + 3;
    } else if (plan === 'monthly') {
      updatedUser.isPremium = true;
      updatedUser.subscriptionType = 'monthly';
      updatedUser.premiumExpiry = now + (30 * 24 * 60 * 60 * 1000); // 30 days
    } else if (plan === 'yearly') {
      updatedUser.isPremium = true;
      updatedUser.subscriptionType = 'yearly';
      updatedUser.premiumExpiry = now + (365 * 24 * 60 * 60 * 1000); // 365 days
    }

    setUser(updatedUser);
    // In a real app, save to backend here
  };

  const handleNavigate = (page: Page) => {
    if (page !== currentPage) setSelectedDeal(null); // Limpa detalhe ao mudar de aba
    if (page === currentPage) return;
    const highValueTransitions = ['jobs', 'exchange', 'news', 'deals', 'cv-builder'];
    const shouldShowAd = !(user?.isPremium || user?.isAdmin) && highValueTransitions.includes(page) && Math.random() > 0.6;

    if (shouldShowAd) {
      setPendingAdPage(page);
      setInterstitialDuration(5);
      setShowInterstitial(true);
    } else {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNotificationClick = () => {
    if (activeNotification?.type === 'job') handleNavigate('jobs');
    if (activeNotification?.type === 'market') handleNavigate('exchange');
    setActiveNotification(null);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <HomePage onNavigate={handleNavigate} />;
      case 'jobs': return <JobsPage
        isAuthenticated={!!user}
        isAdmin={user?.isAdmin}
        onNavigate={handleNavigate}
        onRequireAuth={() => setIsAuthModalOpen(true)}
        onRequestReward={(onSuccess, onCancel) => {
          setRewardCallback(() => onSuccess);
          setOnAdCancel(() => onCancel);
          setShowRewarded(true);
        }}
        onShowInterstitial={(callback) => {
          const now = Date.now();
          const FIVE_MINUTES = 5 * 60 * 1000;

          if (now - lastInterstitialTime < FIVE_MINUTES) {
            // Capping: Skip ad and execute action immediately
            callback();
          } else {
            // Show Ad
            setInterstitialDuration(7); // Reduced duration for better UX
            setInterstitialCallback(() => callback);
            setShowInterstitial(true);
          }
        }}
        subscribedCategories={subscribedCategories}
        onToggleSubscription={(cat) => {
          setSubscribedCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
          );
        }}
      />;
      case 'exchange': return <ExchangePage isAuthenticated={!!user} userEmail={user?.email} onRequireAuth={() => setIsAuthModalOpen(true)} isDarkMode={isDarkMode} />;
      case 'deals':
        return selectedDeal
          ? <DealDetailPage deal={selectedDeal} onBack={() => setSelectedDeal(null)} user={user} />
          : <DealsPage
            isAuthenticated={!!user}
            user={user}
            onRequireAuth={() => setIsAuthModalOpen(true)}
            onSelectDeal={setSelectedDeal}
            onShowInterstitial={(callback) => {
              setInterstitialDuration(5);
              setInterstitialCallback(() => callback);
              setShowInterstitial(true);
            }}
          />;
      case 'news': return <NewsPage
        isAuthenticated={!!user}
        onRequireAuth={() => setIsAuthModalOpen(true)}
        onRequestReward={(onSuccess) => {
          setRewardCallback(() => onSuccess);
          setOnAdCancel(() => () => { });
          setShowRewarded(true);
        }}
        onShowInterstitial={(callback) => {
          const now = Date.now();
          const FIVE_MINUTES = 5 * 60 * 1000;
          if (now - lastInterstitialTime < FIVE_MINUTES) {
            callback();
          } else {
            setInterstitialDuration(5);
            setInterstitialCallback(() => callback);
            setShowInterstitial(true);
          }
        }}
      />;
      case 'cv-builder': return <CVBuilderPage
        isAuthenticated={!!user}
        userProfile={user || undefined}
        onRequireAuth={() => setIsAuthModalOpen(true)}
        onUpgrade={handleUpgradeToPremium}
        onDecrementCredit={() => user && setUser({ ...user, cvCredits: Math.max(0, user.cvCredits - 1) })}
      />;
      case 'admin': return <AdminPage user={user} onNavigate={handleNavigate} />;
      case 'profile': return user ? <ProfilePage user={user} onLogout={handleLogout} onUpdateUser={(updates) => setUser({ ...user, ...updates })} /> : <HomePage onNavigate={handleNavigate} />;
      default: return <HomePage onNavigate={handleNavigate} />;
    }
  };

  const showStickyAd = !(user?.isPremium || user?.isAdmin);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex justify-center overflow-x-hidden text-slate-900 dark:text-white transition-colors duration-300 print:bg-white print:text-black">
      <div className="print:hidden"><Background /></div>

      {/* App Shell - Optimized for all screens */}
      <div className="w-full lg:max-w-7xl xl:max-w-screen-2xl mx-auto print:max-w-none bg-white dark:bg-slate-900 min-h-screen shadow-2xl md:shadow-none print:shadow-none flex flex-col relative text-slate-900 dark:text-white transition-all duration-500">

        {activeNotification && (
          <NotificationToast
            notification={activeNotification}
            onClose={() => setActiveNotification(null)}
            onOpen={handleNotificationClick}
          />
        )}

        <Navbar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
          isAuthenticated={!!user}
          isAdmin={user?.isAdmin || false}
          onOpenAuth={(mode) => { setAuthMode(mode); setIsAuthModalOpen(true); }}
          onLogout={() => setUser(null)}
          onOpenLegal={openLegalModal}
        />

        <main className="flex-grow flex flex-col pt-safe">
          <div className="flex-grow container-responsive py-6 animate-fade-in print:p-0">
            {renderPage()}
          </div>

          <div className="print:hidden"><Footer onNavigate={handleNavigate} onOpenLegal={openLegalModal} /></div>

          {/* Spacer for mobile bottom navigation */}
          <div className={`${showStickyAd ? 'h-[110px]' : 'h-[75px]'} bg-transparent md:hidden lg:hidden print:hidden`}></div>
        </main>

        {/* Mobile Bottom Navigation - Fluid but capped for large mobile */}
        <nav
          className={`fixed bottom-0 left-1/2 -translate-x-1/2 md:hidden w-full max-w-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-orange-500/10 z-[120] flex justify-around items-center px-4 py-3 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.1)] print:hidden ${showStickyAd ? 'mb-[50px]' : 'mb-0'}`}
        >
          {[
            { id: 'home', label: 'Início', icon: Home },
            { id: 'jobs', label: 'Vagas', icon: Briefcase },
            { id: 'cv-builder', label: 'CV', icon: FileText },
            { id: 'exchange', label: 'Câmbio', icon: DollarSign },
            { id: 'deals', label: 'Ofertas', icon: Tag },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id as Page)}
              className={`flex flex-col items-center justify-center min-w-[60px] py-1 transition-all active:scale-95 ${currentPage === item.id ? 'text-orange-500' : 'text-slate-500 dark:text-slate-400 opacity-70 hover:opacity-100'}`}
            >
              <item.icon size={22} strokeWidth={currentPage === item.id ? 2.5 : 2} />
              <span className={`text-[9px] font-black uppercase tracking-tighter mt-1 transition-opacity ${currentPage === item.id ? 'opacity-100' : 'opacity-60'}`}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        {showStickyAd && (
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 md:hidden w-full max-w-lg z-[110] bg-white dark:bg-black border-t border-orange-500/10 shadow-2xl print:hidden">
            <div className="pb-safe">
              <AdBanner format="sticky-footer" />
            </div>
          </div>
        )}
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLoginSuccess}
        initialMode={authMode}
        onOpenLegal={openLegalModal}
      />

      {showInterstitial && (
        <InterstitialAd
          duration={interstitialDuration}
          onClose={() => {
            setShowInterstitial(false);
            if (pendingAdPage) {
              setCurrentPage(pendingAdPage);
              window.scrollTo(0, 0);
            }
            if (interstitialCallback) {
              setLastInterstitialTime(Date.now());
              interstitialCallback();
              setInterstitialCallback(null);
            }
          }}
        />
      )}

      {showRewarded && (
        <RewardedAd
          onReward={() => { setShowRewarded(false); rewardCallback?.(); }}
          onClose={() => { setShowRewarded(false); onAdCancel?.(); }}
        />
      )}

      <LegalModals
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
        type={legalModalType}
      />
    </div>
  );
};

export default App;
