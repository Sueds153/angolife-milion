import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.4.5";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
const VAPID_EMAIL = Deno.env.get("VAPID_EMAIL") || "mailto:admin@resolveao.app";

webpush.setVapidDetails(
  VAPID_EMAIL,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

serve(async (req) => {
  const payload = await req.json();
  const { record, type, table } = payload;

  // Somente trajetos novos (o trigger passa o record do INSERT)
  if (type !== "INSERT" || table !== "trajetos_ativos" || !record?.id) {
    return new Response("Ignorado", { status: 200 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  );

  // Utilizadores cujos destinos_frequentes correspondem à rota publicada
  const { data: alvos, error } = await supabase.rpc("vaija_obter_subscricoes_alvo", {
    p_destino: record.ponto_destino || "",
    p_partida: record.ponto_partida || "",
    p_motorista_id: record.motorista_id || "",
  });

  if (error) {
    console.error("Erro ao obter subscrições alvo:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!alvos || alvos.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
  }

  const notification = {
    title: `VaiJá — ${record.ponto_partida} → ${record.ponto_destino}`,
    body: `Há um trajeto para um dos teus sítios frequentes. Confirma já o teu lugar!`,
    url: `/vaija/trajeto/${record.id}`,
  };

  const enviar = alvos.map((alvo: { user_id: string; subscription: object }) => {
    return webpush.sendNotification(
      alvo.subscription,
      JSON.stringify(notification)
    ).catch((err) => {
      if (err.statusCode === 410 || err.statusCode === 404) {
        // Subscrição expirada/inválida — limpar
        supabase.from("push_subscriptions").delete().eq("user_id", alvo.user_id);
      }
      console.error("Erro ao enviar push:", err);
    });
  });

  await Promise.all(enviar);

  return new Response(JSON.stringify({ sent: alvos.length }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
