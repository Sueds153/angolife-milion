/**
 * @copyright (c) 2024-2026 AngoLife by Su-Golden. All rights reserved.
 */

import { supabase } from "../core/supabaseClient";

export const OrderService = {
  createOrder: async (order: any): Promise<string | null> => {
    const { data, error } = await supabase
      .from("orders")
      .insert([order])
      .select()
      .single();

    if (error) {
      // Log the full error for debugging, then throw so callers can react
      console.error('[OrderService] createOrder error:', error.code, error.message, error.details);
      throw new Error(error.message || 'Erro ao registar ordem no Supabase.');
    }
    return data.id;
  },

  getUserOrders: async (email: string): Promise<any[]> => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_email", email)
      .order("created_at", { ascending: false });

    return error ? [] : data;
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
  getLatestOrders: async (limit: number = 5): Promise<any[]> => {
    const { data, error } = await supabase
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
