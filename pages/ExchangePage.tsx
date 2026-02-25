
import React, { useEffect, useState } from 'react';
import { RefreshCw, X, MessageCircle } from 'lucide-react';
import { ExchangeRatesGrid } from '../components/ExchangeRatesGrid';
import { ConversionSimulator } from '../components/ConversionSimulator';
import { TradeTerminal } from '../components/TradeTerminal';
import { DirectTradeSection } from '../components/DirectTradeSection';
import { ExchangeCheckoutModal } from '../components/ExchangeCheckoutModal';
import { TermsModal } from '../components/TermsModal';
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
import { APP_CONFIG } from '../constants';

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
    const phone = APP_CONFIG.WHATSAPP_NUMBER;
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
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-fluid-h2 font-black text-orange-500 tracking-tight uppercase leading-none">CAMBIO FORMAL / INFORMAL</h2>
          <p className="text-slate-500 mt-2 font-medium text-xs md:text-sm">Cotações oficiais e mercado de rua em tempo real.</p>
        </div>
        <div className="flex w-full lg:w-auto bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-orange-500/20 shadow-sm transition-colors overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('view')} className={`flex-1 lg:flex-none px-6 md:px-8 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'view' ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}>CONSULTAR TAXAS</button>
          <button onClick={() => setActiveTab('trade')} className={`flex-1 lg:flex-none px-6 md:px-8 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'trade' ? 'bg-slate-900 dark:bg-black text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}>COMPRAR / VENDER</button>
        </div>
      </div>

      {activeTab === 'view' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <div className="flex-1 space-y-12">
              <ExchangeRatesGrid rates={rates} />

              <ConversionSimulator
                isAuthenticated={isAuthenticated}
                onRequireAuth={onRequireAuth}
                rates={rates}
                baseAmount={baseAmount}
                setBaseAmount={setBaseAmount}
                isOfficial={isOfficial}
                setIsOfficial={setIsOfficial}
                baseCurrency={baseCurrency}
                setBaseCurrency={setBaseCurrency}
                targetCurrency={targetCurrency}
                setTargetCurrency={setTargetCurrency}
                openDropdown={openDropdown}
                setOpenDropdown={setOpenDropdown}
              />
            </div>

            {/* Native Ad - Strategically placed */}
            <NativeAd />
          </div>

          {/* Sidebar Terminal */}
          <div className="lg:col-span-4">
            <TradeTerminal
              rates={rates}
              tradeType={tradeType}
              setTradeType={setTradeType}
              terminalAmount={terminalAmount}
              setTerminalAmount={setTerminalAmount}
              handleContactOperator={handleContactOperator}
            />
          </div>
        </div>
      ) : (
        /* TRADE TAB DESIGN */
        <DirectTradeSection
          isAuthenticated={isAuthenticated}
          onRequireAuth={onRequireAuth}
          rates={rates}
          tradeAction={tradeAction}
          setTradeAction={setTradeAction}
          tradeCurrency={tradeCurrency}
          setTradeCurrency={setTradeCurrency}
          tradeAmount={tradeAmount}
          setTradeAmount={setTradeAmount}
          handleContactOperator={handleContactOperator}
        />
      )}

      {/* CHECKOUT MODAL - REPLICA FROM IMAGE */}
      <ExchangeCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        tradeAction={tradeAction}
        tradeAmount={tradeAmount}
        tradeCurrency={tradeCurrency}
        rates={rates}
        formData={formData}
        setFormData={setFormData}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        timeLeft={timeLeft}
        isExpired={isExpired}
        uploading={uploading}
        handleFileUpload={handleFileUpload}
        proofUrl={proofUrl}
        handleFinalizeTrade={handleFinalizeTrade}
        showStep1Errors={showStep1Errors}
        setShowStep1Errors={setShowStep1Errors}
        activeParticipants={activeParticipants}
        isGuideOpen={isGuideOpen}
        setIsGuideOpen={setIsGuideOpen}
        guideTab={guideTab}
        setGuideTab={setGuideTab}
        setIsTermsModalOpen={setIsTermsModalOpen}
        handleCopy={handleCopy}
        formatTime={formatTime}
      />

      <TermsModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        onAccept={() => {
          setFormData(p => ({ ...p, termsAccepted: true }));
          setIsTermsModalOpen(false);
        }}
      />

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
