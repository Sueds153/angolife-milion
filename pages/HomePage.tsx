import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Briefcase, ShoppingBag, DollarSign, ChevronRight, MessageCircle, Activity, Volume2, VolumeX, X, Newspaper, FileText, Tag, Users, Shield, Zap, Star, TrendingUp, Quote, CheckCircle } from 'lucide-react';
import { ExchangeService } from '../services/api/exchange.service';
import { DealsService } from '../services/api/deals.service';
import { JobsService } from '../services/api/jobs.service';
import { ExchangeRate, Job, ProductDeal } from '../types';
import { APP_CONFIG } from '../constants/app';
import { PARTNER_ADS } from '../constants/ads';
import { AdBanner } from '../components/ads/AdBanner';
import { AdsService, Ad } from '../services/api/ads.service';
import { VideoUtils } from '../services/utils/videoUtils';
import { useAppStore } from '../store/useAppStore';
import { Helmet } from 'react-helmet-async';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';

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
  { icon: '📊', text: 'Dados de mercado atualizados em tempo real' },
  { icon: '💼', text: 'Vagas atualizadas diariamente das maiores empresas' },
  { icon: '📰', text: 'Notícias verificadas antes de publicar' },
  { icon: '🛡️', text: 'Dados protegidos com encriptação bancária' },
  { icon: '⚡', text: 'Câmbio informal atualizado a cada minuto' },
  { icon: '🤝', text: 'Comunidade de +50.000 utilizadores ativos' },
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

  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const [adImageIndex, setAdImageIndex] = useState(0);

  // Derivar banners dos ads carregados ou usar fallback estático se não houver anúncios da categoria
  const heroBanners: HomeBanner[] = useMemo(() => {
    const filtered = ads.filter(a => a.type === 'hero' && a.is_active && (a.location === 'home' || a.location === 'all') && a.format === 'banner');
    return filtered.length > 0 ? filtered : PARTNER_ADS.heroBanners;
  }, [ads]);
    
  const adBanners: HomeBanner[] = useMemo(() => {
    const filtered = ads.filter(a => a.type === 'partner' && a.is_active && (a.location === 'home' || a.location === 'all') && a.format === 'banner');
    return filtered.length > 0 ? filtered : PARTNER_ADS.partnerBanners.filter(b => b.isActive);
  }, [ads]);

  useEffect(() => {
    // Carrega anúncios e configura rotação de banners
    const setupBannerRotation = () => {
      if (heroBanners.length === 0 || adBanners.length === 0) return;

      // Hero banner rotation
      const heroInterval = setInterval(() => {
        setHeroImageIndex((prev) => (prev + 1) % heroBanners.length);
      }, (heroBanners[0]?.duration_seconds || 6) * 1000);

      // Ad banner rotation
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
          JobsService.getJobs(false),
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

          // Verificar se há Interstitial para Home
          const interstitial = adsData.find(a => a.is_active && a.format === 'interstitial' && (a.location === 'home' || a.location === 'all'));
          if (interstitial) {
            setInterstitialAd(interstitial);
            // Mostrar após 3 segundos
            setTimeout(() => setShowInterstitial(true), 3000);
          }
          
          // Verificar se há Rewarded para Home
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

  const handleWhatsAppContact = () => {
    const phone = systemSettings?.contact_info.whatsapp || APP_CONFIG.WHATSAPP_NUMBER; 
    const message = "Olá! Gostaria de saber mais sobre as opções de publicidade premium no Angolife para o meu negócio.";
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
        <title>Angolife Su-Golden | Inteligência de Mercado e Elite em Angola</title>
        <meta name="description" content="Lidere a economia nacional com a Angolife Su-Golden. Câmbio em tempo real, vagas de elite e as melhores ofertas do mercado angolano." />
        <meta name="keywords" content="vagas angola, cambio angola, economia angola, empregos angola, mercado angolano, su-golden" />
      </Helmet>

      {/* Interstitial Ad Overlay */}
      {showInterstitial && interstitialAd && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl gold-border-subtle">
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
                <span className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em] mb-2 block animate-pulse">Publicidade Exclusiva</span>
                <h3 className="text-2xl font-black text-white uppercase mb-4">{interstitialAd.company_name}</h3>
                <button 
                  onClick={() => {
                    if (interstitialAd.link) window.open(interstitialAd.link, '_blank');
                    setShowInterstitial(false);
                  }}
                  className="w-full bg-brand-gold text-slate-950 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all"
                >
                  Saber Mais
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
            className="fixed bottom-24 right-6 z-[150] bg-brand-gold text-slate-950 p-4 rounded-full shadow-2xl animate-bounce hover:scale-110 active:scale-95 transition-all text-[10px] font-black uppercase tracking-tight flex items-center gap-2"
            title="Ver Oferta Especial"
          >
            <DollarSign size={16} /> Ganhar Bónus
          </button>

          {showRewarded && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 animate-fade-in backdrop-blur-md">
              <div className="bg-slate-900 w-full max-w-sm rounded-[3rem] overflow-hidden border border-brand-gold/30 shadow-brand-gold/10 shadow-2xl">
                <div className="p-8 text-center space-y-6">
                  <div className="w-20 h-20 bg-brand-gold/10 rounded-full flex items-center justify-center text-brand-gold mx-auto">
                    <DollarSign size={40} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase mb-2">Oferta Exclusiva</h3>
                    <p className="text-slate-400 text-xs font-bold leading-relaxed px-4">Veja este anúncio premium da <span className="text-brand-gold">{rewardedAd.company_name}</span> para desbloquear a sua recompensa.</p>
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
                      if (rewardedAd.link) window.open(rewardedAd.link, '_blank');
                      setShowRewarded(false);
                    }}
                    className="w-full bg-brand-gold text-slate-950 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                  >
                    Resgatar Bónus
                  </button>
                  <button 
                    onClick={() => setShowRewarded(false)} 
                    className="text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
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
      <div className="relative rounded-[1.5rem] md:rounded-[3rem] overflow-hidden bg-slate-950 shadow-2xl min-h-[380px] md:min-h-[600px] flex items-center group gold-border-subtle">
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
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent"></div>

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
          <div className="inline-flex items-center gap-2 bg-brand-gold/20 border border-brand-gold/40 backdrop-blur-xl px-4 py-2 rounded-full text-brand-gold text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-6 md:mb-12 shadow-lg">
            <Activity size={10} className="animate-pulse" />
            MERCADO EM TEMPO REAL
          </div>
          
          <h1 className="text-fluid-h1 font-black text-white mb-4 md:mb-8 tracking-tighter leading-[1.1] md:leading-[0.85] uppercase">
            Angolife <br/>
            <span className="text-brand-gold">Su-Golden</span>
          </h1>
          
          <p className="text-fluid-p text-slate-100 font-bold max-w-md mb-6 md:mb-12 opacity-90 uppercase tracking-tight">
            Lidere a economia nacional com inteligência de mercado e oportunidades exclusivas em Angola.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={() => navigate('/cambio')}
              className="w-full sm:w-auto bg-brand-gold hover:bg-amber-600 text-white font-black py-4 px-8 rounded-xl md:rounded-2xl transition-all flex items-center justify-center shadow-xl active:scale-95 text-[10px] md:text-sm uppercase tracking-widest border border-brand-gold/50 cursor-pointer"
            >
              Consultar Câmbio <ArrowRight size={16} className="ml-2" />
            </button>
          </div>
        </div>
      </div>

      {/* Live Ticker */}
      <div className="overflow-hidden rounded-2xl bg-slate-900 dark:bg-black border border-orange-500/20 shadow-lg relative">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 bg-orange-500 px-4 py-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-[9px] font-black text-white uppercase tracking-widest whitespace-nowrap">AO VIVO</span>
          </div>
          <div className="flex-1 overflow-hidden py-3 relative">
            <div
              key={tickerIndex}
              className="flex items-center gap-3 animate-fade-in"
            >
              <span className="text-lg leading-none">{TICKER_MESSAGES[tickerIndex].icon}</span>
              <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wide whitespace-nowrap">
                {TICKER_MESSAGES[tickerIndex].text}
              </span>
            </div>
          </div>
          <div className="flex-shrink-0 flex gap-1.5 px-4">
            {TICKER_MESSAGES.map((_, i) => (
              <button
                key={i}
                onClick={() => setTickerIndex(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === tickerIndex ? 'bg-orange-500 w-4' : 'bg-slate-600 hover:bg-slate-400'}`}
                aria-label={`Mensagem ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Stats Dashboard */}
      {loading ? (
        <div className="grid-adaptive">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-[1.5rem] p-5 md:p-10 shadow-xl gold-border-subtle animate-pulse">
              <div className="flex justify-between items-center mb-4 md:mb-6">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-slate-200 dark:bg-white/10 rounded-xl" />
                <div className="w-6 h-6 bg-slate-200 dark:bg-white/10 rounded" />
              </div>
              <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-1/4 mb-2" />
              <div className="h-8 bg-slate-200 dark:bg-white/10 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid-adaptive">
          <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] p-5 md:p-10 shadow-xl cursor-pointer group gold-border-subtle active:scale-[0.98] transition-all" onClick={() => navigate('/cambio')}>
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <div className="w-10 h-10 md:w-14 md:h-14 bg-brand-gold/5 rounded-xl text-brand-gold flex items-center justify-center">
              <DollarSign className="w-5 h-5 md:w-7 md:h-7" />
            </div>
            <ChevronRight size={16} className="text-slate-300" />
          </div>
          <span className="text-[8px] md:text-[11px] text-slate-400 font-black uppercase tracking-widest block mb-1">Câmbio Rua</span>
          <span className="text-2xl md:text-5xl font-black text-brand-gold">{usdRate?.informalSell.toFixed(0)} <span className="text-xs md:text-sm font-bold text-brand-gold">Kz</span></span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] p-5 md:p-10 shadow-xl cursor-pointer group gold-border-subtle active:scale-[0.98] transition-all" onClick={() => navigate('/vagas')}>
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <div className="w-10 h-10 md:w-14 md:h-14 bg-brand-gold/5 rounded-xl text-brand-gold flex items-center justify-center">
              <Briefcase className="w-5 h-5 md:w-7 md:h-7" />
            </div>
            <ChevronRight size={16} className="text-slate-300" />
          </div>
          <span className="text-[8px] md:text-[11px] text-slate-400 font-black uppercase tracking-widest block mb-1">Vagas de Elite</span>
          <span className="text-2xl md:text-5xl font-black text-brand-gold">{featuredJobs.length}+ <span className="text-xs md:text-sm font-bold text-slate-400">Abertas</span></span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] p-5 md:p-10 shadow-xl cursor-pointer group gold-border-subtle active:scale-[0.98] transition-all" onClick={() => navigate('/ofertas')}>
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <div className="w-10 h-10 md:w-14 md:h-14 bg-brand-gold/10 rounded-xl text-brand-gold flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 md:w-7 md:h-7" />
            </div>
            <ChevronRight size={16} className="text-slate-300" />
          </div>
          <span className="text-[8px] md:text-[11px] text-slate-400 font-black uppercase tracking-widest block mb-1">Promoções</span>
          <span className="text-2xl md:text-5xl font-black text-brand-gold">{featuredDeals.length} <span className="text-xs md:text-sm font-bold text-slate-400">Destaques</span></span>
        </div>
        </div>
      )}

      {/* Por Que a Angolife */}
      <div className="relative overflow-hidden rounded-[2rem] bg-white dark:bg-slate-900 border border-orange-500/10 shadow-xl p-6 md:p-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <p className="text-[9px] font-black text-brand-gold uppercase tracking-[0.25em] mb-3">A Tua Plataforma de Confiança</p>
          <h2 className="text-fluid-h2 font-black text-slate-900 dark:text-white uppercase tracking-tight mb-8">
            Por que <span className="text-brand-gold">milhares</span> escolhem a Angolife?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            {[
              { icon: TrendingUp, title: '#1 em Angola', desc: 'A plataforma de referência para o mercado angolano', color: 'text-brand-gold' },
              { icon: Zap, title: 'Gratuito Para Sempre', desc: 'Acesso completo a câmbio, vagas e notícias sem pagar nada', color: 'text-green-400' },
              { icon: Shield, title: '100% Seguro', desc: 'Os teus dados protegidos com encriptação de nível bancário', color: 'text-blue-400' },
            ].map((item) => (
              <div key={item.title} className="flex flex-col items-start p-5 rounded-[1.5rem] bg-slate-50 dark:bg-white/5 border border-orange-500/10 hover:border-brand-gold/30 transition-all group">
                <div className={`w-12 h-12 rounded-2xl bg-brand-gold/10 flex items-center justify-center mb-4 ${item.color}`}>
                  <item.icon size={22} />
                </div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">{item.title}</h3>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Funcionalidades */}
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
              badge: '🔴 AO VIVO',
              highlight: true,
            },
            {
              icon: Briefcase,
              label: 'Vagas de Elite',
              desc: 'As melhores ofertas de emprego em Angola, de Luanda a todas as províncias.',
              cta: 'Explorar vagas',
              path: '/vagas',
              badge: '⚡ NOVO',
              highlight: false,
            },
            {
              icon: FileText,
              label: 'Criar CV com IA',
              desc: 'Cria um CV profissional em minutos com a ajuda da nossa inteligência artificial.',
              cta: 'Criar o meu CV',
              path: '/cv-criador',
              badge: '✨ IA',
              highlight: false,
            },
            {
              icon: Newspaper,
              label: 'Notícias Angola',
              desc: 'Fica a par do que acontece em Angola antes de toda a gente.',
              cta: 'Ler notícias',
              path: '/noticias',
              badge: '📰 HOJE',
              highlight: false,
            },
            {
              icon: Tag,
              label: 'Descontos Exclusivos',
              desc: 'Promoções e ofertas das melhores marcas e lojas de Angola — por tempo limitado.',
              cta: 'Ver promoções',
              path: '/ofertas',
              badge: '🛍️ LIMITADO',
              highlight: false,
            },
            {
              icon: Users,
              label: 'Comunidade Elite',
              desc: 'Faz parte da rede exclusiva de angolanos que lideram o mercado nacional.',
              cta: 'Criar conta grátis',
              path: '/perfil',
              badge: '🏆 GRÁTIS',
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
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  feature.highlight ? 'bg-brand-gold text-slate-950' : 'bg-brand-gold/10 text-brand-gold'
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

      {/* Depoimentos */}
      <div className="relative overflow-hidden rounded-[2rem] bg-slate-50 dark:bg-slate-900/60 border border-orange-500/10 p-6 md:p-12">
        <div className="text-center mb-8">
          <p className="text-[9px] font-black text-brand-gold uppercase tracking-[0.25em] mb-2">Histórias Reais</p>
          <h2 className="text-fluid-h2 font-black text-slate-900 dark:text-white uppercase tracking-tight">
            O que dizem os nossos <span className="text-brand-gold">utilizadores</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              quote: 'Consegui o meu emprego em 3 dias após ver a vaga aqui. Nunca pensei que fosse tão fácil.',
              name: 'Carlos M.',
              city: 'Luanda',
              role: 'Engenheiro Civil',
              stars: 5,
            },
            {
              quote: 'Poupei mais de 15 000 Kz por semana só por acompanhar a taxa informal pelo app.',
              name: 'Ana F.',
              city: 'Benguela',
              role: 'Empresária',
              stars: 5,
            },
            {
              quote: 'O CV que criei aqui com a IA foi o que me fez passar na entrevista. Recomendo a todos.',
              name: 'Pedro S.',
              city: 'Huambo',
              role: 'Técnico de TI',
              stars: 5,
            },
          ].map((t) => (
            <div key={t.name} className="bg-white dark:bg-slate-800/80 rounded-[1.5rem] p-6 border border-orange-500/10 shadow-sm hover:shadow-md transition-all">
              <Quote size={20} className="text-brand-gold mb-4 opacity-60" />
              <p className="text-[12px] font-medium text-slate-700 dark:text-slate-300 leading-relaxed mb-5 italic">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wide">{t.name}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t.role} · {t.city}</p>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} size={12} className="fill-brand-gold text-brand-gold" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 border-t border-orange-500/10">
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <CheckCircle size={16} className="text-green-400" /> Acesso gratuito imediato
          </div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <CheckCircle size={16} className="text-green-400" /> Sem cartão de crédito
          </div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <CheckCircle size={16} className="text-green-400" /> Cancela quando quiseres
          </div>
        </div>
      </div>

      {/* Ad Section - Mobile Responsive CTA */}
      <div 
        onClick={() => {
          if (adBanners[adImageIndex]?.link) {
            window.open(adBanners[adImageIndex].link, '_blank');
          }
        }}
        className="relative rounded-[1.5rem] md:rounded-[4rem] overflow-hidden bg-black shadow-2xl group transition-all gold-border-subtle min-h-[400px] md:min-h-[500px] flex items-center cursor-pointer"
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
            <p className="text-brand-gold text-[8px] md:text-sm font-black uppercase tracking-[0.2em] mb-4 drop-shadow-md animate-pulse">
              Anuncie e veja o seu negócio crescer
            </p>
            
            <h2 className="text-fluid-h2 font-black text-white uppercase mb-6">
              ALCANCE O <br/>
              <span className="text-brand-gold">TOPO</span> DO MERCADO
            </h2>
            
            <div className="block border-l-2 md:border-l-4 border-brand-gold pl-4 md:pl-6 py-2 mb-6 md:mb-0">
              <p className="text-fluid-p text-slate-200 font-bold">
                Alcance o topo do mercado angolano. Anuncie na rede exclusiva de empresários e investidores da Angolife.
              </p>
            </div>
          </div>

          <div className="w-full md:w-auto">
            <button 
              onClick={(e) => { e.stopPropagation(); handleWhatsAppContact(); }}
              className="w-full md:w-auto bg-brand-gold px-10 py-5 rounded-2xl font-black text-slate-950 uppercase tracking-[0.2em] text-[10px] md:text-sm transition-all active:scale-95 flex items-center justify-center gap-3 shadow-[0_15px_40px_rgba(245,158,11,0.3)] cursor-pointer"
            >
              <MessageCircle size={20} />
              <span>ANUNCIAR AGORA</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Banner de Publicidade Final */}
      <div className="pt-4 md:pt-8">
        <AdBanner format="leaderboard" />
      </div>
    </div>
    </ErrorBoundary>
  );
};
