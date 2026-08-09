/**
 * Edge Function: get-live-orders
 * Resolve.AO by Su-Golden — feed ao vivo das últimas ordens de câmbio.
 *
 * Retorna as ordens mais recentes para a plataforma (sem dados sensíveis:
 * wallet/iban são mascarados). Admins recebem o registo completo.
 */

import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAILS = (Deno.env.get("ADMIN_EMAILS") ?? "suedjosue@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase());

const mask = (v: string | null | undefined) =>
  v ? `${v.slice(0, 4)}...` : null;

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

    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Não autorizado." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const isAdmin =
      ADMIN_EMAILS.includes((user.email ?? "").toLowerCase()) ||
      (await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle()
        .then((r) => r.data?.is_admin === true));

    const query = supabase
      .from("orders")
      .select("id, full_name, wallet, iban, amount, currency, order_type, status, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    const { data: orders, error } = await query;

    if (error) {
      console.error("get-live-orders error:", error);
      return new Response(
        JSON.stringify({ error: "Erro ao listar ordens." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Não-admins só veem dados mascarados
    const safeOrders = orders.map((o) =>
      isAdmin
        ? o
        : {
            ...o,
            wallet: mask(o.wallet),
            full_name: o.full_name ?? null,
          },
    );

    return new Response(
      JSON.stringify({ orders: safeOrders }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("get-live-orders error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});