-- Add image_url and categoria columns to jobs table if they don't exist
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'jobs'
        AND column_name = 'imagem_url'
) THEN
ALTER TABLE public.jobs
ADD COLUMN imagem_url TEXT;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'jobs'
        AND column_name = 'categoria'
) THEN
ALTER TABLE public.jobs
ADD COLUMN categoria TEXT;
END IF;
END $$;