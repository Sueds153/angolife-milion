import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Briefcase, DollarSign, MessageCircle, Volume2, VolumeX, X, Newspaper, FileText, Tag, Users, Shield, Zap, TrendingUp, Quote } from 'lucide-react';
import { ExchangeService } from '../services/api/exchange.service';
import { DealsService } from '../services/api/deals.service';
import { JobsService } from '../services/api/jobs.service';
import { ExchangeRate, Job, ProductDeal } from '../types';
import { APP_CONFIG } from '../constants/app';
import { PARTNER_ADS } from '../constants/ads';
import { AdBanner } from '../components/ads/AdBanner';
import { AdsService, Ad } from '../services/api/ads.service';
import { AdService } from '../services/api/adService';
import { VideoUtils } from '../services/utils/videoUtils';
import { useAppStore } from '../store/useAppStore';
import { Helmet } from 'react-helmet-async';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { SitePreviewModal } from '../components/modals/SitePreviewModal';

interface HomeBanner {
  mediaType?: string;
  media_type?: string;
  videoUrl?: string;
  video_url?: string;
  imageUrl?: string;
  image_url?: string;
  title?: string;
  companyName?: string;
  company_name?: string;
  duration_seconds?: number;
  is_active?: boolean;
  location?: string;
  format?: string;
  link?: string;
}

