/**
 * @copyright (c) 2024-2026 AngoLife by Su-Golden. All rights reserved.
 */

import { supabase } from "./supabaseClient";

export const AdminService = {
  triggerJobScraper: async (): Promise<number> => {
    try {
      const aiJobs = await (await import("../integrations/gemini")).GeminiService.fetchJobs();
      const jobsToInsert = aiJobs.map((j) => ({
        title: j.title,
        company: j.company,
        location: j.location,
        type: j.type,
        salary: j.salary || "A combinar",
        description: j.description,
        posted_at: new Date().toISOString(),
        requirements: j.requirements,
        source_url: j.sourceUrl,
        application_email: j.applicationEmail,
        image_url: j.imageUrl || null,
        categoria: j.category || "Geral",
        fonte: "IA Bot (Gemini)",
        is_verified: false,
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
      const aiNews = await (await import("../integrations/gemini")).GeminiService.fetchNews();
      const newsToInsert = aiNews.map((n) => ({
        titulo: n.title,
        resumo: n.summary,
        corpo: `Informações exclusivas obtidas pelo Angolife indicam movimentos estratégicos nos bastidores que podem alterar completamente o cenário atual. Fontes próximas confirmam que a situação descrita é apenas a ponta do iceberg. "A maioria das pessoas não está a ver o que está por vir", afirmou um analista de mercado que preferiu não ser identificado. Os dados preliminares sugerem um impacto direto nas próximas 48 horas. Especialistas recomendam cautela e atenção redobrada. Se os rumores se confirmarem, estaremos diante de um dos maiores eventos do ano no setor. Continue a acompanhar o Angolife para atualizações em tempo real sobre este desenvolvimento.`,
        fonte: n.source,
        url_origem: n.url,
        categoria: n.category,
        published_at: new Date().toISOString(),
        status: "pendente",
        imagem_url: n.imageUrl || "https://images.unsplash.com/photo-1495020689067-958852a7765e?q=80&w=1000&auto=format&fit=crop",
        is_priority: n.category === "URGENTE" || n.category === "ALERTA",
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
      const aiDeals = await (await import("../integrations/gemini")).GeminiService.fetchDeals();
      const dealsToInsert = aiDeals.map((d) => ({
        title: d.title,
        store: d.store,
        store_number: null,
        phone: null,
        original_price: d.originalPrice,
        discount_price: d.discountPrice,
        location: d.location,
        description: d.description,
        image_placeholder: d.imagePlaceholder,
        image_url: d.imagePlaceholder,
        category: d.category || "Alimentação",
        status: "pendente",
        submitted_by: "IA Bot (Gemini)",
        created_at: new Date().toISOString(),
        verified: false,
        is_admin: false,
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
