/**
 * @copyright (c) 2024-2026 AngoLife by Su-Golden. All rights reserved.
 * @security Referral logic is processed server-side via Edge Function.
 *           No privilege fields are modified directly from the client.
 */

import { supabase } from "../core/supabaseClient";

export const ReferralService = {
  /**
   * Processa recompensas de referral de forma segura.
   * Toda a lógica de negócio (créditos, upgrades, anti-fraud) é executada
   * na Edge Function `referral-reward` com service_role no servidor.
   */
  processReward: async (newUserId: string, referralCode: string) => {
    try {
      const { error } = await supabase.functions.invoke("referral-reward", {
        body: { newUserId, referralCode },
      });

      if (error) {
        console.error("Referral Edge Function error:", error.message);
      }
    } catch (err) {
      console.error("Referral process error:", err);
    }
  },
};
