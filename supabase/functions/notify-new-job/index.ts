import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.4.5";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
const VAPID_EMAIL = Deno.env.get("VAPID_EMAIL") || "mailto:admin@angolife.app";

webpush.setVapidDetails(
  VAPID_EMAIL,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

serve(async (req) => {
  const { record, type, table } = await req.json();

  // Somente notificamos em caso de nova inserção na tabela de jobs
  if (type !== "INSERT" || table !== "jobs") {
    return new Response("Ignorado", { status: 200 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  );

  // Buscar todas as subscrições ativas
  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("subscription");

  if (error) {
    console.error("Erro ao buscar subscrições:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const notification = {
    title: `Nova Vaga: ${record.title}`,
    body: `${record.company} em ${record.location}. Aproveita esta oportunidade!`,
    url: `/vagas`,
  };

  const sendNotifications = subscriptions.map((sub) => {
    return webpush.sendNotification(
      sub.subscription,
      JSON.stringify(notification)
    ).catch(err => {
      // Remover subscrições inválidas/expiradas
      if (err.statusCode === 410 || err.statusCode === 404) {
        console.log("Removendo subscrição expirada");
        // Nota: Idealmente removeríamos pelo ID da subscrição aqui se tivéssemos armazenado
      }
      console.error("Erro ao enviar push:", err);
    });
  });

  await Promise.all(sendNotifications);

  return new Response(JSON.stringify({ sent: subscriptions.length }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
