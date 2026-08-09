-- ==========================================
-- VaiJá — Tabelas principais + RLS + seeds
-- ==========================================

-- ──────────────────────────────────────────
-- 1. dados_motorista (só preenchido quando o utilizador ativa "modo motorista")
--    A verificação documental (verificado) é opcional no MVP: o motorista pode
--    publicar logo com matrícula + tipo de veículo (fricção mínima). O upload
--    do BI/carta vai para o bucket privado documentos-motorista.
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dados_motorista (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  matricula text,
  tipo_veiculo text,
  foto_documento_url text,
  verificado boolean NOT NULL DEFAULT false,
  trajetos_fantasma_count integer NOT NULL DEFAULT 0,
  status_conta text NOT NULL DEFAULT 'ativo',
  criado_em timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  atualizado_em timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT dados_motorista_user_id_key UNIQUE (user_id),
  CONSTRAINT chk_dados_motorista_tipo_veiculo CHECK (tipo_veiculo IN ('candongueiro', 'taxi')),
  CONSTRAINT chk_dados_motorista_status CHECK (status_conta IN ('ativo', 'suspenso'))
);

ALTER TABLE public.dados_motorista ENABLE ROW LEVEL SECURITY;

-- O dono acede a todos os dados (inclui foto_documento_url). Terceiros só veem
-- as colunas públicas através da view motorista_publico (ver abaixo).
CREATE POLICY "Motorista vê os seus dados" ON public.dados_motorista
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Motorista cria os seus dados" ON public.dados_motorista
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Motorista atualiza os seus dados" ON public.dados_motorista
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Motorista apaga os seus dados" ON public.dados_motorista
  FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin gere dados de motoristas" ON public.dados_motorista
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ──────────────────────────────────────────
-- 2. corredores — rotas fixas de candongueiro (seed com preços de referência)
--    Serve o "modo corredor" e a fase 6 (preço médio por rota).
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.corredores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  partida text NOT NULL,
  destino text NOT NULL,
  partida_lat numeric,
  partida_lng numeric,
  destino_lat numeric,
  destino_lng numeric,
  preco_referencia numeric,
  distancia_km numeric,
  ativo boolean NOT NULL DEFAULT true
);

ALTER TABLE public.corredores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Corredores são públicos" ON public.corredores
  FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.corredores (nome, partida, destino, partida_lat, partida_lng, destino_lat, destino_lng, preco_referencia, distancia_km)
VALUES
  ('Maianga ↔ Mutamba', 'Maianga', 'Mutamba', -8.8231, 13.2402, -8.8129, 13.2340, 300, 4),
  ('Futungo de Belas ↔ Mutamba', 'Futungo de Belas', 'Mutamba', -8.9248, 13.1937, -8.8129, 13.2340, 500, 12),
  ('Cazenga ↔ Mutamba', 'Cazenga', 'Mutamba', -8.8174, 13.2905, -8.8129, 13.2340, 350, 10),
  ('Viana ↔ Mutamba', 'Viana', 'Mutamba', -8.9034, 13.3683, -8.8129, 13.2340, 700, 25),
  ('Kilamba ↔ Mutamba', 'Kilamba', 'Mutamba', -8.9855, 13.2921, -8.8129, 13.2340, 600, 18),
  ('Benfica ↔ Marçal', 'Benfica', 'Marçal', -8.9905, 13.2962, -8.8277, 13.2600, 300, 8),
  ('Cacuaco ↔ Mutamba', 'Cacuaco', 'Mutamba', -8.7858, 13.3710, -8.8129, 13.2340, 450, 15),
  ('Rocha Pinto ↔ Mutamba', 'Rocha Pinto', 'Mutamba', -8.8897, 13.2195, -8.8129, 13.2340, 400, 7)
ON CONFLICT (nome) DO NOTHING;

