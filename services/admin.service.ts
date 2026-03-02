/**
 * @copyright (c) 2024-2026 AngoLife by Su-Golden. All rights reserved.
 */

import { supabase } from "./supabaseClient";

export const AdminService = {
  triggerJobScraper: async (): Promise<number> => {
    try {
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
        status: "pendente",
      }));

      const { data, error } = await supabase.from("jobs").insert(jobsToInsert).select();
      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      console.error("Error triggering job scraper:", error);
      return 0;
    }
  },

  triggerNewsScraper: async (): Promise<number> => {
    try {
      const aiNews = await (await import("./gemini")).GeminiService.fetchNews();
      const newsToInsert = aiNews.map((n) => ({
        titulo: n.title,
        resumo: n.summary,
        fonte: n.source,
        url_origem: n.url,
        categoria: n.category,
        published_at: new Date().toISOString(),
        status: "pendente",
      }));

      const { data, error } = await supabase.from("news_articles").insert(newsToInsert).select();
      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      console.error("Error triggering news scraper:", error);
      return 0;
    }
  },

  triggerDealsScraper: async (): Promise<number> => {
    try {
      const aiDeals = await (await import("./gemini")).GeminiService.fetchDeals();
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

      const { data, error } = await supabase.from("product_deals").insert(dealsToInsert).select();
      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      console.error("Error triggering deals scraper:", error);
      return 0;
    }
  },
};
