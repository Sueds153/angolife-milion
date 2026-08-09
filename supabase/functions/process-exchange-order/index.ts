/**
 * Edge Function: process-exchange-order
 * Resolve.AO by Su-Golden — processamento seguro de ordens de câmbio.
 *
 * Recebe uma ordem nova (buy/sell), valida os campos essenciais,
 * calcula o total em Kz conforme a taxa formal do momento e grava
 * na tabela `orders` com service_role.
 */

import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_CURRENCIES = ["USD", "EUR"];
const ALLOWED_TYPES = ["compra", "venda", "buy", "sell"];

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

    const body = await req.json().catch(() => ({}));

    const {
      full_name,
      amount,
      currency,
      order_type,
      bank,
      iban,
      account_holder,
      wallet,
      payment_method,
      proof_url,
      age,
      gender,
      coordinates,
    } = body;

    if (!full_name || !amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: "Nome e valor (amount > 0) são obrigatórios." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!ALLOWED_CURRENCIES.includes(currency)) {
      return new Response(
        JSON.stringify({ error: "Moeda não suportada (apenas USD/EUR)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const type = (order_type ?? "compra").toLowerCase();
    if (!ALLOWED_TYPES.includes(type)) {
      return new Response(
        JSON.stringify({ error: "Tipo de ordem inválido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Taxa formal vigente para conversão
    const { data: rate } = await supabase
      .from("exchange_rates")
      .select("formal_buy, formal_sell")
      .eq("currency", currency)
      .single();

    const buyRate = Number(rate?.formal_sell ?? 0); // 1 USD -> Kz quando o utilizador compra
    const sellRate = Number(rate?.formal_buy ?? 0); // quanto recebe por unidade ao vender

    const rateAtOrder = type === "venda" || type === "sell" ? sellRate : buyRate;
    const total_kz = Number((amount * rateAtOrder).toFixed(2));

    const { data, error } = await supabase
      .from("orders")
      .insert({
        full_name,
        age: age ?? null,
        gender: gender ?? null,
        wallet: wallet ?? null,
        coordinates: coordinates ?? null,
        amount,
        currency,
        total_kz,
        payment_method: payment_method ?? null,
        order_type: type,
        bank: bank ?? null,
        iban: iban ?? null,
        account_holder: account_holder ?? null,
        proof_url: proof_url ?? null,
        status: "pendente",
        user_email: user.email,
        rate_at_order: rateAtOrder,
      })
      .select("id, total_kz, rate_at_order, status")
      .single();

    if (error) {
      console.error("process-exchange-order insert error:", error);
      return new Response(
        JSON.stringify({ error: "Erro ao registar a ordem." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, order: data }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("process-exchange-order error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});