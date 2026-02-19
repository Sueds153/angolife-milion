-- ================================================================
-- AngoLife: Migração para suporte ao campo is_priority
-- ================================================================
-- Execute este script no SQL Editor do Supabase para adicionar
-- o campo is_priority à tabela news_articles.
-- ================================================================
-- 1. Adicionar coluna is_priority se não existir
ALTER TABLE news_articles
ADD COLUMN IF NOT EXISTS is_priority BOOLEAN DEFAULT FALSE;
-- 2. Remover qualquer CHECK constraint restritiva sobre 'status'
--    (permite 'pendente', 'publicado', e outros valores futuros)
DO $$
DECLARE r RECORD;
BEGIN FOR r IN (
    SELECT constraint_name
    FROM information_schema.table_constraints
    WHERE table_name = 'news_articles'
        AND constraint_type = 'CHECK'
        AND constraint_name LIKE '%status%'
) LOOP EXECUTE format(
    'ALTER TABLE news_articles DROP CONSTRAINT IF EXISTS %I',
    r.constraint_name
);
RAISE NOTICE 'Removida constraint: %',
r.constraint_name;
END LOOP;
END $$;
-- 3. Garantir coluna url_origem para deduplicação
ALTER TABLE news_articles
ADD COLUMN IF NOT EXISTS url_origem TEXT;
-- 4. Criar índice único parcial para deduplicação eficiente
CREATE UNIQUE INDEX IF NOT EXISTS idx_news_url_origem_unique ON news_articles (url_origem)
WHERE url_origem IS NOT NULL;
-- 5. Verificar resultado
SELECT column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'news_articles'
ORDER BY ordinal_position;