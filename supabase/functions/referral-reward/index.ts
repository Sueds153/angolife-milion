/**
 * Edge Function: referral-reward
 * Processa recompensas de referral de forma segura no servidor.
 * Executa com service_role — nunca expõe a chave no frontend.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  createClient,
  SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin: SupabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { newUserId, referralCode } = await req.json();

    if (!newUserId || !referralCode) {
      return new Response(
        JSON.stringify({ error: "Parâmetros em falta." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validar e limpar o código de referral
    const cleanCode = String(referralCode).trim().toUpperCase();
    if (!/^ANGO-[A-Z0-9-]{4,}$/.test(cleanCode)) {
      return new Response(
        JSON.stringify({ error: "Código de referral inválido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sharerIdPrefix = cleanCode.replace("ANGO-", "").toLowerCase();

    // Buscar o utilizador referenciador
    const { data: sharer, error: sharerError } = await supabaseAdmin
      .from("profiles")
      .select("id, referral_count, cv_credits, email")
      .ilike("id", `${sharerIdPrefix}%`)
      .single();

    if (sharerError || !sharer) {
      return new Response(
        JSON.stringify({ error: "Código de referral não encontrado." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Garantir que o utilizador não se auto-referencia
    if (sharer.id === newUserId) {
      return new Response(
        JSON.stringify({ error: "Auto-referral não permitido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Recompensar o novo utilizador (Bronze — 5 Créditos)
    await supabaseAdmin
      .from("profiles")
      .update({ cv_credits: 5, account_type: "bronze" })
      .eq("id", newUserId);

    // Atualizar contador e possível upgrade do utilizador referenciador
    const newCount = (sharer.referral_count || 0) + 1;
    const sharerUpdates: Record<string, unknown> = { referral_count: newCount };

    if (newCount === 5) {
      sharerUpdates.account_type = "silver";
      sharerUpdates.is_premium = true;
      sharerUpdates.premium_expiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
      sharerUpdates.has_referral_discount = true;
      sharerUpdates.cv_credits = (sharer.cv_credits || 0) + 15;
    }

    await supabaseAdmin
      .from("profiles")
      .update(sharerUpdates)
      .eq("id", sharer.id);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Referral Error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
