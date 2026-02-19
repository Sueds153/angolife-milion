-- FRESH START: RECREATE NEWS TABLE (Português Final)
-- Use este script se a estrutura estiver confusa ou dando erro de colunas inexistentes.
-- ATENÇÃO: Isto apagará notícias que já estejam na tabela (se houver).
DROP TABLE IF EXISTS public.news_articles;
CREATE TABLE public.news_articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo TEXT NOT NULL,
    resumo TEXT,
    corpo TEXT,
    imagem_url TEXT,
    categoria TEXT CHECK (
        categoria IN ('Economia', 'Oportunidades', 'Utilidade')
    ),
    fonte TEXT,
    url_origem TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'published', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE
);
-- Re-ativar RLS
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
-- Política de leitura pública para as publicadas
CREATE POLICY "Allow Public Select" ON public.news_articles FOR
SELECT USING (status = 'published');
-- Forçar recarregamento do cache
NOTIFY pgrst,
'reload schema';