-- ──────────────────────────────────────────
-- 3. trajetos_ativos
--    modo 'trajeto'  -> janela curta (20 min)
--    modo 'corredor' -> janela longa renovável (2 h), associa-se a corredores
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trajetos_ativos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  motorista_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  modo text NOT NULL DEFAULT 'trajeto',
  corredor_id uuid REFERENCES public.corredores(id) ON DELETE SET NULL,
  ponto_partida text NOT NULL,
  partida_lat numeric,
  partida_lng numeric,
  ponto_destino text NOT NULL,
  destino_lat numeric,
  destino_lng numeric,
  lugares_totais integer NOT NULL DEFAULT 4,
  lugares_disponiveis integer NOT NULL DEFAULT 4,
  preco numeric NOT NULL,
  modo_lotacao_rapida boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'ativo',
  incidente_reportado boolean NOT NULL DEFAULT false,
  criado_em timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  atualizado_em timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  expira_em timestamptz NOT NULL DEFAULT timezone('utc'::text, now()) + interval '20 minutes',
  CONSTRAINT chk_vaija_modo CHECK (modo IN ('trajeto', 'corredor')),
  CONSTRAINT chk_vaija_status CHECK (status IN ('ativo', 'lotado', 'finalizado', 'expirado')),
  CONSTRAINT chk_vaija_lugares CHECK (
    lugares_totais > 0
    AND lugares_disponiveis >= 0
    AND lugares_disponiveis <= lugares_totais
  ),
  CONSTRAINT chk_vaija_preco CHECK (preco >= 0)
);

CREATE INDEX IF NOT EXISTS idx_vaija_trajetos_status ON public.trajetos_ativos (status);
CREATE INDEX IF NOT EXISTS idx_vaija_trajetos_motorista ON public.trajetos_ativos (motorista_id);
CREATE INDEX IF NOT EXISTS idx_vaija_trajetos_expira ON public.trajetos_ativos (expira_em);

ALTER TABLE public.trajetos_ativos ENABLE ROW LEVEL SECURITY;

-- Passageiros autenticados vêm os trajetos ativos/lotados (também alimenta o
-- Realtime: o broadcast respeita esta policy). Não veem 'finalizado'/'expirado'
-- porque essas linhas são movidas para historico_trajetos.
CREATE POLICY "Trajetos ativos visíveis a autenticados" ON public.trajetos_ativos
  FOR SELECT TO authenticated USING (status IN ('ativo', 'lotado'));
CREATE POLICY "Motorista publica os seus trajetos" ON public.trajetos_ativos
  FOR INSERT TO authenticated WITH CHECK (motorista_id = auth.uid());
CREATE POLICY "Motorista atualiza os seus trajetos" ON public.trajetos_ativos
  FOR UPDATE TO authenticated USING (motorista_id = auth.uid()) WITH CHECK (motorista_id = auth.uid());
CREATE POLICY "Motorista apaga os seus trajetos" ON public.trajetos_ativos
  FOR DELETE TO authenticated USING (motorista_id = auth.uid());
CREATE POLICY "Admin vê todos os trajetos" ON public.trajetos_ativos
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ──────────────────────────────────────────
-- 4. historico_trajetos — cópia dos trajetos finalizados/expirados
--    (escrita apenas por trigger; usada na fase 6 para preço médio por rota)
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.historico_trajetos (
  id uuid PRIMARY KEY,
  motorista_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  modo text NOT NULL DEFAULT 'trajeto',
  corredor_id uuid REFERENCES public.corredores(id) ON DELETE SET NULL,
  ponto_partida text NOT NULL,
  partida_lat numeric,
  partida_lng numeric,
  ponto_destino text NOT NULL,
  destino_lat numeric,
  destino_lng numeric,
  lugares_totais integer NOT NULL,
  lugares_disponiveis integer NOT NULL,
  preco numeric NOT NULL,
  modo_lotacao_rapida boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  incidente_reportado boolean NOT NULL DEFAULT false,
  criado_em timestamptz NOT NULL,
  atualizado_em timestamptz NOT NULL,
  expira_em timestamptz,
  finalizado_em timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_hist_modo CHECK (modo IN ('trajeto', 'corredor')),
  CONSTRAINT chk_hist_status CHECK (status IN ('ativo', 'lotado', 'finalizado', 'expirado'))
);

CREATE INDEX IF NOT EXISTS idx_vaija_hist_rota ON public.historico_trajetos (ponto_partida, ponto_destino, finalizado_em);
CREATE INDEX IF NOT EXISTS idx_vaija_hist_motorista ON public.historico_trajetos (motorista_id);

ALTER TABLE public.historico_trajetos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Motorista vê o seu histórico" ON public.historico_trajetos
  FOR SELECT TO authenticated USING (motorista_id = auth.uid());
