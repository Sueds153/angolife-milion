/**
 * @copyright (c) 2024-2026 AngoLife by Su-Golden. All rights reserved.
 * @license Proprietary. Unauthorized copying, modification, or reverse engineering is strictly prohibited.
 */

import { Job, NewsArticle, ProductDeal } from "../types";
import { supabase } from "./supabaseClient";

// Service used to call the secure Supabase Edge Function
// This prevents exposing API keys in the frontend bundle.

// Simple cache to prevent redundant hits within a session
const cache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const getCachedData = <T>(key: string): T | null => {
  const cached = cache[key];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  return null;
};

const setCachedData = (key: string, data: any) => {
  cache[key] = { data, timestamp: Date.now() };
};

// --- FALLBACK DATA ---
// ... (Keeping FALLBACKs as they are essential for resilience)
const FALLBACK_JOBS: Job[] = [
  {
    id: "f1",
    title: "Analista de Sistemas Senior",
    company: "Unitel S.A.",
    location: "Luanda",
    type: "Presencial",
    salary: "A consultar",
    description:
      "Responsável pela manutenção de infraestrutura crítica e desenvolvimento de novas funcionalidades.",
    postedAt: "Há 2 dias",
    requirements: [
      "Experiência com Cloud",
      "Conhecimento de Redes",
      "Inglês Técnico",
    ],
    sourceUrl: "",
    applicationEmail: "recrutamento@unitel.co.ao",
    status: "published",
  },
  {
    id: "f2",
    title: "Gestor de Contas Corporativas",
    company: "Banco BAI",
    location: "Benguela",
    type: "Full-time",
    salary: "Competitivo",
    description:
      "Gestão de carteira de clientes de alto valor e prospecção de novas parcerias.",
    postedAt: "Há 3 dias",
    requirements: [
      "Formação em Gestão/Economia",
      "Boa comunicação",
      "Proatividade",
    ],
    sourceUrl: "",
    applicationEmail: "carreiras@bai.ao",
    status: "published",
  },
  {
    id: "f3",
    title: "Engenheiro Civil (Fiscalização)",
    company: "Mota-Engil Angola",
    location: "Cabinda",
    type: "Presencial",
    salary: "Negociável",
    description:
      "Fiscalização de obras rodoviárias e controlo de qualidade de materiais.",
    postedAt: "Há 5 dias",
    requirements: [
      "Licenciatura em Engenharia Civil",
      "3 anos de experiência",
      "Mobilidade geográfica",
    ],
    sourceUrl: "",
    applicationEmail: "rh@mota-engil.ao",
    status: "published",
  },
];

const FALLBACK_NEWS: NewsArticle[] = [
  {
    id: "n1",
    title:
      "ALERTA: BNA anuncia medida drástica que vai impactar o seu bolso amanhã!",
    summary:
      "Ninguém esperava por esta mudança repentina nas taxas de juro. Saiba urgente como proteger o seu património antes que seja tarde.",
    source: "Mercado Secreto",
    url: "#",
    category: "Urgente",
    publishedAt: "Agora mesmo",
    status: "published",
  },
  {
    id: "n2",
    title:
      "Vazou: A lista secreta das empresas que vão contratar em massa em Luanda",
    summary:
      "Documentos internos revelam salários milionários e benefícios nunca vistos. Veja se a sua área está na lista dourada.",
    source: "Insider Luanda",
    url: "#",
    category: "Exclusivo",
    publishedAt: "Há 15 min",
    status: "published",
  },
  {
    id: "n3",
    title: "Choque no sector petrolífero: A descoberta que muda tudo em Angola",
    summary:
      "Investidores estrangeiros estão a correr para o Namibe. O que foi encontrado no subsolo vale mais que diamantes.",
    source: "Confidencial",
    url: "#",
    category: "Bombástico",
    publishedAt: "Há 1 hora",
    status: "published",
  },
];

