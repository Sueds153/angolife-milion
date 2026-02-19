-- Adiciona coluna URL aos product_deals se não existir
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_deals'
        AND column_name = 'url'
) THEN
ALTER TABLE public.product_deals
ADD COLUMN url text;
END IF;
END $$;
COMMENT ON COLUMN public.product_deals.url IS 'Link direto para a oferta ou folheto digital';