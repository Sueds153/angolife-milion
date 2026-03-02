import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate, NavLink } from 'react-router-dom';
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
import { CVBuilderPage } from './pages/CVBuilderPage';
import { DealDetailPage } from './pages/DealDetailPage';
import { AdBanner } from './components/AdBanner';
import { InterstitialAd, RewardedAd } from './components/AdOverlays';
import { AuthModal } from './components/AuthModal';
import { NotificationToast } from './components/NotificationToast';
import { NotificationService } from './services/notificationService';
import { AuthService } from './services/auth.service';
import { JobsService } from './services/jobs.service';
import { NewsService } from './services/news.service';
import { DealsService } from './services/deals.service';
import { UserProfile, AppNotification, ProductDeal } from './types';
import { Home, Briefcase, DollarSign, Tag, Newspaper, FileText } from 'lucide-react';
import { LegalModals } from './components/LegalModals';
import { useAppStore } from './store/useAppStore';

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

  const [showRewardAd, setShowRewardAd] = useState(false);
  const [rewardCallback, setRewardCallback] = useState<(() => void) | null>(null);

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
            cvCredits: profile.cv_credits,
            isPremium: profile.is_premium,
            isAdmin: profile.is_admin || sessionUser.email === 'suedjosue@gmail.com',
            referralCount: profile.referral_count,
            accountType: profile.account_type,
            savedJobs: profile.saved_jobs || [],
            applicationHistory: profile.application_history || [],
            referralCode: profile.referral_code
          });
          setIsAuthenticated(true);
        } else {
          setUser({
            id: sessionUser.id,
            email: sessionUser.email,
            fullName: sessionUser.email.split('@')[0],
            isAdmin: sessionUser.email === 'suedjosue@gmail.com',
            isPremium: false,
            cvCredits: 0,
            referralCount: 0,
            accountType: 'free'
          } as UserProfile);
          setIsAuthenticated(true);
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

  // Real-time Update Checker (simplified to use Store)
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const [jobs, news] = await Promise.all([
          JobsService.getJobs(false),
          NewsService.getNews(false)
        ]);

        const isJob = Math.random() > 0.5;
        let mockNotification: AppNotification | null = null;

        if (isJob && jobs.length > 0) {
          const latestJob = jobs[0];
          mockNotification = {
            id: latestJob.id,
            title: `Nova Vaga: ${latestJob.title}`,
            message: `Oportunidade em ${latestJob.company} (${latestJob.location}). Candidata-te já!`,
            type: 'job',
            timestamp: Date.now()
          };
        } else if (news.length > 0) {
          const latestNews = news[0];
          mockNotification = {
            id: latestNews.id,
            title: latestNews.title,
            message: latestNews.summary,
            type: 'market',
            timestamp: Date.now()
          };
        }

        if (mockNotification) {
          addNotification(mockNotification);
          NotificationService.sendNativeNotification(mockNotification.title, mockNotification.message);
        }
      } catch (err) {
        console.error("Update checker error:", err);
      }
    };

    const interval = setInterval(checkForUpdates, 180000);
    return () => clearInterval(interval);
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
    const shouldShowAd = !(user?.isPremium || user?.isAdmin) && highValueTransitions.includes(page) && Math.random() > 0.6;

    if (shouldShowAd) {
      setPendingAdPage(page);
      setInterstitialDuration(5);
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
    <div className="min-h-screen bg-white dark:bg-slate-900 flex justify-center overflow-x-hidden text-slate-900 dark:text-white transition-colors duration-300 print:bg-white print:text-black">
      <div className="print:hidden"><Background /></div>

      <div className="w-full lg:max-w-7xl xl:max-w-screen-2xl mx-auto print:max-w-none bg-white dark:bg-slate-900 min-h-screen shadow-2xl md:shadow-none print:shadow-none flex flex-col relative text-slate-900 dark:text-white transition-all duration-500">

        {notifications.map(n => (
          <NotificationToast
            key={n.id}
            notification={n}
            onClose={() => removeNotification(n.id)}
            onOpen={() => handleNotificationClick(n)}
          />
        ))}

        <Navbar />

        <main className="flex-grow flex flex-col pt-safe">
          <div className="flex-grow container py-6 animate-fade-in print:p-0">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/vagas" element={
                <JobsPage
                  onRequestReward={(onSuccess, onCancel) => {
                    setRewardCallback(() => onSuccess);
                    setOnAdCancel(() => onCancel);
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
          </div>

          <div className="print:hidden"><Footer onOpenLegal={openLegalModal} /></div>

          <div className={`${showStickyAd ? 'h-[110px]' : 'h-[75px]'} bg-transparent md:hidden lg:hidden print:hidden`}></div>
        </main>

        {/* Mobile Nav */}
        <nav className={`fixed bottom-0 left-1/2 -translate-x-1/2 md:hidden w-full max-w-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-orange-500/10 z-[120] flex justify-around items-center px-4 py-3 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.1)] print:hidden ${showStickyAd ? 'mb-[50px]' : 'mb-0'}`}>
          {[
            { id: 'home', label: 'Início', icon: Home, path: '/' },
            { id: 'jobs', label: 'Vagas', icon: Briefcase, path: '/vagas' },
            { id: 'cv-builder', label: 'CV', icon: FileText, path: '/cv-criador' },
            { id: 'exchange', label: 'Câmbio', icon: DollarSign, path: '/cambio' },
            { id: 'deals', label: 'Ofertas', icon: Tag, path: '/ofertas' },
          ].map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className={({ isActive }) => `flex flex-col items-center justify-center min-w-[60px] py-1 transition-all active:scale-95 ${isActive ? 'text-orange-500' : 'text-slate-500 dark:text-slate-400 opacity-70 hover:opacity-100'}`}
            >
              {({ isActive }) => (
                <>
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  <span className={`text-[9px] font-black uppercase tracking-tighter mt-1 transition-opacity ${isActive ? 'opacity-100' : 'opacity-60'}`}>{item.label}</span>
                </>
              )}
            </NavLink>
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
