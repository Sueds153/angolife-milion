/// <reference types="vite/client" />
import { GoogleGenAI } from "@google/genai";
import { Job, NewsArticle, ProductDeal } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "dummy_key_for_init";
const ai = new GoogleGenAI({ apiKey });

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

export const GeminiService = {
  fetchJobs: async (): Promise<Job[]> => {
    const cached = getCachedData<Job[]>("jobs");
    if (cached) return cached;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Pesquise na internet por vagas de emprego RECENTES em Angola.
        Retorne uma lista JSON com 6 vagas reais.
        Format JSON array only. Campos: id, title, company, location, type, salary, description, postedAt, requirements (array), sourceUrl, applicationEmail.
        IMPORTANTE: Mantenha os textos em Português de Angola (pt-AO).`,
        config: { tools: [{ googleSearch: {} }] },
      });

      const text = response.text || "";
      const cleanText = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      const data = JSON.parse(cleanText) as Job[];

      const groundingChunks =
        response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const groundingLinks =
        groundingChunks?.filter((c: any) => c.web).map((c: any) => c.web.uri) ||
        [];

      const enrichedData = data.map((job, idx) => ({
        ...job,
        sourceUrl:
          job.sourceUrl || groundingLinks[idx % groundingLinks.length] || "",
        applicationEmail:
          job.applicationEmail ||
          `hr@${job.company.toLowerCase().replace(/\s/g, "")}.ao`,
        status: "published" as const,
      }));

      setCachedData("jobs", enrichedData);
      return enrichedData;
    } catch (error: any) {
      if (error.message?.includes("429") || error.status === 429) {
        console.warn("Gemini Quota Exceeded (Jobs). Using fallback data.");
      } else {
        console.error("Gemini Job Fetch Error:", error);
      }
      return FALLBACK_JOBS;
    }
  },

  fetchDeals: async (): Promise<ProductDeal[]> => {
    const cached = getCachedData<ProductDeal[]>("deals");
    if (cached) return cached;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Pesquise pelas ofertas DESTA SEMANA nos supermercados Kero, Shoprite e Candando em Angola.
        Retorne APENAS um JSON array de 6 produtos.
        Campos: id, title, store, originalPrice, discountPrice, location, description, imagePlaceholder (food, tech, home).
        IMPORTANTE: Mantenha os textos em Português de Angola (pt-AO).`,
        config: { tools: [{ googleSearch: {} }] },
      });

      const text = response.text || "";
      const cleanText = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      const deals = JSON.parse(cleanText);

      const formattedDeals = deals.map((d: any) => ({
        ...d,
        status: "approved",
        submittedBy: "System AI",
        createdAt: new Date().toISOString(),
        imagePlaceholder:
          d.imagePlaceholder === "tech"
            ? "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=500&q=80"
            : d.imagePlaceholder === "home"
              ? "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&q=80"
              : "https://images.unsplash.com/photo-1506617420156-8e4536971650?w=500&q=80",
      }));

      setCachedData("deals", formattedDeals);
      return formattedDeals;
    } catch (error: any) {
      if (error.message?.includes("429") || error.status === 429) {
        console.warn("Gemini Quota Exceeded (Deals). Using fallback data.");
      } else {
        console.error("Gemini Deals Fetch Error:", error);
      }
      return FALLBACK_DEALS;
    }
  },

  fetchNews: async (): Promise<NewsArticle[]> => {
    const cached = getCachedData<NewsArticle[]>("news");
    if (cached) return cached;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Pesquise as notícias mais quentes de hoje em Angola (Economia, Sociedade, Escândalos Financeiros, Oportunidades Secretas).
        Crie títulos EXTREMAMENTE chamativos, estilo "clickbait" mas verdadeiros, que despertem curiosidade imediata (Ex: "O segredo que os bancos não contam", "Mudança drástica no Kwanza").
        
        Retorne JSON array com 5 notícias. 
        Campos: id, title, summary (um resumo que deixa suspense), source, publishedAt, category (use categorias como: 'BOMBÁSTICO', 'ALERTA', 'SEGREDO', 'URGENTE').
        IMPORTANTE: Mantenha os textos em Português de Angola (pt-AO).`,
        config: { tools: [{ googleSearch: {} }] },
      });

      const text = response.text || "";
      const cleanText = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      const data = JSON.parse(cleanText) as NewsArticle[];

      const groundingChunks =
        response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const groundingLinks =
        groundingChunks?.filter((c: any) => c.web).map((c: any) => c.web.uri) ||
        [];

      const enrichedData = data.map((news, idx) => ({
        ...news,
        url:
          news.url && news.url !== "#"
            ? news.url
            : groundingLinks[idx % groundingLinks.length] || news.url,
        status: "published" as const,
      }));

      setCachedData("news", enrichedData);
      return enrichedData;
    } catch (error: any) {
      if (error.message?.includes("429") || error.status === 429) {
        console.warn("Gemini Quota Exceeded (News). Using fallback data.");
      } else {
        console.error("Gemini News Fetch Error:", error);
      }
      return FALLBACK_NEWS;
    }
  },

  fetchMarketAnalysis: async (): Promise<string> => {
    const cached = getCachedData<string>("market-analysis");
    if (cached) return cached;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analise o mercado cambial informal e oficial de Angola hoje. Seja direto e profissional.
        IMPORTANTE: Mantenha os textos em Português de Angola (pt-AO).`,
        config: { tools: [{ googleSearch: {} }] },
      });
      const data = response.text || "Análise indisponível no momento.";

      let sourcesInfo = "";
      const groundingChunks =
        response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks) {
        const links = groundingChunks
          .filter((c: any) => c.web)
          .map((c: any) => `\n- [${c.web.title}](${c.web.uri})`)
          .join("");
        if (links) {
          sourcesInfo = "\n\nFontes consultadas:" + links;
        }
      }

      const finalAnalysis = data + sourcesInfo;
      setCachedData("market-analysis", finalAnalysis);
      return finalAnalysis;
    } catch (error: any) {
      if (error.message?.includes("429") || error.status === 429) {
        console.warn("Gemini Quota Exceeded (Analysis). Using fallback data.");
      } else {
        console.error("Gemini Market Analysis Error:", error);
      }
      return FALLBACK_ANALYSIS;
    }
  },

  improveCVContent: async (
    originalText: string,
    type: "description" | "summary",
  ): Promise<string> => {
    try {
      const prompt = type === 'summary' 
        ? `Reescreva este resumo profissional para um Currículo (CV). Torne-o impactante, executivo e persuasivo, focado no mercado de trabalho angolano/internacional. Use Português de Angola (pt-AO). Texto original: "${originalText}"`
        : `Reescreva esta descrição de experiência profissional para um CV. Use verbos de ação, quantifique resultados se possível, e mantenha um tom profissional e direto em Português de Angola (pt-AO). Texto original: "${originalText}"`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      return response.text || originalText;
    } catch (error) {
      console.error("CV Improvement Error:", error);
      return originalText; // Fail gracefully
    }
  },
};
