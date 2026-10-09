-- Restringe o RPC bump_job_counter (20261008000003).
-- 'application' passa a exigir sessão autenticada: o fluxo do client só deixa
-- candidatar-se com utilizador logado, mas o grant a `anon` permitia inflar
-- application_count por chamada direta à RPC sem sessão.
-- 'report' já exigia auth.uid() dentro da função.

create or replace function public.bump_job_counter(p_job_id uuid, p_kind text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_kind = 'application' then
    if auth.uid() is null then
      raise exception 'Autenticação necessária para registar candidaturas';
    end if;

    update jobs
       set application_count = coalesce(application_count, 0) + 1
     where id = p_job_id
       and status in ('publicado', 'published', 'aprovado', 'approved');
  elsif p_kind = 'report' then
    if auth.uid() is null then
      raise exception 'Autenticação necessária para denunciar vagas';
    end if;

    update jobs
       set report_count = coalesce(report_count, 0) + 1
     where id = p_job_id
       and status in ('publicado', 'published', 'aprovado', 'approved');

    update jobs
       set status = 'pendente'
     where id = p_job_id
       and coalesce(report_count, 0) >= 3
       and status in ('publicado', 'published', 'aprovado', 'approved');
  else
    raise exception 'Tipo de contador desconhecido: %', p_kind;
  end if;
end;
$$;

-- Defesa em profundidade: anon já não precisa de executar a função.
revoke execute on function public.bump_job_counter(uuid, text) from anon;
grant execute on function public.bump_job_counter(uuid, text) to authenticated, service_role;
