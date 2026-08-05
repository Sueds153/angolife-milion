/**
 * Edge Function: delete-account
 * Apaga permanentemente a conta do utilizador (perfil + auth).
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

    const { userId } = await req.json();

    if (!userId || typeof userId !== "string") {
      return new Response(
        JSON.stringify({ error: "userId em falta." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar que o JWT pertence ao utilizador a ser apagado
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);

    if (!user || user.id !== userId) {
      return new Response(
        JSON.stringify({ error: "Não autorizado." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Apagar dados associados ao perfil
    await supabaseAdmin.from("profiles").delete().eq("id", userId);

    // Apagar o utilizador de autenticação
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) {
      console.error("Delete user error:", error);
      return new Response(
        JSON.stringify({ error: "Erro ao apagar utilizador." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Delete account error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
