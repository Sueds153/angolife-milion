/**
 * @copyright (c) 2024-2026 Resolve.AO by Su-Golden. All rights reserved.
 */

import { supabase } from "../core/supabaseClient";
import { ServiceUtils } from "../utils/utils";

export interface CVSubscriptionRow {
  id: string;
  user_id: string;
  status: string;
  created_at?: string;
  receipt_url?: string | null;        // coluna real na DB
  type?: string | null;               // coluna real na DB ('pack3', 'monthly', 'yearly')
  profiles?: { email?: string; full_name?: string } | null;
}

export const SubscriptionService = {
  submitCVSubscription: async (
    userId: string,
    planId: string,
    receiptUrl: string,
  ): Promise<boolean> => {
    // Escrever type (coluna principal) E plano_escolhido (legado) — edge function lê type primeiro
    const { error } = await supabase.from("subscriptions_pending").insert([
      {
        user_id: userId,
        type: planId,
        plano_escolhido: planId,
        receipt_url: receiptUrl,
        status: "pending",
      },
    ]);
    if (error) {
      console.error('[SubscriptionService] submitCVSubscription error:', error);
    }
    return !error;
  },

  getCVSubscriptions: async (): Promise<CVSubscriptionRow[]> => {
    const { data, error } = await supabase
      .from("subscriptions_pending")
      .select("*, profiles(email, full_name)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error('[SubscriptionService] getCVSubscriptions error:', error);
      return [];
    }
    return data.map((sub: CVSubscriptionRow): CVSubscriptionRow => ({
      ...sub,
      status: ServiceUtils.mapStatus(sub.status)
    }));
  },

  approveCVSubscription: async (
    id: string,
    userId: string,
  ): Promise<boolean> => {
    // Aprovação processada server-side (Edge Function com service_role) para
    // garantir segurança: o cliente não pode alterar campos de privilégio.
    const { error } = await supabase.functions.invoke("subscription-approve", {
      body: { id, userId },
    });

    return !error;
  },
};
