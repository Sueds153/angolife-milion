/**
 * Edge Function: rate-limiter
 * Resolve.AO by Su-Golden — controlo central de taxa.
 *
 * Limita requisições por utilizador para evitar abuso em endpoints sensíveis
 * (envio de notificações, submissão de ordens, etc.).
 *
 * POST body:
 *   { action?: string, limit?: number }
 *
 * A limitação é aplicada por dia por utilizador via RPC
 * public.check_notification_limit(user_id, limit) — a mesma tabela já usada
 * pelo NotificationService no frontend (notification_rate_limit).
 */

import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_LIMIT = 2;
const MAX_LIMIT = 50;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");

    // Resolve o utilizador — a limitação é per-user.
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Não autorizado." }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { limit: requestedLimit } = await req.json().catch(() => ({}));

    const limit = Math.min(
      Math.max(Number(requestedLimit) || DEFAULT_LIMIT, 1),
      MAX_LIMIT,
    );

    const { data: allowed, error: rpcError } = await supabase.rpc(
      "check_notification_limit",
      { p_user_id: user.id, p_limit: limit },
    );

    if (rpcError) {
      console.error("rate-limiter rpc error:", rpcError);
      return new Response(
        JSON.stringify({ error: "Erro interno do servidor." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (allowed !== true) {
      return new Response(
        JSON.stringify({ error: "Limite atingido. Tenta novamente amanhã." }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({ ok: true, limit }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("rate-limiter error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});