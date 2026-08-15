import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Background } from './components/layout/Background';
import { AdBanner } from './components/ads/AdBanner';
import { InterstitialAd, RewardedAd } from './components/ads/AdOverlays';
import { AuthModal } from './components/modals/AuthModal';
import { RecoveryPasswordModal } from './components/modals/RecoveryPasswordModal';
import { NotificationToast } from './components/ui/NotificationToast';
import { NotificationService } from './services/integrations/notificationService';
import { AuthService } from './services/core/auth.service';
import { JobsService } from './services/api/jobs.service';
import { NewsService } from './services/api/news.service';
import type { User } from '@supabase/supabase-js';
import { UserProfile, AppNotification, ProductDeal } from './types';
import { LegalModals } from './components/modals/LegalModals';
import { BottomNav } from './components/layout/BottomNav';
import { ScrollToTop } from './components/layout/ScrollToTop';
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
const VaiJaPage = lazy(() => import('./pages/VaiJaPage').then(m => ({ default: m.VaiJaPage })));
const VaiJaTrajetoPage = lazy(() => import('./pages/VaiJaTrajetoPage').then(m => ({ default: m.VaiJaTrajetoPage })));
const MulticaixaPage = lazy(() => import('./pages/MulticaixaPage').then(m => ({ default: m.MulticaixaPage })));
type Page = 'home' | 'jobs' | 'exchange' | 'deals' | 'news' | 'admin' | 'profile' | 'cv-builder' | 'vaija' | 'multicaixa';

// Emails com privilégio de admin. Configurável via VITE_ADMIN_EMAILS (separado por
// vírgulas); por defeito mantém o antigo owner para não bloquear acesso.
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || 'suedjosue@gmail.com')
  .split(',')
  .map((e: string) => e.trim().toLowerCase())
  .filter(Boolean);
