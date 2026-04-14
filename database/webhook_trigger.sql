-- 1. Certifica-te de que a tabela de subscrições existe (já deve existir via push_subscriptions.sql)
-- 2. Criar o Webhook para disparar a Edge Function
-- Nota: Substitui <PROJECT_REF> pela referência do teu projeto Supabase
-- E <SERVICE_ROLE_KEY> pela tua chave de serviço (ou usa segredos do Supabase)
create trigger on_job_inserted
after
insert on public.jobs for each row execute function supabase_functions.http_request(
        'https://<PROJECT_REF>.functions.supabase.co/notify-new-job',
        'POST',
        '{"Content-Type":"application/json", "Authorization":"Bearer <SERVICE_ROLE_KEY>"}',
        '{}',
        '1000'
    );
-- Opcional: Adicionar política para permitir que o sistema leia subscrições
-- (Geralmente a Service Role já tem acesso total)