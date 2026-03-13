import React, { useState } from 'react';
import { supabase } from '../../services/core/supabaseClient';
import { Star, CheckCircle, Send, MessageSquare } from 'lucide-react';

interface FeedbackModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ order, isOpen, onClose }) => {
  const [step, setStep] = useState<'celebration' | 'feedback' | 'success'>('celebration');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !order) return null;

  const handleConfirmReceipt = () => {
    setStep('feedback');
  };

  const handleSubmitFeedback = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    
    try {
      const { error: reviewError } = await supabase
        .from('reviews')
        .insert({
          order_id: order.id,
          rating,
          comment
        });

      if (!reviewError) {
        await supabase
          .from('orders')
          .update({ status: 'completed' })
          .eq('id', order.id);
        
        setSubmitted(true);
        setTimeout(() => setStep('success'), 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border gold-border-subtle overflow-hidden relative">
        
        {step === 'celebration' ? (
          <div className="p-8 text-center space-y-6">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-green-500 blur-2xl opacity-20 animate-pulse"></div>
              <CheckCircle size={80} className="text-green-500 relative animate-bounce" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                Os seus ativos foram enviados! 🚀
              </h2>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                A operação de <span className="text-brand-gold font-bold">{order.amount} {order.currency}</span> para <span className="font-bold">{order.wallet}</span> foi concluída com sucesso pela nossa equipa.
              </p>
            </div>

            <button 
              onClick={handleConfirmReceipt}
              className="w-full bg-green-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-green-500/30 hover:bg-green-600 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Confirmar Recebimento
            </button>
          </div>
        ) : step === 'feedback' ? (
          <div className="p-8 text-center space-y-6">
            {!submitted ? (
              <>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase">Como foi a tua experiência?</h3>
                  <p className="text-xs text-slate-400 font-medium">A tua avaliação ajuda-nos a crescer.</p>
                </div>

                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star}
                      title={`Avaliar com ${star} estrelas`}
                      onClick={() => setRating(star)}
                      className={`p-1 transition-transform hover:scale-125 ${rating >= star ? 'text-brand-gold' : 'text-slate-200 dark:text-slate-700'}`}
                    >
                      <Star size={32} fill={rating >= star ? "currentColor" : "none"} strokeWidth={3} title={`Avaliar com ${star} estrelas`} />
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  <div className="relative">
                    <textarea 
                      placeholder="Deixa um comentário rápido..."
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl p-4 text-sm font-medium outline-none focus:ring-2 ring-brand-gold/20 min-h-[100px] resize-none"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                    <MessageSquare size={16} className="absolute bottom-4 right-4 text-slate-300" />
                  </div>
                </div>

                <button 
                  onClick={handleSubmitFeedback}
                  disabled={rating === 0 || submitting}
                  className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg transition-all flex items-center justify-center gap-2 ${
                    rating === 0 || submitting 
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                      : 'bg-brand-gold text-white hover:bg-amber-600'
                  }`}
                >
                  {submitting ? 'A enviar...' : 'Enviar Avaliação'}
                  <Send size={14} />
                </button>
              </>
            ) : (
              <div className="py-10 space-y-4">
                 <CheckCircle size={60} className="text-brand-gold mx-auto animate-bounce" />
                 <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase">Obrigado!</h3>
                 <p className="text-sm text-slate-500 font-medium">A tua avaliação foi registada.</p>
              </div>
            )}
          </div>
        ) : (
          /* INSTAGRAMMABLE SUCCESS CARD */
          <div className="p-4 animate-scale-in">
              <div className="relative bg-gradient-to-br from-slate-900 via-[#020617] to-slate-900 rounded-[2.5rem] border-4 border-brand-gold/20 overflow-hidden shadow-2xl p-8 text-center space-y-8">
                  {/* Gold Overlay Glow */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-brand-gold/10 blur-[100px] pointer-events-none"></div>
                  
                  {/* AngoLife Logo / Header */}
                  <div className="flex flex-col items-center gap-2 relative">
                     <div className="flex items-center gap-2">
                        <Star size={18} className="text-brand-gold fill-brand-gold" />
                        <span className="text-xl font-black text-white tracking-widest uppercase">ANGOLIFE</span>
                        <Star size={18} className="text-brand-gold fill-brand-gold" />
                     </div>
                     <div className="h-[1px] w-12 bg-brand-gold/30"></div>
                  </div>

                  {/* Hero Section */}
                  <div className="space-y-2">
                     <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 uppercase tracking-tighter leading-none">
                        Troca<br/>Concluída!
                     </h2>
                     <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                        <CheckCircle size={10} className="text-green-500" />
                        <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Verificado</span>
                     </div>
                  </div>

                  {/* Receipt Details Card */}
                  <div className="bg-white/5 border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                     <div className="absolute inset-0 bg-brand-gold/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                     <div className="space-y-4 relative">
                        <div className="flex flex-col items-center gap-1">
                           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">VALOR ENVIADO</span>
                           <span className="text-2xl font-black text-brand-gold">{parseFloat(order.amount).toFixed(2)} {order.currency}</span>
                        </div>
                        <div className="h-[1px] w-full bg-white/5"></div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">TOTAL EM KZ</span>
                              <span className="block text-[10px] font-bold text-white uppercase">{order.total_kz?.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                           </div>
                           <div className="space-y-1">
                              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">DATA</span>
                              <span className="block text-[10px] font-bold text-white uppercase">{new Date().toLocaleDateString('pt-AO')}</span>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Footer / Social Branding */}
                  <div className="pt-4 space-y-6">
                     <div className="flex flex-col items-center gap-3">
                        <p className="text-[9px] font-medium text-slate-500 tracking-widest uppercase">AngoLife.app • O seu parceiro cambial</p>
                        
                        <div className="flex gap-3 w-full">
                           <button 
                             onClick={() => alert('Recibo gerado e guardado!')}
                             className="flex-1 bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-white/5"
                           >
                             Baixar Recibo
                           </button>
                           <button 
                             onClick={() => {
                                if (navigator.share) {
                                  navigator.share({
                                    title: 'Minha Troca na AngoLife',
                                    text: `Acabei de trocar ${order.amount} ${order.currency} na AngoLife! Seguro e rápido.`,
                                    url: 'https://angolife.app'
                                  });
                                }
                             }}
                             className="px-6 bg-slate-800 text-white rounded-2xl hover:bg-slate-700 transition-colors"
                             title="Partilhar"
                           >
                             <Send size={18} />
                           </button>
                        </div>
                     </div>

                     <button 
                       onClick={onClose}
                       className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] hover:text-white transition-colors"
                     >
                       Voltar ao Início
                     </button>
                  </div>
              </div>
          </div>
        )}
      </div>
    </div>
  );
};
