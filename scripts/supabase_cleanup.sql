-- Resolve.AO — Limpeza one-off da tabela jobs
-- Projeto: efhelvzdlwewsjkdknkl (produção)
-- Correr no Supabase Dashboard → SQL Editor.
-- Reversível: corre os comandos dentro da transação; se algo correr mal, faz ROLLBACK.

BEGIN;

-- 1. Normalizar locations repetidas/sujas
UPDATE public.jobs
SET location = 'Luanda'
WHERE lower(regexp_replace(trim(location), '\s+', ' ', 'g'))
  IN ('luanda, luanda', 'luanda , luanda', 'luanda, angola', 'luanda, luanda, angola', 'luanda , luanda , angola');

UPDATE public.jobs
SET location = 'Viana, Luanda'
WHERE location ILIKE '%viana, luanda%';

UPDATE public.jobs
SET location = 'Luanda'
WHERE location ILIKE '%quebecc, luanda%'
   OR location ILIKE '%km 30, luanda%';

-- 2. Locations que são categorias (Sociedade / Construção) → mover para categoria e limpar local
UPDATE public.jobs
SET location = 'Angola',
    categoria = CASE
      WHEN lower(location) IN ('sociedade', 'construção', 'construcao') THEN 'Geral'
      ELSE categoria
    END
WHERE lower(location) IN ('sociedade', 'construção', 'construcao');

-- 3. Preencher type a partir do título onde vazio
UPDATE public.jobs
SET type = CASE
  WHEN lower(title) ~ 'est[áa]gio|estagi[áa]ri|trainee|young graduate' THEN 'Estágio'
  WHEN lower(title) ~ 'tempo indeterminado|tempo integral|full[- ]?time' THEN 'Tempo Inteiro'
  WHEN lower(title) ~ 'tempo determinado' THEN 'Tempo Determinado'
  WHEN lower(title) ~ 'contrato de servi[çc]os|presta[çc][ãa]o de servi[çc]os' THEN 'Contrato de Serviços'
  WHEN lower(title) ~ 'part[- ]?time|meio per[íi]odo' THEN 'Part-time'
  WHEN lower(title) ~ 'remoto|remote|h[íi]brido' THEN 'Remoto'
  WHEN lower(title) ~ 'a definir' THEN 'A definir'
END
WHERE (type IS NULL OR type = '');

-- 4. Marcar notícias como pendentes (saem do feed; revertível com status='publicado')
UPDATE public.jobs
SET status = 'pendente'
WHERE lower(title) IN (
  'investigadores angolanos convidados a publicarem trabalhos em revista científica internacional',
  'governo está a construir 1500 habitações sociais no icolo e bengo',
  'governo do cuanza sul mobiliza famílias para identificar 22 vítimas de acidente'
);

-- 5. Remover duplicados (mantém a publicação mais recente)
DELETE FROM public.jobs a
USING public.jobs b
WHERE a.posted_at < b.posted_at
  AND lower(trim(a.title)) = lower(trim(b.title))
  AND lower(trim(coalesce(a.company, ''))) = lower(trim(coalesce(b.company, '')));

-- 6. Backfill da fonte a partir do source_url (habilita o badge "Via X")
UPDATE public.jobs
SET fonte = lower(substring(source_url from '://([^/]+)'))
WHERE (fonte IS NULL OR fonte = '') AND source_url IS NOT NULL AND source_url <> '';

COMMIT;
