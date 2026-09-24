/**
 * Edge Function: referral-reward
 * Processa recompensas de referral de forma segura no servidor.
 * Executa com service_role — nunca expõe a chave no frontend.
 *
 * Segurança:
 *  - Exige sessão válida (Authorization Bearer do chamador).
 *  - Só processa o próprio utilizador (newUserId === sub do token).
 *  - Idempotência via tabela referral_rewards (evita farming repetido).
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

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

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

    const token = (req.headers.get("Authorization") ?? "").replace(
      "Bearer ",
      ""
    );
    if (!token) {
      return json({ error: "Autenticação necessária." }, 401);
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return json({ error: "Sessão inválida." }, 401);
    }

    const { newUserId, referralCode } = await req.json();

    if (!newUserId || !referralCode) {
      return json({ error: "Parâmetros em falta." }, 400);
    }

    // Só o próprio utilizador autenticado pode processar a sua recompensa.
    if (newUserId !== user.id) {
      return json({ error: "Não autorizado." }, 403);
    }

    const cleanCode = String(referralCode).trim().toUpperCase();
    if (!/^ANGO-[A-Z0-9]{4,}$/.test(cleanCode)) {
      return json({ error: "Código de referral inválido." }, 400);
    }

    // Idempotência: marcar o claimed ANTES de creditar (PK impede duplicados).
    const { error: claimError } = await supabaseAdmin
      .from("referral_rewards")
      .insert({ new_user_id: user.id, referral_code: cleanCode });

    if (claimError) {
      // 23505 = unique_violation → já processado
      if (claimError.code === "23505") {
        return json({ success: true, alreadyProcessed: true }, 200);
      }
      console.error("referral_rewards insert error:", claimError);
      return json({ error: "Erro interno do servidor." }, 500);
    }

    const { data: sharer, error: sharerError } = await supabaseAdmin
      .from("profiles")
      .select("id, referral_count, cv_credits, email")
      .eq("referral_code", cleanCode)
      .maybeSingle();

    if (sharerError || !sharer) {
      // Reverter claim se o código não existir
      await supabaseAdmin
        .from("referral_rewards")
        .delete()
        .eq("new_user_id", user.id);
      return json({ error: "Código de referral não encontrado." }, 404);
    }

    if (sharer.id === user.id) {
      await supabaseAdmin
        .from("referral_rewards")
        .delete()
        .eq("new_user_id", user.id);
      return json({ error: "Auto-referral não permitido." }, 400);
    }

    await supabaseAdmin
      .from("profiles")
      .update({ cv_credits: 5, account_type: "bronze" })
      .eq("id", user.id);

    const newCount = (sharer.referral_count || 0) + 1;
    const sharerUpdates: Record<string, unknown> = {
      referral_count: newCount,
    };

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

    return json({ success: true }, 200);
  } catch (err) {
    console.error("Referral Error:", err);
    return json({ error: "Erro interno do servidor." }, 500);
  }
});
