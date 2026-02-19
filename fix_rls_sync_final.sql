-- FIX: PERMITIR QUE O PAINEL ADMIN VEJA ITENS PENDENTES (Sync Fix)
-- Este script ajusta as políticas RLS para permitir leitura pública, necessária enquanto o sistema usa autenticação simulada.
-- 1. LIMPEZA DE POLÍTICAS ANTIGAS (Garantir que não há filtros restritivos de SELECT)
DROP POLICY IF EXISTS "Public Read" ON public.jobs;
DROP POLICY IF EXISTS "Allow Public Read" ON public.jobs;
DROP POLICY IF EXISTS "Public news are viewable by everyone" ON public.news_articles;
DROP POLICY IF EXISTS "Allow Public Select" ON public.news_articles;
DROP POLICY IF EXISTS "Allow Public Read" ON public.news_articles;
-- 2. APLICAR NOVAS POLÍTICAS PERMISSIVAS PARA SELECT
-- Isso permite que o AdminPanel (usando a Anon Key) veja itens pendentes.
-- O frontend continua a filtrar o que o usuário comum vê.
-- JOBS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sync Fix: Allow Public Select" ON public.jobs FOR
SELECT USING (true);
-- NEWS_ARTICLES
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sync Fix: Allow Public Select" ON public.news_articles FOR
SELECT USING (true);
-- 3. RECARREGAR SCHEMA (PostgREST)
NOTIFY pgrst,
'reload schema';