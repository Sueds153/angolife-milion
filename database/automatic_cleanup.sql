-- ==========================================
-- AngoLife: Mecanismo de Limpeza Automática (MANTENÇÃO)
-- Remove dados obsoletos para otimização e performance.
-- ==========================================

-- 1. Ativar as extensões necessárias no Supabase
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Criar a função de limpeza
CREATE OR REPLACE FUNCTION maintenance_cleanup_task()
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- REMOVER VAGAS COM MAIS DE 30 DIAS
    DELETE FROM public.jobs
    WHERE posted_at < NOW() - INTERVAL '30 days';

    -- REMOVER NOTÍCIAS COM MAIS DE 30 DIAS
    DELETE FROM public.news_articles
    WHERE published_at < NOW() - INTERVAL '30 days';

    -- LIMPAR RATE LIMITS DE NOTIFICAÇÕES ANTIGOS (MAIS DE 7 DIAS)
    DELETE FROM public.notification_rate_limit
    WHERE date < CURRENT_DATE - INTERVAL '7 days';

    RAISE NOTICE 'Manutenção concluída: Dados obsoletos removidos.';
END;
$$;

-- 3. Agendar a tarefa para correr todos os dias (meia-noite)
-- Nota: O pg_cron usa o fuso horário do banco de dados (geralmente UTC)
SELECT cron.schedule(
    'daily-cleanup',   -- Nome único da tarefa
    '0 0 * * *',       -- Cron: Meia-noite
    'SELECT maintenance_cleanup_task()'
);
