/**
 * @copyright (c) 2024-2026 AngoLife by Su-Golden. All rights reserved.
 */

import { supabase } from "./supabaseClient";

export const OrderService = {
  createOrder: async (order: any): Promise<string | null> => {
    const { data, error } = await supabase
      .from("orders")
      .insert([order])
      .select()
      .single();

    if (error) {
      if (error.code === "42501" || error.message?.includes("row-level security")) {
        throw new Error("Erro de conexão segura. Por favor, recarregue a página.");
      }
      return null;
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

    return error ? 0 : (count || 0) + 12;
  },

  getLatestOrders: async (limit: number = 5): Promise<any[]> => {
    const { data, error } = await supabase
      .from("orders")
      .select("full_name, wallet, amount, currency, order_type, bank")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return [];
    return data.map(o => ({
      name: o.full_name?.split(' ')[0] || 'Utilizador',
      wallet: o.wallet,
      amount: o.amount,
      currency: o.currency,
      type: o.order_type === 'venda' ? 'sell' : 'buy',
      bank: o.bank
    }));
  },
};
