-- Corrige seed com placeholder AdSense (ca-pub-XXXX) gravado pelo script antigo.
-- Runtime já rejeita placeholders, mas limpamos a BD para o admin configurar o ID real.
update public.system_settings
set value = jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(value, '{client}', to_jsonb(''::text)),
          '{slots,homeHero}', to_jsonb(''::text)
        ),
        '{slots,homeFooter}', to_jsonb(''::text)
      ),
      '{slots,jobsList}', to_jsonb(''::text)
    ),
    updated_at = timezone('utc'::text, now())
where key = 'google_ads'
  and value #>> '{client}' like 'ca-pub-XXXX%';

notify pgrst, 'reload schema';
