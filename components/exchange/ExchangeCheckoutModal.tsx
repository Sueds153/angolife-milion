import React, { useRef } from 'react';
import { ChevronDown, CheckCircle, ArrowRightLeft, MessageCircle } from 'lucide-react';
import { ExchangeRate } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { OrderService } from '../../services/api/order.service';
import { NotificationService } from '../../services/integrations/notificationService';
import { APP_CONFIG } from '../../constants/app';
import { ExchangeStepIdentity } from './ExchangeStepIdentity';
import { ExchangeStepTerms } from './ExchangeStepTerms';
import { ExchangeStepPayment } from './ExchangeStepPayment';

interface ExchangeCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradeAction: 'buy' | 'sell';
  tradeAmount: string;
  tradeCurrency: 'USD' | 'EUR';
  rates: ExchangeRate[];
  formData: any;
  setFormData: (data: any) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  timeLeft: number;
  isExpired: boolean;
  uploading: boolean;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  proofUrl: string | null;
  handleFinalizeTrade: () => void;
  showStep1Errors: boolean;
  setShowStep1Errors: (show: boolean) => void;
  activeParticipants: number;
  isGuideOpen: boolean;
  setIsGuideOpen: (open: boolean) => void;
  guideTab: 'mc' | 'mm';
  setGuideTab: (tab: 'mc' | 'mm') => void;
  setIsTermsModalOpen: (open: boolean) => void;
  handleCopy: (text: string) => void;
  formatTime: (seconds: number) => string;
}

export const ExchangeCheckoutModal: React.FC<ExchangeCheckoutModalProps> = ({
  isOpen,
  onClose,
  tradeAction,
  tradeAmount,
  tradeCurrency,
  rates,
  formData,
  setFormData,
  currentStep,
  setCurrentStep,
  timeLeft,
  isExpired,
  uploading,
  handleFileUpload,
  proofUrl,
  handleFinalizeTrade,
  showStep1Errors,
  setShowStep1Errors,
  activeParticipants,
  isGuideOpen,
  setIsGuideOpen,
  guideTab,
  setGuideTab,
  setIsTermsModalOpen,
  handleCopy,
  formatTime
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentRateValue = tradeAction === 'buy' ? (rates.find(r => r.currency === tradeCurrency)?.informalSell || 0) : (rates.find(r => r.currency === tradeCurrency)?.informalBuy || 0);
  const totalKz = Math.round(((parseFloat(tradeAmount) || 0) * currentRateValue) * 100) / 100;
  const totalKzFormatted = totalKz.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
  const savingsAmount = Math.round((50 * (parseFloat(tradeAmount) || 0)) * 100) / 100;
  const savingsFormatted = savingsAmount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
  const isRateValid = (rates.find(r => r.currency === tradeCurrency)?.informalSell || 0) > (rates.find(r => r.currency === tradeCurrency)?.informalBuy || 0) && (rates.find(r => r.currency === tradeCurrency)?.informalBuy || 0) > 0;

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

  const hour = new Date().getHours();
  const isOnline = hour >= APP_CONFIG.OPERATIONAL_HOURS.START && hour < APP_CONFIG.OPERATIONAL_HOURS.END;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in">
      <div className="bg-white dark:bg-[#0f172a] w-full max-w-lg rounded-[2.5rem] border border-orange-500/30 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className={`w-full py-3 px-4 text-center text-[10px] font-black uppercase tracking-[0.2em] border-b ${isOnline ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'}`}>
          {isOnline ? '⚡ Operadores Online' : '🌙 Processamento em espera (Horário de descanso)'}
        </div>

        <div className="bg-slate-50 dark:bg-[#1e293b]/50 p-6 border-b border-orange-500/10 space-y-6">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-sm font-black uppercase tracking-tighter text-[orange-500]">CHECKOUT CAMBIAL</h3>
            <button onClick={onClose} title="Fechar" className="text-slate-500 hover:text-white transition-colors">
              <ChevronDown size={20} />
            </button>
          </div>

          <div className="flex justify-between items-center max-w-sm mx-auto relative px-4">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-800 -z-10"></div>
            {[
              { step: 1, label: 'DADOS' },
              { step: 2, label: 'TERMOS' },
              { step: 3, label: 'PAGAMENTO' }
            ].map((s) => (
              <button
                key={s.step}
                onClick={() => { if (currentStep > s.step) setCurrentStep(s.step); }}
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

        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1">
          {currentStep === 1 && (
            <ExchangeStepIdentity
              tradeAction={tradeAction}
              tradeAmount={tradeAmount}
              tradeCurrency={tradeCurrency}
              totalKzFormatted={totalKzFormatted}
              currentRateValue={currentRateValue}
              isRateValid={isRateValid}
              formData={formData}
              setFormData={setFormData}
              showStep1Errors={showStep1Errors}
              savingsFormatted={savingsFormatted}
            />
          )}

          {currentStep === 2 && (
            <ExchangeStepTerms
              tradeAction={tradeAction}
              formData={formData}
              setFormData={setFormData}
              setIsTermsModalOpen={setIsTermsModalOpen}
            />
          )}

          {currentStep === 3 && (
            <ExchangeStepPayment
              tradeAction={tradeAction}
              timeLeft={timeLeft}
              isExpired={isExpired}
              formatTime={formatTime}
              handleCopy={handleCopy}
              isGuideOpen={isGuideOpen}
              setIsGuideOpen={setIsGuideOpen}
              guideTab={guideTab}
              setGuideTab={setGuideTab}
              activeParticipants={activeParticipants}
              uploading={uploading}
              proofUrl={proofUrl}
              handleFileUpload={handleFileUpload}
            />
          )}
        </div>

        <div className="p-4 md:p-8 bg-slate-50 dark:bg-slate-950/50 border-t border-orange-500/20 flex gap-3 md:gap-4">
          <button
            onClick={() => currentStep === 1 ? onClose() : setCurrentStep(currentStep - 1)}
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
                  setCurrentStep(currentStep + 1);
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
  );
};
