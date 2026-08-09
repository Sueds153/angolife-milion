import React, { useState, useEffect } from 'react';
import { OrderService, OrderRow } from '../../services/api/order.service';
import { Clock, Eye, Send, ArrowRight, ExternalLink } from 'lucide-react';

interface OrderCardProps {
  orderId: string;
  onComplete: () => void;
  whatsappLink?: string;
  timeLeft?: number;
}

export const OrderCard: React.FC<OrderCardProps> = ({ orderId, onComplete, whatsappLink, timeLeft: parentTimeLeft }) => {
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Use parent timeLeft if provided, otherwise use local state
  const [localTimeLeft, setLocalTimeLeft] = useState(900);
  const timeLeft = parentTimeLeft ?? localTimeLeft;

  // Local timer only runs when no parent timeLeft
  useEffect(() => {
    if (parentTimeLeft !== undefined) return;
    
    const timer = setInterval(() => {
      setLocalTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, [parentTimeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const fetchOrder = async () => {
      const data = await OrderService.getOrderById(orderId);
      if (data) {
        setOrder(data);
      }
      setLoading(false);
    };

    fetchOrder();

    // Subscribe to realtime changes
    const subscription = OrderService.subscribeOrder(orderId, (updated) => {
      setOrder(updated);
      if (updated.status === 'sent') {
        // Trigger celebration modal will be handled by parent or deep link
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [orderId]);

  if (loading || !order || order.status === 'completed') return null;

  const getStatusDisplay = () => {
    switch (order.status) {
      case 'processing':
        return {
          icon: <Eye className="text-blue-500 animate-pulse" />,
          label: 'Visto pelo Operador',
          color: 'bg-blue-500/10 text-blue-500',
          desc: 'Estamos a validar o comprovativo.'
        };
      case 'sent':
        return {
          icon: <Send className="text-green-500 animate-bounce" />,
          label: 'Dinheiro Enviado!',
          color: 'bg-green-500/10 text-green-500',
          desc: 'Os teus ativos já saíram da plataforma.'
        };
      default:
        return {
          icon: <Clock className="text-brand-gold animate-spin-slow" />,
          label: 'Aguardando Validação',
          color: 'bg-brand-gold/10 text-brand-gold',
          desc: 'A tua ordem está na fila de processamento.'
        };
    }
  };

  const status = getStatusDisplay();

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[90] w-full max-w-md px-4 animate-slide-down">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border gold-border-subtle overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${status.color}`}>
              {status.icon}
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-tight text-slate-800 dark:text-white">
                {status.label}
              </h4>
              <p className="text-[10px] font-medium text-slate-400">ID: {orderId.slice(0, 8)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-black text-brand-gold">{order.amount} {order.currency}</p>
            <p className="text-[9px] font-bold text-slate-400">{order.wallet}</p>
          </div>
        </div>
        
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <p className="text-[10px] font-bold text-slate-500">{status.desc}</p>
             <div className="flex items-center gap-1.5 h-6 px-2 bg-slate-900 rounded-lg border border-white/5">
                <Clock size={10} className="text-orange-500" />
                <span className="text-[10px] font-black text-white">{formatTime(timeLeft)}</span>
             </div>
          </div>
<div className="flex gap-2">
            {order.status === 'pending' && whatsappLink && (
              <button
                onClick={() => window.open(whatsappLink, '_blank')}
                className="bg-orange-500 text-black px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 hover:scale-105 transition-transform"
              >
                <ExternalLink size={10} /> Finalizar no WhatsApp
              </button>
            )}
            {order.status === 'pending' && !whatsappLink && (
              <button
                onClick={() => alert("Link do WhatsApp não disponível. Por favor, finalize a transação no modal de Checkout.")}
                className="bg-orange-500/50 text-black px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 hover:scale-105 transition-transform cursor-not-allowed opacity-70"
              >
                Finalizar Agora
              </button>
            )}
            {order.status === 'sent' && (
              <button
                onClick={onComplete}
                className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 hover:scale-105 transition-transform"
              >
                Confirmar <ArrowRight size={12} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
