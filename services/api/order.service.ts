/**
 * @copyright (c) 2024-2026 Resolve.AO by Su-Golden. All rights reserved.
 */

import { supabase } from "../core/supabaseClient";

export interface NewOrder {
  full_name?: string | null;
  age?: string | number | null;
  gender?: string | null;
  wallet?: string | null;
  coordinates?: string | null;
  amount?: number;
  currency?: string;
  total_kz?: number;
  payment_method?: string;
  status?: string;
  proof_url?: string | null;
  order_type?: string;
  bank?: string | null;
  iban?: string | null;
  account_holder?: string | null;
  user_email?: string | null;
}

export interface OrderRow {
  id: string;
  full_name?: string | null;
  wallet?: string | null;
  amount?: string | number | null;
  currency?: string;
  order_type?: string | null;
  type?: string | null;
  bank?: string | null;
  status?: string | null;
  total_kz?: number | null;
  created_at?: string;
}

export interface LatestOrder {
  name: string;
  wallet: string;
  amount: string | number;
  currency: string;
  type: 'buy' | 'sell';
  bank?: string;
}

export const OrderService = {
  createOrder: async (
    order: NewOrder,
  ): Promise<{ orderId: string | null; error?: string }> => {
    const { data, error } = await supabase
      .from("orders")
      .insert([order])
      .select()
      .single();

    if (error) {
      // Padrão consistente com os restantes serviços: nunca lançar throw.
      console.error('[OrderService] createOrder error:', error.code, error.message, error.details);
      return { orderId: null, error: error.message || 'Erro ao registar ordem no Supabase.' };
    }
    return { orderId: data.id };
  },

  getOrderById: async (id: string): Promise<OrderRow | null> => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    return error || !data ? null : (data as OrderRow);
  },

  /** Subscreve alterações de uma ordem via realtime; devolve a subscription para unsubscribe(). */
  subscribeOrder: (
    id: string,
    onUpdate: (order: OrderRow) => void,
  ): { unsubscribe: () => void } => {
    const subscription = supabase
      .channel(`order-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${id}` },
        (payload) => onUpdate(payload.new as OrderRow),
      )
      .subscribe();

    return { unsubscribe: () => supabase.removeChannel(subscription) };
  },

  getUserOrders: async (email: string): Promise<OrderRow[]> => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_email", email)
      .order("created_at", { ascending: false });

    return error ? [] : data;
  },

  submitReview: async (
    orderId: string,
    rating: number,
    comment: string,
  ): Promise<boolean> => {
    const { error: reviewError } = await supabase
      .from("reviews")
      .insert({ order_id: orderId, rating, comment });

    if (reviewError) {
      console.error("Submit review error:", reviewError);
      return false;
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: "completed" })
      .eq("id", orderId);

    return !updateError;
  },

  getActiveOrdersCount: async (): Promise<number> => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error } = await supabase
      .from("orders")
      .select("*", { count: 'exact', head: true })
      .gte("created_at", twentyFourHoursAgo);

    // 🔐 SEGURANÇA: valor real sem inflação artificial.
    return error ? 0 : (count || 0);
  },

  // 🔐 SEGURANÇA: requer sessão de admin (protegido por RLS "Admins view all orders").
  // Dados financeiros nunca são retornados a utilizadores sem permissão.
  getLatestOrders: async (limit: number = 5): Promise<LatestOrder[]> => {    const { data, error } = await supabase
      .from("orders")
      .select("full_name, wallet, amount, currency, order_type, bank")
      .order("created_at", { ascending: false })
      .limit(limit);

    // Se RLS bloquear (sem sessão admin), retorna lista vazia sem expor dados
    if (error) return [];
    return data.map(o => ({
      name: o.full_name?.split(' ')[0] || 'Utilizador',
      wallet: o.wallet ? `${o.wallet.slice(0, 4)}...` : '—',  // mascarar wallet parcialmente
      amount: o.amount,
      currency: o.currency,
      type: o.order_type === 'venda' ? 'sell' : 'buy',
      bank: o.bank
    }));
  },
};
