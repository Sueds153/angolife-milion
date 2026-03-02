/**
 * @copyright (c) 2024-2026 AngoLife by Su-Golden. All rights reserved.
 */

import { supabase } from "./supabaseClient";
import { ServiceUtils } from "./utils";

export const SubscriptionService = {
  submitCVSubscription: async (
    userId: string,
    planId: string,
    receiptUrl: string,
  ): Promise<boolean> => {
    const { error } = await supabase.from("subscriptions_pending").insert([
      {
        user_id: userId,
        plano_escolhido: planId,
        url_comprovativo: receiptUrl,
        status: "aguardando",
      },
    ]);
    return !error;
  },

  getCVSubscriptions: async (): Promise<any[]> => {
    const { data, error } = await supabase
      .from("subscriptions_pending")
      .select("*, profiles(email, full_name)")
      .order("created_at", { ascending: false });

    if (error) return [];
    return data.map((sub: any) => ({
      ...sub,
      status: ServiceUtils.mapStatus(sub.status)
    }));
  },

  approveCVSubscription: async (
    id: string,
    userId: string,
  ): Promise<boolean> => {
    const { error: subError } = await supabase
      .from("subscriptions_pending")
      .update({ status: "premium" })
      .eq("id", id);

    if (subError) return false;

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        is_premium: true,
        account_type: "premium",
      })
      .eq("id", userId);

    return !profileError;
  },
};
