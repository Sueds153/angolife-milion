-- Defense-in-depth: as 16 policies de administracao em public.* estavam criadas
-- sem clausula TO, o que as torna aplicaveis a PUBLIC (incluso anon).
--
-- Com o grant de 20261008000000, anon passa a conseguir avaliar is_admin() e
-- estas policies deixam de dar 42501 - mas nao deviam de todo ser avaliadas
-- por anon. Aqui recriamos cada uma com "to authenticated", preservando
-- literalmente o WITH CHECK / USING original (lidos de pg_policies, sem
-- reescrever expressoes a mao).
--
-- Filtro: apenas policies em public.* que chamam a funcao is_admin() e que
-- incluem o role 'public'. Policies que referenciam a coluna profiles.is_admin
-- por subquery nao sao afetadas; storage.* ja esta todo "to authenticated",
-- excepto "avatars_individual_access", que precisa de continuar publico para
-- anon (leitura de avatares) e por isso e excluido deste script.

do $$
declare
  r record;
  v_using text;
  v_check text;
begin
  for r in
    select schemaname, tablename, policyname, cmd, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (qual ~ 'is_admin\s*\(' or with_check ~ 'is_admin\s*\(')
      and (roles::text[] @> array['public'] or roles::text[] @> array['anon'])
  loop
    v_using := coalesce(r.qual, coalesce(r.with_check, 'true'));
    v_check := coalesce(r.with_check, r.qual);

    execute format(
      'drop policy %I on %I.%I',
      r.policyname, r.schemaname, r.tablename
    );

    -- pg_policies.cmd devolve MAIUSCULAS (SELECT/INSERT/UPDATE/DELETE/ALL).
    -- Postgres so aceita WITH CHECK em policies INSERT (sem USING).
    if lower(r.cmd) = 'insert' then
      execute format(
        'create policy %I on %I.%I for insert to authenticated with check (%s)',
        r.policyname, r.schemaname, r.tablename, coalesce(v_check, 'true')
      );
    elsif lower(r.cmd) in ('update', 'all') and v_check is not null then
      execute format(
        'create policy %I on %I.%I for %s to authenticated using (%s) with check (%s)',
        r.policyname, r.schemaname, r.tablename, lower(r.cmd), v_using, v_check
      );
    else
      execute format(
        'create policy %I on %I.%I for %s to authenticated using (%s)',
        r.policyname, r.schemaname, r.tablename, lower(r.cmd), v_using
      );
    end if;
  end loop;
end $$;

notify pgrst, 'reload schema';
