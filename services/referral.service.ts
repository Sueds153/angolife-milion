/**
 * @copyright (c) 2024-2026 AngoLife by Su-Golden. All rights reserved.
 */

import { supabase } from "./supabaseClient";

export const ReferralService = {
  processReward: async (newUserId: string, referralCode: string) => {
    try {
      const sharerIdPrefix = referralCode.replace('ANGO-', '').toLowerCase();

      const { data: sharer, error: sharerError } = await supabase
        .from("profiles")
        .select("id, referral_count, cv_credits, email")
        .ilike("id", `${sharerIdPrefix}%`)
        .single();

      if (sharerError || !sharer) return;

      // Award Recruit (Bronze Reward - 5 Credits)
      await supabase
        .from("profiles")
        .update({
          cv_credits: 5,
          account_type: 'bronze'
        })
        .eq("id", newUserId);

      const newCount = (sharer.referral_count || 0) + 1;
      const updates: any = { referral_count: newCount };

      if (newCount === 5) {
        updates.account_type = 'silver';
        updates.is_premium = true;
        updates.premium_expiry = Date.now() + (30 * 24 * 60 * 60 * 1000);
        updates.has_referral_discount = true;
        updates.cv_credits = (sharer.cv_credits || 0) + 15;
      }

      await supabase
        .from("profiles")
        .update(updates)
        .eq("id", sharer.id);

    } catch (err) {
      console.error("Referral process error:", err);
    }
  }
};
