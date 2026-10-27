-- Beta según tu altura: la altura (opcional) de quien cuenta su beta y el voto «morfo»
-- (¿el bloque va mejor si eres bajo, alto o da igual?).
-- Ejecútalo una vez en Supabase → SQL Editor, DESPUÉS de 006. Se puede repetir sin problema.
alter table public.comments add column if not exists height smallint check (height between 120 and 220);  -- cm
alter table public.ratings add column if not exists morpho smallint check (morpho between -1 and 1);      -- -1 mejor bajos, 0 da igual, 1 mejor altos

drop function if exists public.block_stats();
create function public.block_stats()
returns table (block_id uuid, avg_stars numeric, votes bigint, sends bigint, projects bigint, flashes bigint,
               soft bigint, fair bigint, hard bigint, avg_attempts numeric, m_short bigint, m_any bigint, m_tall bigint)
language sql stable security definer
set search_path = ''
as $$
  select r.block_id,
         round(avg(r.stars), 2),
         count(r.stars),
         count(*) filter (where r.sent),
         count(*) filter (where r.project and not r.sent),
         count(*) filter (where r.sent and r.flash),
         count(*) filter (where r.feel = -1),
         count(*) filter (where r.feel = 0),
         count(*) filter (where r.feel = 1),
         round(avg(r.attempts) filter (where r.sent), 1),
         count(*) filter (where r.morpho = -1),
         count(*) filter (where r.morpho = 0),
         count(*) filter (where r.morpho = 1)
  from public.ratings r
  group by r.block_id;
$$;
revoke execute on function public.block_stats() from public;
grant execute on function public.block_stats() to anon, authenticated;
