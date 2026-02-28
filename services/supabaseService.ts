/**
 * @copyright (c) 2024-2026 AngoLife by Su-Golden. All rights reserved.
 * @license Proprietary. Unauthorized copying, modification, or reverse engineering is strictly prohibited.
 */

import { supabase } from "./supabaseClient";
import { ExchangeRate, ProductDeal, Job, NewsArticle } from "../types";

export const SupabaseService = {
  // --- UTILS ---
  sanitize: (text: string): string => {
    if (!text) return "";
    // Remove tags HTML, espaços extras e caracteres suspeitos de SQL Injection simples
    return text
      .trim()
      .replace(/<[^>]*>?/gm, "") // Remove HTML tags
      .replace(/['";\\]/g, ""); // Remove caracteres de escape comuns
  },

  getSupabaseInstance: () => supabase,

  mapStatus: (status: string | undefined): "pending" | "published" | "approved" | "rejected" => {
    if (!status) return "pending";
    const s = status.toLowerCase();

    // Published/Publicado/Approved/Aprovado/Premium -> published (or approved for deals)
    if (s === "publicado" || s === "published" || s === "aprovado" || s === "approved" || s === "premium" || s === "ativo" || s === "active") {
      return "published";
    }

    // Rejected/Rejeitado -> rejected
    if (s === "rejeitado" || s === "rejected") {
      return "rejected";
    }

    // Default to pending (aguardando, pending, pendente)
    return "pending";
  },

  // --- AUTHENTICATION ---
  auth: {
    signUp: async (email: string, password: string, fullName: string, invitedBy?: string) => {
      // Create user
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
        // Run reward logic in the background (or here for simplicity)
        await SupabaseService.referrals.processReward(data.user.id, invitedBy);
      } else if (!error && data?.user) {
        // Even without referral, maybe give a small welcome?
        // For now, only focus on the referral request
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

    getProfile: async (userId: string) => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      return { data, error };
    },

    updateProfile: async (userId: string, updates: any) => {
      // Map frontend camelCase to backend snake_case if necessary
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

    resetPassword: async (email: string) => {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin, // Send them back to the site
      });
      return { data, error };
    },

    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      return supabase.auth.onAuthStateChange(callback);
    },
  },

  // --- REFERRALS & REWARDS ---
  referrals: {
    processReward: async (newUserId: string, referralCode: string) => {
      try {
        // 1. Identify the Sharer (Ambassador)
        // Referral code format: ANGO-XXXXXX
        const sharerIdPrefix = referralCode.replace('ANGO-', '').toLowerCase();

        const { data: sharer, error: sharerError } = await supabase
          .from("profiles")
          .select("id, referral_count, cv_credits, email")
          .ilike("id", `${sharerIdPrefix}%`)
          .single();

        if (sharerError || !sharer) return;

        // 2. Award Recruit (Bronze Reward - 5 Credits)
        await supabase
          .from("profiles")
          .update({
            cv_credits: 5,
            account_type: 'bronze'
          })
          .eq("id", newUserId);

        // 3. Update Sharer Count
        const newCount = (sharer.referral_count || 0) + 1;
        const updates: any = { referral_count: newCount };

        // 4. Check for Ambassador Goal (Silver Reward at 5)
        if (newCount === 5) {
          updates.account_type = 'silver';
          updates.is_premium = true;
          updates.premium_expiry = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days
          updates.has_referral_discount = true;
          // Add 15 credits (Silver equivalent)
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
  },

  // --- EXCHANGE RATES ---
  getRates: async (): Promise<ExchangeRate[]> => {
    const { data, error } = await supabase.from("exchange_rates").select("*");

    if (error) {
      console.error("Error fetching rates:", error);
      return [];
    }

    return data.map((r: any) => ({
      currency: r.currency,
      formalBuy: r.formal_buy,
      formalSell: r.formal_sell,
      informalBuy: r.informal_buy,
      informalSell: r.informal_sell,
      lastUpdated: r.last_updated,
    }));
  },

  updateInformalRate: async (
    currency: "USD" | "EUR",
    buy: number,
    sell: number,
  ): Promise<boolean> => {
    const { error } = await supabase
      .from("exchange_rates")
      .update({
        informal_buy: buy,
        informal_sell: sell,
        last_updated: new Date().toISOString(),
      })
      .eq("currency", currency);

    if (error) {
      console.error("Error updating informal rate:", error);
      return false;
    }
    return true;
  },

  updateFormalRate: async (
    currency: "USD" | "EUR",
    buy: number,
    sell: number,
  ): Promise<boolean> => {
    const { error } = await supabase
      .from("exchange_rates")
      .update({
        formal_buy: buy,
        formal_sell: sell,
        last_updated: new Date().toISOString(),
      })
      .eq("currency", currency);

    if (error) {
      console.error("Error updating formal rate:", error);
      return false;
    }
    return true;
  },

  // --- DEALS ---
  getDeals: async (isAdmin: boolean = false): Promise<ProductDeal[]> => {
    let query = supabase.from("product_deals").select("*");

    if (!isAdmin) {
      query = query.or(
        "status.eq.approved,status.eq.aprovado,status.eq.publicado,status.eq.published",
      );
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching deals:", error);
      return [];
    }

    return data.map((d: any) => ({
      ...d,
      id: d.id,
      title: d.title,
      store: d.store,
      originalPrice: d.original_price,
      discountPrice: d.discount_price,
      location: d.location,
      description: d.description,
      imagePlaceholder: d.image_placeholder,
      url: d.url,
      category: d.category,
      status: SupabaseService.mapStatus(d.status) === "published" ? "approved" : (SupabaseService.mapStatus(d.status) as any),
      submittedBy: d.submitted_by,
      createdAt: d.created_at,
    }));
  },

  getPendingDeals: async (): Promise<ProductDeal[]> => {
    const { data, error } = await supabase
      .from("product_deals")
      .select("*")
      .or(
        "status.eq.pending,status.eq.Pending,status.eq.pendente,status.eq.Pendente",
      );

    if (error) {
      console.error("❌ [Supabase] Error fetching pending deals:", error);
      return [];
    }

    console.log("📦 [Supabase] Pending Deals count:", data?.length || 0);

    return data.map((d: any) => ({
      ...d,
      id: d.id,
      title: d.title,
      store: d.store,
      originalPrice: d.original_price,
      discountPrice: d.discount_price,
      location: d.location,
      description: d.description,
      imagePlaceholder: d.image_placeholder,
      url: d.url,
      category: d.category,
      status: "pending",
      submittedBy: d.submitted_by,
      createdAt: d.created_at,
    }));
  },

  submitDeal: async (
    deal: Omit<ProductDeal, "id" | "status" | "createdAt">,
  ): Promise<void> => {
    const { error } = await supabase.from("product_deals").insert([
      {
        title: deal.title,
        store: deal.store,
        original_price: deal.originalPrice,
        discount_price: deal.discountPrice,
        location: deal.location,
        description: deal.description,
        image_placeholder: deal.imagePlaceholder,
        category: deal.category,
        submitted_by: deal.submittedBy,
        status: "pending",
      },
    ]);

    if (error) console.error("Error submitting deal:", error);
  },

  approveDeal: async (id: string, isApproved: boolean): Promise<void> => {
    const status = isApproved ? "approved" : "rejected";
    const { error } = await supabase
      .from("product_deals")
      .update({ status })
      .eq("id", id);

    if (error) console.error("Error approving deal:", error);
  },

  getDealById: async (id: string): Promise<ProductDeal | null> => {
    const { data, error } = await supabase
      .from("product_deals")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      console.error("Error fetching deal by id:", error);
      return null;
    }

    return {
      id: data.id,
      title: data.title,
      store: data.store,
      storeNumber: data.store_number,
      phone: data.phone,
      originalPrice: data.original_price,
      discountPrice: data.discount_price,
      price: data.discount_price,
      location: data.location,
      description: data.description,
      imagePlaceholder: data.image_placeholder,
      imageUrl: data.image_url,
      url: data.url,
      category: data.category,
      status: SupabaseService.mapStatus(data.status) === "published" ? "approved" : (SupabaseService.mapStatus(data.status) as any),
      submittedBy: data.submitted_by,
      createdAt: data.created_at,
      views: data.views ?? 0,
      likes: data.likes ?? 0,
      verified: data.verified ?? false,
      is_admin: data.is_admin ?? false,
    };
  },

  incrementDealViews: async (id: string): Promise<void> => {
    // Fetch current views then increment (fallback safe if RPC not available)
    const { data, error: fetchError } = await supabase
      .from("product_deals")
      .select("views")
      .eq("id", id)
      .single();

    if (fetchError || !data) return;

    const { error: updateError } = await supabase
      .from("product_deals")
      .update({ views: (data.views ?? 0) + 1 })
      .eq("id", id);

    if (updateError)
      console.error("Error incrementing deal views:", updateError);
  },

  // --- STORAGE ---
  uploadDiscountImage: async (file: File): Promise<string | null> => {
    try {
      const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
      const { data, error } = await supabase.storage
        .from("discount-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Error uploading discount image:", error);
        return null;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("discount-images").getPublicUrl(data.path);

      return publicUrl;
    } catch (err) {
      console.error("Unexpected error during upload:", err);
      return null;
    }
  },

  // --- JOBS ---
  getJobs: async (isAdmin: boolean = false): Promise<Job[]> => {
    let query = supabase.from("jobs").select("*");
    if (!isAdmin) {
      // Suporte para ambos os nomes (inglês/português) para garantir visibilidade plena
      query = query.or(
        "status.eq.publicado,status.eq.published,status.eq.aprovado,status.eq.approved",
      );
    }

    const { data, error } = await query.order("posted_at", { ascending: false });
    if (error) {
      console.error("Error fetching jobs:", error);
      return [];
    }

    return data.map((j: any) => ({
      id: j.id,
      title: j.title,
      company: j.company,
      location: j.location || '',
      type: j.type || '',
      salary: j.salary,
      description: j.description || '',
      postedAt: j.posted_at,
      requirements: j.requirements || [],
      sourceUrl: j.source_url,
      applicationEmail: j.application_email,
      status: SupabaseService.mapStatus(j.status) as any,
      imageUrl: j.imagem_url,
      category: j.categoria,
      source: j.fonte,
      isVerified: j.is_verified || false,
      applicationCount: j.application_count || 0,
    }));
  },

  getPendingJobs: async (): Promise<Job[]> => {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .or(
        "status.eq.pendente,status.eq.Pendente,status.eq.pending,status.eq.Pending",
      );

    if (error) {
      console.error("❌ [Supabase] Error fetching pending jobs:", error);
      return [];
    }

    console.log("📦 [Supabase] Admin Pending Jobs count:", data?.length || 0);

    console.log("📦 ADMIN PENDING JOBS:", data);

    return data.map((j: any) => ({
      id: j.id,
      title: j.title,
      company: j.company,
      location: j.location,
      type: j.type,
      salary: j.salary,
      description: j.description,
      postedAt: j.posted_at,
      requirements: j.requirements || [],
      sourceUrl: j.source_url,
      applicationEmail: j.application_email,
      status: SupabaseService.mapStatus(j.status) as any,
      imageUrl: j.imagem_url,
      category: j.categoria,
      source: j.fonte,
      isVerified: j.is_verified,
    }));
  },

  approveJob: async (id: string, isApproved: boolean): Promise<boolean> => {
    if (isApproved) {
      console.log("🚀 [Supabase] Aprovando vaga ID:", id);
      const { error } = await supabase
        .from("jobs")
        .update({ status: "publicado" })
        .eq("id", id);
      if (error) {
        console.error("❌ Error approving job:", error.message, error.details);
        return false;
      }
      return true;
    } else {
      console.log("🗑️ [Supabase] Rejeitando vaga ID:", id);
      const { error } = await supabase.from("jobs").delete().eq("id", id);
      if (error) {
        console.error("❌ Error rejecting job:", error.message, error.details);
        return false;
      }
      return true;
    }
  },

  approveAllJobs: async (): Promise<boolean> => {
    console.log("🚀 [Supabase] Aprovando TODAS as vagas pendentes");
    const { error } = await supabase
      .from("jobs")
      .update({ status: "publicado" })
      .or("status.eq.pending,status.eq.pendente");

    if (error) {
      console.error(
        "❌ Error approving all jobs:",
        error.message,
        error.details,
      );
      return false;
    }
    return true;
  },

  createJob: async (
    job: Omit<Job, "id" | "postedAt" | "status">,
  ): Promise<boolean> => {
    const { error } = await supabase.from("jobs").insert([
      {
        title: job.title,
        company: job.company,
        location: job.location,
        type: job.type,
        salary: job.salary,
        description: job.description,
        requirements: job.requirements,
        application_email: job.applicationEmail,
        status: "publicado",
        posted_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("Error creating job:", error);
      return false;
    }
    return true;
  },

  toggleJobVerification: async (
    id: string,
    isVerified: boolean,
  ): Promise<boolean> => {
    const { error } = await supabase
      .from("jobs")
      .update({ is_verified: isVerified })
      .eq("id", id);
    if (error) {
      console.error("❌ Error toggling job verification:", error);
      return false;
    }
    return true;
  },

  reportJob: async (id: string): Promise<void> => {
    // 1. Get current report count
    const { data: job, error: fetchError } = await supabase
      .from("jobs")
      .select("report_count")
      .eq("id", id)
      .single();

    if (fetchError || !job) return;

    const newCount = (job.report_count || 0) + 1;

    // 2. Update count and flip to pending if threshold reached
    const updateData: any = { report_count: newCount };
    if (newCount >= 3) {
      updateData.status = "pending";
    }

    const { error: updateError } = await supabase
      .from("jobs")
      .update(updateData)
      .eq("id", id);

    if (updateError) console.error("Error reporting job:", updateError);
  },

  incrementApplicationCount: async (id: string): Promise<void> => {
    const { data: job, error: fetchError } = await supabase
      .from("jobs")
      .select("application_count")
      .eq("id", id)
      .single();

    if (fetchError || !job) return;

    const { error: updateError } = await supabase
      .from("jobs")
      .update({ application_count: (job.application_count || 0) + 1 })
      .eq("id", id);

    if (updateError)
      console.error("Error incrementing application count:", updateError);
  },

  getJobById: async (id: string): Promise<Job | null> => {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return {
      id: data.id,
      title: data.title,
      company: data.company,
      location: data.location,
      type: data.type,
      salary: data.salary,
      description: data.description,
      postedAt: data.posted_at,
      requirements: data.requirements || [],
      sourceUrl: data.source_url,
      applicationEmail: data.application_email,
      status: SupabaseService.mapStatus(data.status) as any,
      imageUrl: data.imagem_url,
      category: data.categoria,
      source: data.fonte,
    };
  },

  getJobsByIds: async (ids: string[]): Promise<Job[]> => {
    if (!ids || ids.length === 0) return [];

    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .in("id", ids);

    if (error || !data) return [];
    return data.map((j: any) => ({
      id: j.id,
      title: j.title,
      company: j.company,
      location: j.location,
      type: j.type,
      salary: j.salary,
      description: j.description,
      postedAt: j.posted_at,
      requirements: j.requirements || [],
      sourceUrl: j.source_url,
      applicationEmail: j.application_email,
      status: SupabaseService.mapStatus(j.status) as any,
      imageUrl: j.imagem_url,
      category: j.categoria,
      source: j.fonte,
    }));
  },

  toggleSaveJob: async (userId: string, currentSaved: string[], jobId: string): Promise<string[]> => {
    const isSaved = currentSaved.includes(jobId);
    const newList = isSaved
      ? currentSaved.filter(id => id !== jobId)
      : [...currentSaved, jobId];

    await supabase
      .from("profiles")
      .update({ saved_jobs: newList })
      .eq("id", userId);

    return newList;
  },

  submitJobApplication: async (userId: string, currentHistory: any[], job: Job): Promise<any[]> => {
    const newEntry = {
      jobId: job.id,
      title: job.title,
      company: job.company,
      date: new Date().toISOString()
    };
    const newHistory = [newEntry, ...currentHistory];

    await supabase
      .from("profiles")
      .update({ application_history: newHistory })
      .eq("id", userId);

    // Also increment global count
    await SupabaseService.incrementApplicationCount(job.id);

    return newHistory;
  },

  // --- NEWS ---
  getNews: async (isAdmin: boolean = false): Promise<NewsArticle[]> => {
    let query = supabase.from("news_articles").select("*");
    if (!isAdmin) {
      query = query.or(
        "status.eq.publicado,status.eq.published,status.eq.aprovado,status.eq.approved",
      );
    }

    const { data, error } = await query.order("published_at", { ascending: false });
    if (error) {
      console.error("Error fetching news:", error);
      return [];
    }

    return data.map((n: any) => ({
      id: n.id,
      title: n.titulo,
      summary: n.resumo,
      source: n.fonte,
      url: n.url_origem,
      category: n.categoria,
      publishedAt: n.published_at,
      status: SupabaseService.mapStatus(n.status) as any,
      imageUrl: n.imagem_url,
    }));
  },

  getPendingNews: async (): Promise<NewsArticle[]> => {
    const { data, error } = await supabase
      .from("news_articles")
      .select("*")
      .or(
        "status.eq.pendente,status.eq.Pendente,status.eq.pending,status.eq.Pending",
      )
      .order("published_at", { ascending: false });

    if (error) {
      console.error("❌ [Supabase] Error fetching pending news:", error);
      return [];
    }

    console.log("📦 [Supabase] Pending News count:", data?.length || 0);

    console.log("📦 ADMIN PENDING NEWS:", data);

    return data.map((n: any) => ({
      id: n.id,
      title: n.titulo,
      summary: n.resumo,
      source: n.fonte,
      url: n.url_origem,
      category: n.categoria,
      publishedAt: n.published_at,
      imageUrl: n.imagem_url,
      status: SupabaseService.mapStatus(n.status) as any,
    }));
  },

  approveNews: async (id: string, isApproved: boolean): Promise<{ success: boolean; error?: string }> => {
    if (isApproved) {
      console.log("🚀 [Supabase] Aprovando notícia ID:", id);
      const { data, error } = await supabase
        .from("news_articles")
        .update({
          status: "publicado",
          published_at: new Date().toISOString()
        })
        .eq("id", id)
        .select();

      if (error) {
        console.error("❌ Error approving news:", error.message);
        return { success: false, error: error.message };
      }

      if (!data || data.length === 0) {
        console.error("⚠️ News found but update failed (0 rows affected). RLS or ID mismatch?");
        return { success: false, error: "Permissão negada ou ID não encontrado no banco (RLS)." };
      }

      return { success: true };
    } else {
      console.log("🗑️ [Supabase] Rejeitando notícia ID:", id);
      const { error } = await supabase
        .from("news_articles")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("❌ Error rejecting news:", error.message);
        return { success: false, error: error.message };
      }
      return { success: true };
    }
  },

  approveAllNews: async (): Promise<{ success: boolean; error?: string }> => {
    console.log("🚀 [Supabase] Aprovando TODAS as notícias pendentes");
    const { error } = await supabase
      .from("news_articles")
      .update({
        status: "publicado",
        published_at: new Date().toISOString()
      })
      .or("status.eq.pending,status.eq.pendente");

    if (error) {
      console.error(
        "❌ Error approving all news:",
        error.message
      );
      return { success: false, error: error.message };
    }
    return { success: true };
  },

  updateNews: async (
    id: string,
    updates: Partial<NewsArticle>,
  ): Promise<boolean> => {
    const { error } = await supabase
      .from("news_articles")
      .update({
        titulo: updates.title,
        resumo: updates.summary,
        categoria: updates.category,
      })
      .eq("id", id);

    if (error) {
      console.error("Error updating news:", error);
      return false;
    }
    return true;
  },

  deleteNews: async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from("news_articles")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting news:", error);
      return false;
    }
    return true;
  },

  getActiveOrdersCount: async (): Promise<number> => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error } = await supabase
      .from("orders")
      .select("*", { count: 'exact', head: true })
      .gte("created_at", twentyFourHoursAgo);

    if (error) return 0;
    return (count || 0) + 12; // Base offset to make it look "active" as requested
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

  createNews: async (news: Partial<NewsArticle>): Promise<boolean> => {
    const { error } = await supabase.from("news_articles").insert([
      {
        titulo: news.title,
        resumo: news.summary,
        corpo: (news as any).body || "",
        categoria: news.category,
        imagem_url: news.imageUrl,
        fonte: "AngoLife Admin",
        url_origem: `manual-${Date.now()}`,
        status: "publicado",
        published_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("Error creating local news:", error);
      return false;
    }
    return true;
  },

  // --- SIMULATION TRIGGERS (NOW OPERATIONAL WITH GEMINI) ---
  triggerJobScraper: async (): Promise<number> => {
    try {
      // Fetch real jobs from Gemini
      const aiJobs = await (await import("./gemini")).GeminiService.fetchJobs();

      const jobsToInsert = aiJobs.map((j) => ({
        title: j.title,
        company: j.company,
        location: j.location,
        type: j.type,
        salary: j.salary,
        description: j.description,
        posted_at: new Date().toISOString(),
        requirements: j.requirements,
        source_url: j.sourceUrl,
        application_email: j.applicationEmail,
        status: "pendente", // Always pending for admin review
      }));

      const { data, error } = await supabase
        .from("jobs")
        .insert(jobsToInsert)
        .select();
      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      console.error("Error triggering job scraper:", error);
      return 0;
    }
  },

  triggerNewsScraper: async (): Promise<number> => {
    try {
      // Fetch real news from Gemini
      const aiNews = await (await import("./gemini")).GeminiService.fetchNews();

      const newsToInsert = aiNews.map((n) => ({
        titulo: n.title,
        resumo: n.summary,
        fonte: n.source,
        url_origem: n.url,
        categoria: n.category,
        published_at: new Date().toISOString(),
        status: "pendente", // Always pending for admin review
      }));

      const { data, error } = await supabase
        .from("news_articles")
        .insert(newsToInsert)
        .select();
      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      console.error("Error triggering news scraper:", error);
      return 0;
    }
  },

  triggerDealsScraper: async (): Promise<number> => {
    try {
      const aiDeals = await (
        await import("./gemini")
      ).GeminiService.fetchDeals();
      const dealsToInsert = aiDeals.map((d) => ({
        title: d.title,
        store: d.store,
        original_price: d.originalPrice,
        discount_price: d.discountPrice,
        location: d.location,
        description: d.description,
        image_placeholder: d.imagePlaceholder,
        category: d.category || "Alimentação",
        status: "pendente",
        submitted_by: "IA Bot",
        created_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from("product_deals")
        .insert(dealsToInsert)
        .select();
      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      console.error("Error triggering deals scraper:", error);
      return 0;
    }
  },

  // --- STORAGE & UTILS ---
  uploadProof: async (file: File): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `proofs/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("exchange-proofs")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Error uploading proof:", uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from("exchange-proofs")
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  uploadReceipt: async (file: File): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `receipts/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("payment-receipts")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Error uploading receipt:", uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from("payment-receipts")
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  uploadAvatar: async (file: File): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Error uploading avatar:", uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

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

    if (error) {
      console.error("Error submitting CV subscription:", error);
      return false;
    }
    return true;
  },

  getCVSubscriptions: async (): Promise<any[]> => {
    const { data, error } = await supabase
      .from("subscriptions_pending")
      .select("*, profiles(email, full_name)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching CV subscriptions:", error);
      return [];
    }

    return data.map((sub: any) => ({
      ...sub,
      status: SupabaseService.mapStatus(sub.status)
    }));
  },

  approveCVSubscription: async (
    id: string,
    userId: string,
  ): Promise<boolean> => {
    // 1. Approve subscription
    const { error: subError } = await supabase
      .from("subscriptions_pending")
      .update({ status: "premium" })
      .eq("id", id);

    if (subError) {
      console.error("Error approving CV subscription:", subError);
      return false;
    }

    // 2. Upgrade user profile to Premium
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        is_premium: true,
        account_type: "premium",
      })
      .eq("id", userId);

    if (profileError) {
      console.error("Error upgrading user profile:", profileError);
      return false;
    }

    return true;
  },

  // --- ORDERS & REVIEWS ---
  createOrder: async (order: any): Promise<string | null> => {
    const { data, error } = await supabase
      .from("orders")
      .insert([order])
      .select()
      .single();

    if (error) {
      console.error("Error creating order:", error);
      if (
        error.code === "42501" ||
        error.message?.includes("row-level security")
      ) {
        throw new Error(
          "Erro de conexão segura. Por favor, recarregue a página.",
        );
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

    if (error) {
      console.error("Error fetching user orders:", error);
      return [];
    }
    return data;
  },
};
