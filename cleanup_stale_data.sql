-- Manutenção de Banco de Dados AngoLife
-- Executar a cada 24 horas para manter o banco leve (Lógica de Auto-Limpeza Elite)
-- 1. Apagar notícias com mais de 30 dias
DELETE FROM public.news_articles
WHERE created_at < NOW() - INTERVAL '30 days';
-- 2. Apagar vagas de emprego aprovadas com mais de 30 dias
-- Nota: Mantemos as pendentes para revisão humana se necessário, ou limpamos tudo.
DELETE FROM public.jobs
WHERE (
        status = 'publicado'
        OR status = 'published'
    )
    AND posted_at < NOW() - INTERVAL '30 days';
-- Opcional: Limpar logs antigos ou notificações
DELETE FROM public.orders
WHERE created_at < NOW() - INTERVAL '60 days';