import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate, NavLink } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Background } from './components/layout/Background';
import { AdBanner } from './components/ads/AdBanner';
import { InterstitialAd, RewardedAd } from './components/ads/AdOverlays';
import { AuthModal } from './components/modals/AuthModal';
import { NotificationToast } from './components/ui/NotificationToast';
import { NotificationService } from './services/integrations/notificationService';
import { AuthService } from './services/core/auth.service';
import { supabase } from './services/core/supabaseClient';
import { JobsService } from './services/api/jobs.service';
import { NewsService } from './services/api/news.service';
import { DealsService } from './services/api/deals.service';
import { UserProfile, AppNotification, ProductDeal } from './types';
import { Home, Briefcase, DollarSign, Tag, Newspaper, FileText, AlertTriangle } from 'lucide-react';
import { LegalModals } from './components/modals/LegalModals';
import { BottomNav } from './components/layout/BottomNav';
import { useAppStore } from './store/useAppStore';
import { OnboardingModal } from './components/modals/OnboardingModal';

// Lazy loaded pages for performance
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const JobsPage = lazy(() => import('./pages/JobsPage').then(m => ({ default: m.JobsPage })));
const ExchangePage = lazy(() => import('./pages/ExchangePage').then(m => ({ default: m.ExchangePage })));
const DealsPage = lazy(() => import('./pages/DealsPage').then(m => ({ default: m.DealsPage })));
const NewsPage = lazy(() => import('./pages/NewsPage').then(m => ({ default: m.NewsPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const CVBuilderPage = lazy(() => import('./pages/CVBuilderPage').then(m => ({ default: m.CVBuilderPage })));
const DealDetailPage = lazy(() => import('./pages/DealDetailPage').then(m => ({ default: m.DealDetailPage })));
type Page = 'home' | 'jobs' | 'exchange' | 'deals' | 'news' | 'admin' | 'profile' | 'cv-builder';

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    user, setUser, isAuthenticated, setIsAuthenticated, setIsAuthLoading,
    isDarkMode, toggleTheme,
    isAuthModalOpen, authMode, setAuthModal,
    notifications, addNotification, removeNotification
  } = useAppStore();

  const getPageFromPath = (path: string): Page => {
    if (path === '/') return 'home';
    if (path.startsWith('/vagas')) return 'jobs';
    if (path.startsWith('/cambio')) return 'exchange';
    if (path.startsWith('/ofertas')) return 'deals';
    if (path.startsWith('/noticias')) return 'news';
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/perfil')) return 'profile';
    if (path.startsWith('/cv-criador')) return 'cv-builder';
    return 'home';
  };

  const currentPage = getPageFromPath(location.pathname);
  const [selectedDeal, setSelectedDeal] = useState<ProductDeal | null>(null);
  const [isThemeSwitching, setIsThemeSwitching] = useState(false);

  const [showRewardAd, setShowRewardAd] = useState(false);
  const [rewardCallback, setRewardCallback] = useState<(() => void) | null>(null);

  // Sync Dark Mode with DOM
  useEffect(() => {
    const root = document.documentElement;
    setIsThemeSwitching(true);
    
    if (isDarkMode) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }

    const timer = setTimeout(() => setIsThemeSwitching(false), 350);
    return () => clearTimeout(timer);
  }, [isDarkMode]);

  // Auth Listener & Profile Fetching
  useEffect(() => {
    const fetchProfile = async (sessionUser: any) => {
      if (!sessionUser) {
        setUser(null);
        setIsAuthenticated(false);
        setIsAuthLoading(false);
        return;
      }

      try {
        const { data: profile, error } = await AuthService.getProfile(sessionUser.id);
        
        if (profile && !error) {
          setUser({
            id: profile.id,
            email: profile.email,
            fullName: profile.full_name,
            avatarUrl: profile.avatar_url,
            phone: profile.phone,
            location: profile.location,
            cvCredits: profile.cv_credits,
            isPremium: profile.is_premium,
            isAdmin: profile.is_admin,
            referralCount: profile.referral_count,
            accountType: profile.account_type,
            savedJobs: profile.saved_jobs || [],
            applicationHistory: profile.application_history || [],
            cvHistory: profile.cv_history || [],
            hasReferralDiscount: profile.has_referral_discount,
            referralCode: profile.referral_code || profile.id?.substring(0, 8).toUpperCase()
          });
          setIsAuthenticated(true);
        } else {
          setUser({
            id: sessionUser.id,
            email: sessionUser.email,
            fullName: sessionUser.email.split('@')[0],
            isAdmin: false,
            isPremium: false,
            cvCredits: 0,
            referralCount: 0,
            accountType: 'free',
            savedJobs: [],
            applicationHistory: [],
            cvHistory: [],
            hasReferralDiscount: false,
            referralCode: sessionUser.id?.substring(0, 8).toUpperCase() || 'ANGOLIFE'
          } as UserProfile);
          setIsAuthenticated(true);
        }

        // --- EMERGENCY ADMIN BYPASS ---
        const adminEmails = ['suedjosue@gmail.com', 'osuedjosu@gmail.com', 'josuemiguelsued@gmail.com'];
        if (sessionUser?.email && adminEmails.includes(sessionUser.email.toLowerCase())) {
          setUser((prev: any) => prev ? { ...prev, isAdmin: true } : prev);
          console.info("👑 EMERGENCY ADMIN ACTIVE: Control restored for", sessionUser.email);
        }
      } catch (err) {
        console.error("Auth profile fetch error:", err);
      } finally {
        setIsAuthLoading(false);
      }
    };

    const { data: { subscription } } = AuthService.onAuthStateChange((_event, session) => {
      fetchProfile(session?.user ?? null);
      if (_event === 'SIGNED_IN') setAuthModal(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const [showInterstitial, setShowInterstitial] = useState(false);
  const [interstitialDuration, setInterstitialDuration] = useState(5);
  const [interstitialCallback, setInterstitialCallback] = useState<(() => void) | null>(null);
  const [onAdCancel, setOnAdCancel] = useState<(() => void) | null>(null);
  const [lastInterstitialTime, setLastInterstitialTime] = useState(0);
  const [subscribedCategories, setSubscribedCategories] = useState<string[]>([]);

  // Connection Diagnostic
  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    if (!url || url.includes('placeholder')) {
      console.error("❌ CRITICAL: Supabase URL is missing or placeholder!");
      addNotification({
        id: 'db-error',
        title: 'Erro de Ligação',
        message: 'O sistema não conseguiu detetar as chaves do base de dados. Verifique o painel do Vercel.',
        type: 'market',
        timestamp: Date.now()
      });
    } else {
      console.log("✅ Supabase Client Initialized:", url.substring(0, 20) + "...");
    }
  }, []);

  // Real-time Update Checker via Supabase
  useEffect(() => {
    let mockNotification: AppNotification | null = null;
    
    const channel = supabase.channel('public-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'jobs' }, (payload) => {
        const newJob = payload.new;
        if (newJob.status === 'publicado' || newJob.status === 'published') {
          mockNotification = {
            id: newJob.id,
            title: `Nova Vaga: ${newJob.title}`,
            message: `Oportunidade em ${newJob.company} (${newJob.location || ''}). Candidata-te já!`,
            type: 'job',
            timestamp: Date.now()
          };
          addNotification(mockNotification);
          NotificationService.sendNativeNotification(mockNotification.title, mockNotification.message);
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'news_articles' }, (payload) => {
        const newNews = payload.new;
        if (newNews.status === 'publicado' || newNews.status === 'published') {
          mockNotification = {
            id: newNews.id,
            title: newNews.titulo,
            message: newNews.resumo,
            type: 'market',
            timestamp: Date.now()
          };
          addNotification(mockNotification);
          NotificationService.sendNativeNotification(mockNotification.title, mockNotification.message);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [subscribedCategories, addNotification]);

  const [showRewarded, setShowRewarded] = useState(false);
  const [pendingAdPage, setPendingAdPage] = useState<Page>('home');

  // Legal Modals State
  const [showLegalModal, setShowLegalModal] = useState<boolean>(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | 'data'>('terms');

  const openLegalModal = (type: 'privacy' | 'terms' | 'data') => {
    setLegalModalType(type);
    setShowLegalModal(true);
  };

  const handleNavigate = (page: Page) => {
    if (page !== currentPage) setSelectedDeal(null);
    if (page === currentPage) return;
    const highValueTransitions = ['jobs', 'exchange', 'news', 'deals', 'cv-builder'];
    const shouldShowAd = !(user?.isPremium || user?.isAdmin) && 
      highValueTransitions.includes(page) && 
      Math.random() < AD_CONFIG.PAGE_TRANSITION_AD_PROBABILITY;

    if (shouldShowAd) {
      setPendingAdPage(page);
      setInterstitialDuration(AD_CONFIG.INTERSTITIAL_DURATION);
      setShowInterstitial(true);
    } else {
      navigate(page === 'home' ? '/' : `/${page}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNotificationClick = (notification: AppNotification) => {
    if (notification.type === 'job') handleNavigate('jobs');
    if (notification.type === 'market') handleNavigate('exchange');
    removeNotification(notification.id);
  };

  const showStickyAd = !(user?.isPremium || user?.isAdmin);

  return (
    <div className={`min-h-screen overflow-x-hidden bg-white dark:bg-slate-900 flex justify-center text-slate-900 dark:text-white transition-colors duration-200 print:bg-white print:text-black ${isThemeSwitching ? 'theme-switching' : ''}`}>
      {/* Diagnostic Indicator — Apenas visível em erro ou para Admin */}
      {(!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) && (
        <div className="fixed top-0 left-0 w-full bg-red-600 text-white text-[10px] py-1 text-center z-[9999] font-bold uppercase tracking-widest animate-pulse">
           ⚠️ LIGAÇÃO EM FALTA: Configure VITE_ no painel Vercel/Netlify!
        </div>
      )}

      {user?.isAdmin && (
        <div className="fixed bottom-4 left-4 bg-slate-900/80 backdrop-blur-md border border-brand-gold/20 p-2 rounded-lg z-50 text-[10px] text-brand-gold flex items-center gap-2 pointer-events-none">
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
          <span>API: {import.meta.env.VITE_SUPABASE_URL?.substring(0, 20)}...</span>
        </div>
      )}

      <div className="print:hidden"><Background /></div>

      <div className="w-full overflow-x-hidden lg:max-w-7xl xl:max-w-screen-2xl mx-auto print:max-w-none bg-white dark:bg-slate-900 min-h-screen shadow-2xl md:shadow-none print:shadow-none flex flex-col relative text-slate-900 dark:text-white transition-colors duration-200">

        {notifications.map(n => (
          <NotificationToast
            key={n.id}
            notification={n}
            onClose={() => removeNotification(n.id)}
            onOpen={() => handleNotificationClick(n)}
          />
        ))}

        <OnboardingModal />

        <Navbar />

        <main className="flex-grow flex flex-col pt-safe">
          <div className="flex-grow container py-6 animate-fade-in print:p-0">
            <Suspense fallback={
              <div className="flex-grow flex items-center justify-center min-h-[50vh]">
                <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
              </div>
            }>
              <Routes>
              <Route path="/" element={
                <HomePage 
                  onRequestReward={(onSuccess) => {
                    setRewardCallback(() => onSuccess);
                    setOnAdCancel(() => () => {});
                    setShowRewarded(true);
                  }}
                  onShowInterstitial={(callback) => {
                    setInterstitialDuration(AD_CONFIG.INTERSTITIAL_DURATION);
                    setInterstitialCallback(() => callback);
                    setShowInterstitial(true);
                  }}
                />
              } />
              <Route path="/vagas" element={
                <JobsPage
                  onRequestReward={(onSuccess, onCancel) => {
                    setRewardCallback(() => onSuccess);
                    setOnAdCancel(() => onCancel);
                    setShowRewarded(true);
                  }}
                  onShowInterstitial={(callback) => {
                    const now = Date.now();
                    if (now - lastInterstitialTime < AD_CONFIG.INTERSTITIAL_COOLDOWN_MS) {
                      callback();
                    } else {
                      setInterstitialDuration(AD_CONFIG.INTERSTITIAL_DURATION);
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
                />
              } />
              <Route path="/cambio" element={<ExchangePage />} />
              <Route path="/ofertas" element={
                selectedDeal
                  ? <Navigate to={`/ofertas/${selectedDeal.id}`} replace />
                  : <DealsPage
                    onSelectDeal={setSelectedDeal}
                    onShowInterstitial={(callback) => {
                      setInterstitialDuration(5);
                      setInterstitialCallback(() => callback);
                      setShowInterstitial(true);
                    }}
                  />
              } />
              <Route path="/ofertas/:id" element={
                selectedDeal
                  ? <DealDetailPage deal={selectedDeal} onBack={() => setSelectedDeal(null)} />
                  : <Navigate to="/ofertas" replace />
              } />
              <Route path="/noticias" element={
                <NewsPage
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
                />
              } />
              <Route path="/cv-criador" element={<CVBuilderPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/perfil" element={user ? <ProfilePage /> : <Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </Suspense>
          </div>

          <div className="print:hidden"><Footer onOpenLegal={openLegalModal} /></div>
          {/* Spacer: always compensates for the bottom nav + optional sticky ad height on mobile */}
          <div className={`${showStickyAd ? 'h-[140px]' : 'h-[80px]'} md:hidden print:hidden`} />
        </main>

        <BottomNav showStickyAd={showStickyAd} />

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
        onClose={() => setAuthModal(false)}
        initialMode={authMode}
        onOpenLegal={openLegalModal}
      />

      {showInterstitial && (
        <InterstitialAd
          duration={interstitialDuration}
          onClose={() => {
            setShowInterstitial(false);
            if (pendingAdPage) {
              navigate(pendingAdPage === 'home' ? '/' : `/${pendingAdPage}`);
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