CREATE POLICY "Admin vê todo o histórico" ON public.historico_trajetos
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ──────────────────────────────────────────
-- 5. confirmacoes — lugares confirmados pelos passageiros
--    INSERT/UPDATE/DELETE são feitos APENAS via RPC (SECURITY DEFINER) para
--    garantir atomicidade (lock de linha + capacidade). Por isso não se
--    concede escrita direta a authenticated.
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.confirmacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trajeto_id uuid NOT NULL REFERENCES public.trajetos_ativos(id) ON DELETE CASCADE,
  passageiro_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  preco_acordado numeric,
  status text NOT NULL DEFAULT 'confirmado',
  criado_em timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT confirmacoes_trajeto_passageiro_key UNIQUE (trajeto_id, passageiro_id),
  CONSTRAINT chk_confirmacoes_status CHECK (status IN ('confirmado', 'embarcado', 'cancelado', 'nao_apareceu'))
);

CREATE INDEX IF NOT EXISTS idx_vaija_confirmacoes_trajeto ON public.confirmacoes (trajeto_id);
CREATE INDEX IF NOT EXISTS idx_vaija_confirmacoes_passageiro ON public.confirmacoes (passageiro_id);

ALTER TABLE public.confirmacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Passageiro vê as suas confirmações" ON public.confirmacoes
  FOR SELECT TO authenticated USING (passageiro_id = auth.uid());
CREATE POLICY "Motorista vê as confirmações dos seus trajetos" ON public.confirmacoes
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.trajetos_ativos t
      WHERE t.id = confirmacoes.trajeto_id AND t.motorista_id = auth.uid()
    )
  );
CREATE POLICY "Admin vê todas as confirmações" ON public.confirmacoes
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ──────────────────────────────────────────
-- 6. pedidos_demanda — sinais de procura (melhoria: lado da demanda)
--    O passageiro anuncia "quero ir de X→Y"; o motorista vê procura antes de
--    publicar, combatendo o arranque a frio (densidade).
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pedidos_demanda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passageiro_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ponto_partida text NOT NULL,
  partida_lat numeric,
  partida_lng numeric,
  ponto_destino text NOT NULL,
  destino_lat numeric,
  destino_lng numeric,
  status text NOT NULL DEFAULT 'aberto',
  criado_em timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_demanda_status CHECK (status IN ('aberto', 'atendido', 'cancelado'))
);

CREATE INDEX IF NOT EXISTS idx_vaija_demanda_status ON public.pedidos_demanda (status, criado_em);

ALTER TABLE public.pedidos_demanda ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pedidos de procura visíveis a autenticados" ON public.pedidos_demanda
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Passageiro cria os seus pedidos" ON public.pedidos_demanda
  FOR INSERT TO authenticated WITH CHECK (passageiro_id = auth.uid());
CREATE POLICY "Passageiro gere os seus pedidos" ON public.pedidos_demanda
  FOR UPDATE TO authenticated USING (passageiro_id = auth.uid()) WITH CHECK (passageiro_id = auth.uid());
CREATE POLICY "Passageiro apaga os seus pedidos" ON public.pedidos_demanda
  FOR DELETE TO authenticated USING (passageiro_id = auth.uid());

-- ──────────────────────────────────────────
-- 7. motorista_publico — vista pública do motorista (sem dados sensíveis)
--    Vista definer: ignora RLS da base para expor só colunas públicas.
--    O acesso à tabela dados_motorista continua restrito ao dono/admin via RLS.
-- ──────────────────────────────────────────
CREATE OR REPLACE VIEW public.motorista_publico AS
SELECT
  dm.user_id,
  dm.matricula,
  dm.tipo_veiculo,
  dm.verificado,
  dm.trajetos_fantasma_count,
  dm.status_conta,
  p.full_name,
  p.phone,
  p.avatar_url,
  p.avaliacao_media
FROM public.dados_motorista dm
JOIN public.profiles p ON p.id = dm.user_id;

GRANT SELECT ON public.motorista_publico TO authenticated;

-- ──────────────────────────────────────────
-- Grants explícitos (a Data API pode não expor tabelas criadas por SQL)
-- ──────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trajetos_ativos TO authenticated;
GRANT SELECT ON public.historico_trajetos TO authenticated;
GRANT SELECT ON public.confirmacoes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedidos_demanda TO authenticated;
GRANT SELECT ON public.corredores TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.dados_motorista TO authenticated;
