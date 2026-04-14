-- =================================================================
-- 🔐 AngoLife — Security Patch v2
-- Execute este script no Supabase SQL Editor em sequência.
-- Preserva todas as funcionalidades do painel admin.
-- =================================================================
-- ---------------------------------------------------------------
-- 1. PROTEÇÃO DO CAMPO is_admin (Anti-Privilege Escalation)
-- ---------------------------------------------------------------
-- Remove a política base e recria com WITH CHECK para bloquear
-- auto-escalada. O painel admin usa service_role (Edge Function),
-- que ignora RLS por design, portanto continua totalmente funcional.
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR
UPDATE USING (auth.uid() = id) WITH CHECK (
        -- O utilizador NÃO pode alterar o seu próprio campo is_admin
        is_admin = (
            SELECT is_admin
            FROM public.profiles
            WHERE id = auth.uid()
        ) -- O utilizador NÃO pode auto-promover is_premium (gerido pelo subscription service)
        AND is_premium = (
            SELECT is_premium
            FROM public.profiles
            WHERE id = auth.uid()
        ) -- O utilizador NÃO pode auto-promover cv_credits (gerido pelo referral Edge Function)
        AND cv_credits = (
            SELECT cv_credits
            FROM public.profiles
            WHERE id = auth.uid()
        ) -- O utilizador NÃO pode auto-alterar account_type (gerido server-side)
        AND account_type = (
            SELECT account_type
            FROM public.profiles
            WHERE id = auth.uid()
        )
    );
-- ---------------------------------------------------------------
-- 2. TABELA DE RATE-LIMIT DE NOTIFICAÇÕES (Server-side)
-- ---------------------------------------------------------------
-- Substitui o controlo via localStorage (bypassável) por um registo
-- real na base de dados.
CREATE TABLE IF NOT EXISTS public.notification_rate_limit (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    count INT NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, date)
);
-- RLS: cada utilizador só vê e gere os seus próprios registos
ALTER TABLE public.notification_rate_limit ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own rate limit" ON public.notification_rate_limit;
CREATE POLICY "Users manage own rate limit" ON public.notification_rate_limit FOR ALL USING (auth.uid() = user_id);
-- Função para verificar e incrementar o rate-limit de notificações
-- Retorna TRUE se a notificação pode ser enviada, FALSE se o limite foi atingido
CREATE OR REPLACE FUNCTION public.check_notification_limit(p_user_id UUID, p_limit INT DEFAULT 2) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_count INT;
BEGIN -- Inserir ou obter registo de hoje
INSERT INTO public.notification_rate_limit (user_id, date, count)
VALUES (p_user_id, CURRENT_DATE, 0) ON CONFLICT (user_id, date) DO NOTHING;
SELECT count INTO v_count
FROM public.notification_rate_limit
WHERE user_id = p_user_id
    AND date = CURRENT_DATE;
IF v_count >= p_limit THEN RETURN FALSE;
END IF;
-- Incrementar contador
UPDATE public.notification_rate_limit
SET count = count + 1
WHERE user_id = p_user_id
    AND date = CURRENT_DATE;
RETURN TRUE;
END;
$$;
-- ---------------------------------------------------------------
-- 3. VERIFICAÇÃO FINAL — Confirmar tabelas protegidas
-- ---------------------------------------------------------------
SELECT relname AS tabela,
    relrowsecurity AS rls_ativo
FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
    AND c.relkind = 'r'
ORDER BY relname;