const FALLBACK_DEALS: ProductDeal[] = [
  {
    id: "d1",
    title: "Arroz Tio Lucas 25kg",
    store: "Kero Kilamba",
    originalPrice: 15000,
    discountPrice: 12500,
    location: "Kilamba, Luanda",
    description: "Promoção de fim de semana.",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&q=80",
    status: "approved",
    submittedBy: "system",
    createdAt: new Date().toISOString(),
  },
  {
    id: "d2",
    title: "Óleo Vegetal Fula 1L",
    store: "Candando",
    originalPrice: 2000,
    discountPrice: 1600,
    location: "Talatona, Luanda",
    description: "Leve 3 pague 2.",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1474631245212-32dc3c8310c6?w=500&q=80",
    status: "approved",
    submittedBy: "system",
    createdAt: new Date().toISOString(),
  },
  {
    id: "d3",
    title: 'Smart TV Samsung 43"',
    store: "Worten",
    originalPrice: 250000,
    discountPrice: 210000,
    location: "Shopping Avennida",
    description: "Desconto exclusivo online.",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&q=80",
    status: "approved",
    submittedBy: "system",
    createdAt: new Date().toISOString(),
  },
];

const FALLBACK_ANALYSIS = `
**Análise de Mercado (Modo Offline/Simulado)**

O mercado cambial apresenta uma ligeira estabilidade nesta semana.
- **Dólar (USD):** Mantém-se na faixa dos 1100-1150 Kz no mercado informal, com ligeira pressão de compra.
- **Euro (EUR):** Estável em torno de 1200-1260 Kz.

Recomendação: O momento é de cautela. Observe as flutuações nas primeiras horas da manhã antes de realizar grandes transações.
`;

// Helper to call Supabase Edge Functions
async function callEdgeProxy(action: string, payload: any = {}) {
  const { data, error } = await supabase.functions.invoke('gemini-proxy', {
    body: { action, ...payload }
  });
  if (error) throw error;
  return data;
}

export const GeminiService = {
  fetchJobs: async (): Promise<Job[]> => {
    const cached = getCachedData<Job[]>("jobs");
    if (cached) return cached;

    try {
      const { jobs } = await callEdgeProxy('fetchJobs');
      setCachedData("jobs", jobs);
      return jobs;
    } catch (error: any) {
      console.error("Gemini Job Fetch Error:", error);
      return FALLBACK_JOBS;
    }
  },

  fetchDeals: async (): Promise<ProductDeal[]> => {
    const cached = getCachedData<ProductDeal[]>("deals");
    if (cached) return cached;

    try {
      const { deals } = await callEdgeProxy('fetchDeals');
      setCachedData("deals", deals);
      return deals;
    } catch (error: any) {
      console.error("Gemini Deals Fetch Error:", error);
      return FALLBACK_DEALS;
    }
  },

  fetchNews: async (): Promise<NewsArticle[]> => {
    const cached = getCachedData<NewsArticle[]>("news");
    if (cached) return cached;

    try {
      const { news } = await callEdgeProxy('fetchNews');
      setCachedData("news", news);
      return news;
    } catch (error: any) {
      console.error("Gemini News Fetch Error:", error);
      return FALLBACK_NEWS;
    }
  },

  fetchMarketAnalysis: async (): Promise<string> => {
    const cached = getCachedData<string>("market-analysis");
    if (cached) return cached;

    try {
      const { analysis } = await callEdgeProxy('fetchMarketAnalysis');
      setCachedData("market-analysis", analysis);
      return analysis;
    } catch (error: any) {
      console.error("Gemini Market Analysis Error:", error);
      return FALLBACK_ANALYSIS;
    }
  },

  improveCVContent: async (
    originalText: string,
    type: "description" | "summary",
  ): Promise<string> => {
    try {
      const { improvedText } = await callEdgeProxy('improveCVContent', { originalText, type });
      return improvedText;
    } catch (error) {
      console.error("CV Improvement Error:", error);
      return originalText;
    }
  },
};

