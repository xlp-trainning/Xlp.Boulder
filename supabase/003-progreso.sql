-- Progreso: flash y fecha de encadenado en los votos, y flashes en las estadísticas de cada bloque.
-- Ejecútalo una vez en Supabase → SQL Editor. Se puede repetir sin problema.
alter table public.ratings add column if not exists flash boolean not null default false;
alter table public.ratings add column if not exists sent_at timestamptz;
update public.ratings set sent_at = updated_at where sent and sent_at is null;

drop function if exists public.block_stats();
create function public.block_stats()
returns table (block_id uuid, avg_stars numeric, votes bigint, sends bigint, projects bigint, flashes bigint)
language sql stable security definer
set search_path = ''
as $$
  select r.block_id,
         round(avg(r.stars), 2),
         count(r.stars),
         count(*) filter (where r.sent),
         count(*) filter (where r.project and not r.sent),
         count(*) filter (where r.sent and r.flash)
  from public.ratings r
  group by r.block_id;
$$;
revoke execute on function public.block_stats() from public;
grant execute on function public.block_stats() to anon, authenticated;
