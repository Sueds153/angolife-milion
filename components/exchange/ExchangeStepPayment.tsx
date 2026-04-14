import React, { useRef } from 'react';
import { RefreshCw, Copy, ChevronDown, Sparkles, MessageCircle, CheckCircle, Upload } from 'lucide-react';
import { StorageService } from '../../services/api/storage.service';
import { APP_CONFIG } from '../../constants/app';

interface ExchangeStepPaymentProps {
  tradeAction: 'buy' | 'sell';
  timeLeft: number;
  isExpired: boolean;
  formatTime: (seconds: number) => string;
  handleCopy: (text: string) => void;
  isGuideOpen: boolean;
  setIsGuideOpen: (open: boolean) => void;
  guideTab: 'mc' | 'mm';
  setGuideTab: (tab: 'mc' | 'mm') => void;
  activeParticipants: number;
  uploading: boolean;
  proofUrl: string | null;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ExchangeStepPayment: React.FC<ExchangeStepPaymentProps> = ({
  tradeAction,
  timeLeft,
  isExpired,
  formatTime,
  handleCopy,
  isGuideOpen,
  setIsGuideOpen,
  guideTab,
  setGuideTab,
  activeParticipants,
  uploading,
  proofUrl,
  handleFileUpload
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-6 animate-fade-in px-2">
      <div className="border-2 border-orange-500 rounded-2xl p-5 flex items-center justify-between bg-orange-500/5 relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-orange-500/10 rounded-lg">
            <RefreshCw size={24} className={`text-orange-500 ${!isExpired ? 'animate-[spin_3s_linear_infinite]' : ''}`} />
          </div>
          <div>
            <span className="block text-[9px] font-black text-orange-500 uppercase tracking-[0.2em] opacity-70">TEMPO RESTANTE</span>
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
                <button type="button" onClick={() => handleCopy(m.val)} className="p-3 text-slate-500 hover:text-orange-500 transition-colors" title="Copiar">
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
                <button type="button" onClick={() => handleCopy(m.val)} className="p-3 text-slate-500 hover:text-orange-500 transition-colors" title="Copiar">
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
            type="button"
            onClick={() => setIsGuideOpen(!isGuideOpen)}
            className="w-full p-4 flex justify-between items-center hover:bg-white/5 transition-colors"
          >
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="text-orange-500">❔</span> Como efetuar o pagamento?
            </span>
            <ChevronDown size={14} className={`text-slate-500 transition-transform duration-300 ${isGuideOpen ? 'rotate-180' : ''}`} />
          </button>

          {isGuideOpen && (
            <div className="p-4 pt-0 space-y-4 animate-slide-up">
              <div className="flex bg-[#020617] p-1 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => setGuideTab('mc')}
                  className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${guideTab === 'mc' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500'}`}
                >
                  Multicaixa
                </button>
                <button
                  type="button"
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
                      <div className="w-5 h-5 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[9px] font-black text-orange-500">{idx + 1}</div>
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">{step}</span>
                    </div>
                  ))
                ) : (
                  [
                    "Escolha a sua carteira (Unitel/Afri)",
                    "Realize a transferência para os dados exibidos acima"
                  ].map((step, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-slate-800/30 p-3 rounded-xl border border-white/5">
                      <div className="w-5 h-5 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[9px] font-black text-orange-500">{idx + 1}</div>
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
          <Sparkles size={12} className="text-orange-500 animate-pulse" />
          <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em]">{activeParticipants} PESSOAS CONSULTANDO ESTA TAXA AGORA</span>
        </div>

        <div className="flex justify-end w-full">
          <button
            type="button"
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
          ? 'border-orange-500/50 bg-orange-500/5 cursor-wait'
          : proofUrl
            ? 'border-green-500/50 bg-green-500/5 cursor-default'
            : 'border-slate-800 hover:border-orange-500/50 hover:bg-orange-500/5 cursor-pointer group'
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
          <RefreshCw className="text-orange-500 animate-spin" size={32} />
        ) : proofUrl ? (
          <CheckCircle className="text-green-500" size={32} />
        ) : (
          <Upload className="text-slate-600 group-hover:text-orange-500 transition-colors" size={32} />
        )}
        <div className="flex flex-col gap-1">
          <span className={`text-[10px] font-black uppercase tracking-[0.1em] transition-colors ${uploading
            ? 'text-orange-500'
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
  );
};