const TICKER_MESSAGES = [
  'Câmbio do dia, atualizado várias vezes ao dia',
  'Novas vagas de emprego publicadas todos os dias',
  'Notícias revistas antes de serem publicadas',
  'O preço do dólar na rua, sem inventar',
  'Ofertas e descontos verificados na hora',
  'Feito para quem vive e trabalha em Angola',
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { systemSettings, setSystemSettings, setActiveAds } = useAppStore();
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [featuredDeals, setFeaturedDeals] = useState<ProductDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [tickerIndex, setTickerIndex] = useState(0);
  
  const [ads, setAds] = useState<Ad[]>([]);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [interstitialAd, setInterstitialAd] = useState<Ad | null>(null);
  const [showRewarded, setShowRewarded] = useState(false);
  const [rewardedAd, setRewardedAd] = useState<Ad | null>(null);

  // Site Preview Modal State
  const [showSitePreview, setShowSitePreview] = useState(false);
  const [sitePreviewUrl, setSitePreviewUrl] = useState('');
  const [sitePreviewTitle, setSitePreviewTitle] = useState<string | undefined>();
  const [sitePreviewCompany, setSitePreviewCompany] = useState<string | undefined>();

  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const [adImageIndex, setAdImageIndex] = useState(0);
  const interstitialTimerRef = useRef<number | null>(null);

  const heroBanners: HomeBanner[] = useMemo(() => {
    const filtered = ads.filter(a => a.type === 'hero' && a.is_active && (a.location === 'home' || a.location === 'all') && a.format === 'banner');
    return filtered.length > 0 ? filtered : PARTNER_ADS.heroBanners;
  }, [ads]);
    
  const adBanners: HomeBanner[] = useMemo(() => {
    const filtered = ads.filter(a => a.type === 'partner' && a.is_active && (a.location === 'home' || a.location === 'all') && a.format === 'banner');
    return filtered.length > 0 ? filtered : PARTNER_ADS.partnerBanners.filter(b => b.isActive);
  }, [ads]);

  useEffect(() => {
    const setupBannerRotation = () => {
      if (heroBanners.length === 0 || adBanners.length === 0) return;

      const heroInterval = setInterval(() => {
        setHeroImageIndex((prev) => (prev + 1) % heroBanners.length);
      }, (heroBanners[0]?.duration_seconds || 6) * 1000);

      const adInterval = setInterval(() => {
        setAdImageIndex((prev) => (prev + 1) % adBanners.length);
      }, (adBanners[0]?.duration_seconds || 5) * 1000);

      return () => {
        clearInterval(heroInterval);
        clearInterval(adInterval);
      };
    };

    const cleanup = setupBannerRotation();
    return cleanup;
  }, [heroBanners, adBanners]);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [ratesData, dealsData, jobsData, adsData, settingsData] = await Promise.all([
          ExchangeService.getRates(),
          DealsService.getDeals(false),
          JobsService.getJobs(false, { limit: 4 }),
          AdsService.getAds().catch((err) => {
            console.error('[HomePage] AdsService.getAds failed:', err);
            return [];
          }),
          AdsService.getSettings().catch((err) => {
            console.error('[HomePage] AdsService.getSettings failed:', err);
            return null;
          })
        ]);
        
        setRates(ratesData);
        setFeaturedDeals(dealsData.slice(0, 2));
        setFeaturedJobs(jobsData.slice(0, 3));
        
        if (adsData && adsData.length > 0) {
          setAds(adsData);
          setActiveAds(adsData);

          const interstitial = adsData.find(a => a.is_active && a.format === 'interstitial' && (a.location === 'home' || a.location === 'all'));
          if (interstitial && AdService.canShowInterstitial()) {
            setInterstitialAd(interstitial);
            AdService.recordInterstitialShown();
            interstitialTimerRef.current = window.setTimeout(() => setShowInterstitial(true), 3000);
          }
          
          const rewarded = adsData.find(a => a.is_active && a.format === 'rewarded' && (a.location === 'home' || a.location === 'all'));
          if (rewarded) {
            setRewardedAd(rewarded);
          }
        }
        if (settingsData) setSystemSettings(settingsData);
        
      } catch (error) {
        console.error("Dashboard error", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [setSystemSettings, setActiveAds]);

  // Cleanup pending interstitial timer on unmount
  useEffect(() => {
    return () => {
      if (interstitialTimerRef.current !== null) {
        window.clearTimeout(interstitialTimerRef.current);
      }
    };
  }, []);

  const handleBannerClick = (banner: HomeBanner) => {
    if (banner.link) {
      setSitePreviewUrl(banner.link);
      setSitePreviewTitle(banner.title);
      setSitePreviewCompany(banner.companyName || banner.company_name);
      setShowSitePreview(true);
    }
  };

  const handleWhatsAppContact = () => {
    const phone = systemSettings?.contact_info.whatsapp || APP_CONFIG.WHATSAPP_NUMBER; 
    const message = "Olá! Gostaria de saber mais sobre as opções de publicidade premium no Resolve.AO para o meu negócio.";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const usdRate = rates.find(r => r.currency === 'USD');

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % TICKER_MESSAGES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <ErrorBoundary>
      <div className="space-y-6 md:space-y-12 animate-fade-in">
      <Helmet>
        <title>Resolve.AO | Câmbio, Emprego, Notícias e Ofertas em Angola</title>
        <meta name="description" content="Câmbio formal e informal, vagas de emprego, notícias e promoções atualizados em Angola. Tudo o que precisas num só lugar." />
        <meta name="keywords" content="vagas angola, cambio angola, economia angola, empregos angola, notícias angola, ofertas angola" />
      </Helmet>

      {/* Site Preview Modal */}
      <SitePreviewModal
        isOpen={showSitePreview}
        onClose={() => setShowSitePreview(false)}
        url={sitePreviewUrl}
        title={sitePreviewTitle}
        companyName={sitePreviewCompany}
      />

      {/* Interstitial Ad Overlay */}
      {showInterstitial && interstitialAd && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 rounded-2xl overflow-hidden shadow-xl gold-border-subtle">
            <button 
              onClick={() => setShowInterstitial(false)}
              className="absolute top-6 right-6 z-10 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white transition-all"
              aria-label="Fechar Anúncio"
              title="Fechar"
            >
              <X size={20} />
            </button>
            <div className="aspect-[4/5] relative">
              {interstitialAd.media_type === 'video' ? (
                (() => {
                  const embedInfo = VideoUtils.getEmbedUrl(interstitialAd.video_url);
                  return embedInfo.isEmbed && embedInfo.embedUrl ? (
                    <iframe
                      src={embedInfo.embedUrl}
                      className="w-full h-full border-0 pointer-events-none"
                      title="Interstitial Video"
                    />
                  ) : (
                    <video 
                      src={interstitialAd.video_url} 
                      poster={interstitialAd.image_url}
                      autoPlay 
                      loop 
                      muted={isMuted}
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  );
                })()
              ) : (
                <img src={interstitialAd.image_url} className="w-full h-full object-cover" alt="interstitial" />
              )}
              <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black via-black/60 to-transparent">
                <span className="text-[11px] font-semibold text-brand-gold uppercase tracking-wide mb-2 block">Publicidade</span>
                <h3 className="text-2xl font-bold text-white mb-4">{interstitialAd.company_name}</h3>
                <button 
                  onClick={() => {
                    if (interstitialAd.link) {
                      setSitePreviewUrl(interstitialAd.link);
                      setSitePreviewCompany(interstitialAd.company_name);
                      setShowSitePreview(true);
                    }
                    setShowInterstitial(false);
                  }}
                  className="w-full bg-brand-gold text-slate-950 py-4 rounded-xl font-semibold text-sm transition-colors active:scale-[0.98]"
                >
                  Ver site / oferta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rewarded Ad Floating Trigger & Modal */}
      {rewardedAd && (
        <>
          <button 
            onClick={() => setShowRewarded(true)}
            className="fixed bottom-24 right-6 z-[150] bg-brand-gold text-slate-950 px-5 py-4 rounded-full shadow-lg transition-all text-xs font-semibold flex items-center gap-2 hover:brightness-105 active:scale-[0.97]"
            title="Ver Oferta Especial"
          >
            <DollarSign size={16} /> Ganhar bónus
          </button>

          {showRewarded && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 animate-fade-in backdrop-blur-md">
              <div className="bg-slate-900 w-full max-w-sm rounded-3xl overflow-hidden border border-brand-gold/30 shadow-xl">
                <div className="p-8 text-center space-y-6">
                  <div className="w-20 h-20 bg-brand-gold/10 rounded-full flex items-center justify-center text-brand-gold mx-auto">
                    <DollarSign size={40} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Oferta especial</h3>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed px-4">Veja este anúncio da <span className="text-brand-gold">{rewardedAd.company_name}</span> para desbloquear a recompensa.</p>
                  </div>
                  
                  <div className="rounded-2xl overflow-hidden border border-white/5 aspect-video">
                    {rewardedAd.media_type === 'video' ? (
                      (() => {
                        const embedInfo = VideoUtils.getEmbedUrl(rewardedAd.video_url);
                        return embedInfo.isEmbed && embedInfo.embedUrl ? (
                          <iframe
                            src={embedInfo.embedUrl}
                            className="w-full h-full border-0 pointer-events-none"
                            title="Rewarded Video"
                          />
                        ) : (
                          <video 
                            src={rewardedAd.video_url} 
                            poster={rewardedAd.image_url}
                            autoPlay 
                            muted={isMuted}
                            className="w-full h-full object-cover"
                          />
                        );
                      })()
                    ) : (
                      <img src={rewardedAd.image_url} className="w-full h-full object-cover" alt="rewarded" />
                    )}
                  </div>

                  <button 
                    onClick={() => {
                      if (rewardedAd.link) {
                        setSitePreviewUrl(rewardedAd.link);
                        setSitePreviewCompany(rewardedAd.company_name);
                        setShowSitePreview(true);
                      }
                      setShowRewarded(false);
                    }}
                    className="w-full bg-brand-gold text-slate-950 py-4 rounded-2xl font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                  >
                    Resgatar bónus e ver site
                  </button>
                  <button 
                    onClick={() => setShowRewarded(false)} 
                    className="text-slate-500 text-xs font-semibold tracking-wide hover:text-white transition-colors"
                    title="Fechar"
                    aria-label="Fechar Oferta"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Hero Section Dynamic - Mobile Optimized Height */}
      <div 
        onClick={() => {
          if (heroBanners[heroImageIndex]) {
            handleBannerClick(heroBanners[heroImageIndex]);
          }
        }}
        className="relative rounded-2xl md:rounded-[2rem] overflow-hidden bg-slate-950 shadow-md min-h-[360px] md:min-h-[560px] flex items-center group cursor-pointer"
      >
        <div className="absolute inset-0 z-0">
          {heroBanners.map((banner, idx) => {
            const isVideo = (banner.mediaType === 'video' || banner.media_type === 'video');
            const videoUrl = banner.videoUrl || banner.video_url;
            const imageUrl = banner.imageUrl || banner.image_url;
            const embedInfo = isVideo ? VideoUtils.getEmbedUrl(videoUrl) : { isEmbed: false, embedUrl: null };

            if (isVideo && embedInfo.isEmbed && embedInfo.embedUrl) {
              return (
                <iframe
                  key={idx}
                  src={embedInfo.embedUrl}
                  className={`absolute inset-0 w-full h-full border-0 pointer-events-none transition-all duration-[3000ms] ${heroImageIndex === idx ? 'opacity-50 scale-110' : 'opacity-0 scale-100'}`}
                  title="Hero Banner Video"
                />
              );
            }

            if (isVideo && videoUrl) {
              return (
                <video 
                  key={idx}
                  src={videoUrl} 
                  poster={imageUrl}
                  autoPlay 
                  muted
                  loop 
                  playsInline
                  ref={(el) => { if (el) el.muted = isMuted; }}
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-[3000ms] ease-in-out ${heroImageIndex === idx ? 'opacity-40 scale-110' : 'opacity-0 scale-100'}`}
                />
              );
            }

            return (
              <img 
                key={idx}
                src={imageUrl} 
                alt={banner.title || 'Hero Banner'} 
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-[3000ms] ease-in-out ${heroImageIndex === idx ? 'opacity-40 scale-110 translate-x-0' : 'opacity-0 scale-100 translate-x-4'}`}
              />
            );
          })}
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#110e0b] via-[#110e0b]/75 to-[#110e0b]/10"></div>

          {/* Volume Toggle Hero */}
          {(heroBanners[heroImageIndex]?.mediaType === 'video' || heroBanners[heroImageIndex]?.media_type === 'video') && (
            <button 
              onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
              className="absolute bottom-6 right-6 z-30 p-3 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white border border-white/20 transition-all active:scale-95"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          )}
        </div>
        
        <div className="relative z-10 p-6 md:p-24 max-w-5xl w-full">
          <p className="text-eyebrow text-brand-gold mb-5 md:mb-10">
            Câmbio · Empregos · Notícias · Descontos
          </p>

          <h1 className="font-display text-fluid-h1 font-bold text-white mb-4 md:mb-8 leading-[1.05] md:leading-[0.98]">
            A Angola do dia a dia,<br />
            <span className="text-brand-gold">num só lugar.</span>
          </h1>

          <p className="text-fluid-p text-slate-200 font-medium max-w-md mb-6 md:mb-12">
            Taxas de câmbio, vagas de emprego, notícias e descontos atualizados ao longo do dia — para quem vive e trabalha cá.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); navigate('/cambio'); }}
              className="w-full sm:w-auto bg-brand-gold hover:bg-orange-600 text-slate-950 font-semibold py-4 px-8 rounded-xl md:rounded-xl transition-colors flex items-center justify-center text-sm md:text-base cursor-pointer"
            >
              Consultar câmbio <ArrowRight size={16} className="ml-2" />
            </button>
          </div>
        </div>
      </div>

      {/* Live Ticker */}
      <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm relative">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 border-r border-slate-200 dark:border-white/10 px-4 py-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-brand-gold rounded-full" />
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap tracking-wide">Agora</span>
          </div>
          <div className="flex-1 overflow-hidden py-3 relative">
            <div
              key={tickerIndex}
              className="flex items-center gap-3 animate-fade-in"
            >
              <span className="text-xs font-medium text-slate-700 dark:text-slate-200 tracking-normal whitespace-nowrap">
                {TICKER_MESSAGES[tickerIndex]}
              </span>
            </div>
          </div>
          <div className="flex-shrink-0 flex gap-1.5 px-4">
            {TICKER_MESSAGES.map((_, i) => (
              <button
                key={i}
                onClick={() => setTickerIndex(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === tickerIndex ? 'bg-brand-gold w-4' : 'bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'}`}
                aria-label={`Mensagem ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Stats Dashboard */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-white/10 animate-pulse h-28" />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-white/10">
            <button onClick={() => navigate('/cambio')} className="group text-left p-5 md:p-8 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
              <span className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium block mb-2">Câmbio rua · venda</span>
              <span className="font-display text-2xl md:text-4xl font-bold text-slate-900 dark:text-white">{usdRate?.informalSell.toFixed(0)} <span className="text-base md:text-lg text-brand-gold">Kz</span></span>
              <span className="mt-2 block text-xs text-slate-400">Ver taxas de hoje →</span>
            </button>

            <button onClick={() => navigate('/vagas')} className="group text-left p-5 md:p-8 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
              <span className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium block mb-2">Vagas em destaque</span>
              <span className="font-display text-2xl md:text-4xl font-bold text-slate-900 dark:text-white">{featuredJobs.length} <span className="text-base md:text-lg text-slate-400">+</span></span>
              <span className="mt-2 block text-xs text-slate-400">Ver vagas →</span>
            </button>

            <button onClick={() => navigate('/ofertas')} className="group text-left p-5 md:p-8 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
              <span className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium block mb-2">Promoções ativas</span>
              <span className="font-display text-2xl md:text-4xl font-bold text-slate-900 dark:text-white">{featuredDeals.length}</span>
              <span className="mt-2 block text-xs text-slate-400">Ver descontos →</span>
            </button>
          </div>
        </div>
      )}

      {/* Por Que a Resolve.AO */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 md:p-12">
        <p className="text-eyebrow text-brand-gold mb-3">Porquê o Resolve.AO</p>
        <h2 className="text-fluid-h2 font-display font-bold text-slate-900 dark:text-white mb-8">
          Não inventámos nada. Só juntámos o que faz falta.
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          {[
            { icon: TrendingUp, title: 'Útil todos os dias', desc: 'Câmbio, vagas e notícias sempre à mão, sem assinatura nem taxas escondidas.', color: 'text-brand-gold' },
            { icon: Zap, title: 'Custa 0 Kz', desc: 'Podes consultar tudo sem criar conta. A conta é grátis e só serve para guardar o que interessa.', color: 'text-green-600' },
            { icon: Shield, title: 'Com respeito pelos teus dados', desc: 'Guardamos o mínimo necessário e não vendemos a tua informação a ninguém.', color: 'text-blue-600' },
          ].map((item) => (
            <div key={item.title} className="flex flex-col items-start p-5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-brand-gold/40 transition-colors">
              <div className={`w-12 h-12 rounded-xl bg-brand-gold/10 flex items-center justify-center mb-4 ${item.color}`}>
                <item.icon size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Funcionalidades */}
      <div>
        <div className="text-center mb-8">
          <p className="text-eyebrow text-brand-gold mb-3">O que encontras aqui</p>
          <h2 className="text-fluid-h2 font-display font-bold text-slate-900 dark:text-white">
            Câmbio, trabalho, notícias e descontos
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: DollarSign,
              label: 'Câmbio',
              desc: 'A taxa do banco e a da rua, lado a lado. Sabes se estás a fazer bom negócio antes de trocar.',
              cta: 'Ver taxas',
              path: '/cambio',
              highlight: true,
            },
            {
              icon: Briefcase,
              label: 'Vagas de emprego',
              desc: 'Ofertas publicadas por empresas em todo o país, de Luanda a outras províncias. Candidata-te em poucos toques.',
              cta: 'Explorar vagas',
              path: '/vagas',
              highlight: false,
            },
            {
              icon: FileText,
              label: 'Criar CV',
              desc: 'Um currículo simples e bem feito, sem precisar de saber design. Pronto para enviar.',
              cta: 'Criar o meu CV',
              path: '/cv-criador',
              highlight: false,
            },
            {
              icon: Newspaper,
              label: 'Notícias de Angola',
              desc: 'O essencial do dia, sem ruído e sem títulos de alarme.',
              cta: 'Ler notícias',
              path: '/noticias',
              highlight: false,
            },
            {
              icon: Tag,
              label: 'Descontos',
              desc: 'Promoções reais de lojas e marcas em Angola, verificadas antes de publicar.',
              cta: 'Ver promoções',
              path: '/ofertas',
              highlight: false,
            },
            {
              icon: Users,
              label: 'A tua conta',
              desc: 'Guarda o teu CV, segue vagas e recebe aviso quando aparece algo para ti. Grátis.',
              cta: 'Criar conta',
              path: '/perfil',
              highlight: false,
            },
          ].map((feature) => (
            <div
              key={feature.path}
              onClick={() => navigate(feature.path)}
              className={`group relative cursor-pointer rounded-xl p-6 border transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.99] ${
                feature.highlight
                  ? 'bg-slate-900 dark:bg-slate-900 border-brand-gold/40'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 hover:border-brand-gold/40'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  feature.highlight ? 'bg-brand-gold text-slate-950' : 'bg-brand-gold/10 text-brand-gold'
                }`}>
                  <feature.icon size={22} />
                </div>
              </div>
              <h3 className={`text-base font-bold mb-2 ${
                feature.highlight ? 'text-white' : 'text-slate-900 dark:text-white'
              }`}>{feature.label}</h3>
              <p className={`text-sm font-medium leading-relaxed mb-4 ${
                feature.highlight ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'
              }`}>{feature.desc}</p>
              <div className="flex items-center gap-2 text-sm font-semibold text-brand-gold group-hover:gap-3 transition-all">
                {feature.cta} <ArrowRight size={14} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Depoimentos */}
      <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 p-6 md:p-12">
        <div className="text-center mb-8">
          <p className="text-eyebrow text-brand-gold mb-3">Na voz de quem usa</p>
          <h2 className="text-fluid-h2 font-display font-bold text-slate-900 dark:text-white">
            Do Luanda ao Huambo, a mesma utilidade
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              quote: 'Vi uma vaga de motorista de app numa segunda, liguei na terça e na quinta já estava a trabalhar.',
              name: 'Carlos',
              city: 'Luanda',
              role: 'Motorista',
            },
            {
              quote: 'Sigo o câmbio da rua aqui todos os dias. Já sei quando o valor que me dão no bairro está certo ou me estão a enganar.',
              name: 'Ana',
              city: 'Benguela',
              role: 'Vendedora',
            },
            {
              quote: 'Fiz o meu CV no telemóvel numa tarde, mandei para três empresas e fui chamado em duas.',
              name: 'Pedro',
              city: 'Huambo',
              role: 'Técnico de informática',
            },
          ].map((t) => (
            <div key={t.name} className="bg-white dark:bg-slate-800/80 rounded-xl p-6 border border-slate-200 dark:border-white/10">
              <Quote size={20} className="text-brand-gold mb-4 opacity-60" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{t.name}</p>
                  <p className="text-xs font-medium text-slate-400">{t.role} · {t.city}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-white/10 text-center">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
            O Resolve.AO é gratuito. Se quiseres, cria conta para guardar o CV e seguir vagas.
          </p>
        </div>
      </div>

      {/* Ad Section - Mobile Responsive CTA */}
      <div 
        onClick={() => {
          if (adBanners[adImageIndex]?.link) {
            handleBannerClick(adBanners[adImageIndex]);
          }
        }}
        className="relative rounded-2xl md:rounded-[2.5rem] overflow-hidden bg-black shadow-md group cursor-pointer min-h-[400px] md:min-h-[500px] flex items-center"
      >
        <div className="absolute inset-0 z-0">
          {adBanners.map((banner, idx) => {
            const isVideo = (banner.mediaType === 'video' || banner.media_type === 'video');
            const videoUrl = banner.videoUrl || banner.video_url;
            const imageUrl = banner.imageUrl || banner.image_url;
            const embedInfo = isVideo ? VideoUtils.getEmbedUrl(videoUrl) : { isEmbed: false, embedUrl: null };

            if (isVideo && embedInfo.isEmbed && embedInfo.embedUrl) {
              return (
                <iframe
                  key={idx}
                  src={embedInfo.embedUrl}
                  className={`absolute inset-0 w-full h-full border-0 pointer-events-none transition-all duration-[4000ms] ${adImageIndex === idx ? 'opacity-60 scale-105' : 'opacity-0 scale-100'}`}
                  title="Ad Banner Video"
                />
              );
            }

            if (isVideo && videoUrl) {
              return (
                <video 
                  key={idx}
                  src={videoUrl} 
                  poster={imageUrl}
                  autoPlay 
                  muted
                  loop 
                  playsInline
                  ref={(el) => { if (el) el.muted = isMuted; }}
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-[4000ms] ${adImageIndex === idx ? 'opacity-60 scale-105 blur-none' : 'opacity-0 scale-100'}`}
                />
              );
            }

            return (
              <img 
                key={idx}
                src={imageUrl} 
                alt={banner.companyName || banner.company_name || 'Ad Banner'} 
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-[4000ms] ${adImageIndex === idx ? 'opacity-60 scale-105 blur-none' : 'opacity-0 scale-100'}`}
              />
            );
          })}
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black via-black/85 to-transparent"></div>
          
          {/* Volume Toggle Ads */}
          {(adBanners[adImageIndex]?.mediaType === 'video' || adBanners[adImageIndex]?.media_type === 'video') && (
            <button 
              onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
              className="absolute bottom-6 right-6 z-30 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white border border-white/10 transition-all active:scale-95"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          )}
        </div>

        <div className="relative z-10 p-6 md:p-24 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 w-full text-center md:text-left stack-narrow">
          <div className="max-w-3xl">
            <p className="text-brand-gold text-sm md:text-base font-semibold mb-4">
              Divulga o teu negócio
            </p>
            
            <h2 className="text-fluid-h2 font-display font-bold text-white mb-6">
              Aparece a quem está<br/>
              <span className="text-brand-gold">a procurar</span>
            </h2>
            
            <div className="border-l-2 md:border-l-4 border-brand-gold pl-4 md:pl-6 py-2 mb-6 md:mb-0">
              <p className="text-fluid-p text-slate-200 font-medium">
                O teu anúncio aparece junto das taxas, vagas e notícias que as pessoas consultam todos os dias. Fala connosco no WhatsApp e tratamos do resto.
              </p>
            </div>
          </div>

          <div className="w-full md:w-auto">
            <button 
              onClick={(e) => { e.stopPropagation(); handleWhatsAppContact(); }}
              className="w-full md:w-auto bg-brand-gold px-10 py-5 rounded-xl font-bold text-slate-950 text-sm md:text-base transition-colors active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer"
            >
              <MessageCircle size={20} />
              <span>Falar no WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Banner de Publicidade Final */}
      <div className="pt-4 md:pt-8">
        <AdBanner format="leaderboard" customLocation="home" />
      </div>
    </div>
    </ErrorBoundary>
  );
};
