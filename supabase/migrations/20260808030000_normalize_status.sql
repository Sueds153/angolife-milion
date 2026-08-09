-- Fase 9: Normalizar status de conteudo (jobs/news/deals)
-- Variantes PT/EN -> valores canonicos por tabela:
--   jobs/news_articles: publicado / pendente / rejeitado
--   product_deals:      approved / pending / rejected
-- Includes: dados existentes, CHECK constraints e trigger de escrita.

-- 1. Normalizar dados existentes (apenas variantes fora do canonico)
UPDATE product_deals SET status = 'approved'
WHERE lower(btrim(status)) IN ('publicado','published','aprovado');

-- jobs/news ja estao em PT canonico (publicado/pendente); apenas protege variantes residuais
UPDATE jobs SET status = 'publicado'
WHERE lower(btrim(status)) IN ('published','aprovado','approved','ativo','active','premium');
UPDATE jobs SET status = 'pendente'
WHERE lower(btrim(status)) IN ('pending');
UPDATE jobs SET status = 'rejeitado'
WHERE lower(btrim(status)) IN ('rejected');

UPDATE news_articles SET status = 'publicado'
WHERE lower(btrim(status)) IN ('published','aprovado','approved','ativo','active','premium');
UPDATE news_articles SET status = 'pendente'
WHERE lower(btrim(status)) IN ('pending');
UPDATE news_articles SET status = 'rejeitado'
WHERE lower(btrim(status)) IN ('rejected');

-- 2. Funcao canonicizadora (por tabela) para writes futuros
CREATE OR REPLACE FUNCTION public.normalize_content_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  canonical_published text;
  canonical_pending   text;
  canonical_rejected  text;
BEGIN
  IF TG_TABLE_NAME = 'product_deals' THEN
    canonical_published := 'approved';
    canonical_pending   := 'pending';
    canonical_rejected  := 'rejected';
  ELSE
    canonical_published := 'publicado';
    canonical_pending   := 'pendente';
    canonical_rejected  := 'rejeitado';
  END IF;

  IF NEW.status IS NULL OR btrim(NEW.status) = '' THEN
    NEW.status := canonical_pending;
    RETURN NEW;
  END IF;

  NEW.status := CASE lower(btrim(NEW.status))
    WHEN 'publicado' THEN canonical_published
    WHEN 'published' THEN canonical_published
    WHEN 'aprovado'  THEN canonical_published
    WHEN 'approved'  THEN canonical_published
    WHEN 'ativo'     THEN canonical_published
    WHEN 'active'    THEN canonical_published
    WHEN 'premium'   THEN canonical_published
    WHEN 'pendente'  THEN canonical_pending
    WHEN 'pending'   THEN canonical_pending
    WHEN 'rejeitado' THEN canonical_rejected
    WHEN 'rejected'  THEN canonical_rejected
    ELSE NEW.status
  END;

  RETURN NEW;
END;
$$;

-- 3. Triggers BEFORE INSERT/UPDATE
-- (remover triggers antigos redundantes que só faziam lower/trim do status)
DROP TRIGGER IF EXISTS tr_standardize_jobs_status ON jobs;
DROP TRIGGER IF EXISTS tr_std_jobs ON jobs;
DROP TRIGGER IF EXISTS tr_standardize_news_status ON news_articles;
DROP TRIGGER IF EXISTS tr_std_news ON news_articles;
DROP TRIGGER IF EXISTS tr_standardize_deals_status ON product_deals;
DROP TRIGGER IF EXISTS tr_std_deals ON product_deals;
DROP FUNCTION IF EXISTS standardize_status_trigger();

DROP TRIGGER IF EXISTS trg_jobs_normalize_status ON jobs;
CREATE TRIGGER trg_jobs_normalize_status
BEFORE INSERT OR UPDATE OF status ON jobs
FOR EACH ROW EXECUTE FUNCTION public.normalize_content_status();

DROP TRIGGER IF EXISTS trg_news_normalize_status ON news_articles;
CREATE TRIGGER trg_news_normalize_status
BEFORE INSERT OR UPDATE OF status ON news_articles
FOR EACH ROW EXECUTE FUNCTION public.normalize_content_status();

DROP TRIGGER IF EXISTS trg_deals_normalize_status ON product_deals;
CREATE TRIGGER trg_deals_normalize_status
BEFORE INSERT OR UPDATE OF status ON product_deals
FOR EACH ROW EXECUTE FUNCTION public.normalize_content_status();

-- 4. CHECK constraints (valores canonicos apenas)
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS chk_jobs_status;
ALTER TABLE jobs ADD CONSTRAINT chk_jobs_status
CHECK (status IN ('publicado','pendente','rejeitado'));

ALTER TABLE news_articles DROP CONSTRAINT IF EXISTS chk_news_status;
ALTER TABLE news_articles ADD CONSTRAINT chk_news_status
CHECK (status IN ('publicado','pendente','rejeitado'));

ALTER TABLE product_deals DROP CONSTRAINT IF EXISTS chk_deals_status;
ALTER TABLE product_deals ADD CONSTRAINT chk_deals_status
CHECK (status IN ('approved','pending','rejected'));
