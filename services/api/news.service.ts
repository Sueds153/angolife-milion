/**
 * @copyright (c) 2024-2026 AngoLife by Su-Golden. All rights reserved.
 */

import { supabase } from "../core/supabaseClient";
import { NewsArticle } from "../../types";
import { ServiceUtils } from "../utils/utils";

interface NewsRow {
  id: string;
  titulo: string;
  resumo: string;
  corpo: string;
  fonte: string;
  url_origem: string;
  categoria: string;
  published_at: string;
  status: string;
  imagem_url?: string;
  is_priority?: boolean;
}

export const NewsService = {
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

    return data.map((n: NewsRow): NewsArticle => ({
      id: n.id,
      title: n.titulo,
      summary: n.resumo,
      source: n.fonte,
      url: n.url_origem,
      category: n.categoria,
      publishedAt: n.published_at,
      status: ServiceUtils.mapStatus(n.status),
      imageUrl: n.imagem_url,
      body: n.corpo,
      is_priority: n.is_priority,
      isSecret: n.is_priority, // Legacy: priority = secret/exclusive
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

    return data.map((n: NewsRow): NewsArticle => ({
      id: n.id,
      title: n.titulo,
      summary: n.resumo,
      source: n.fonte,
      url: n.url_origem,
      category: n.categoria,
      publishedAt: n.published_at,
      imageUrl: n.imagem_url,
      body: n.corpo,
      is_priority: n.is_priority,
      isSecret: n.is_priority,
      status: ServiceUtils.mapStatus(n.status),
    }));
  },

  approveNews: async (id: string, isApproved: boolean): Promise<{ success: boolean; error?: string }> => {
    if (isApproved) {
      const { data, error } = await supabase
        .from("news_articles")
        .update({
          status: "publicado",
          published_at: new Date().toISOString()
        })
        .eq("id", id)
        .select();

      if (error) return { success: false, error: error.message };
      if (!data || data.length === 0) return { success: false, error: "Notícia não encontrada." };

      return { success: true };
    } else {
      const { error } = await supabase.from("news_articles").delete().eq("id", id);
      if (error) return { success: false, error: error.message };
      return { success: true };
    }
  },

  approveAllNews: async (): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase
      .from("news_articles")
      .update({
        status: "publicado",
        published_at: new Date().toISOString()
      })
      .or("status.eq.pending,status.eq.pendente");

    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  updateNews: async (id: string, news: Partial<NewsArticle>): Promise<boolean> => {
    const { error } = await supabase
      .from("news_articles")
      .update({
        titulo: news.title,
        resumo: news.summary,
        corpo: news.body,
        fonte: news.source,
        url_origem: news.url,
        categoria: news.category,
        imagem_url: news.imageUrl,
        is_priority: news.is_priority,
      })
      .eq("id", id);
    return !error;
  },

  deleteNews: async (id: string): Promise<boolean> => {
    const { error } = await supabase.from("news_articles").delete().eq("id", id);
    return !error;
  },

  createNews: async (news: Partial<NewsArticle>): Promise<boolean> => {
    const { error } = await supabase.from("news_articles").insert([
      {
        titulo: news.title,
        resumo: news.summary,
        corpo: news.body,
        fonte: news.source || "AngoLife",
        url_origem: news.url || "",
        categoria: news.category,
        imagem_url: news.imageUrl,
        status: "publicado",
        published_at: new Date().toISOString(),
        is_priority: news.is_priority || false,
      },
    ]);
    return !error;
  },
};
