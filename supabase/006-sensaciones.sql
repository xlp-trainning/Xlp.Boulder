-- Sensación de dificultad (blando / justo / duro), intentos y «primero en encadenarlo».
-- Ejecútalo una vez en Supabase → SQL Editor, DESPUÉS de 004-ranking.sql. Se puede repetir sin problema.

alter table public.ratings add column if not exists feel smallint check (feel between -1 and 1);         -- -1 blando, 0 justo, 1 duro
alter table public.ratings add column if not exists attempts smallint check (attempts between 1 and 999); -- intentos

-- Medias públicas de cada bloque, ahora con sensaciones e intentos medios al encadenar
drop function if exists public.block_stats();
create function public.block_stats()
returns table (block_id uuid, avg_stars numeric, votes bigint, sends bigint, projects bigint, flashes bigint,
               soft bigint, fair bigint, hard bigint, avg_attempts numeric)
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
         round(avg(r.attempts) filter (where r.sent), 1)
  from public.ratings r
  group by r.block_id;
$$;
revoke execute on function public.block_stats() from public;
grant execute on function public.block_stats() to anon, authenticated;

-- Primero en encadenar cada bloque de un rocódromo, entre quienes se han apuntado al ranking con un apodo
create or replace function public.first_sends(p_gym text)
returns table (block_id uuid, nick text, sent_at timestamptz, flash boolean, is_me boolean)
language sql stable security definer
set search_path = ''
as $$
  select distinct on (r.block_id) r.block_id, c.nick, r.sent_at, r.flash, r.user_id = auth.uid()
  from public.ratings r
  join public.climbers c on c.user_id = r.user_id
  join public.blocks b on b.id = r.block_id
  where b.gym_id = p_gym and r.sent and r.sent_at is not null
  order by r.block_id, r.sent_at, c.created_at;
$$;
revoke execute on function public.first_sends(text) from public;
grant execute on function public.first_sends(text) to anon, authenticated;
