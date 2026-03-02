/**
 * @copyright (c) 2024-2026 AngoLife by Su-Golden. All rights reserved.
 */

import { supabase } from "./supabaseClient";
import { ReferralService } from "./referral.service";

export const AuthService = {
  signUp: async (email: string, password: string, fullName: string, invitedBy?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          invited_by: invitedBy,
        },
      },
    });

    if (!error && data?.user && invitedBy) {
      await ReferralService.processReward(data.user.id, invitedBy);
    }
    
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/perfil`,
    });
    return { error };
  },

  getProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    return { data, error };
  },

  updateProfile: async (userId: string, updates: any) => {
    const dbUpdates: any = { ...updates };
    if (updates.fullName) dbUpdates.full_name = updates.fullName;
    if (updates.avatarUrl) dbUpdates.avatar_url = updates.avatarUrl;
    if (updates.savedJobs) dbUpdates.saved_jobs = updates.savedJobs;
    if (updates.applicationHistory) dbUpdates.application_history = updates.applicationHistory;
    if (updates.cvHistory) dbUpdates.cv_history = updates.cvHistory;

    const { data, error } = await supabase
      .from("profiles")
      .update(dbUpdates)
      .eq("id", userId);
    return { data, error };
  },

  onAuthStateChange: (callback: (event: any, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};