const isAdminEmail = (email?: string | null) => !!email && ADMIN_EMAILS.includes(email.toLowerCase());

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    user, setUser, setIsAuthenticated, setIsAuthLoading,
    isDarkMode,
    isAuthModalOpen, authMode, setAuthModal,
    setPasswordRecovery,
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
    if (path.startsWith('/vaija')) return 'vaija';
    if (path.startsWith('/multicaixa')) return 'multicaixa';
    return 'home';
  };

  const currentPage = getPageFromPath(location.pathname);
  const [selectedDeal, setSelectedDeal] = useState<ProductDeal | null>(null);

  const [rewardCallback, setRewardCallback] = useState<(() => void) | null>(null);

  // Sync Dark Mode with DOM
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Auth Listener & Profile Fetching
  useEffect(() => {
    const fetchProfile = async (sessionUser: User | null) => {
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
            premiumExpiry: profile.premium_expiry ? Number(profile.premium_expiry) : undefined,
            isAdmin: profile.is_admin || isAdminEmail(sessionUser.email),
            referralCount: profile.referral_count,
            accountType: profile.account_type,
            savedJobs: profile.saved_jobs || [],
            applicationHistory: profile.application_history || [],
            referralCode: profile.referral_code,
            phone: profile.phone || undefined,
            location: profile.location || undefined,
            cvHistory: profile.cv_history || [],
            hasReferralDiscount: profile.has_referral_discount || false,
            tipoUtilizador: profile.tipo_utilizador || 'passageiro',
            destinosFrequentes: profile.destinos_frequentes || [],
            avaliacaoMedia: profile.avaliacao_media ?? null,
            passageiroNoShowCount: profile.passageiro_no_show_count || 0,
            contactoEmergencia: profile.contacto_emergencia || undefined,
            pontosGuardiao: profile.pontos_guardiao || 0,
            precisaoReportes: profile.precisao_reportes ?? null,
            badgesMulticaixa: profile.badges_multicaixa || []
          });
          setIsAuthenticated(true);
        } else {
          setUser({
            id: sessionUser.id,
            email: sessionUser.email,
            fullName: sessionUser.email.split('@')[0],
            isAdmin: isAdminEmail(sessionUser.email),
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
      if (_event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setAuthModal, setIsAuthLoading, setIsAuthenticated, setUser, setPasswordRecovery]);

  const [showInterstitial, setShowInterstitial] = useState(false);
  const [interstitialDuration, setInterstitialDuration] = useState(5);
  const [interstitialCallback, setInterstitialCallback] = useState<(() => void) | null>(null);
  const [onAdCancel, setOnAdCancel] = useState<(() => void) | null>(null);
  const [lastInterstitialTime, setLastInterstitialTime] = useState(0);
  const [subscribedCategories, setSubscribedCategories] = useState<string[]>([]);

  // Real-time Update Checker (real: só notifica quando há conteúdo novo)
  useEffect(() => {
    const readSeenIds = (key: string): string[] => {
      try {
        return JSON.parse(localStorage.getItem(key) || '[]') as string[];
      } catch {
        return [];
      }
    };

    const writeSeenId = (key: string, id: string) => {
      const seen = readSeenIds(key);
      if (!seen.includes(id)) {
        seen.unshift(id);
        localStorage.setItem(key, JSON.stringify(seen.slice(0, 20)));
      }
    };

    const checkForUpdates = async () => {
      try {
        const [jobs, news] = await Promise.all([
          JobsService.getJobs(false, { limit: 1 }),
          NewsService.getNews(false, { limit: 1 })
        ]);

        const latestJob = jobs.length > 0 ? jobs[0] : null;
        const latestNews = news.length > 0 ? news[0] : null;

        let notification: AppNotification | null = null;

        if (latestJob && !readSeenIds('seen_jobs_ids').includes(latestJob.id)) {
          notification = {
            id: `job-${latestJob.id}-${Date.now()}`,
            title: `Nova Vaga: ${latestJob.title}`,
            message: `Oportunidade em ${latestJob.company} (${latestJob.location}). Candidata-te já!`,
            type: 'job',
            timestamp: Date.now()
          };
          writeSeenId('seen_jobs_ids', latestJob.id);
        } else if (latestNews && !readSeenIds('seen_news_ids').includes(latestNews.id)) {
          notification = {
            id: `news-${latestNews.id}-${Date.now()}`,
            title: latestNews.title,
            message: latestNews.summary,
            type: 'market',
            timestamp: Date.now()
          };
          writeSeenId('seen_news_ids', latestNews.id);
        }

        if (notification) {
          addNotification(notification);
          NotificationService.sendNativeNotification(notification.title, notification.message, user?.id);
        }
      } catch (err) {
        console.error("Update checker error:", err);
      }
    };

    // Primeira verificação marca o estado atual como visto (sem notificar conteúdo antigo)
    const bootstrap = async () => {
      try {
        const [jobs, news] = await Promise.all([
          JobsService.getJobs(false, { limit: 1 }),
          NewsService.getNews(false, { limit: 1 })
        ]);
        if (jobs[0] && readSeenIds('seen_jobs_ids').length === 0) {
          writeSeenId('seen_jobs_ids', jobs[0].id);
        }
        if (news[0] && readSeenIds('seen_news_ids').length === 0) {
          writeSeenId('seen_news_ids', news[0].id);
        }
      } catch (err) {
        console.error("Update checker bootstrap error:", err);
      }
    };

    bootstrap();
    const interval = setInterval(checkForUpdates, 180000);
    return () => clearInterval(interval);
  }, [subscribedCategories, addNotification, user?.id]);

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
    <div className="min-h-dvh bg-white dark:bg-slate-900 flex justify-center text-slate-900 dark:text-white transition-colors duration-300 print:bg-white print:text-black">
      <div className="print:hidden"><Background /></div>

      <div className="w-full lg:max-w-7xl xl:max-w-screen-2xl mx-auto print:max-w-none bg-white dark:bg-slate-900 min-h-dvh flex flex-col relative text-slate-900 dark:text-white transition-all duration-500">

        {notifications.map(n => (
          <NotificationToast
            key={n.id}
            notification={n}
            onClose={() => removeNotification(n.id)}
            onOpen={() => handleNotificationClick(n)}
          />
        ))}

        <ScrollToTop />
        <OnboardingModal />

        <Navbar />

        <main className="flex-grow flex flex-col pt-safe">
          <div className="flex-grow container py-6 animate-fade-in print:p-0">
            <Suspense fallback={
              <div className="flex-grow flex items-center justify-center min-h-[50vh]">
                <div className="w-12 h-12 border-4 border-brand-gold/20 border-t-brand-gold rounded-full animate-spin"></div>
              </div>
            }>
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
              <Route path="/vaija" element={<VaiJaPage />} />
              <Route path="/vaija/trajeto/:id" element={<VaiJaTrajetoPage />} />
              <Route path="/multicaixa" element={<MulticaixaPage />} />
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

      <RecoveryPasswordModal />

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
