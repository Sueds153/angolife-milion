// Setup: deploy this function to Supabase
// Command: supabase functions deploy gemini-proxy
// Secret: supabase secrets set GEMINI_API_KEY=your_key

import { serve } from "std/http/server.ts"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { createClient, SupabaseClient } from "@supabase/supabase-js"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── Limites server-side (substituem o localStorage) ─────────────────
const FREE_AI_MONTHLY_LIMIT = 2 // otimizações grátis/mês (free tier)
const CONTENT_DAILY_LIMIT = 20  // fetchs de conteúdo/dia por utilizador

const monthKey = () => new Date().toISOString().slice(0, 7) // YYYY-MM
const dayKey = () => new Date().toISOString().slice(0, 10)  // YYYY-MM-DD

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// ── JWT helpers ────────────────────────────────────────────────────
function getAuthToken(req: Request): string | null {
  const auth = req.headers.get('authorization')
  if (!auth || !auth.toLowerCase().startsWith('bearer ')) return null
  return auth.slice(7).trim()
}

function base64UrlDecode(s: string): string {
  s = s.replace(/-/g, '+').replace(/_/g, '/')
  while (s.length % 4) s += '='
  const bin = atob(s)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

function decodeJwt(token: string): { sub?: string } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    return JSON.parse(base64UrlDecode(parts[1]))
  } catch {
    return null
  }
}

// ── Admin client (service_role) ────────────────────────────────────
let admin: SupabaseClient | null = null
function getAdmin(): SupabaseClient {
  if (!admin) {
    admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } },
    )
  }
  return admin
}

interface Entitlements {
  isAdmin: boolean
  isPremiumValid: boolean
  cvCredits: number
}

async function loadEntitlements(userId: string): Promise<Entitlements | null> {
  const { data, error } = await getAdmin()
    .from('profiles')
    .select('is_admin, is_premium, premium_expiry, cv_credits')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) return null
  const expiry = data.premium_expiry ? Number(data.premium_expiry) : 0
  return {
    isAdmin: !!data.is_admin,
    isPremiumValid: !!data.is_premium && (expiry === 0 || expiry > Date.now()),
    cvCredits: data.cv_credits ?? 0,
  }
}

async function getUsage(userId: string, key: string): Promise<number> {
  const { data } = await getAdmin().rpc('get_ai_usage', {
    p_user_id: userId,
    p_month: key,
  })
  return data ?? 0
}

async function incUsage(userId: string, key: string): Promise<void> {
  await getAdmin().rpc('increment_ai_usage', {
    p_user_id: userId,
    p_month: key,
  })
}

// gate: 'ok' | 'no_credits' | 'limit'
type GateResult = 'ok' | 'no_credits' | 'limit'

// Otimizações de IA: premium/admin ilimitado; free = 2/mês (server-side)
async function gatePaidAi(userId: string): Promise<GateResult> {
  const ent = await loadEntitlements(userId)
  if (!ent) return 'no_credits'
  if (ent.isAdmin || ent.isPremiumValid) return 'ok'
  const used = await getUsage(userId, monthKey())
  if (used >= FREE_AI_MONTHLY_LIMIT) return 'limit'
  await incUsage(userId, monthKey()) // reserva antes de gerar (anti-abuso)
  return 'ok'
}

