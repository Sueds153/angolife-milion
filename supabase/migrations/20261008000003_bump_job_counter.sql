-- Contadores de vagas (candidaturas e denúncias) para clientes.
-- Motivo: as políticas RLS de UPDATE existentes (service_role e is_admin)
-- bloqueavam silenciosamente os updates de anon/authenticated em jobs,
-- pelo que incrementApplicationCount e reportJob nunca alteravam valores.
-- A função SECURITY DEFINER incrementa de forma atómica no servidor e
-- move a vaga para 'pendente' ao chegar a 3 denúncias.

create or replace function public.bump_job_counter(p_job_id uuid, p_kind text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_kind = 'application' then
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

revoke execute on function public.bump_job_counter(uuid, text) from public;
grant execute on function public.bump_job_counter(uuid, text) to anon, authenticated, service_role;
