import React from 'react';
import { Shield } from 'lucide-react';

interface ExchangeStepTermsProps {
  tradeAction: 'buy' | 'sell';
  formData: any;
  setFormData: (data: any) => void;
  setIsTermsModalOpen: (open: boolean) => void;
}

export const ExchangeStepTerms: React.FC<ExchangeStepTermsProps> = ({
  tradeAction,
  formData,
  setFormData,
  setIsTermsModalOpen
}) => {
  return (
    <div className="space-y-8 py-10 flex flex-col items-center justify-center text-center animate-fade-in">
      <div className="p-8 bg-orange-500/5 rounded-full border border-orange-500/10">
        <Shield size={56} className="text-orange-500 opacity-80" />
      </div>
      <div className="space-y-3">
        <h4 className="text-slate-900 dark:text-white font-black uppercase tracking-[0.2em] text-lg">
          Protocolo de {tradeAction === 'buy' ? 'Segurança' : 'Venda'}
        </h4>
        <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest max-w-[320px] leading-relaxed">
          {tradeAction === 'buy'
            ? "Para prosseguir, é necessário confirmar a aceitação dos nossos protocolos operacionais e de segurança."
            : "Declaro que os ativos digitais são de minha propriedade e assumo total responsabilidade pelos dados bancários fornecidos."}
        </p>
      </div>

      <label className="flex items-center gap-4 cursor-pointer group bg-slate-100 dark:bg-slate-900/40 p-5 rounded-2xl border border-orange-500/20 hover:border-orange-500/30 transition-all">
        <input
          type="checkbox"
          className="w-6 h-6 rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-transparent accent-orange-500 cursor-pointer"
          checked={formData.termsAccepted}
          onChange={e => setFormData({ ...formData, termsAccepted: e.target.checked })}
        />
        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest group-hover:text-slate-900 dark:group-hover:text-white transition-colors text-left leading-tight">
          Li e aceito os <span onClick={(e) => { e.preventDefault(); setIsTermsModalOpen(true); }} className="text-orange-500 hover:text-amber-600 transition-colors underline underline-offset-4 decoration-amber-500/20">Termos de Serviço e Políticas de Operação</span>
        </span>
      </label>

      <label className="flex items-center gap-4 cursor-pointer group bg-slate-100 dark:bg-slate-900/40 p-5 rounded-2xl border border-orange-500/20 hover:border-orange-500/30 transition-all">
        <input
          type="checkbox"
          className="w-6 h-6 rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-transparent accent-orange-500 cursor-pointer"
          checked={formData.rateGuaranteeAccepted}
          onChange={e => setFormData({ ...formData, rateGuaranteeAccepted: e.target.checked })}
        />
        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest group-hover:text-slate-900 dark:group-hover:text-white transition-colors text-left leading-tight">
          Compreendo que a taxa é garantida por 15 min
        </span>
      </label>
    </div>
  );
};
