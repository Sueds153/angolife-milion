-- ==========================================
-- Multicaixa — Tabelas, RLS, seeds e índices
--
-- multicaixas        : ATMs (dados fixos + contribuição comunitária)
-- reportes_multicaixa: reportes crowdsourced (coração da funcionalidade)
-- ==========================================

-- ──────────────────────────────────────────
-- 1. multicaixas
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.multicaixas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  banco_operador text,
  latitude numeric,
  longitude numeric,
  bairro text,
  status_aprovacao text NOT NULL DEFAULT 'aprovado',
  contribuidor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  criado_em timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_multicaixas_status_aprovacao
    CHECK (status_aprovacao IN ('aprovado', 'pendente_aprovacao', 'rejeitado')),
  CONSTRAINT chk_multicaixas_latitude
    CHECK (latitude IS NULL OR (latitude BETWEEN -90 AND 90)),
  CONSTRAINT chk_multicaixas_longitude
    CHECK (longitude IS NULL OR (longitude BETWEEN -180 AND 180))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_multicaixas_nome ON public.multicaixas (nome);
CREATE INDEX IF NOT EXISTS idx_multicaixas_status_aprovacao ON public.multicaixas (status_aprovacao);
CREATE INDEX IF NOT EXISTS idx_multicaixas_bairro ON public.multicaixas (bairro);

ALTER TABLE public.multicaixas ENABLE ROW LEVEL SECURITY;

-- Leitura pública: só ATMs aprovados
CREATE POLICY "Multicaixas aprovados são públicos" ON public.multicaixas
  FOR SELECT TO anon, authenticated USING (status_aprovacao = 'aprovado');
-- Admin vê também pendentes/rejeitados
CREATE POLICY "Admin vê todos os multicaixas" ON public.multicaixas
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );
-- Inserção apenas via RPC multicaixa_adicionar (SECURITY DEFINER)
CREATE POLICY "Admin aprova ou rejeita multicaixas" ON public.multicaixas
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );
CREATE POLICY "Admin apaga multicaixas" ON public.multicaixas
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ──────────────────────────────────────────
-- 2. reportes_multicaixa
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reportes_multicaixa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  multicaixa_id uuid NOT NULL REFERENCES public.multicaixas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status_dinheiro text NOT NULL,
  tipo_notas text NOT NULL DEFAULT 'nao_informado',
  valor_maximo_levantado numeric,
  status_fila text NOT NULL DEFAULT 'nao_informado',
  timestamp timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_reportes_status_dinheiro
    CHECK (status_dinheiro IN ('tem_dinheiro', 'sem_dinheiro', 'avariado')),
  CONSTRAINT chk_reportes_tipo_notas
    CHECK (tipo_notas IN ('notas_pequenas', 'so_notas_grandes', 'nao_informado')),
  CONSTRAINT chk_reportes_status_fila
    CHECK (status_fila IN ('sem_fila', 'fila_pequena', 'fila_grande', 'nao_informado')),
  CONSTRAINT chk_reportes_valor
    CHECK (valor_maximo_levantado IS NULL OR valor_maximo_levantado BETWEEN 0 AND 500000)
);

CREATE INDEX IF NOT EXISTS idx_reportes_multicaixa_atm
  ON public.reportes_multicaixa (multicaixa_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_reportes_multicaixa_user
  ON public.reportes_multicaixa (user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_reportes_multicaixa_timestamp
  ON public.reportes_multicaixa (timestamp);

ALTER TABLE public.reportes_multicaixa ENABLE ROW LEVEL SECURITY;

-- Dados comunitários: todos os autenticados leem (usado pelo estado/realtime)
CREATE POLICY "Reportes visíveis a autenticados" ON public.reportes_multicaixa
  FOR SELECT TO authenticated USING (true);
-- Inserção do próprio reporte (RPC recomenda-se; RLS como rede de segurança)
CREATE POLICY "Utilizador reporta os seus" ON public.reportes_multicaixa
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin gere reportes" ON public.reportes_multicaixa
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ──────────────────────────────────────────
-- 3. Grants
-- ──────────────────────────────────────────
GRANT SELECT ON public.multicaixas TO anon, authenticated;
GRANT SELECT ON public.reportes_multicaixa TO authenticated;
GRANT INSERT ON public.reportes_multicaixa TO authenticated;

-- ──────────────────────────────────────────
-- 4. Seeds — ATMs iniciais de Luanda (fontes públicas, coordenadas aproximadas)
--    Complementados depois por contribuição comunitária (pendente_aprovacao).
-- ──────────────────────────────────────────
INSERT INTO public.multicaixas (nome, banco_operador, latitude, longitude, bairro, status_aprovacao) VALUES
  ('Multicaixa Shoprite Talatona',        'BAI',               -8.9349, 13.1535, 'Talatona',   'aprovado'),
  ('Multicaixa Kilamba Av. 25 de Abril',  'BFA',               -8.9961, 13.2689, 'Kilamba',    'aprovado'),
  ('Multicaixa Central Mutamba',          'BAI',               -8.8229, 13.2318, 'Mutamba',    'aprovado'),
  ('Multicaixa Banco Atlântico Mutamba',  'Banco Atlântico',   -8.8236, 13.2305, 'Mutamba',    'aprovado'),
  ('Multicaixa Ingombota Av. Deolinda',   'BFA',               -8.8260, 13.2340, 'Ingombota',  'aprovado'),
  ('Multicaixa Maianga Rua Amílcar Cabral','Standard Bank',    -8.8173, 13.2250, 'Maianga',    'aprovado'),
  ('Multicaixa Maculusso Banco Sol',      'Banco Sol',         -8.8257, 13.2232, 'Maculusso',  'aprovado'),
  ('Multicaixa Alvalade Rua D. Maria',    'BAI',               -8.8300, 13.2190, 'Alvalade',   'aprovado'),
  ('Multicaixa Rangel',                   'BFA',               -8.8050, 13.2300, 'Rangel',     'aprovado'),
  ('Multicaixa Benfica Vila',             'Millennium Atlântico', -8.9070, 13.1800, 'Benfica', 'aprovado'),
  ('Multicaixa Viana Centro',             'Standard Bank',     -8.8880, 13.3720, 'Viana',      'aprovado'),
  ('Multicaixa Cazenga Mercado',          'BAI',               -8.7870, 13.2450, 'Cazenga',    'aprovado'),
  ('Multicaixa Golf 2',                   'Banco Yetu',        -8.8600, 13.2900, 'Golf 2',     'aprovado'),
  ('Multicaixa Camama',                   'Finibanco',         -8.9500, 13.2000, 'Camama',     'aprovado'),
  ('Multicaixa Cassequel Shopping',       'Millennium Atlântico', -8.9200, 13.1400, 'Cassequel','aprovado'),
  ('Multicaixa Nova Vida',                'BAI',               -8.9250, 13.2850, 'Nova Vida',  'aprovado'),
  ('Multicaixa Gamek',                    'BFA',               -8.9700, 13.2100, 'Gamek',      'aprovado'),
  ('Multicaixa Sambizanga',               'Banco Sol',         -8.8100, 13.2240, 'Sambizanga', 'aprovado'),
  ('Multicaixa Zango 3',                  'Standard Bank',     -9.0400, 13.4400, 'Zango',      'aprovado'),
  ('Multicaixa Cacuaco',                  'BAI',               -8.7300, 13.3500, 'Cacuaco',    'aprovado')
ON CONFLICT (nome) DO NOTHING;
