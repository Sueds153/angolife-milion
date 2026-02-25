import React from 'react';
import { X } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose, onAccept }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in">
      <div className="bg-white dark:bg-[#0f172a] w-full max-w-2xl rounded-[2.5rem] border border-orange-500/30 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-8 border-b border-orange-500/10 flex justify-between items-center">
          <div className="space-y-1">
            <h3 className="text-xl font-black uppercase tracking-tighter text-[orange-500]">TERMOS DE SERVIÇO</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Protocolo de Segurança Digital</p>
          </div>
          <button title="Fechar" onClick={onClose} className="p-3 bg-slate-700/50 rounded-full text-slate-400 hover:text-white hover:bg-red-500/20 transition-all"><X size={20} /></button>
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
          <button onClick={onAccept} className="w-full bg-[orange-500] text-black py-5 rounded-2xl font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:bg-orange-500 active:scale-95 transition-all">
            CONCORDO E AVANÇAR
          </button>
        </div>
      </div>
    </div>
  );
};
