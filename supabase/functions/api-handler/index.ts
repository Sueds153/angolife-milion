/**
 * Edge Function: api-handler
 * Resolve.AO by Su-Golden — router central da API.
 *
 * Accepta pedidos com { path, payload } e reencaminha para os serviços
 * internos correspondentes. Centraliza CORS, autenticação e rate-limit.
 *
 * Rotas:
 *   GET  /health            -> estado do servidor
 *   POST /notify            -> aprova pedido de notificação plus rate-limit
 *   POST /exchange/order    -> cria ordem de câmbio validada
 *   GET  /exchange/live     -> lista ordens ao vivo (admin/offline)
 */

import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAILS = (Deno.env.get("ADMIN_EMAILS") ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const url = new URL(req.url);
    const route = url.pathname.replace(/^\/+/, "");
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");

    const { data: { user } } = await supabase.auth.getUser(token);
    const userId = user?.id ?? null;

    // /health — sem autenticação
    if (route === "health") {
      return json({ ok: true, service: "api-handler", ts: Date.now() });
    }

    // Rotas protegidas precisam de sessão
    if (!userId) {
      return json({ error: "Não autorizado." }, 401);
    }

    const { payload } = await req.json().catch(() => ({ payload: {} }));

    if (route === "notify") {
      // Rate-limit fixo no servidor (2/dia) — ignora limit do cliente
      const { data: allowed } = await supabase.rpc(
        "check_notification_limit",
        { p_user_id: userId, p_limit: 2 },
      );
      if (allowed !== true) {
        return json({ error: "Limite atingido." }, 429);
      }
      return json({ ok: true });
    }

    if (route === "exchange-rate" && req.method === "POST") {
      // Exige admin (profiles.is_admin ou ADMIN_EMAILS) — escrita sensível
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", userId)
        .maybeSingle();
      const isAdmin =
        profile?.is_admin === true ||
        ADMIN_EMAILS.includes((user?.email ?? "").toLowerCase());
      if (!isAdmin) {
        return json({ error: "Apenas administradores." }, 403);
      }

      const { currency, buy, sell } = payload;
      if (!currency || buy == null || sell == null) {
        return json({ error: "Parâmetros em falta." }, 400);
      }
      const { error } = await supabase
        .from("exchange_rates")
        .update({ informal_buy: buy, informal_sell: sell, last_updated: new Date().toISOString() })
        .eq("currency", currency);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    if (route === "exchange/live") {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("id, full_name, wallet, amount, currency, order_type, status, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) return json({ error: error.message }, 500);
      return json({ orders });
    }

    return json({ error: `Rota desconhecida: ${route}` }, 404);
  } catch (err) {
    console.error("api-handler error:", err);
    return json({ error: "Erro interno do servidor." }, 500);
  }
});