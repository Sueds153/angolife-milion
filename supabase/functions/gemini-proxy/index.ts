// Setup: deploy this function to Supabase
// Command: supabase functions deploy gemini-proxy
// Secret: supabase secrets set GEMINI_API_KEY=your_key

import { serve } from "std/http/server.ts"
import { GoogleGenerativeAI } from "@google/generative-ai"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, payload } = await req.json()
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not set in Edge Function secrets')
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    let resultData = {}

    switch (action) {
      case 'fetchJobs': {
        const response = await model.generateContent(`Pesquise na internet por vagas de emprego RECENTES em Angola.
        Retorne uma lista JSON com 6 vagas reais.
        Format JSON array only. Campos: id, title, company, location, type, salary, description, postedAt, requirements (array), sourceUrl, applicationEmail.
        IMPORTANTE: Mantenha os textos em Português de Angola (pt-AO).`)
        const text = response.response.text().replace(/```json/g, '').replace(/```/g, '').trim()
        resultData = { jobs: JSON.parse(text) }
        break
      }
      
      case 'fetchNews': {
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
        const response = await model.generateContent(`Pesquise pelas ofertas DESTA SEMANA nos supermercados Kero, Shoprite e Candando em Angola.
        Retorne APENAS um JSON array de 6 produtos.
        Campos: id, title, store, originalPrice, discountPrice, location, description, imagePlaceholder (food, tech, home).
        IMPORTANTE: Mantenha os textos em Português de Angola (pt-AO).`)
        const text = response.response.text().replace(/```json/g, '').replace(/```/g, '').trim()
        resultData = { deals: JSON.parse(text) }
        break
      }

      case 'fetchMarketAnalysis': {
        const response = await model.generateContent(`Analise o mercado cambial informal e oficial de Angola hoje. Seja direto e profissional.
        IMPORTANTE: Mantenha os textos em Português de Angola (pt-AO).`)
        resultData = { analysis: response.response.text() }
        break
      }

      case 'improveCVContent': {
        const prompt = payload.type === 'summary' 
          ? `Reescreva este resumo profissional para um Currículo (CV). Torne-o impactante, executivo e persuasivo, focado no mercado de trabalho angolano/internacional. Use Português de Angola (pt-AO). Texto original: "${payload.originalText}"`
          : `Reescreva esta descrição de experiência profissional para um CV. Use verbos de ação, quantifique resultados se possível, e mantenha um tom profissional e direto em Português de Angola (pt-AO). Texto original: "${payload.originalText}"`;
        const response = await model.generateContent(prompt)
        resultData = { improvedText: response.response.text() }
        break
      }

      default:
        throw new Error('Ação inválida')
    }

    return new Response(
      JSON.stringify(resultData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
