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

const NEWS_LIST_FIELDS =
  "id,titulo,resumo,fonte,url_origem,categoria,published_at,status,imagem_url,is_priority";

const NEWS_LIST_LIMIT = 30;

const mapNews = (n: NewsRow): NewsArticle => ({
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
  isSecret: n.is_priority, // Legacy: priority = secret/exclusive
  status: ServiceUtils.mapStatus(n.status),
});

export const NewsService = {
  getNews: async (
    isAdmin: boolean = false,
    options: { limit?: number } = {},
  ): Promise<NewsArticle[]> => {
    let query = supabase
      .from("news_articles")
      .select(isAdmin ? "*" : NEWS_LIST_FIELDS)
      .order("published_at", { ascending: false });

    if (!isAdmin) {
      query = query.or(
        "status.eq.publicado,status.eq.published,status.eq.aprovado,status.eq.approved",
      );
      const limit = options.limit ?? NEWS_LIST_LIMIT;
      if (limit > 0) query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching news:", error);
      return [];
    }

    return (data as unknown as NewsRow[]).map(mapNews);
  },

  getNewsById: async (id: string): Promise<NewsArticle | null> => {
    const { data, error } = await supabase
      .from("news_articles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching news by id:", error);
      return null;
    }
    if (!data) return null;

    return mapNews(data as NewsRow);
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

    return data.map(mapNews);
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
