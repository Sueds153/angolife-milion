import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/core/supabaseClient';
import { Clock, Eye, Send, CheckCircle, ArrowRight } from 'lucide-react';

interface OrderCardProps {
  orderId: string;
  onComplete: () => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ orderId, onComplete }) => {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins default

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const fetchOrder = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (data) {
        setOrder(data);
      }
      setLoading(false);
    };

    fetchOrder();

    // Subscribe to realtime changes
    const subscription = supabase
      .channel(`order-${orderId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'orders',
        filter: `id=eq.${orderId}`
      }, (payload) => {
        setOrder(payload.new);
        if (payload.new.status === 'sent') {
          // Trigger celebration modal will be handled by parent or deep link
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
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
            {order.status === 'pending' && (
              <button 
                onClick={() => {
                   // Simulamos a finalização abrindo o WhatsApp se o link existir (gerado pelo parent)
                   const savedSession = localStorage.getItem('ANGOLIFE_EXCHANGE_SESSION');
                   if (savedSession) {
                      // O link já foi gerado na ExchangePage, mas aqui apenas alertamos para usar o suporte manual ou re-abrir.
                      // Idealmente, a ExchangePage deve passar o whatsappLink se ativo
                      alert("Por favor, finalize a transação no modal de Checkout.");
                   }
                }}
                className="bg-orange-500 text-black px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 hover:scale-105 transition-transform"
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
