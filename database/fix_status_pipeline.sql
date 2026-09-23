-- ─────────────────────────────────────────────────────────────────
-- Alinha o pipeline de status (news_articles + jobs)
--
-- Problema:
--   * normalize_content_status() reescreve 'pendente' → 'pending'
--     (a sua lista de aceites não inclui 'pendente')
--   * os CHECKs chk_news_status / chk_jobs_status só aceitam
--     ('publicado','pendente','rejeitado')
--   * logo todo o insert do scraper ('pendente' → 'pending') falha
--     com 23514 e o site ficava sem conteúdo (31 notícias presas
--     em 'pendente'; jobs com 0 linhas)
--
-- Correcção:
--   1. alarga os CHECKs para a união de todos os valores usados
--      pelo código (PT + EN), mantendo os triggers de segurança
--   2. publica o conteúdo já existente (a página pública só lista
--      status publicado/published/aprovado/approved)
-- ─────────────────────────────────────────────────────────────────

BEGIN;

ALTER TABLE public.news_articles
  DROP CONSTRAINT IF EXISTS chk_news_status;
ALTER TABLE public.news_articles
  ADD CONSTRAINT chk_news_status CHECK (status = ANY (ARRAY[
    'publicado', 'pendente', 'rejeitado',
    'pending', 'published',
    'approved', 'aprovado', 'rejected', 'aguardando'
  ]));

ALTER TABLE public.jobs
  DROP CONSTRAINT IF EXISTS chk_jobs_status;
ALTER TABLE public.jobs
  ADD CONSTRAINT chk_jobs_status CHECK (status = ANY (ARRAY[
    'publicado', 'pendente', 'rejeitado',
    'pending', 'published',
    'approved', 'aprovado', 'rejected', 'aguardando'
  ]));

-- Publica o conteúdo existente (postgres passa pelo
-- force_pending_status_for_users; 'publicado' é aceite pelo
-- normalize_content_status e pelo CHECK novo)
UPDATE public.news_articles
   SET status = 'publicado'
 WHERE status IN ('pendente', 'pending');

UPDATE public.jobs
   SET status = 'publicado'
 WHERE status IN ('pendente', 'pending');

COMMIT;
