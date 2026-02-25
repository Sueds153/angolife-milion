import React, { useRef } from 'react';
import { ChevronDown, CheckCircle, Activity, ArrowRightLeft, Sparkles, Shield, RefreshCw, Copy, MessageCircle, Upload } from 'lucide-react';
import { ExchangeRate } from '../types';
import { APP_CONFIG } from '../constants';

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
            <div className="space-y-6">
              <div className="text-center">
                <h4 className="text-slate-900 dark:text-white font-black uppercase tracking-widest text-sm mb-4">Passo 1: {tradeAction === 'buy' ? 'Identificação' : 'Dados de Recebimento'}</h4>
              </div>

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

              {parseFloat(tradeAmount) > 0 && (
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
                      { label: 'ENTIDADE', val: APP_CONFIG.BANK_DETAILS.ENTITY },
                      { label: 'REFERÊNCIA', val: APP_CONFIG.BANK_DETAILS.REFERENCE }
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
                      { label: 'ID BINANCE (PAY ID)', val: APP_CONFIG.BANK_DETAILS.BINANCE_PAY_ID },
                      { label: 'WISE / PAYPAL', val: APP_CONFIG.BANK_DETAILS.WISE_PAYPAL_EMAIL }
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

              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center justify-center gap-2">
                  <Sparkles size={12} className="text-[orange-500] animate-pulse" />
                  <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em]">{activeParticipants} PESSOAS CONSULTANDO ESTA TAXA AGORA</span>
                </div>

                <div className="flex justify-end w-full">
                  <button
                    onClick={() => {
                      const msg = `Olá AngoLife! Estou no meio de uma operação de ${tradeAction === 'buy' ? 'Compra' : 'Venda'} e tive um problema. Podem ajudar?`;
                      window.open(`https://wa.me/${APP_CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800/40 backdrop-blur-sm border border-white/5 rounded-full hover:bg-slate-800/60 transition-all group"
                  >
                    <MessageCircle size={12} className="text-slate-500 group-hover:text-orange-500 transition-colors" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">Problemas com o pagamento?</span>
                  </button>
                </div>
              </div>

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

        <div className="p-8 bg-slate-50 dark:bg-slate-950/50 border-t border-orange-500/20 flex gap-4">
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
