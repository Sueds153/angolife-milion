import React, { useEffect, useState } from 'react';
import { DollarSign, X, AlertTriangle } from 'lucide-react';
import { ExchangeService } from '../services/api/exchange.service';
import { DealsService } from '../services/api/deals.service';
import { JobsService } from '../services/api/jobs.service';
import { ExchangeRate, Job, ProductDeal } from '../types';
import { PARTNER_ADS } from '../constants/ads';
import { AdBanner } from '../components/ads/AdBanner';
import { AdsService, Ad } from '../services/api/ads.service';
import { useAppStore } from '../store/useAppStore';
import { Helmet } from 'react-helmet-async';

import { HeroBannerSlider } from '../components/home/HeroBannerSlider';
import { LiveMarketTicker } from '../components/home/LiveMarketTicker';
import { StatsDashboard } from '../components/home/StatsDashboard';
import { WhyAngolife } from '../components/home/WhyAngolife';
import { FeatureShowcase } from '../components/home/FeatureShowcase';
import { Testimonials } from '../components/home/Testimonials';
import { TopMarketAd } from '../components/home/TopMarketAd';

interface HomePageProps {
  onShowInterstitial: (callback: () => void) => void;
  onRequestReward: (onSuccess: () => void) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onShowInterstitial, onRequestReward }) => {
  const { setSystemSettings } = useAppStore();
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [featuredDeals, setFeaturedDeals] = useState<ProductDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  
  const [ads, setAds] = useState<Ad[]>([]);

  const heroBanners = ads.length > 0 
    ? ads.filter(a => a.type === 'hero' && a.is_active && (a.location === 'home' || a.location === 'all') && a.format === 'banner') 
    : PARTNER_ADS.heroBanners;
    
  const adBanners = ads.length > 0 
    ? ads.filter(a => a.type === 'partner' && a.is_active && (a.location === 'home' || a.location === 'all') && a.format === 'banner') 
    : PARTNER_ADS.partnerBanners.filter(b => b.isActive);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [ratesData, dealsData, jobsData, adsData, settingsData] = await Promise.all([
          ExchangeService.getRates(),
          DealsService.getDeals(user?.isAdmin || false),
          JobsService.getJobs(user?.isAdmin || false),
          AdsService.getAds().catch(() => []), 
          AdsService.getSettings().catch(() => null)
        ]);
        
        setRates(ratesData);
        setFeaturedDeals(dealsData.slice(0, 2));
        setFeaturedJobs(jobsData.slice(0, 3));
        
        if (adsData.length > 0) {
          setAds(adsData);
          const interstitial = adsData.find(a => a.is_active && a.format === 'interstitial' && (a.location === 'home' || a.location === 'all'));
          if (interstitial) {
            setTimeout(() => onShowInterstitial(() => {}), 3000);
          }
        }
        if (settingsData) setSystemSettings(settingsData);
        
      } catch (err) {
        console.error("Dashboard error", err);
        setError("Não foi possível carregar os dados. Verifique a sua ligação ou as variáveis de ambiente.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [setSystemSettings]);

  const usdRate = rates.find(r => r.currency === 'USD');

  if (loading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-fade-in">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-orange-500/10 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-orange-500 rounded-full animate-spin"></div>
        </div>
        <p className="text-orange-500/60 font-black uppercase text-[10px] tracking-[0.3em] animate-pulse">Carregando Elite Angola</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-6 animate-fade-in">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
          <AlertTriangle size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white uppercase">Falha na Ligação</h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto">{error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-brand-gold text-slate-950 rounded-xl font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-12 animate-fade-in">
      <Helmet>
        <title>Angolife Su-Golden | Inteligência de Mercado e Elite em Angola</title>
        <meta name="description" content="Lidere a economia nacional com a Angolife Su-Golden. Câmbio em tempo real, vagas de elite e as melhores ofertas do mercado angolano." />
        <meta name="keywords" content="vagas angola, cambio angola, economia angola, empregos angola, mercado angolano, su-golden" />
      </Helmet>
      
      {ads.some(a => a.is_active && a.format === 'rewarded') && (
        <button 
          onClick={() => onRequestReward(() => window.location.reload())}
          className="fixed bottom-[140px] md:bottom-24 right-6 z-[150] bg-brand-gold text-slate-950 p-4 rounded-full shadow-2xl animate-bounce hover:scale-110 active:scale-95 transition-all text-[10px] font-black uppercase tracking-tight flex items-center gap-2 border-2 border-slate-950 dark:border-white/10"
        >
          <DollarSign size={16} /> Ganhar Bónus
        </button>
      )}

      <HeroBannerSlider heroBanners={heroBanners} isMuted={isMuted} setIsMuted={setIsMuted} />
      <LiveMarketTicker />
      <StatsDashboard usdRate={usdRate} featuredJobs={featuredJobs} featuredDeals={featuredDeals} />
      <WhyAngolife />
      <FeatureShowcase />
      <Testimonials />
      <TopMarketAd adBanners={adBanners} isMuted={isMuted} setIsMuted={setIsMuted} />
      
      <div className="pt-4 md:pt-8">
        <AdBanner format="leaderboard" />
      </div>
    </div>
  );
};
