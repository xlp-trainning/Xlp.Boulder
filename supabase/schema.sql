-- Libreta de Bloques: esquema de Supabase.
-- Pégalo entero en Supabase → SQL Editor → New query → Run.
-- Se puede ejecutar más de una vez sin romper nada.

-- Equipadores: las cuentas que pueden crear, editar y borrar bloques.
create table if not exists public.setters (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.setters enable row level security;
revoke all on public.setters from anon, authenticated;

create or replace function public.is_setter()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (select 1 from public.setters where user_id = auth.uid());
$$;

-- Rocódromos: cada uno con su plano. map_path puede ser un archivo de la web (mapas/...) o una foto subida.
create table if not exists public.gyms (
  id       text primary key check (id ~ '^[a-z0-9-]{2,30}$'),
  name     text not null check (char_length(name) between 1 and 60),
  sort     smallint not null default 0,
  map_path text not null default '' check (char_length(map_path) <= 200)
);
alter table public.gyms enable row level security;
drop policy if exists "todos leen los rocódromos" on public.gyms;
create policy "todos leen los rocódromos" on public.gyms for select to anon, authenticated using (true);
drop policy if exists "el equipador cambia los rocódromos" on public.gyms;
create policy "el equipador cambia los rocódromos" on public.gyms for update to authenticated
  using (public.is_setter()) with check (public.is_setter());
grant select on public.gyms to anon, authenticated;
grant update on public.gyms to authenticated;
insert into public.gyms (id, name, sort, map_path) values
  ('patraix', 'Natural Patraix', 1, 'mapas/natural-patraix.png'),
  ('benimaclet', 'Natural Benimaclet', 2, 'mapas/natural-benimaclet.png')
on conflict (id) do nothing;

-- Bloques
create table if not exists public.blocks (
  id           uuid primary key default gen_random_uuid(),
  gym_id       text not null references public.gyms (id),
  name         text not null default '' check (char_length(name) <= 60),
  level        text not null check (level in ('azul','verde','naranja','amarillo','morado','rojo','negro','compe')),
  hold_color   text not null default '' check (char_length(hold_color) <= 20),
  sector       text not null default '' check (char_length(sector) <= 40),
  styles       text[] not null default '{}' check (cardinality(styles) <= 15),
  set_date     date not null default current_date,
  removed_date date,
  beta         text not null default '' check (char_length(beta) <= 4000),
  video        text not null default '' check (video = '' or video ~* '^https?://'),
  photo_path   text not null default '' check (char_length(photo_path) <= 200),
  active       boolean not null default true,
  xlp          boolean not null default false,   -- sello Xlp: equipado por el dueño de la web
  created_at   timestamptz not null default now()
);
alter table public.blocks add column if not exists xlp boolean not null default false;
create index if not exists blocks_gym_idx on public.blocks (gym_id);
alter table public.blocks enable row level security;

drop policy if exists "todos leen los bloques" on public.blocks;
create policy "todos leen los bloques" on public.blocks
  for select to anon, authenticated using (true);

drop policy if exists "el equipador crea bloques" on public.blocks;
create policy "el equipador crea bloques" on public.blocks
  for insert to authenticated with check (public.is_setter());

drop policy if exists "el equipador edita bloques" on public.blocks;
create policy "el equipador edita bloques" on public.blocks
  for update to authenticated using (public.is_setter()) with check (public.is_setter());

drop policy if exists "el equipador borra bloques" on public.blocks;
create policy "el equipador borra bloques" on public.blocks
  for delete to authenticated using (public.is_setter());

grant select on public.blocks to anon, authenticated;
grant insert, update, delete on public.blocks to authenticated;

-- Puntuaciones y encadenados: una fila por persona (o dispositivo) y bloque.
-- Cada uno solo ve y toca las suyas; las medias salen de block_stats().
create table if not exists public.ratings (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  block_id   uuid not null references public.blocks (id) on delete cascade,
  stars      smallint check (stars between 1 and 5),
  sent       boolean not null default false,
  project    boolean not null default false,
  flash      boolean not null default false,       -- encadenado a la primera
  sent_at    timestamptz,                          -- cuándo se encadenó (rachas y medallas)
  updated_at timestamptz not null default now(),
  primary key (user_id, block_id)
);
alter table public.ratings add column if not exists flash boolean not null default false;
alter table public.ratings add column if not exists sent_at timestamptz;
alter table public.ratings enable row level security;

drop policy if exists "cada uno ve sus votos" on public.ratings;
create policy "cada uno ve sus votos" on public.ratings
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "cada uno crea sus votos" on public.ratings;
create policy "cada uno crea sus votos" on public.ratings
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "cada uno cambia sus votos" on public.ratings;
create policy "cada uno cambia sus votos" on public.ratings
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "cada uno borra sus votos" on public.ratings;
create policy "cada uno borra sus votos" on public.ratings
  for delete to authenticated using (user_id = auth.uid());

grant select, insert, update, delete on public.ratings to authenticated;

-- Medias públicas, sin exponer quién ha votado qué.
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

-- Sectores de cada rocódromo, con su posición en el plano (fracciones 0-1 de la imagen)
create table if not exists public.sectors (
  id         uuid primary key default gen_random_uuid(),
  gym_id     text not null references public.gyms (id),
  name       text not null check (char_length(name) between 1 and 40),
  x          real check (x between 0 and 1),
  y          real check (y between 0 and 1),
  shape      jsonb,                                  -- zona tocable en el plano: [[x, y], …] en fracciones 0-1
  created_at timestamptz not null default now(),
  unique (gym_id, name)
);
alter table public.sectors add column if not exists shape jsonb;
alter table public.sectors enable row level security;
drop policy if exists "todos leen los sectores" on public.sectors;
create policy "todos leen los sectores" on public.sectors for select to anon, authenticated using (true);
drop policy if exists "el equipador gestiona sectores" on public.sectors;
create policy "el equipador gestiona sectores" on public.sectors for all to authenticated
  using (public.is_setter()) with check (public.is_setter());
grant select on public.sectors to anon, authenticated;
grant insert, update, delete on public.sectors to authenticated;

-- Betas y comentarios de la gente. Cualquiera (también anónimo) publica con un apodo;
-- cada uno borra los suyos y el equipador puede borrar cualquiera.
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  block_id   uuid not null references public.blocks (id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  author     text not null check (char_length(btrim(author)) between 1 and 30),
  body       text not null check (char_length(btrim(body)) between 1 and 1000),
  video      text not null default '' check (video = '' or video ~* '^https?://'),
  created_at timestamptz not null default now()
);
create index if not exists comments_block_idx on public.comments (block_id, created_at);
alter table public.comments enable row level security;
drop policy if exists "todos leen los comentarios" on public.comments;
create policy "todos leen los comentarios" on public.comments for select to anon, authenticated using (true);
drop policy if exists "cada uno publica los suyos" on public.comments;
create policy "cada uno publica los suyos" on public.comments for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "borrar los propios o el equipador" on public.comments;
create policy "borrar los propios o el equipador" on public.comments for delete to authenticated
  using (user_id = auth.uid() or public.is_setter());
grant select on public.comments to anon, authenticated;
grant insert, delete on public.comments to authenticated;

-- Freno al spam: como mucho 10 comentarios por persona y hora
create or replace function public.comments_guard()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  new.created_at := now();
  if (select count(*) from public.comments
      where user_id = new.user_id and created_at > now() - interval '1 hour') >= 10 then
    raise exception 'demasiados comentarios seguidos' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
drop trigger if exists comments_guard on public.comments;
create trigger comments_guard before insert on public.comments
  for each row execute function public.comments_guard();

-- Fotos de bloques y planos subidos: lectura pública, solo el equipador sube y borra
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "el equipador ve las fotos" on storage.objects;
create policy "el equipador ve las fotos" on storage.objects for select to authenticated
  using (bucket_id = 'fotos' and public.is_setter());
drop policy if exists "el equipador sube fotos" on storage.objects;
create policy "el equipador sube fotos" on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and public.is_setter());
drop policy if exists "el equipador cambia fotos" on storage.objects;
create policy "el equipador cambia fotos" on storage.objects for update to authenticated
  using (bucket_id = 'fotos' and public.is_setter()) with check (bucket_id = 'fotos' and public.is_setter());
drop policy if exists "el equipador borra fotos" on storage.objects;
create policy "el equipador borra fotos" on storage.objects for delete to authenticated
  using (bucket_id = 'fotos' and public.is_setter());

-- Ranking mensual por ligas de color (ver supabase/004-ranking.sql para las reglas)
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

revoke execute on function public.block_stats() from public;
revoke execute on function public.is_setter() from public;
grant execute on function public.block_stats() to anon, authenticated;
grant execute on function public.is_setter() to anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- ÚLTIMO PASO, cuando hayas creado tu usuario en Authentication → Users:
-- cambia el email y ejecuta solo esta línea.
--
-- insert into public.setters (user_id)
--   select id from auth.users where email = 'TU_EMAIL@ejemplo.com'
--   on conflict do nothing;
