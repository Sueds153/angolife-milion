import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Briefcase, ShoppingBag, DollarSign, ChevronRight, MessageCircle, Activity, Volume2, VolumeX } from 'lucide-react';
import { ExchangeService } from '../services/exchange.service';
import { DealsService } from '../services/deals.service';
import { JobsService } from '../services/jobs.service';
import { ExchangeRate, Job, ProductDeal } from '../types';
import { APP_CONFIG } from '../constants';
import { PARTNER_ADS } from '../constants/ads';
import { AdBanner } from '../components/AdBanner';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [featuredDeals, setFeaturedDeals] = useState<ProductDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const [adImageIndex, setAdImageIndex] = useState(0);

  const heroBanners = PARTNER_ADS.heroBanners;
  const adBanners = PARTNER_ADS.partnerBanners.filter(b => b.isActive);

  useEffect(() => {
    const heroInterval = setInterval(() => {
      setHeroImageIndex((prev) => (prev + 1) % heroBanners.length);
    }, 6000);

    const adInterval = setInterval(() => {
      setAdImageIndex((prev) => (prev + 1) % adBanners.length);
    }, 5000);

    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [ratesData, dealsData, jobsData] = await Promise.all([
          ExchangeService.getRates(),
          DealsService.getDeals(false),
          JobsService.getJobs(false)
        ]);
        setRates(ratesData);
        setFeaturedDeals(dealsData.slice(0, 2));
        setFeaturedJobs(jobsData.slice(0, 3));
      } catch (error) {
        console.error("Dashboard error", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
    return () => {
      clearInterval(heroInterval);
      clearInterval(adInterval);
    };
  }, []);

  const handleWhatsAppContact = () => {
    const phone = APP_CONFIG.WHATSAPP_NUMBER; 
    const message = "Olá! Gostaria de saber mais sobre as opções de publicidade premium no Angolife para o meu negócio.";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const usdRate = rates.find(r => r.currency === 'USD');

  return (
    <div className="space-y-6 md:space-y-12 animate-fade-in">
      {/* Hero Section Dynamic - Mobile Optimized Height */}
      <div className="relative rounded-[1.5rem] md:rounded-[3rem] overflow-hidden bg-slate-950 shadow-2xl min-h-[380px] md:min-h-[600px] flex items-center group gold-border-subtle">
        <div className="absolute inset-0 z-0">
          {heroBanners.map((banner, idx) => (
            banner.mediaType === 'video' ? (
              <video 
                key={idx}
                src={banner.videoUrl} 
                poster={banner.imageUrl}
                autoPlay 
                muted={isMuted}
                loop 
                playsInline
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-[3000ms] ease-in-out ${heroImageIndex === idx ? 'opacity-40 scale-110' : 'opacity-0 scale-100'}`}
              />
            ) : (
              <img 
                key={idx}
                src={banner.imageUrl} 
                alt={banner.title} 
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-[3000ms] ease-in-out ${heroImageIndex === idx ? 'opacity-40 scale-110 translate-x-0' : 'opacity-0 scale-100 translate-x-4'}`}
              />
            )
          ))}
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent"></div>

          {/* Volume Toggle Hero */}
          {heroBanners[heroImageIndex]?.mediaType === 'video' && (
            <button 
              onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
              className="absolute bottom-6 right-6 z-30 p-3 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white border border-white/20 transition-all active:scale-95"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          )}
        </div>
        
        <div className="relative z-10 p-6 md:p-16 max-w-4xl w-full">
          <div className="inline-flex items-center gap-2 bg-brand-gold/20 border border-brand-gold/40 backdrop-blur-xl px-3 py-1.5 rounded-full text-brand-gold text-[7px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-4 md:mb-10 shadow-lg">
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
              className="w-full sm:w-auto bg-brand-gold hover:bg-amber-600 text-white font-black py-4 px-8 rounded-xl md:rounded-2xl transition-all flex items-center justify-center shadow-xl active:scale-95 text-[10px] md:text-sm uppercase tracking-widest border border-brand-gold/50"
            >
              Consultar Câmbio <ArrowRight size={16} className="ml-2" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Dashboard - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
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

        <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] p-5 md:p-10 shadow-xl cursor-pointer group lg:col-span-1 sm:col-span-2 gold-border-subtle active:scale-[0.98] transition-all" onClick={() => navigate('/ofertas')}>
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

      {/* Ad Section - Mobile Responsive CTA */}
      <div className="relative rounded-[1.5rem] md:rounded-[4rem] overflow-hidden bg-black shadow-2xl group transition-all gold-border-subtle min-h-[400px] md:min-h-[500px] flex items-center">
        <div className="absolute inset-0 z-0">
          {adBanners.map((banner, idx) => (
            banner.mediaType === 'video' ? (
              <video 
                key={idx}
                src={banner.videoUrl} 
                poster={banner.imageUrl}
                autoPlay 
                muted={isMuted}
                loop 
                playsInline
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-[4000ms] ${adImageIndex === idx ? 'opacity-60 scale-105 blur-none' : 'opacity-0 scale-100'}`}
              />
            ) : (
              <img 
                key={idx}
                src={banner.imageUrl} 
                alt={banner.companyName} 
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-[4000ms] ${adImageIndex === idx ? 'opacity-60 scale-105 blur-none' : 'opacity-0 scale-100'}`}
              />
            )
          ))}
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black via-black/85 to-transparent"></div>
          
          {/* Volume Toggle Ads */}
          {adBanners[adImageIndex]?.mediaType === 'video' && (
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
              onClick={handleWhatsAppContact}
              className="w-full md:w-auto bg-brand-gold px-10 py-5 rounded-2xl font-black text-slate-950 uppercase tracking-[0.2em] text-[10px] md:text-sm transition-all active:scale-95 flex items-center justify-center gap-3 shadow-[0_15px_40px_rgba(245,158,11,0.3)]"
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
  );
};
