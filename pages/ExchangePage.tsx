
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  RefreshCw, Calculator, TrendingUp, ArrowRightLeft, Lock, MessageCircle,
  ArrowDownCircle, ArrowUpCircle, Activity, LogIn, ChevronDown, Copy,
  Upload, CheckCircle, X, Sparkles, Shield
} from 'lucide-react';
import { SupabaseService } from '../services/supabaseService';
import { supabase } from '../services/supabaseClient';
import { GeminiService } from '../services/gemini';
import { ExchangeRate } from '../types';
import { LiveFeed } from '../components/LiveFeed';
import { OrderCard } from '../components/OrderCard';
import { FeedbackModal } from '../components/FeedbackModal';
import { NativeAd } from '../components/NativeAd';
import { RewardedAdModal } from '../components/RewardedAdModal';
import { AdService } from '../services/adService';

interface ExchangePageProps {
  isAuthenticated: boolean;
  userEmail?: string;
  onRequireAuth: () => void;
  isDarkMode: boolean;
  onRequestReward?: (callback: () => void) => void;
}

export const ExchangePage: React.FC<ExchangePageProps> = ({ isAuthenticated, userEmail, onRequireAuth, isDarkMode, onRequestReward }) => {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'view' | 'trade'>('view');

  // Converter States
  const [baseAmount, setBaseAmount] = useState<number>(50000);
  const [isOfficial, setIsOfficial] = useState(false);
  const [baseCurrency, setBaseCurrency] = useState<'AOA' | 'USD' | 'EUR'>('AOA');
  const [targetCurrency, setTargetCurrency] = useState<'AOA' | 'USD' | 'EUR'>('USD');
  const [openDropdown, setOpenDropdown] = useState<'base' | 'target' | null>(null);

  // Terminal Sidebar
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [terminalAmount, setTerminalAmount] = useState<string>('100');

  // Direct Trading
  const [tradeAction, setTradeAction] = useState<'buy' | 'sell'>('buy');
  const [tradeCurrency, setTradeCurrency] = useState<'USD' | 'EUR'>('USD');
  const [tradeAmount, setTradeAmount] = useState<string>('500');

  // Checkout / Modal States
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [timeLeft, setTimeLeft] = useState(900); // 15:00
  const [isExpired, setIsExpired] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [proofUrl, setProofUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    gender: 'Masculino',
    wallet: 'Wise',
    coordinates: '',
    paymentMethod: 'Entidade/Referência',
    termsAccepted: false,
    rateGuaranteeAccepted: false,
    bank: 'BAI',
    iban: '',
    accountHolder: ''
  });

  const [showStep1Errors, setShowStep1Errors] = useState(false);

  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [guideTab, setGuideTab] = useState<'mc' | 'mm'>('mc');

  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [activeParticipants, setActiveParticipants] = useState<number>(0);
  const [showRecoveryBanner, setShowRecoveryBanner] = useState(true);

  // Ad System State
  const [isRewardedAdModalOpen, setIsRewardedAdModalOpen] = useState(false);
  const [hasPriorityReward, setHasPriorityReward] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCheckoutOpen && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isCheckoutOpen]); // Only restart if the modal opens/closes

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const data = await SupabaseService.getRates();
      setRates(data);
      setLoading(false);
    };
    init();
  }, []);

  const handleContactOperator = (sourceTab?: 'view' | 'trade') => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    if (sourceTab === 'view') {
      setTradeAction(tradeType);
      setTradeCurrency('USD');
      setTradeAmount(terminalAmount);
    }
    setActiveParticipants(Math.floor(Math.random() * 40) + 12);
    setIsCheckoutOpen(true);
    setCurrentStep(1);
    setTimeLeft(900);
    setIsExpired(false);
  };

  // Dynamic Social Proof Logic
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveParticipants(prev => {
        const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
        return Math.max(8, prev + change);
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // PERSISTENCE: Save session
  useEffect(() => {
    if (isCheckoutOpen) {
      const session = {
        formData,
        currentStep,
        timeLeft,
        isExpired,
        timestamp: Date.now()
      };
      localStorage.setItem('ANGOLIFE_EXCHANGE_SESSION', JSON.stringify(session));
    }
  }, [formData, currentStep, timeLeft, isExpired, isCheckoutOpen]);

  // Click Outside to close dropdowns
  useEffect(() => {
    const handleGlobalClick = () => setOpenDropdown(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // PERSISTENCE: Recovery & Deep Linking
  useEffect(() => {
    const initPersistence = async () => {
      // 1. Check Deep Linking
      const params = new URLSearchParams(window.location.search);
      const orderIdParam = params.get('order_id');
      const actionParam = params.get('action');

      if (orderIdParam && actionParam === 'confirm') {
        const { data } = await supabase.from('orders').select('*').eq('id', orderIdParam).single();
        if (data) {
          setActiveOrder(data);
          setIsFeedbackModalOpen(true);
          return;
        }
      }

      // 2. Check Local Persistence
      const savedSession = localStorage.getItem('ANGOLIFE_EXCHANGE_SESSION');
      if (savedSession) {
        const session = JSON.parse(savedSession);
        const hoursPassed = (Date.now() - session.timestamp) / (1000 * 60 * 60);

        if (hoursPassed < 24) {
          // Se for uma atualização de página recente, podemos restaurar auto para Passo 3
          // Mas manter o banner visível para o usuário ter controle
          setFormData(session.formData);
          setCurrentStep(session.currentStep);
          setTimeLeft(session.timeLeft);
          setIsExpired(session.isExpired);
          
          // Se estava no passo 3, abre o modal automaticamente (UX solicitada)
          if (session.currentStep === 3) {
            setIsCheckoutOpen(true);
          }
        } else {
          localStorage.removeItem('ANGOLIFE_EXCHANGE_SESSION');
        }
      }
    };
    initPersistence();
  }, [activeOrderId]);

  // PERSISTENCE: Prevent accidential exit
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isCheckoutOpen && currentStep === 3) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isCheckoutOpen, currentStep]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // VALIDATIONS
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];

    if (file.size > maxSize) {
      alert("Arquivo muito grande. Por favor, envie uma captura de tela ou um arquivo menor que 5MB.");
      if (e.target) e.target.value = ''; // Reset input
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      alert("Tipo de arquivo não suportado. Por favor, envie um JPG, PNG ou PDF.");
      if (e.target) e.target.value = ''; // Reset input
      return;
    }

    setUploading(true);
    try {
      const url = await SupabaseService.uploadProof(file);
      if (url) {
        setProofUrl(url);
        console.log('Upload successful:', url);
      } else {
        throw new Error('Upload failed - no URL returned');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Erro ao enviar comprovativo. Verifica a tua ligação à internet e tenta novamente.');
      if (e.target) e.target.value = ''; // Reset input
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getWhatsappLink = (orderId: string, isPriority: boolean) => {
    const phone = "244900000000";
    let message = "";
    const priorityTag = isPriority ? "⚡ *PRIORITÁRIO* | " : "";
    const finalOrderId = orderId || `MANUAL-${Date.now().toString().slice(-6)}`;

    if (tradeAction === 'buy') {
      message = `${priorityTag}📥 *NOVO PEDIDO - ANGOLIFE*\n\n*ID:* ${finalOrderId}\n\n👤 *Perfil*:\nNome: ${formData.fullName}\nIdade: ${formData.age}\nGénero: ${formData.gender}\n\n🔄 *Operação*:\nTipo: COMPRA\nMontante: ${parseFloat(tradeAmount).toFixed(2)} ${tradeCurrency}\nTotal: ${totalKzFormatted}\n\n📍 *Destino*:\nCarteira: ${formData.wallet}\nID/Coord: ${formData.coordinates}\n\n💳 *Pagamento*:\nMétodo: ${formData.paymentMethod}${isExpired ? '\n\n⚠️ *TEMPO EXPIRADO*' : ''}\n\nLink do Comprovativo:\n${proofUrl || 'Não anexado'}`;
    } else {
      message = `${priorityTag}📥 *ORDEM DE VENDA - ANGOLIFE*\n\n*ID:* ${finalOrderId}\n\n👤 *CLIENTE:* ${formData.fullName}, ${formData.age}, ${formData.gender}.\n\n💰 *VALOR A ENTREGAR:* ${parseFloat(tradeAmount).toFixed(2)} ${tradeCurrency}.\n\n🏦 *RECEBER EM KWANZAS:* ${totalKzFormatted} no banco ${formData.bank}.\n\n📍 *DADOS BANCÁRIOS:* IBAN: ${formData.iban} | Titular: ${formData.accountHolder}.\n\n🕒 *STATUS DO TIMER:* ${isExpired ? '⚠️ Expirado' : 'Dentro do Prazo'}.\n\nLink do Comprovativo:\n${proofUrl || 'Não anexado'}`;
    }

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const handleFinalizeTrade = async () => {
    const isPriority = hasPriorityReward || AdService.hasActiveReward();
    const result = await executeFinalizeTrade();
    
    if (result) {
      const { orderId } = result;
      setActiveOrderId(orderId);
      const link = getWhatsappLink(orderId, isPriority);
      setWhatsappLink(link);
      
      // Se não tem recompensa ativa, mostra o modal
      if (!isPriority) {
        setIsRewardedAdModalOpen(true);
      } else {
        window.open(link, '_blank');
        finalizeCleanup();
      }
    }
  };

  const finalizeCleanup = () => {
    localStorage.removeItem('ANGOLIFE_EXCHANGE_SESSION');
    AdService.resetRewardState();
    setHasPriorityReward(false);
    setWhatsappLink(null);
    setFormData({
      fullName: '',
      age: '',
      gender: 'Masculino',
      wallet: 'Wise',
      coordinates: '',
      paymentMethod: 'Entidade/Referência',
      termsAccepted: false,
      rateGuaranteeAccepted: false,
      bank: 'BAI',
      iban: '',
      accountHolder: ''
    });
    setProofUrl(null);
    setCurrentStep(1);
  };

  const executeFinalizeTrade = async () => {
    const tradeAmountNum = parseFloat(tradeAmount) || 0;
    if (tradeAmountNum <= 0) {
      alert("Por favor, insira um montante válido.");
      return null;
    }

    const currentRate = rates.find(r => r.currency === tradeCurrency);
    const rateValue = tradeAction === 'buy' ? currentRate?.informalSell : currentRate?.informalBuy;
    
    // Integridade de Taxas: Recalcula com base no estado atual para evitar manipulação de console
    const totalKz = tradeAmountNum * (rateValue || 0);

    const orderData = {
      full_name: SupabaseService.sanitize(formData.fullName),
      age: SupabaseService.sanitize(formData.age),
      gender: formData.gender,
      wallet: tradeAction === 'buy' ? formData.wallet : null,
      coordinates: tradeAction === 'buy' ? SupabaseService.sanitize(formData.coordinates) : null,
      amount: tradeAmountNum,
      currency: tradeCurrency,
      total_kz: totalKz,
      payment_method: formData.paymentMethod,
      status: 'pending',
      proof_url: proofUrl,
      type: tradeAction,
      bank: tradeAction === 'sell' ? formData.bank : null,
      iban: tradeAction === 'sell' ? SupabaseService.sanitize(formData.iban) : null,
      account_holder: tradeAction === 'sell' ? SupabaseService.sanitize(formData.accountHolder) : null,
      user_email: userEmail || null,
    };

    try {
      const orderId = await SupabaseService.createOrder(orderData);
      
      // Mostramos Interstitial se permitido
      if (AdService.canShowInterstitial()) {
        setTimeout(() => {
          AdService.showInterstitial();
        }, 1500);
      }

      return { orderId };
    } catch (error: any) {
      console.error(error);
      const errorMsg = "Erro no registro. Redirecionando para suporte manual...";
      alert(errorMsg);
      // Retornamos um orderId fake para o link manual
      return { orderId: null };
    }
  };

  const calculateConversion = () => {
    if (!rates.length) return '0.00';
    const foreignCurrency = baseCurrency === 'AOA' ? targetCurrency : baseCurrency;
    const rateData = rates.find(r => r.currency === foreignCurrency);
    if (!rateData) return '0.00';
    const rate = isOfficial ? rateData.formalSell : rateData.informalSell;
    if (!rate) return '0.00';
    const result = baseCurrency === 'AOA' ? baseAmount / rate : baseAmount * rate;
    return result.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const currentTradeRate = rates.find(r => r.currency === tradeCurrency);
  const estimatedTotal = Math.round(((parseFloat(terminalAmount) || 0) * (tradeType === 'buy' ? (rates.find(r => r.currency === 'USD')?.informalSell || 0) : (rates.find(r => r.currency === 'USD')?.informalBuy || 0))) * 100) / 100;
  const estimatedTotalFormatted = estimatedTotal.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });

  // Derived UI Formats
  const currentRateValue = tradeAction === 'buy' ? (rates.find(r => r.currency === tradeCurrency)?.informalSell || 0) : (rates.find(r => r.currency === tradeCurrency)?.informalBuy || 0);
  const totalKz = Math.round(((parseFloat(tradeAmount) || 0) * currentRateValue) * 100) / 100;
  const totalKzFormatted = totalKz.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
  const savingsAmount = Math.round((50 * (parseFloat(tradeAmount) || 0)) * 100) / 100;
  const savingsFormatted = savingsAmount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });

  const rateData = rates.find(r => r.currency === tradeCurrency);
  const isRateValid = (rateData?.informalSell || 0) > (rateData?.informalBuy || 0) && (rateData?.informalBuy || 0) > 0;

  const isStep1Valid = () => {
    const commonValid = formData.fullName.trim() !== '' && formData.age.trim() !== '';
    if (tradeAction === 'buy') {
      return commonValid && formData.coordinates.trim() !== '';
    } else {
      return commonValid &&
        formData.iban.length === 25 &&
        formData.iban.startsWith('AO06') &&
        formData.accountHolder.trim() !== '';
    }
  };

  const LockedOverlay = ({ title }: { title: string }) => (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-md rounded-[2rem] p-6 text-center shadow-2xl">
      <Lock size={40} className="text-orange-500 mb-4" />
      <h4 className="text-white font-black uppercase text-xl mb-2">{title}</h4>
      <p className="text-slate-300 text-sm mb-6 max-w-[200px]">Crie uma conta gratuita para aceder a estas ferramentas.</p>
      <button onClick={onRequireAuth} className="bg-orange-500 text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all">Entrar agora</button>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <LiveFeed />
      {activeOrderId && <OrderCard orderId={activeOrderId} onComplete={() => { supabase.from('orders').select('*').eq('id', activeOrderId).single().then(({ data }) => { setActiveOrder(data); setIsFeedbackModalOpen(true); }); }} />}

      {/* Session Recovery Banner */}
      {!activeOrderId && showRecoveryBanner && localStorage.getItem('ANGOLIFE_EXCHANGE_SESSION') && (
        <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-2xl flex items-center justify-between gap-4 mb-8 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-full text-orange-500">
              <RefreshCw size={16} className="animate-spin-slow" />
            </div>
            <p className="text-sm font-bold text-white uppercase tracking-tight">Desejas continuar o teu pedido anterior?</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const session = JSON.parse(localStorage.getItem('ANGOLIFE_EXCHANGE_SESSION')!);
                setFormData(session.formData);
                setCurrentStep(session.currentStep);
                setTimeLeft(session.timeLeft);
                setIsExpired(session.isExpired);
                setIsCheckoutOpen(true);
              }}
              className="bg-orange-500 text-black px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 transition-all"
            >
              RECUPERAR AGORA
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('ANGOLIFE_EXCHANGE_SESSION');
                setShowRecoveryBanner(false);
              }}
              className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white"
              title="Cancelar"
              aria-label="Cancelar recuperação"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      <FeedbackModal isOpen={isFeedbackModalOpen} order={activeOrder} onClose={() => { setIsFeedbackModalOpen(false); setActiveOrderId(null); localStorage.removeItem('ANGOLIFE_EXCHANGE_SESSION'); }} />

      {/* Main Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-[orange-500] tracking-tight uppercase leading-none">CAMBIO FORMAL / INFORMAL</h2>
          <p className="text-slate-500 mt-2 font-medium text-sm">Cotações oficiais e mercado de rua em tempo real.</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-orange-500/20 shadow-sm transition-colors">
          <button onClick={() => setActiveTab('view')} className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'view' ? 'bg-[orange-500] text-white shadow-lg' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}>CONSULTAR TAXAS</button>
          <button onClick={() => setActiveTab('trade')} className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'trade' ? 'bg-slate-900 dark:bg-black text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}>COMPRAR / VENDER</button>
        </div>
      </div>

      {activeTab === 'view' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            {/* Rates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rates.map(rate => (
                <div key={rate.currency} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-orange-500/20 p-8 shadow-sm relative overflow-hidden group">
                  <div className="flex justify-between items-center mb-10">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{rate.currency} / AOA</h3>
                    <TrendingUp size={24} className="text-[orange-500] opacity-50" />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">OFICIAL (BNA)</span>
                      <div className="text-3xl font-black text-[orange-500]">{rate.formalSell.toFixed(0)} <span className="text-sm font-medium">Kz</span></div>
                    </div>
                    <div className="space-y-1 pl-6 border-l border-orange-500/10">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[orange-500]">RUA (SU-GOLDEN)</span>
                      <div className="text-3xl font-black text-[orange-500]">{rate.informalSell.toFixed(0)} <span className="text-sm font-medium">Kz</span></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Native Ad - Strategically placed */}
            <NativeAd />

            {/* Simulator Section */}
            <div className="bg-slate-100 dark:bg-slate-900 rounded-[2.5rem] border border-orange-500/20 p-10 shadow-sm relative overflow-hidden transition-colors">
              {!isAuthenticated && <LockedOverlay title="Simulador Elite" />}
              <div className={!isAuthenticated ? 'blur-md pointer-events-none' : ''}>
                <div className="flex items-center gap-3 mb-10">
                  <Calculator className="text-[orange-500]" size={28} />
                  <h3 className="text-2xl font-black uppercase text-white tracking-widest">SIMULADOR DE CONVERSÃO</h3>
                </div>

                <div className="flex justify-center mb-10">
                  <div className="bg-slate-200 dark:bg-black p-1.5 rounded-2xl flex border border-orange-500/10 shadow-inner">
                    <button onClick={() => setIsOfficial(true)} className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${isOfficial ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>BANCOS (BNA)</button>
                    <button onClick={() => setIsOfficial(false)} className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${!isOfficial ? 'bg-[orange-500] text-white shadow-lg' : 'text-slate-500 dark:text-slate-400'}`}>MERCADO INFORMAL</button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white dark:bg-black p-8 rounded-[2rem] border border-orange-500/20 shadow-sm">
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 block">VOCÊ ENVIA</span>
                    <div className="flex items-center gap-4">
                      <input type="number" value={baseAmount} onChange={e => setBaseAmount(Number(e.target.value))} className="w-full bg-transparent text-5xl font-black text-slate-900 dark:text-white outline-none" title="Enviar" />
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === 'base' ? null : 'base'); }}
                          className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 px-5 py-3 rounded-2xl border border-orange-500/20 shadow-xl"
                          title={`Trocar moeda de envio (${baseCurrency})`}
                          aria-label={`Moeda de envio atual: ${baseCurrency}`}
                        >
                          <img src={`https://flagcdn.com/${baseCurrency === 'AOA' ? 'ao' : baseCurrency === 'USD' ? 'us' : 'eu'}.svg`} className="w-6 h-6 rounded-full" alt={`${baseCurrency} flag`} />
                          <span className="font-black text-sm text-slate-900 dark:text-white">{baseCurrency}</span>
                          <ChevronDown size={16} className="text-slate-400" />
                        </button>

                        {openDropdown === 'base' && (
                          <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 border border-orange-500/20 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-fade-in">
                            {(['AOA', 'USD', 'EUR'] as const).map(cur => (
                              <button
                                key={cur}
                                onClick={() => { setBaseCurrency(cur); setOpenDropdown(null); }}
                                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-100 dark:hover:bg-white/5 transition-all text-left"
                              >
                                <img src={`https://flagcdn.com/${cur === 'AOA' ? 'ao' : cur === 'USD' ? 'us' : 'eu'}.svg`} className="w-4 h-4 rounded-full" alt={cur} />
                                <span className={`font-black text-xs uppercase tracking-widest ${baseCurrency === cur ? 'text-orange-500' : 'text-slate-500 dark:text-slate-400'}`}>{cur}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center -my-8 relative z-10">
                    <button
                      onClick={() => { setBaseCurrency(targetCurrency); setTargetCurrency(baseCurrency); }}
                      className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-orange-500/20 shadow-lg text-[orange-500] active:scale-95 transition-all"
                      title="Inverter Moedas"
                      aria-label="Inverter moedas de envio e recebimento"
                    >
                      <ArrowRightLeft size={24} />
                    </button>
                  </div>

                  <div className="bg-white dark:bg-black p-8 rounded-[2rem] border border-orange-500/20 shadow-sm">
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 block">VOCÊ RECEBE</span>
                    <div className="flex items-center gap-4">
                      <div className="w-full text-5xl font-black text-[orange-500]">{calculateConversion()}</div>
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === 'target' ? null : 'target'); }}
                          className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 px-5 py-3 rounded-2xl border border-orange-500/20 shadow-xl"
                          title={`Trocar moeda de recebimento (${targetCurrency})`}
                          aria-label={`Moeda de recebimento atual: ${targetCurrency}`}
                        >
                          <img src={`https://flagcdn.com/${targetCurrency === 'AOA' ? 'ao' : targetCurrency === 'USD' ? 'us' : 'eu'}.svg`} className="w-6 h-6 rounded-full" alt={`${targetCurrency} flag`} />
                          <span className="font-black text-sm text-slate-900 dark:text-white">{targetCurrency}</span>
                          <ChevronDown size={16} className="text-slate-400" />
                        </button>

                        {openDropdown === 'target' && (
                          <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 border border-orange-500/20 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-fade-in">
                            {(['AOA', 'USD', 'EUR'] as const).map(cur => (
                              <button
                                key={cur}
                                onClick={() => { setTargetCurrency(cur); setOpenDropdown(null); }}
                                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-100 dark:hover:bg-white/5 transition-all text-left"
                              >
                                <img src={`https://flagcdn.com/${cur === 'AOA' ? 'ao' : cur === 'USD' ? 'us' : 'eu'}.svg`} className="w-4 h-4 rounded-full" alt={cur} />
                                <span className={`font-black text-xs uppercase tracking-widest ${targetCurrency === cur ? 'text-orange-500' : 'text-slate-500 dark:text-slate-400'}`}>{cur}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t border-orange-500/20 flex justify-between items-center px-4">
                  <div className="flex items-center gap-2 text-[orange-500] text-[10px] font-black uppercase tracking-widest">
                    <Sparkles size={14} /> Melhor taxa garantida
                  </div>
                  <span className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest">1 USD = {(isOfficial ? rates.find(r => r.currency === 'USD')?.formalSell : rates.find(r => r.currency === 'USD')?.informalSell)?.toLocaleString('pt-AO')} Kz</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Terminal */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-orange-500/20 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-orange-500/10">
                <div className="flex items-center gap-3">
                  <Activity size={20} className="text-[orange-500]" />
                  <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tighter">Terminal</h3>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[9px] font-black uppercase animate-pulse border border-green-500/20">LIVE</div>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 dark:bg-black rounded-2xl border border-orange-500/20 shadow-inner">
                  <button onClick={() => setTradeType('buy')} className={`py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tradeType === 'buy' ? 'bg-[#22c55e] text-white shadow-xl shadow-green-500/20' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>COMPRAR</button>
                  <button onClick={() => setTradeType('sell')} className={`py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tradeType === 'sell' ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>VENDER</button>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-2" htmlFor="terminalAmount">MONTANTE (USD)</label>
                  <input
                    id="terminalAmount"
                    type="number"
                    value={terminalAmount}
                    onChange={e => setTerminalAmount(e.target.value)}
                    className="w-full bg-white dark:bg-black border border-orange-500/20 p-5 rounded-2xl text-slate-900 dark:text-white font-mono font-black text-lg outline-none focus:border-[orange-500] transition-all"
                    title="Montante para Câmbio"
                    aria-label="Montante em Dólares"
                  />
                </div>

                <div className="bg-slate-100 dark:bg-black p-6 rounded-2xl space-y-2 border border-orange-500/20 shadow-inner">
                  <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">TOTAL ESTIMADO (A PAGAR)</span>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-black text-[orange-500] tracking-tight">{estimatedTotalFormatted}</span>
                  </div>
                </div>

                <button onClick={() => handleContactOperator('view')} className="w-full py-6 rounded-2xl bg-[#22c55e] hover:bg-green-600 text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-green-500/40 active:scale-95 transition-all">
                  CONFIRMAR COMPRA
                </button>
                <p className="text-[9px] text-center text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest italic opacity-50">*Transação sujeita a verificação e disponibilidade.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* TRADE TAB DESIGN */
        <div className="animate-slide-up bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-orange-500/20 md:p-20 p-8 shadow-2xl relative overflow-hidden text-center">
          {!isAuthenticated && <LockedOverlay title="Negociação Direta" />}
          <div className={!isAuthenticated ? 'blur-md pointer-events-none' : 'max-w-4xl mx-auto space-y-16'}>
            <div className="space-y-4">
              <h3 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight">NEGOCIAÇÃO DIRETA</h3>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-sm tracking-widest uppercase opacity-60">Intermediação segura de câmbio informal.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button onClick={() => setTradeAction('buy')} className={`p-10 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-6 group hover:scale-[1.02] ${tradeAction === 'buy' ? 'bg-[orange-500]/10 border-[orange-500] shadow-2xl shadow-[orange-500]/20' : 'bg-slate-100 dark:bg-slate-800/20 border-orange-500/20 opacity-50'}`}>
                <div className={`p-5 rounded-full ${tradeAction === 'buy' ? 'bg-[orange-500] text-black' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                  <ArrowDownCircle size={32} />
                </div>
                <span className="font-black uppercase tracking-widest text-sm text-slate-900 dark:text-white">QUERO COMPRAR</span>
              </button>
              <button onClick={() => setTradeAction('sell')} className={`p-10 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-6 group hover:scale-[1.02] ${tradeAction === 'sell' ? 'bg-[orange-500]/10 border-[orange-500] shadow-2xl shadow-[orange-500]/20' : 'bg-slate-100 dark:bg-slate-800/20 border-orange-500/20 opacity-50'}`}>
                <div className={`p-5 rounded-full ${tradeAction === 'sell' ? 'bg-[orange-500] text-black' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                  <ArrowUpCircle size={32} />
                </div>
                <span className="font-black uppercase tracking-widest text-sm text-slate-900 dark:text-white">QUERO VENDER</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-left">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4">MOEDA</label>
                <div className="flex gap-4">
                  {['USD', 'EUR'].map(cur => (
                    <button key={cur} onClick={() => setTradeCurrency(cur as any)} className={`flex-1 py-6 rounded-2xl font-black text-lg border-2 transition-all ${tradeCurrency === cur ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-orange-500/30 shadow-2xl shadow-orange-500/10' : 'bg-slate-100 dark:bg-slate-800/50 border-orange-500/10 text-slate-500'}`}>{cur}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4" htmlFor="tradeAmount">MONTANTE ({tradeCurrency})</label>
                <input
                  id="tradeAmount"
                  type="number"
                  value={tradeAmount}
                  onChange={e => setTradeAmount(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800/50 border-2 border-orange-500/20 p-6 rounded-2xl font-black text-2xl text-[orange-500] outline-none focus:border-[orange-500] transition-all"
                  title={`Montante em ${tradeCurrency}`}
                  aria-label={`Montante em ${tradeCurrency}`}
                />
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-[#020617] p-12 rounded-[3rem] border-2 border-orange-500/20 flex flex-col md:flex-row justify-between items-center gap-10 shadow-inner">
              <div className="text-left space-y-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">TOTAL ESTIMADO EM KWANZAS</span>
                <div className="text-6xl font-black text-[orange-500]">{totalKzFormatted}</div>
              </div>
              <button onClick={() => handleContactOperator('trade')} className="w-full md:w-auto bg-[#10b981] hover:bg-[#059669] text-white px-14 py-7 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/40 active:scale-95 transition-all flex items-center justify-center gap-4">
                <MessageCircle size={28} /> FALAR NO WHATSAPP
              </button>
            </div>

            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] opacity-40">* OPERAÇÃO SUJEITA A CONFIRMAÇÃO DE STOCK E DISPONIBILIDADE.</p>
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL - REPLICA FROM IMAGE */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in">
          <div className="bg-white dark:bg-[#0f172a] w-full max-w-lg rounded-[2.5rem] border border-orange-500/30 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Status Banner */}
            {(() => {
              const hour = new Date().getHours();
              const isOnline = hour >= 8 && hour < 22;
              return (
                <div className={`w-full py-3 px-4 text-center text-[10px] font-black uppercase tracking-[0.2em] border-b ${isOnline ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'}`}>
                  {isOnline ? '⚡ Operadores Online' : '🌙 Processamento em espera (Horário de descanso)'}
                </div>
              );
            })()}
            {/* Header Section */}
            <div className="bg-slate-50 dark:bg-[#1e293b]/50 p-6 border-b border-orange-500/10 space-y-6">
              <div className="flex justify-between items-center px-2">
                <h3 className="text-sm font-black uppercase tracking-tighter text-[orange-500]">CHECKOUT CAMBIAL</h3>
                <button onClick={() => setIsCheckoutOpen(false)} title="Fechar" className="text-slate-500 hover:text-white transition-colors">
                  <ChevronDown size={20} />
                </button>
              </div>

              {/* Stepper Indicator */}
              <div className="flex justify-between items-center max-w-sm mx-auto relative px-4">
                <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-800 -z-10"></div>
                {[
                  { step: 1, label: 'DADOS' },
                  { step: 2, label: 'TERMOS' },
                  { step: 3, label: 'PAGAMENTO' }
                ].map((s, idx) => (
                  <button 
                    key={s.step} 
                    onClick={() => {
                      if (currentStep > s.step) {
                        setCurrentStep(s.step);
                      }
                    }}
                    disabled={currentStep <= s.step}
                    className="flex flex-col items-center gap-2 group outline-none"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500 
                      ${currentStep > s.step ? 'bg-green-500 text-white shadow-lg' : 
                        currentStep === s.step ? 'bg-orange-500 text-white shadow-lg animate-pulse' : 
                        'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                      {currentStep > s.step ? <CheckCircle size={16} /> : s.step}
                    </div>
                    <span className={`text-[8px] font-black uppercase tracking-widest ${currentStep >= s.step ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600'}`}>
                      {s.label} {currentStep > s.step && '(Concluído)'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            {/* Body */}
            <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1">
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h4 className="text-slate-900 dark:text-white font-black uppercase tracking-widest text-sm mb-4">Passo 1: {tradeAction === 'buy' ? 'Identificação' : 'Dados de Recebimento'}</h4>
                  </div>

                  {/* ORDER SUMMARY BOX */}
                  <div className="grid grid-cols-1 gap-4 mb-6">
                    <div className="bg-slate-50 dark:bg-black border border-orange-500/20 dark:border-[orange-500]/30 p-8 rounded-3xl space-y-4 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <ArrowRightLeft size={40} className="text-[orange-500]" />
                      </div>
                      <div className="flex flex-col items-center gap-1 relative">
                        <span className="text-4xl font-black text-slate-900 dark:text-white">{totalKzFormatted}</span>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total a {tradeAction === 'buy' ? 'entregar' : 'receber'}</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-black border border-orange-500/20 p-8 rounded-3xl space-y-4 shadow-sm">
                      <div className="flex justify-between items-center px-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{tradeAction === 'buy' ? 'RECEBES' : 'ENTREGAS'}</span>
                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em]">Câmbio: 1 USD = {currentRateValue.toLocaleString('pt-AO')} Kz</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-4xl font-black text-slate-900 dark:text-white">{parseFloat(tradeAmount).toFixed(2)} {tradeCurrency}</span>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{tradeCurrency === 'USD' ? 'Dólares' : 'Euros'} Digitais</span>
                      </div>
                    </div>
                  </div>

                  {/* RATE VALIDATION ALERT */}
                  {!isRateValid && (
                    <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl flex flex-col items-center gap-3 animate-pulse text-center">
                      <div className="p-3 bg-red-500/20 rounded-full text-red-500">
                        <Activity size={24} />
                      </div>
                      <div className="space-y-1">
                        <span className="block text-[10px] font-black text-red-500 uppercase tracking-widest">ALERTA DE SISTEMA</span>
                        <p className="text-xs font-bold text-white leading-tight">Sistema em atualização de taxas. Por favor, tente novamente em instantes.</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Dados Pessoais</label>
                    <div className="space-y-1">
                      <input
                        className={`w-full bg-white dark:bg-slate-900 border ${showStep1Errors && !formData.fullName ? 'border-red-500' : 'border-orange-500/20'} p-5 rounded-2xl font-bold text-slate-900 dark:text-white outline-none focus:border-[orange-500] transition-colors`}
                        placeholder="Nome Completo *"
                        value={formData.fullName}
                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                      />
                      {showStep1Errors && !formData.fullName && <p className="text-[9px] text-red-500 font-bold ml-2 uppercase">Campo obrigatório</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <input
                          type="number"
                          className={`w-full bg-white dark:bg-slate-900 border ${showStep1Errors && !formData.age ? 'border-red-500' : 'border-orange-500/20'} p-5 rounded-2xl font-bold text-slate-900 dark:text-white outline-none focus:border-[orange-500] transition-colors`}
                          placeholder="Idade"
                          value={formData.age}
                          onChange={e => setFormData({ ...formData, age: e.target.value })}
                        />
                        {showStep1Errors && !formData.age && <p className="text-[9px] text-red-500 font-bold ml-2 uppercase">Campo obrigatório</p>}
                      </div>
                      <select
                        title="Gênero"
                        className="w-full bg-white dark:bg-slate-900 border border-orange-500/20 p-5 rounded-2xl font-bold text-slate-900 dark:text-white outline-none focus:border-[orange-500]"
                        value={formData.gender}
                        onChange={e => setFormData({ ...formData, gender: e.target.value })}
                      >
                        <option>Masculino</option>
                        <option>Feminino</option>
                        <option>Prefiro não dizer</option>
                      </select>
                    </div>
                  </div>

                  {tradeAction === 'buy' ? (
                    <>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Escolha sua Carteira Digital</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {['Wise', 'PayPal', 'Revolut', 'Redotpay', 'Bybit', 'Jeton', 'Binance', 'Outros'].map(w => (
                            <button
                              key={w}
                              onClick={() => setFormData({ ...formData, wallet: w })}
                               className={`p-3 rounded-xl border-2 font-bold text-[10px] transition-all uppercase tracking-tighter ${formData.wallet === w ? 'bg-[orange-500]/10 border-[orange-500] text-slate-900 dark:text-white' : 'bg-white dark:bg-slate-900 border-orange-500/10 text-slate-500'}`}
                            >
                              {w}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Coordenada / ID da Carteira *</label>
                        <div className="space-y-1">
                           <input
                            className={`w-full bg-white dark:bg-slate-900 border-2 ${showStep1Errors && !formData.coordinates ? 'border-red-500' : 'border-orange-500/20'} p-5 rounded-2xl font-bold text-slate-900 dark:text-white outline-none focus:border-[orange-500] transition-colors`}
                            placeholder={
                              formData.wallet === 'Binance' ? "Insira Pay ID" :
                                formData.wallet === 'Wise' || formData.wallet === 'PayPal' ? "Insira E-mail" :
                                  "Insira ID ou Coordenada"
                            }
                            value={formData.coordinates}
                            onChange={e => setFormData({ ...formData, coordinates: e.target.value })}
                          />
                          {showStep1Errors && !formData.coordinates && <p className="text-[9px] text-red-500 font-bold ml-2 uppercase">Insira a coordenada</p>}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Dados Bancários para Receber Kwanza</label>
                      <select
                        title="Banco de Destino"
                        className="w-full bg-white dark:bg-slate-900 border border-orange-500/20 p-5 rounded-2xl font-bold text-slate-900 dark:text-white outline-none focus:border-[orange-500]"
                        value={formData.bank}
                        onChange={e => setFormData({ ...formData, bank: e.target.value })}
                      >
                        {['BAI', 'BFA', 'ATLÂNTICO', 'PAYPAY'].map(b => (
                          <option key={b}>{b}</option>
                        ))}
                      </select>
                      <div className="space-y-1">
                        <input
                          className={`w-full bg-white dark:bg-slate-900 border ${showStep1Errors && (formData.iban.length !== 25 || !formData.iban.startsWith('AO06')) ? 'border-red-500' : 'border-orange-500/20'} p-5 rounded-2xl font-bold text-slate-900 dark:text-white outline-none focus:border-[orange-500] transition-colors`}
                          placeholder="IBAN (AO06...) *"
                          value={formData.iban}
                          maxLength={25}
                          onChange={e => {
                            let val = e.target.value.toUpperCase().replace(/\s/g, '');
                            // Force prefix and restrict to digits
                            if (!val.startsWith('AO06')) {
                              val = 'AO06' + val.replace(/\D/g, '');
                            } else {
                              const prefix = 'AO06';
                              const rest = val.slice(4).replace(/\D/g, '');
                              val = prefix + rest;
                            }
                            if (val.length <= 25) {
                              setFormData({ ...formData, iban: val });
                            }
                          }}
                        />
                        {showStep1Errors && formData.iban.length < 25 && <p className="text-[9px] text-red-500 font-bold ml-2 uppercase">IBAN incompleto (25 dígitos)</p>}
                      </div>
                      <div className="space-y-1">
                        <input
                          className={`w-full bg-white dark:bg-slate-900 border ${showStep1Errors && !formData.accountHolder ? 'border-red-500' : 'border-orange-500/20'} p-5 rounded-2xl font-bold text-slate-900 dark:text-white outline-none focus:border-[orange-500] transition-colors`}
                          placeholder="Nome do Titular da Conta *"
                          value={formData.accountHolder}
                          onChange={e => setFormData({ ...formData, accountHolder: e.target.value })}
                        />
                        {showStep1Errors && !formData.accountHolder && <p className="text-[9px] text-red-500 font-bold ml-2 uppercase">Campo obrigatório</p>}
                      </div>
                    </div>
                  )}

                  {/* SAVINGS INDICATOR (SPREAD) */}
                  {tradeAmount > 0 && (
                    <div className="bg-green-500/5 border border-green-500/10 p-4 rounded-2xl flex items-center gap-3 animate-pulse">
                      <div className="bg-green-500/20 p-2 rounded-full text-green-500">
                        <Sparkles size={16} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-green-500 uppercase tracking-widest whitespace-nowrap">Economia AngoLife</span>
                        <span className="text-xs font-bold text-white leading-tight">
                          Estás a poupar aproximadamente <span className="text-green-500">{savingsFormatted}</span> em comparação às taxas médias de rua.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-8 py-10 flex flex-col items-center justify-center text-center animate-fade-in">
                  <div className="p-8 bg-[orange-500]/5 rounded-full border border-[orange-500]/10">
                    <Shield size={56} className="text-[orange-500] opacity-80" />
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-slate-900 dark:text-white font-black uppercase tracking-[0.2em] text-lg">Protocolo de {tradeAction === 'buy' ? 'Segurança' : 'Venda'}</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest max-w-[320px] leading-relaxed">
                      {tradeAction === 'buy'
                        ? "Para prosseguir, é necessário confirmar a aceitação dos nossos protocolos operacionais e de segurança."
                        : "Declaro que os ativos digitais são de minha propriedade e assumo total responsabilidade pelos dados bancários fornecidos."}
                    </p>
                  </div>

                  <label className="flex items-center gap-4 cursor-pointer group bg-slate-100 dark:bg-slate-900/40 p-5 rounded-2xl border border-orange-500/20 hover:border-[orange-500]/30 transition-all">
                    <input
                      type="checkbox"
                      className="w-6 h-6 rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-transparent accent-[orange-500] cursor-pointer"
                      checked={formData.termsAccepted}
                      onChange={e => setFormData({ ...formData, termsAccepted: e.target.checked })}
                    />
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest group-hover:text-slate-900 dark:group-hover:text-white transition-colors text-left leading-tight">
                      Li e aceito os <span onClick={(e) => { e.preventDefault(); setIsTermsModalOpen(true); }} className="text-[orange-500] hover:text-amber-600 transition-colors underline underline-offset-4 decoration-amber-500/20">Termos de Serviço e Políticas de Operação</span>
                    </span>
                  </label>

                  <label className="flex items-center gap-4 cursor-pointer group bg-slate-100 dark:bg-slate-900/40 p-5 rounded-2xl border border-orange-500/20 hover:border-[orange-500]/30 transition-all">
                    <input
                      type="checkbox"
                      className="w-6 h-6 rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-transparent accent-[orange-500] cursor-pointer"
                      checked={formData.rateGuaranteeAccepted}
                      onChange={e => setFormData({ ...formData, rateGuaranteeAccepted: e.target.checked })}
                    />
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest group-hover:text-slate-900 dark:group-hover:text-white transition-colors text-left leading-tight">
                      Compreendo que a taxa é garantida por 15 min
                    </span>
                  </label>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6 animate-fade-in px-2">
                  {/* URGENCE TIMER BOX */}
                  <div className="border-2 border-[orange-500] rounded-2xl p-5 flex items-center justify-between bg-[orange-500]/5 relative overflow-hidden">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-[orange-500]/10 rounded-lg">
                        <RefreshCw size={24} className={`text-[orange-500] ${!isExpired ? 'animate-spin' : ''}`} style={{ '--spin-duration': '3s' } as React.CSSProperties} />
                      </div>
                      <div>
                        <span className="block text-[9px] font-black text-[orange-500] uppercase tracking-[0.2em] opacity-70">TEMPO RESTANTE</span>
                        <span className="text-2xl font-mono font-black text-slate-900 dark:text-white">{formatTime(timeLeft)}</span>
                      </div>
                    </div>
                    <div className="text-right max-w-[120px]">
                      <span className="text-[8px] font-bold text-slate-400 uppercase leading-tight tracking-tighter">A TAXA SERÁ ATUALIZADA EM BREVE</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/30 rounded-3xl border border-orange-500/20 p-6 space-y-4">
                    <div className="mb-4">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{tradeAction === 'buy' ? 'DADOS PARA PAGAMENTO' : 'ENTREGAR ATIVOS (ANGOLIFE)'}</span>
                    </div>

                    <div className="space-y-3">
                      {tradeAction === 'buy' ? (
                        [
                          { label: 'ENTIDADE', val: '10116' },
                          { label: 'REFERÊNCIA', val: '921 967 112' }
                        ].map(m => (
                          <div key={m.label} className="flex justify-between items-center p-4 bg-white dark:bg-black rounded-2xl border border-orange-500/20 hover:border-orange-500/50 transition-all group shadow-sm">
                            <div className="space-y-1">
                              <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">{m.label}</span>
                               <span className="text-lg font-mono font-black text-slate-900 dark:text-white tracking-widest">{m.val}</span>
                            </div>
                            <button onClick={() => handleCopy(m.val)} className="p-3 text-slate-500 hover:text-[orange-500] transition-colors" title="Copiar">
                              <Copy size={16} />
                            </button>
                          </div>
                        ))
                      ) : (
                        [
                          { label: 'ID BINANCE (PAY ID)', val: '821967221' },
                          { label: 'WISE / PAYPAL', val: 'info@angolife.site' }
                        ].map(m => (
                          <div key={m.label} className="flex justify-between items-center p-4 bg-white dark:bg-black rounded-2xl border border-orange-500/20 hover:border-orange-500/50 transition-all group shadow-sm">
                            <div className="space-y-1">
                              <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">{m.label}</span>
                               <span className="text-lg font-mono font-black text-slate-900 dark:text-white tracking-tight">{m.val}</span>
                            </div>
                            <button onClick={() => handleCopy(m.val)} className="p-3 text-slate-500 hover:text-[orange-500] transition-colors" title="Copiar">
                              <Copy size={16} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="text-center pt-2">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                        {tradeAction === 'buy' ? 'Aceitamos Unitel Money e Afrimoney' : 'Pagamento imediato via BAI/BFA após confirmação'}
                      </span>
                    </div>
                  </div>

                  {tradeAction === 'buy' && (
                    <div className="bg-slate-900/50 rounded-2xl border border-white/5 overflow-hidden transition-all">
                      <button
                        onClick={() => setIsGuideOpen(!isGuideOpen)}
                        className="w-full p-4 flex justify-between items-center hover:bg-white/5 transition-colors"
                      >
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <span className="text-[orange-500]">❔</span> Como efetuar o pagamento?
                        </span>
                        <ChevronDown size={14} className={`text-slate-500 transition-transform duration-300 ${isGuideOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isGuideOpen && (
                        <div className="p-4 pt-0 space-y-4 animate-slide-up">
                          <div className="flex bg-[#020617] p-1 rounded-xl border border-white/5">
                            <button
                              onClick={() => setGuideTab('mc')}
                              className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${guideTab === 'mc' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500'}`}
                            >
                              Multicaixa
                            </button>
                            <button
                              onClick={() => setGuideTab('mm')}
                              className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${guideTab === 'mm' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500'}`}
                            >
                              Mobile Money
                            </button>
                          </div>

                          <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                            {guideTab === 'mc' ? (
                              [
                                "Menu Pagamentos",
                                "Pagamento de Serviços",
                                "Pagamentos por Referência",
                                "Inserir dados e confirmar"
                              ].map((step, idx) => (
                                <div key={idx} className="flex items-center gap-3 bg-slate-800/30 p-3 rounded-xl border border-white/5">
                                  <div className="w-5 h-5 rounded-full bg-[orange-500]/10 border border-[orange-500]/20 flex items-center justify-center text-[9px] font-black text-[orange-500]">{idx + 1}</div>
                                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">{step}</span>
                                </div>
                              ))
                            ) : (
                              [
                                "Escolha a sua carteira (Unitel/Afri)",
                                "Realize a transferência para os dados exibidos acima"
                              ].map((step, idx) => (
                                <div key={idx} className="flex items-center gap-3 bg-slate-800/30 p-3 rounded-xl border border-white/5">
                                  <div className="w-5 h-5 rounded-full bg-[orange-500]/10 border border-[orange-500]/20 flex items-center justify-center text-[9px] font-black text-[orange-500]">{idx + 1}</div>
                                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">{step}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {tradeAction === 'sell' && (
                    <div className="bg-orange-500/5 border border-orange-500/20 p-4 rounded-xl">
                      <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest leading-relaxed">
                        ⚠️ Coordenação de rede (TRC20/BEP20) feita exclusivamente via WhatsApp após confirmação do envio.
                      </p>
                    </div>
                  )}

                  {/* SOCIAL PROOF */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center justify-center gap-2">
                      <Sparkles size={12} className="text-[orange-500] animate-pulse" />
                      <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em]">{activeParticipants} PESSOAS CONSULTANDO ESTA TAXA AGORA</span>
                    </div>

                    {/* SUPPORT BUTTON */}
                    <div className="flex justify-end w-full">
                      <button
                        onClick={() => {
                          const msg = `Olá AngoLife! Estou no meio de uma operação de ${tradeAction === 'buy' ? 'Compra' : 'Venda'} e tive um problema. Podem ajudar?`;
                          window.open(`https://wa.me/244900000000?text=${encodeURIComponent(msg)}`, '_blank');
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800/40 backdrop-blur-sm border border-white/5 rounded-full hover:bg-slate-800/60 transition-all group"
                      >
                        <MessageCircle size={12} className="text-slate-500 group-hover:text-orange-500 transition-colors" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">Problemas com o pagamento?</span>
                      </button>
                    </div>
                  </div>

                  {/* PROOF UPLOAD */}
                  <div
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 py-12 text-center transition-all flex flex-col items-center gap-3 ${uploading
                      ? 'border-[orange-500]/50 bg-[orange-500]/5 cursor-wait'
                      : proofUrl
                        ? 'border-green-500/50 bg-green-500/5 cursor-default'
                        : 'border-slate-800 hover:border-[orange-500]/50 hover:bg-[orange-500]/5 cursor-pointer group'
                      }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.pdf"
                      title="Anexar Comprovativo"
                      aria-label="Anexar Comprovativo de Pagamento"
                    />
                    {uploading ? (
                      <RefreshCw className="text-[orange-500] animate-spin" size={32} />
                    ) : proofUrl ? (
                      <CheckCircle className="text-green-500" size={32} />
                    ) : (
                      <Upload className="text-slate-600 group-hover:text-[orange-500] transition-colors" size={32} />
                    )}
                    <div className="flex flex-col gap-1">
                      <span className={`text-[10px] font-black uppercase tracking-[0.1em] transition-colors ${uploading
                        ? 'text-[orange-500]'
                        : proofUrl
                          ? 'text-green-500'
                          : 'text-slate-500 group-hover:text-white'
                        }`}>
                        {uploading ? 'A ENVIAR COMPROVATIVO...' : (proofUrl ? '✓ COMPROVATIVO ANEXADO' : 'CLIQUE PARA ANEXAR COMPROVATIVO')}
                      </span>
                      {!uploading && !proofUrl && (
                        <span className="text-[8px] font-bold text-slate-600 uppercase tracking-wider">
                          JPG, PNG ou PDF (máx. 5MB)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Section */}
            <div className="p-8 bg-slate-50 dark:bg-slate-950/50 border-t border-orange-500/20 flex gap-4">
              <button
                onClick={() => currentStep === 1 ? setIsCheckoutOpen(false) : setCurrentStep(s => s - 1)}
                className="px-8 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 transition-all border border-white/5 active:scale-95"
              >
                VOLTAR
              </button>

              {currentStep < 3 ? (
                <button
                  onClick={() => {
                    if (currentStep === 1) {
                      if (isStep1Valid()) {
                        setCurrentStep(2);
                        setShowStep1Errors(false);
                      } else {
                        setShowStep1Errors(true);
                      }
                    } else {
                      setCurrentStep(s => s + 1);
                    }
                  }}
                  disabled={!isRateValid || (currentStep === 2 && (!formData.termsAccepted || !formData.rateGuaranteeAccepted))}
                  className={`flex-1 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl transition-all ${!isRateValid || (currentStep === 2 && (!formData.termsAccepted || !formData.rateGuaranteeAccepted)) ? 'bg-slate-800 text-slate-600 opacity-50 cursor-not-allowed' : 'bg-[orange-500] text-black hover:bg-orange-500 active:scale-95'}`}
                >
                  PRÓXIMO
                </button>
              ) : (
                <button
                  onClick={handleFinalizeTrade}
                  className="flex-1 py-5 rounded-2xl bg-[#10b981] hover:bg-[#059669] text-white font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <MessageCircle size={20} /> CONFIRMAR E ENVIAR
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TERMS MODAL - PROFESSIONAL TEXT */}
      {isTermsModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in">
          <div className="bg-white dark:bg-[#0f172a] w-full max-w-2xl rounded-[2.5rem] border border-orange-500/30 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-8 border-b border-orange-500/10 flex justify-between items-center">
              <div className="space-y-1">
                <h3 className="text-xl font-black uppercase tracking-tighter text-[orange-500]">TERMOS DE SERVIÇO</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Protocolo de Segurança Digital</p>
              </div>
              <button title="Fechar" onClick={() => setIsTermsModalOpen(false)} className="p-3 bg-slate-700/50 rounded-full text-slate-400 hover:text-white hover:bg-red-500/20 transition-all"><X size={20} /></button>
            </div>

            <div className="p-10 overflow-y-auto custom-scrollbar text-xs text-slate-400 space-y-8 leading-relaxed">
              <div className="space-y-8">
                <section className="space-y-3">
                  <h5 className="font-black text-slate-900 dark:text-white uppercase text-[11px] tracking-[0.2em] flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[orange-500] rounded-full"></div>
                    1. NATUREZA DA MEDIAÇÃO TECNOLÓGICA
                  </h5>
                  <p className="text-justify opacity-80 pl-4 border-l border-[orange-500]/20">A AngoLife opera estritamente como uma plataforma de tecnologia e agregação de dados para facilitar a intenção de troca de ativos digitais. O USUÁRIO declara estar ciente de que a AngoLife não é uma instituição bancária ou casa de câmbio física, atuando apenas como interface para a liquidação de trocas privadas entre carteiras digitais e moeda nacional.</p>
                </section>

                <section className="space-y-3">
                  <h5 className="font-black text-slate-900 dark:text-white uppercase text-[11px] tracking-[0.2em] flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[orange-500] rounded-full"></div>
                    2. RESPONSABILIDADE CIVIL SOBRE DADOS DE DESTINO
                  </h5>
                  <p className="text-justify opacity-80 pl-4 border-l border-[orange-500]/20">Ao preencher os campos de "Coordenadas" ou "ID da Carteira", o USUÁRIO assume responsabilidade total e exclusiva pela exatidão dos dados fornecidos. Devido à natureza irreversível das transações em redes Blockchain e sistemas de pagamento internacional (Wise, PayPal, Binance, etc.), a AngoLife EXIME-SE de qualquer dever de ressarcimento ou recuperação de valores em caso de erro de digitação por parte do usuário.</p>
                </section>

                <section className="space-y-3">
                  <h5 className="font-black text-slate-900 dark:text-white uppercase text-[11px] tracking-[0.2em] flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[orange-500] rounded-full"></div>
                    3. PROTOCOLO DE URGÊNCIA E JANELA DE 15 MINUTOS
                  </h5>
                  <div className="text-justify opacity-80 pl-4 border-l border-[orange-500]/20 space-y-2">
                    <p>A taxa de câmbio apresentada é garantida exclusivamente por uma janela de 15 (quinze) minutos a partir do início da operação.</p>
                    <p>3.1. Após a expiração do cronómetro, a cotação é considerada obsoleta.</p>
                    <p>3.2. Caso o pagamento seja efetuado após os 15 minutos, a AngoLife reserva-se o direito de reajustar o montante final de ativos a enviar com base na taxa de mercado no exato momento da validação do comprovativo.</p>
                  </div>
                </section>

                <section className="space-y-3">
                  <h5 className="font-black text-slate-900 dark:text-white uppercase text-[11px] tracking-[0.2em] flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[orange-500] rounded-full"></div>
                    4. POLÍTICA ANTI-FRAUDE E COMPROVATIVOS
                  </h5>
                  <p className="text-justify opacity-80 pl-4 border-l border-[orange-500]/20">Em conformidade com as normas de segurança, não são aceites comprovativos de "transferências agendadas" ou "em processamento" como prova de liquidação. A entrega dos ativos digitais está estritamente condicionada à entrada efetiva, irrevogável e verificada dos fundos na conta de destino da plataforma. Tentativas de fraude com documentos editados resultarão em bloqueio imediato e reporte às autoridades.</p>
                </section>

                <section className="space-y-3">
                  <h5 className="font-black text-slate-900 dark:text-white uppercase text-[11px] tracking-[0.2em] flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[orange-500] rounded-full"></div>
                    5. DECLARAÇÃO DE ORIGEM LÍCITA
                  </h5>
                  <p className="text-justify opacity-80 pl-4 border-l border-[orange-500]/20">Ao prosseguir com a operação, o USUÁRIO declara, sob as penas da lei, que os fundos utilizados para a troca possuem origem lícita e não são provenientes de atividades ilícitas, lavagem de dinheiro ou financiamento de atos criminosos.</p>
                </section>

                <section className="space-y-3">
                  <h5 className="font-black text-slate-900 dark:text-white uppercase text-[11px] tracking-[0.2em] flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[orange-500] rounded-full"></div>
                    6. ACEITAÇÃO IRREVOGÁVEL
                  </h5>
                  <p className="text-justify opacity-80 pl-4 border-l border-[orange-500]/20">Ao clicar em "Concordo e Avançar", o USUÁRIO confirma ter lido, compreendido e aceite todos os termos deste protocolo, renunciando a qualquer direito de contestação sobre flutuações cambiais verificadas após o tempo limite ou erros nos dados de destino por si inseridos.</p>
                </section>
              </div>
            </div>

            <div className="p-8 bg-slate-50 dark:bg-slate-900/80 border-t border-orange-500/10">
              <button onClick={() => { setFormData(p => ({ ...p, termsAccepted: true })); setIsTermsModalOpen(false); }} className="w-full bg-[orange-500] text-black py-5 rounded-2xl font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:bg-orange-500 active:scale-95 transition-all">
                CONCORDO E AVANÇAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REWARDED AD MODAL - Fast Pass for WhatsApp */}
      <RewardedAdModal
        isOpen={isRewardedAdModalOpen}
        onClose={() => {
          setIsRewardedAdModalOpen(false);
          finalizeCleanup();
        }}
        onRewardEarned={() => {
          AdService.markRewardCompleted();
          setHasPriorityReward(true);
          // Regenerar link com prioridade
          const priorityLink = getWhatsappLink(activeOrderId || '', true);
          setWhatsappLink(priorityLink);
          return priorityLink; // Retornar para o modal usar imediatamente
        }}
        onSkip={() => {
          // Link já está setado sem prioridade
        }}
        whatsappLink={whatsappLink}
        onFinalize={finalizeCleanup}
      />
    </div>
  );
};
