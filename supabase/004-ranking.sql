-- Ranking mensual por ligas de color.
-- Ejecútalo una vez en Supabase → SQL Editor. Se puede repetir sin problema.
--
-- Reglas:
--   · Todo el mundo empieza en la liga Azul.
--   · Para subir a la liga de un color hay que encadenar 10 bloques de ese color en el rocódromo.
--     Tu liga es el color más alto del que tengas 10 encadenados (no se baja nunca).
--   · Dentro de cada liga se ordena por los puntos del mes: azul 1 … compe 8, el flash suma la mitad más.
--   · Cada rocódromo tiene su ranking. Solo sale quien se apunta con un apodo.

-- Participantes del ranking: un apodo por persona (o dispositivo)
create table if not exists public.climbers (
  user_id    uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  nick       text not null check (char_length(btrim(nick)) between 2 and 20),
  created_at timestamptz not null default now()
);
create unique index if not exists climbers_nick_idx on public.climbers (lower(btrim(nick)));
alter table public.climbers enable row level security;
drop policy if exists "cada uno ve su apodo" on public.climbers;
create policy "cada uno ve su apodo" on public.climbers for select to authenticated
  using (user_id = auth.uid() or public.is_setter());
drop policy if exists "cada uno se apunta" on public.climbers;
create policy "cada uno se apunta" on public.climbers for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "cada uno cambia su apodo" on public.climbers;
create policy "cada uno cambia su apodo" on public.climbers for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "salir o el equipador quita" on public.climbers;
create policy "salir o el equipador quita" on public.climbers for delete to authenticated
  using (user_id = auth.uid() or public.is_setter());
grant select, insert, update, delete on public.climbers to authenticated;

-- La fecha de encadenado la pone el servidor: no se puede adelantar ni atrasar para el ranking
create or replace function public.ratings_sent_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.sent then
    if tg_op = 'UPDATE' and old.sent then new.sent_at := coalesce(old.sent_at, now());
    else new.sent_at := now(); end if;
  else
    new.sent_at := null; new.flash := false;
  end if;
  return new;
end;
$$;
drop trigger if exists ratings_sent_at on public.ratings;
create trigger ratings_sent_at before insert or update on public.ratings
  for each row execute function public.ratings_sent_at();

-- Ranking de un rocódromo en un mes (por defecto, el actual), con la liga de cada uno a final de ese mes
create or replace function public.ranking(p_gym text, p_month date default null)
returns table (user_id uuid, nick text, league text, to_next integer, points integer, sends integer, flashes integer, is_me boolean)
language sql stable security definer
set search_path = ''
as $$
  with lv(level, ord, pts) as (values
    ('azul', 0, 1), ('verde', 1, 2), ('naranja', 2, 3), ('amarillo', 3, 4),
    ('morado', 4, 5), ('rojo', 5, 6), ('negro', 6, 7), ('compe', 7, 8)),
  per as (
    select date_trunc('month', coalesce(p_month, (now() at time zone 'Europe/Madrid')::date))::timestamp as m0,
           date_trunc('month', coalesce(p_month, (now() at time zone 'Europe/Madrid')::date))::timestamp + interval '1 month' as m1),
  -- Encadenados en este rocódromo hasta final del mes, sin contar los marcados después de desmontar el bloque
  s as (
    select r.user_id, l.level, l.ord, l.pts, r.flash, r.sent_at at time zone 'Europe/Madrid' as t
    from public.ratings r
    join public.climbers c on c.user_id = r.user_id
    join public.blocks b on b.id = r.block_id
    join lv l on l.level = b.level
    cross join per
    where r.sent and r.sent_at is not null and b.gym_id = p_gym
      and r.sent_at at time zone 'Europe/Madrid' < per.m1
      and (b.removed_date is null or (r.sent_at at time zone 'Europe/Madrid')::date <= b.removed_date)),
  counts as (select s.user_id, s.ord, count(*) as n from s group by s.user_id, s.ord),
  lg as (
    select c.user_id, coalesce((select max(k.ord) from counts k where k.user_id = c.user_id and k.n >= 10), 0) as ord
    from public.climbers c),
  mon as (
    select s.user_id, sum(s.pts + case when s.flash then ceil(s.pts / 2.0)::int else 0 end)::int as points,
           count(*)::int as sends, (count(*) filter (where s.flash))::int as flashes
    from s cross join per where s.t >= per.m0 group by s.user_id)
  select c.user_id, c.nick, l.level,
         case when g.ord < 7 then greatest(0, 10 - coalesce((select k.n from counts k where k.user_id = c.user_id and k.ord = g.ord + 1), 0))::int end,
         coalesce(m.points, 0), coalesce(m.sends, 0), coalesce(m.flashes, 0), c.user_id = auth.uid()
  from public.climbers c
  join lg g on g.user_id = c.user_id
  join lv l on l.ord = g.ord
  left join mon m on m.user_id = c.user_id
  where coalesce(m.sends, 0) > 0 or c.user_id = auth.uid()
  order by g.ord desc, coalesce(m.points, 0) desc, coalesce(m.flashes, 0) desc, c.created_at;
$$;
revoke execute on function public.ranking(text, date) from public;
grant execute on function public.ranking(text, date) to anon, authenticated;
