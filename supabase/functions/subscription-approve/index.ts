/**
 * Edge Function: subscription-approve
 * Aprova uma subscrição CV (liberta Premium) de forma segura no servidor.
 * Executa com service_role — nunca expõe a chave no frontend.
 * Verifica que o chamador é um administrador antes de atuar.
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

// Emails permitidos como admin (fallback caso is_admin não esteja marcado na DB)
const ADMIN_EMAILS = (Deno.env.get("ADMIN_EMAILS") ?? "suedjosue@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase());

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

    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Não autorizado." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar permissões de administrador
    const { data: caller } = await supabaseAdmin
      .from("profiles")
      .select("is_admin, email")
      .eq("id", user.id)
      .single();

    const isAdmin = caller?.is_admin === true ||
      ADMIN_EMAILS.includes((user.email ?? "").toLowerCase());

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Permissões insuficientes." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { id, userId } = await req.json();

    if (!id || !userId) {
      return new Response(
        JSON.stringify({ error: "Parâmetros em falta." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Marcar subscrição como premium
    const { error: subError } = await supabaseAdmin
      .from("subscriptions_pending")
      .update({ status: "premium" })
      .eq("id", id);

    if (subError) {
      console.error("Update subscription error:", subError);
      return new Response(
        JSON.stringify({ error: "Erro ao atualizar subscrição." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Ativar Premium no perfil
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ is_premium: true, account_type: "premium" })
      .eq("id", userId);

    if (profileError) {
      console.error("Update profile error:", profileError);
      return new Response(
        JSON.stringify({ error: "Erro ao ativar premium." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Approve subscription error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