// Fetchs de conteúdo (jobs/news/deals/análise): cap diário por utilizador
async function gateContent(userId: string): Promise<GateResult> {
  const used = await getUsage(userId, dayKey())
  if (used >= CONTENT_DAILY_LIMIT) return 'limit'
  await incUsage(userId, dayKey())
  return 'ok'
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const token = getAuthToken(req)
    if (!token) {
      return json({ error: { code: 'unauth', message: 'Autenticação necessária.' } }, 401)
    }

    const claims = decodeJwt(token)
    const userId = claims?.sub
    if (!userId) {
      return json({ error: { code: 'unauth', message: 'Token inválido.' } }, 401)
    }

    const { action, payload } = await req.json()

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not set in Edge Function secrets')
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    let resultData: Record<string, unknown> = {}

    switch (action) {
      case 'fetchJobs': {
        const gate = await gateContent(userId)
        if (gate === 'limit') return json({ error: { code: 'limit', message: 'Limite diário de consultas atingido.' } }, 429)
        const response = await model.generateContent(`Pesquise na internet por vagas de emprego RECENTES em Angola.
        Retorne uma lista JSON com 6 vagas reais.
        Format JSON array only. Campos: id, title, company, location, type, salary, description, postedAt, requirements (array), sourceUrl, applicationEmail.
        IMPORTANTE: Mantenha os textos em Português de Angola (pt-AO).`)
        const text = response.response.text().replace(/```json/g, '').replace(/```/g, '').trim()
        resultData = { jobs: JSON.parse(text) }
        break
      }

      case 'fetchNews': {
        const gate = await gateContent(userId)
        if (gate === 'limit') return json({ error: { code: 'limit', message: 'Limite diário de consultas atingido.' } }, 429)
        const response = await model.generateContent(`Pesquise as notícias mais quentes de hoje em Angola (Economia, Sociedade, Escândalos Financeiros, Oportunidades Secretas).
        Crie títulos EXTREMAMENTE chamativos, estilo "clickbait" mas verdadeiros, que despertem curiosidade imediata (Ex: "O segredo que os bancos não contam", "Mudança drástica no Kwanza").

        Retorne JSON array com 5 notícias.
        Campos: id, title, summary (um resumo que deixa suspense), source, publishedAt, category (use categorias como: 'BOMBÁSTICO', 'ALERTA', 'SEGREDO', 'URGENTE').
        IMPORTANTE: Mantenha os textos em Português de Angola (pt-AO).`)
        const text = response.response.text().replace(/```json/g, '').replace(/```/g, '').trim()
        resultData = { news: JSON.parse(text) }
        break
      }

      case 'fetchDeals': {
        const gate = await gateContent(userId)
        if (gate === 'limit') return json({ error: { code: 'limit', message: 'Limite diário de consultas atingido.' } }, 429)
        const response = await model.generateContent(`Pesquise pelas ofertas DESTA SEMANA nos supermercados Kero, Shoprite e Candando em Angola.
        Retorne APENAS um JSON array de 6 produtos.
        Campos: id, title, store, originalPrice, discountPrice, location, description, imagePlaceholder (food, tech, home).
        IMPORTANTE: Mantenha os textos em Português de Angola (pt-AO).`)
        const text = response.response.text().replace(/```json/g, '').replace(/```/g, '').trim()
        resultData = { deals: JSON.parse(text) }
        break
      }

      case 'fetchMarketAnalysis': {
        const gate = await gateContent(userId)
        if (gate === 'limit') return json({ error: { code: 'limit', message: 'Limite diário de consultas atingido.' } }, 429)
        const response = await model.generateContent(`Analise o mercado cambial informal e oficial de Angola hoje. Seja direto e profissional.
        IMPORTANTE: Mantenha os textos em Português de Angola (pt-AO).`)
        resultData = { analysis: response.response.text() }
        break
      }

      case 'improveCVContent': {
        const gate = await gatePaidAi(userId)
        if (gate === 'no_credits') return json({ error: { code: 'no_credits', message: 'Sem acesso à IA. Faça upgrade do seu plano.' } }, 403)
        if (gate === 'limit') return json({ error: { code: 'limit', message: 'Limite mensal gratuito atingido. Faça upgrade para acesso ilimitado.' } }, 429)

        const prompt = payload.type === 'summary'
          ? `Reescreva este resumo profissional para um Currículo (CV). Torne-o impactante, executivo e persuasivo, focado no mercado de trabalho angolano/internacional. Use Português de Angola (pt-AO). Texto original: "${payload.originalText}"`
          : `Reescreva esta descrição de experiência profissional para um CV. Use verbos de ação, quantifique resultados se possível, e mantenha um tom profissional e direto em Português de Angola (pt-AO). Texto original: "${payload.originalText}"`;
        const response = await model.generateContent(prompt)
        resultData = { improvedText: response.response.text() }
        break
      }

      case 'improveCVSections': {
        const gate = await gatePaidAi(userId)
        if (gate === 'no_credits') return json({ error: { code: 'no_credits', message: 'Sem acesso à IA. Faça upgrade do seu plano.' } }, 403)
        if (gate === 'limit') return json({ error: { code: 'limit', message: 'Limite mensal gratuito atingido. Faça upgrade para acesso ilimitado.' } }, 429)

        // Expects: payload = { summary: string, experiences: CVExperience[], skills: string[] }
        const { summary, experiences, skills } = payload as { summary: string; experiences: { description?: string }[]; skills: string[] };

        // Build prompt for batch optimization
        const expDescriptions = (experiences || []).map(e => e.description || '').join('\n---\n');
        const skillsList = (skills || []).join(', ');

        const prompt = `Você é um especialista em otimização de CV para ATS (Sistema de Rastreamento de Candidatos) e mercado de trabalho angolano/internacional.
Otimize os textos abaixo para serem ATS-friendly, executivos, diretos e em Português de Angola (pt-AO).
REGRAS CRÍTICAS:
- NÃO invente empresas, cargos, datas, números ou resultados que não existam no texto original.
- Preserve exatamente a estrutura/original. Apenas melhore o vocabulário, impacto e clareza.
- Para skills: categorize em technical, soft, languages, tools.

RETORNE APENAS JSON VÁLIDO no formato:
{
  "summary": "resumo otimizado",
  "experiences": ["descrição otimizada exp 1", "descrição otimizada exp 2", ...],
  "skills": {
    "technical": ["skill1", "skill2", ...],
    "soft": ["skill1", ...],
    "languages": ["skill1", ...],
    "tools": ["skill1", ...]
  }
}

--- ENTRADA ---
Resumo:
${summary || '(não informado)'}

Experiências (uma por linha, separe com ---):
${expDescriptions || '(não informado)'}

Skills (lista bruta):
${skillsList || '(não informado)'}`;

        const response = await model.generateContent(prompt);
        let text = response.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const improved = JSON.parse(text);
        resultData = { improved };
        break
      }

      default:
        throw new Error('Ação inválida')
    }

    return json(resultData)
  } catch (error: any) {
    // Nunca expor a API key no erro (as mensagens da Google incluem "?key=...")
    const safeMessage = String(error?.message || error).replace(/[?&]key=[^&\s"']+/g, '');
    return json({ error: { code: 'server', message: safeMessage } }, 400)
  }
})
