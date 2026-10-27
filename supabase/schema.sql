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
  feel       smallint check (feel between -1 and 1),         -- sensación: -1 blando, 0 justo, 1 duro
  attempts   smallint check (attempts between 1 and 999),    -- intentos
  morpho     smallint check (morpho between -1 and 1),       -- morfo: -1 mejor bajos, 0 da igual, 1 mejor altos
  updated_at timestamptz not null default now(),
  primary key (user_id, block_id)
);
alter table public.ratings add column if not exists flash boolean not null default false;
alter table public.ratings add column if not exists sent_at timestamptz;
alter table public.ratings add column if not exists feel smallint check (feel between -1 and 1);
alter table public.ratings add column if not exists attempts smallint check (attempts between 1 and 999);
alter table public.ratings add column if not exists morpho smallint check (morpho between -1 and 1);
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
  height     smallint check (height between 120 and 220),   -- altura de quien cuenta la beta (cm, opcional)
  created_at timestamptz not null default now()
);
alter table public.comments add column if not exists height smallint check (height between 120 and 220);
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

-- Buzón de sugerencias (ver supabase/007-buzon.sql)
create table if not exists public.suggestions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  gym_id     text references public.gyms (id),
  kind       text not null default 'otro' check (kind in ('idea', 'bloques', 'fallo', 'otro')),
  body       text not null check (char_length(btrim(body)) between 3 and 2000),
  contact    text not null default '' check (char_length(contact) <= 100),   -- nombre o apodo, opcional
  status     text not null default 'nuevo' check (status in ('nuevo', 'leido', 'hecho')),  -- solo para el equipador; 'hecho' = archivado
  created_at timestamptz not null default now()
);
create index if not exists suggestions_created_idx on public.suggestions (created_at desc);
alter table public.suggestions enable row level security;
drop policy if exists "cada uno ve los suyos y el equipador todos" on public.suggestions;
drop policy if exists "cualquiera escribe" on public.suggestions;
drop policy if exists "el equipador responde" on public.suggestions;
drop policy if exists "borrar los propios o el equipador" on public.suggestions;
alter table public.suggestions drop column if exists reply;
alter table public.suggestions drop column if exists replied_at;
drop policy if exists "solo el equipador lee" on public.suggestions;
create policy "solo el equipador lee" on public.suggestions for select to authenticated using (public.is_setter());
drop policy if exists "cualquiera escribe" on public.suggestions;
create policy "cualquiera escribe" on public.suggestions for insert to authenticated
  with check (user_id = auth.uid() and status = 'nuevo');
drop policy if exists "el equipador organiza" on public.suggestions;
create policy "el equipador organiza" on public.suggestions for update to authenticated
  using (public.is_setter()) with check (public.is_setter());
drop policy if exists "el equipador borra" on public.suggestions;
create policy "el equipador borra" on public.suggestions for delete to authenticated using (public.is_setter());
revoke all on public.suggestions from anon, authenticated;
grant insert on public.suggestions to authenticated;
grant select, update, delete on public.suggestions to authenticated;

-- Freno al spam: como mucho 5 mensajes por persona y hora
create or replace function public.suggestions_guard()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  new.created_at := now();
  if (select count(*) from public.suggestions
      where user_id = new.user_id and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'demasiados mensajes seguidos' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
drop trigger if exists suggestions_guard on public.suggestions;
create trigger suggestions_guard before insert on public.suggestions
  for each row execute function public.suggestions_guard();

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

revoke execute on function public.block_stats() from public;
revoke execute on function public.is_setter() from public;
grant execute on function public.block_stats() to anon, authenticated;
grant execute on function public.is_setter() to anon, authenticated;

-- Grupos de amigos (ver supabase/008-grupos.sql)
-- Tener apodo (para grupos) sin salir en el ranking público
alter table public.climbers add column if not exists in_ranking boolean not null default true;

-- Puntos de un encadenado: azul 1 … compe 8; el flash suma la mitad más
create or replace function public.send_points(p_level text, p_flash boolean)
returns integer language sql immutable set search_path = '' as $$
  select p + case when p_flash then ceil(p / 2.0)::int else 0 end
  from (select coalesce(array_position(array['azul','verde','naranja','amarillo','morado','rojo','negro','compe'], p_level), 0) as p) x;
$$;

-- Encadenados válidos (no cuentan los marcados después de desmontar el bloque). Solo para uso interno.
create or replace view public.valid_sends as
  select r.user_id, r.block_id, r.sent_at, r.flash, r.attempts, b.level, b.gym_id, b.name, b.styles, b.active,
         public.send_points(b.level, r.flash) as pts
  from public.ratings r join public.blocks b on b.id = r.block_id
  where r.sent and r.sent_at is not null
    and (b.removed_date is null or (r.sent_at at time zone 'Europe/Madrid')::date <= b.removed_date);
revoke all on public.valid_sends from public, anon, authenticated;

-- El ranking público y «primero en encadenarlo» solo muestran a quien está en el ranking
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
  where c.in_ranking and (coalesce(m.sends, 0) > 0 or c.user_id = auth.uid())
  order by g.ord desc, coalesce(m.points, 0) desc, coalesce(m.flashes, 0) desc, c.created_at;
$$;
create or replace function public.first_sends(p_gym text)
returns table (block_id uuid, nick text, sent_at timestamptz, flash boolean, is_me boolean)
language sql stable security definer
set search_path = ''
as $$
  select distinct on (r.block_id) r.block_id, c.nick, r.sent_at, r.flash, r.user_id = auth.uid()
  from public.ratings r
  join public.climbers c on c.user_id = r.user_id and c.in_ranking
  join public.blocks b on b.id = r.block_id
  where b.gym_id = p_gym and r.sent and r.sent_at is not null
  order by r.block_id, r.sent_at, c.created_at;
$$;

/* ---------- grupos y miembros ---------- */
create table if not exists public.groups (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(btrim(name)) between 2 and 40),
  code       text not null unique,
  owner      uuid not null references public.climbers (user_id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.group_members (
  group_id  uuid not null references public.groups (id) on delete cascade,
  user_id   uuid not null references public.climbers (user_id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index if not exists group_members_user_idx on public.group_members (user_id);

create or replace function public.is_member(p_group uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.group_members where group_id = p_group and user_id = auth.uid());
$$;
-- ¿Comparto algún grupo con esta persona?
create or replace function public.shares_group(p_user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.group_members a join public.group_members b on b.group_id = a.group_id
                 where a.user_id = auth.uid() and b.user_id = p_user);
$$;

alter table public.groups enable row level security;
alter table public.group_members enable row level security;
drop policy if exists "los miembros ven el grupo" on public.groups;
create policy "los miembros ven el grupo" on public.groups for select to authenticated using (public.is_member(id));
drop policy if exists "el creador cambia el grupo" on public.groups;
create policy "el creador cambia el grupo" on public.groups for update to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
drop policy if exists "el creador borra el grupo" on public.groups;
create policy "el creador borra el grupo" on public.groups for delete to authenticated using (owner = auth.uid());
drop policy if exists "los miembros se ven" on public.group_members;
create policy "los miembros se ven" on public.group_members for select to authenticated using (public.is_member(group_id));
drop policy if exists "salir o lo echa el creador" on public.group_members;
create policy "salir o lo echa el creador" on public.group_members for delete to authenticated
  using (user_id = auth.uid() or exists (select 1 from public.groups g where g.id = group_id and g.owner = auth.uid()));
grant select, update, delete on public.groups to authenticated;
grant select, delete on public.group_members to authenticated;

-- Crear un grupo (hace falta apodo); devuelve el grupo con su código de invitación
create or replace function public.create_group(p_name text)
returns table (id uuid, name text, code text)
language plpgsql security definer set search_path = '' as $$
declare g public.groups; c text; i int := 0;
begin
  if not exists (select 1 from public.climbers where user_id = auth.uid()) then
    raise exception 'necesitas un apodo' using errcode = 'P0002';
  end if;
  if (select count(*) from public.groups where owner = auth.uid()) >= 10 then
    raise exception 'demasiados grupos' using errcode = 'P0001';
  end if;
  loop
    c := (select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '') from generate_series(1, 6));
    exit when not exists (select 1 from public.groups x where x.code = c);
    i := i + 1; if i > 20 then raise exception 'sin código'; end if;
  end loop;
  insert into public.groups (name, code, owner) values (btrim(p_name), c, auth.uid()) returning * into g;
  insert into public.group_members (group_id, user_id) values (g.id, auth.uid());
  return query select g.id, g.name, g.code;
end;
$$;
-- Unirse con el código de invitación
create or replace function public.join_group(p_code text)
returns table (id uuid, name text, code text)
language plpgsql security definer set search_path = '' as $$
declare g public.groups;
begin
  if not exists (select 1 from public.climbers where user_id = auth.uid()) then
    raise exception 'necesitas un apodo' using errcode = 'P0002';
  end if;
  select * into g from public.groups x where x.code = upper(btrim(p_code));
  if g.id is null then raise exception 'código no válido' using errcode = 'P0003'; end if;
  if (select count(*) from public.group_members m where m.group_id = g.id) >= 50 then
    raise exception 'grupo lleno' using errcode = 'P0001';
  end if;
  insert into public.group_members (group_id, user_id) values (g.id, auth.uid()) on conflict do nothing;
  return query select g.id, g.name, g.code;
end;
$$;
create or replace function public.my_groups()
returns table (id uuid, name text, code text, is_owner boolean, members integer)
language sql stable security definer set search_path = '' as $$
  select g.id, g.name, g.code, g.owner = auth.uid(), (select count(*) from public.group_members x where x.group_id = g.id)::int
  from public.groups g join public.group_members m on m.group_id = g.id and m.user_id = auth.uid()
  order by m.joined_at;
$$;
create or replace function public.group_people(p_group uuid)
returns table (user_id uuid, nick text, is_owner boolean, is_me boolean)
language sql stable security definer set search_path = '' as $$
  select c.user_id, c.nick, g.owner = c.user_id, c.user_id = auth.uid()
  from public.group_members m join public.climbers c on c.user_id = m.user_id join public.groups g on g.id = m.group_id
  where m.group_id = p_group and public.is_member(p_group)
  order by c.nick;
$$;

/* ---------- ranking y actividad del grupo ---------- */
create or replace function public.group_ranking(p_group uuid, p_period text default 'month')
returns table (user_id uuid, nick text, points integer, sends integer, flashes integer, is_me boolean)
language sql stable security definer set search_path = '' as $$
  with per as (select case p_period
      when 'week' then date_trunc('week', now() at time zone 'Europe/Madrid')
      when 'month' then date_trunc('month', now() at time zone 'Europe/Madrid')
      else '-infinity'::timestamp end as t0)
  select c.user_id, c.nick, coalesce(sum(v.pts), 0)::int, count(v.block_id)::int, (count(v.block_id) filter (where v.flash))::int, c.user_id = auth.uid()
  from public.group_members m
  join public.climbers c on c.user_id = m.user_id
  cross join per
  left join public.valid_sends v on v.user_id = m.user_id and (v.sent_at at time zone 'Europe/Madrid') >= per.t0
  where m.group_id = p_group and public.is_member(p_group)
  group by c.user_id, c.nick
  order by 3 desc, 4 desc, c.nick;
$$;

-- Reacciones a los encadenados de la gente con la que compartes grupo
create table if not exists public.reactions (
  sender     uuid not null references auth.users (id) on delete cascade,
  block_id   uuid not null references public.blocks (id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  emoji      text not null check (emoji in ('🔥', '👏', '💪')),
  created_at timestamptz not null default now(),
  primary key (sender, block_id, user_id, emoji)
);
alter table public.reactions enable row level security;
drop policy if exists "cada uno ve las suyas" on public.reactions;
create policy "cada uno ve las suyas" on public.reactions for select to authenticated using (user_id = auth.uid());
drop policy if exists "reaccionar a amigos" on public.reactions;
create policy "reaccionar a amigos" on public.reactions for insert to authenticated
  with check (user_id = auth.uid() and sender <> auth.uid() and public.shares_group(sender));
drop policy if exists "quitar las suyas" on public.reactions;
create policy "quitar las suyas" on public.reactions for delete to authenticated using (user_id = auth.uid());
grant select, insert, delete on public.reactions to authenticated;

create or replace function public.group_feed(p_group uuid, p_limit integer default 60)
returns table (user_id uuid, nick text, block_id uuid, block_name text, level text, gym_id text, active boolean,
               sent_at timestamptz, flash boolean, attempts smallint, fire integer, clap integer, strong integer, mine text[], is_me boolean)
language sql stable security definer set search_path = '' as $$
  select v.user_id, c.nick, v.block_id, v.name, v.level, v.gym_id, v.active, v.sent_at, v.flash, v.attempts,
    (select count(*) from public.reactions x where x.sender = v.user_id and x.block_id = v.block_id and x.emoji = '🔥')::int,
    (select count(*) from public.reactions x where x.sender = v.user_id and x.block_id = v.block_id and x.emoji = '👏')::int,
    (select count(*) from public.reactions x where x.sender = v.user_id and x.block_id = v.block_id and x.emoji = '💪')::int,
    array(select x.emoji from public.reactions x where x.sender = v.user_id and x.block_id = v.block_id and x.user_id = auth.uid()),
    v.user_id = auth.uid()
  from public.group_members m
  join public.climbers c on c.user_id = m.user_id
  join public.valid_sends v on v.user_id = m.user_id
  where m.group_id = p_group and public.is_member(p_group) and v.sent_at > now() - interval '60 days'
  order by v.sent_at desc
  limit least(greatest(p_limit, 1), 200);
$$;

-- «¿Quién lo ha hecho?»: tus amigos (de cualquiera de tus grupos) que han encadenado o están probando un bloque
create or replace function public.block_friends(p_block uuid)
returns table (nick text, sent boolean, flash boolean, attempts smallint, project boolean, sent_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select distinct on (c.user_id) c.nick, r.sent, r.flash, r.attempts, r.project, r.sent_at
  from public.group_members me
  join public.group_members m on m.group_id = me.group_id and m.user_id <> me.user_id
  join public.climbers c on c.user_id = m.user_id
  join public.ratings r on r.user_id = m.user_id and r.block_id = p_block and (r.sent or r.project or coalesce(r.attempts, 0) > 0)
  where me.user_id = auth.uid();
$$;

-- Proyectos compartidos: bloques abiertos en los que andan metidos 2 o más del grupo y alguno sigue probando
create or replace function public.group_projects(p_group uuid)
returns table (block_id uuid, block_name text, level text, gym_id text, trying text[], sent text[])
language sql stable security definer set search_path = '' as $$
  select b.id, b.name, b.level, b.gym_id,
         coalesce(array_agg(c.nick order by c.nick) filter (where not r.sent), '{}'),
         coalesce(array_agg(c.nick order by r.sent_at) filter (where r.sent), '{}')
  from public.group_members m
  join public.climbers c on c.user_id = m.user_id
  join public.ratings r on r.user_id = m.user_id and (r.sent or r.project or coalesce(r.attempts, 0) > 0)
  join public.blocks b on b.id = r.block_id and b.active
  where m.group_id = p_group and public.is_member(p_group)
  group by b.id, b.name, b.level, b.gym_id
  having count(*) >= 2 and count(*) filter (where not r.sent) >= 1
  order by count(*) desc, b.level;
$$;

/* ---------- duelos ---------- */
create table if not exists public.duels (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.groups (id) on delete cascade,
  challenger  uuid not null default auth.uid() references public.climbers (user_id) on delete cascade,
  rival       uuid not null references public.climbers (user_id) on delete cascade,
  kind        text not null check (kind in ('block', 'week')),
  block_id    uuid references public.blocks (id) on delete cascade,
  status      text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at  timestamptz not null default now(),
  accepted_at timestamptz,
  check ((kind = 'block') = (block_id is not null)),
  check (challenger <> rival)
);
alter table public.duels enable row level security;
drop policy if exists "los miembros ven los duelos" on public.duels;
create policy "los miembros ven los duelos" on public.duels for select to authenticated using (public.is_member(group_id));
drop policy if exists "retar a alguien del grupo" on public.duels;
create policy "retar a alguien del grupo" on public.duels for insert to authenticated
  with check (challenger = auth.uid() and status = 'pending' and accepted_at is null and public.is_member(group_id)
              and exists (select 1 from public.group_members m where m.group_id = duels.group_id and m.user_id = duels.rival)
              and (select count(*) from public.duels d where d.challenger = auth.uid() and d.status = 'pending') < 10);
drop policy if exists "retirar o rechazar" on public.duels;
create policy "retirar o rechazar" on public.duels for delete to authenticated using (challenger = auth.uid() or rival = auth.uid());
grant select, insert, delete on public.duels to authenticated;

create or replace function public.respond_duel(p_duel uuid, p_accept boolean)
returns void language sql security definer set search_path = '' as $$
  update public.duels set status = case when p_accept then 'accepted' else 'declined' end,
                          accepted_at = case when p_accept then now() end
  where id = p_duel and rival = auth.uid() and status = 'pending';
$$;
-- Duelos del grupo con su marcador: bloque → quién lo encadena antes; semana → puntos en 7 días desde que se acepta
create or replace function public.group_duels(p_group uuid)
returns table (id uuid, kind text, block_id uuid, block_name text, level text, gym_id text,
               challenger_nick text, rival_nick text, i_challenge boolean, i_am_rival boolean, status text,
               created_at timestamptz, accepted_at timestamptz, ends_at timestamptz,
               c_points integer, r_points integer, c_sent timestamptz, r_sent timestamptz)
language sql stable security definer set search_path = '' as $$
  select d.id, d.kind, d.block_id, b.name, b.level, b.gym_id, cc.nick, rc.nick, d.challenger = auth.uid(), d.rival = auth.uid(), d.status,
         d.created_at, d.accepted_at, case when d.kind = 'week' then d.accepted_at + interval '7 days' end,
         case when d.kind = 'week' and d.accepted_at is not null then (select coalesce(sum(v.pts), 0) from public.valid_sends v where v.user_id = d.challenger and v.sent_at >= d.accepted_at and v.sent_at < d.accepted_at + interval '7 days') end::int,
         case when d.kind = 'week' and d.accepted_at is not null then (select coalesce(sum(v.pts), 0) from public.valid_sends v where v.user_id = d.rival and v.sent_at >= d.accepted_at and v.sent_at < d.accepted_at + interval '7 days') end::int,
         case when d.kind = 'block' then (select r.sent_at from public.ratings r where r.user_id = d.challenger and r.block_id = d.block_id and r.sent) end,
         case when d.kind = 'block' then (select r.sent_at from public.ratings r where r.user_id = d.rival and r.block_id = d.block_id and r.sent) end
  from public.duels d
  join public.climbers cc on cc.user_id = d.challenger
  join public.climbers rc on rc.user_id = d.rival
  left join public.blocks b on b.id = d.block_id
  where d.group_id = p_group and public.is_member(p_group) and d.status <> 'declined'
    and d.created_at > now() - interval '45 days'
  order by d.created_at desc;
$$;

/* ---------- retos del grupo ---------- */
create table if not exists public.group_challenges (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups (id) on delete cascade,
  created_by uuid not null default auth.uid() references public.climbers (user_id) on delete cascade,
  metric     text not null check (metric in ('sends', 'points', 'flashes')),
  target     integer not null check (target between 1 and 10000),
  level      text check (level in ('azul','verde','naranja','amarillo','morado','rojo','negro','compe')),
  style      text check (char_length(style) <= 20),
  starts_at  timestamptz not null default now(),
  ends_at    timestamptz not null,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at and ends_at <= starts_at + interval '92 days')
);
alter table public.group_challenges enable row level security;
drop policy if exists "los miembros ven los retos" on public.group_challenges;
create policy "los miembros ven los retos" on public.group_challenges for select to authenticated using (public.is_member(group_id));
drop policy if exists "los miembros crean retos" on public.group_challenges;
create policy "los miembros crean retos" on public.group_challenges for insert to authenticated
  with check (created_by = auth.uid() and public.is_member(group_id)
              and (select count(*) from public.group_challenges x where x.group_id = group_challenges.group_id and x.ends_at > now()) < 10);
drop policy if exists "borrar retos propios o el creador del grupo" on public.group_challenges;
create policy "borrar retos propios o el creador del grupo" on public.group_challenges for delete to authenticated
  using (created_by = auth.uid() or exists (select 1 from public.groups g where g.id = group_id and g.owner = auth.uid()));
grant select, insert, delete on public.group_challenges to authenticated;

create or replace function public.group_challenge_progress(p_group uuid)
returns table (id uuid, metric text, target integer, level text, style text, starts_at timestamptz, ends_at timestamptz,
               progress integer, mine integer, creator text)
language sql stable security definer set search_path = '' as $$
  select ch.id, ch.metric, ch.target, ch.level, ch.style, ch.starts_at, ch.ends_at,
    coalesce(sum(case ch.metric when 'sends' then (v.block_id is not null)::int when 'flashes' then coalesce(v.flash, false)::int else coalesce(v.pts, 0) end), 0)::int,
    coalesce(sum(case ch.metric when 'sends' then 1 when 'flashes' then v.flash::int else v.pts end) filter (where v.user_id = auth.uid()), 0)::int,
    cr.nick
  from public.group_challenges ch
  join public.climbers cr on cr.user_id = ch.created_by
  left join public.group_members m on m.group_id = ch.group_id
  left join public.valid_sends v on v.user_id = m.user_id and v.sent_at >= ch.starts_at and v.sent_at < ch.ends_at
    and (ch.level is null or v.level = ch.level) and (ch.style is null or ch.style = any (v.styles))
  where ch.group_id = p_group and public.is_member(p_group) and ch.ends_at > now() - interval '30 days'
  group by ch.id, cr.nick
  order by ch.ends_at desc;
$$;

/* ---------- sesiones en grupo ---------- */
create table if not exists public.group_sessions (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups (id) on delete cascade,
  gym_id     text references public.gyms (id),
  started_by uuid not null default auth.uid() references public.climbers (user_id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at   timestamptz
);
create table if not exists public.group_session_members (
  session_id uuid not null references public.group_sessions (id) on delete cascade,
  user_id    uuid not null default auth.uid() references public.climbers (user_id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (session_id, user_id)
);
alter table public.group_sessions enable row level security;
alter table public.group_session_members enable row level security;
drop policy if exists "los miembros ven las sesiones" on public.group_sessions;
create policy "los miembros ven las sesiones" on public.group_sessions for select to authenticated using (public.is_member(group_id));
drop policy if exists "empezar sesión de grupo" on public.group_sessions;
create policy "empezar sesión de grupo" on public.group_sessions for insert to authenticated
  with check (started_by = auth.uid() and ended_at is null and public.is_member(group_id));
drop policy if exists "terminar la sesión propia" on public.group_sessions;
create policy "terminar la sesión propia" on public.group_sessions for update to authenticated
  using (started_by = auth.uid()) with check (started_by = auth.uid());
drop policy if exists "ver quién está en la sesión" on public.group_session_members;
create policy "ver quién está en la sesión" on public.group_session_members for select to authenticated
  using (exists (select 1 from public.group_sessions s where s.id = session_id and public.is_member(s.group_id)));
drop policy if exists "unirse a la sesión" on public.group_session_members;
create policy "unirse a la sesión" on public.group_session_members for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.group_sessions s where s.id = session_id and s.ended_at is null and public.is_member(s.group_id)));
drop policy if exists "salir de la sesión" on public.group_session_members;
create policy "salir de la sesión" on public.group_session_members for delete to authenticated using (user_id = auth.uid());
grant select, insert, update on public.group_sessions to authenticated;
grant select, insert, delete on public.group_session_members to authenticated;

-- Sesiones de grupo abiertas (últimas 8 horas) en tus grupos
create or replace function public.group_active_sessions()
returns table (id uuid, group_id uuid, group_name text, gym_id text, starter text, started_at timestamptz, members text[], am_in boolean)
language sql stable security definer set search_path = '' as $$
  select s.id, s.group_id, g.name, s.gym_id, c.nick, s.started_at,
         array(select c2.nick from public.group_session_members sm join public.climbers c2 on c2.user_id = sm.user_id where sm.session_id = s.id order by sm.joined_at),
         exists (select 1 from public.group_session_members sm where sm.session_id = s.id and sm.user_id = auth.uid())
  from public.group_sessions s
  join public.groups g on g.id = s.group_id
  join public.climbers c on c.user_id = s.started_by
  where public.is_member(s.group_id) and s.ended_at is null and s.started_at > now() - interval '8 hours'
  order by s.started_at desc;
$$;
-- Resumen de una sesión de grupo: lo que encadenó cada participante mientras duró
create or replace function public.group_session_summary(p_session uuid)
returns table (nick text, sends integer, flashes integer, points integer, best_level text, is_me boolean)
language sql stable security definer set search_path = '' as $$
  select c.nick, count(v.block_id)::int, (count(v.block_id) filter (where v.flash))::int, coalesce(sum(v.pts), 0)::int,
         (array_agg(v.level order by array_position(array['azul','verde','naranja','amarillo','morado','rojo','negro','compe'], v.level) desc) filter (where v.level is not null))[1],
         c.user_id = auth.uid()
  from public.group_sessions s
  join public.group_session_members sm on sm.session_id = s.id
  join public.climbers c on c.user_id = sm.user_id
  left join public.valid_sends v on v.user_id = sm.user_id and v.sent_at >= s.started_at and v.sent_at <= coalesce(s.ended_at, now())
  where s.id = p_session and public.is_member(s.group_id)
  group by c.user_id, c.nick
  order by 4 desc;
$$;

-- Resumen del mes del grupo (para «Tu mes»): por persona, encadenados, flashes, puntos, intentos y semanas activas
create or replace function public.group_month(p_group uuid, p_month date default null)
returns table (nick text, sends integer, flashes integer, points integer, attempts integer, weeks integer, is_me boolean)
language sql stable security definer set search_path = '' as $$
  with per as (select date_trunc('month', coalesce(p_month, (now() at time zone 'Europe/Madrid')::date))::timestamp as m0)
  select c.nick, count(v.block_id)::int, (count(v.block_id) filter (where v.flash))::int, coalesce(sum(v.pts), 0)::int,
         coalesce(sum(coalesce(v.attempts, 1)), 0)::int,
         count(distinct date_trunc('week', v.sent_at at time zone 'Europe/Madrid'))::int, c.user_id = auth.uid()
  from public.group_members m
  join public.climbers c on c.user_id = m.user_id
  cross join per
  left join public.valid_sends v on v.user_id = m.user_id
    and (v.sent_at at time zone 'Europe/Madrid') >= per.m0 and (v.sent_at at time zone 'Europe/Madrid') < per.m0 + interval '1 month'
  where m.group_id = p_group and public.is_member(p_group)
  group by c.user_id, c.nick
  order by 4 desc;
$$;

do $$
declare f text;
begin
  foreach f in array array['create_group(text)', 'join_group(text)', 'my_groups()', 'group_people(uuid)', 'group_ranking(uuid, text)',
    'group_feed(uuid, integer)', 'block_friends(uuid)', 'group_projects(uuid)', 'respond_duel(uuid, boolean)', 'group_duels(uuid)',
    'group_challenge_progress(uuid)', 'group_active_sessions()', 'group_session_summary(uuid)', 'group_month(uuid, date)',
    'is_member(uuid)', 'shares_group(uuid)']
  loop
    execute format('revoke execute on function public.%s from public', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

-- Apodo con PIN para recuperarlo (ver supabase/010-apodos.sql)
create extension if not exists pgcrypto with schema extensions;

alter table public.climbers add column if not exists pin_hash text;
alter table public.climbers add column if not exists pin_fails smallint not null default 0;
alter table public.climbers add column if not exists pin_fail_at timestamptz;
-- El PIN (cifrado) no se puede leer desde la web
revoke select on public.climbers from authenticated;
grant select (user_id, nick, in_ranking, created_at) on public.climbers to authenticated;

-- Al recuperar un apodo cambia su identidad: las tablas de grupos la siguen
do $$
declare r record;
begin
  for r in select * from (values
      ('groups', 'groups_owner_fkey', 'owner'), ('group_members', 'group_members_user_id_fkey', 'user_id'),
      ('duels', 'duels_challenger_fkey', 'challenger'), ('duels', 'duels_rival_fkey', 'rival'),
      ('group_challenges', 'group_challenges_created_by_fkey', 'created_by'), ('group_sessions', 'group_sessions_started_by_fkey', 'started_by'),
      ('group_session_members', 'group_session_members_user_id_fkey', 'user_id')) t(tbl, con, col)
  loop
    execute format('alter table public.%I drop constraint if exists %I', r.tbl, r.con);
    execute format('alter table public.%I add constraint %I foreign key (%I) references public.climbers (user_id) on delete cascade on update cascade', r.tbl, r.con, r.col);
  end loop;
end $$;

-- Poner o cambiar el PIN del apodo propio (4 a 8 cifras)
create or replace function public.set_pin(p_pin text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(p_pin, '') !~ '^[0-9]{4,8}$' then raise exception 'pin no válido' using errcode = 'P0004'; end if;
  update public.climbers set pin_hash = extensions.crypt(p_pin, extensions.gen_salt('bf')), pin_fails = 0 where user_id = auth.uid();
  if not found then raise exception 'sin apodo' using errcode = 'P0002'; end if;
end;
$$;
create or replace function public.has_pin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select pin_hash is not null from public.climbers where user_id = auth.uid()), false);
$$;
-- El equipador pone un PIN a un apodo (para quien lo perdió antes de que existieran los PIN)
create or replace function public.admin_set_pin(p_nick text, p_pin text)
returns text language plpgsql security definer set search_path = '' as $$
declare n text;
begin
  if not public.is_setter() then raise exception 'solo el equipador' using errcode = '42501'; end if;
  if coalesce(p_pin, '') !~ '^[0-9]{4,8}$' then raise exception 'pin no válido' using errcode = 'P0004'; end if;
  update public.climbers set pin_hash = extensions.crypt(p_pin, extensions.gen_salt('bf')), pin_fails = 0
    where lower(nick) = lower(btrim(p_nick)) returning nick into n;
  if n is null then raise exception 'no existe' using errcode = 'P0003'; end if;
  return n;
end;
$$;

-- Recuperar un apodo con su PIN: todo lo suyo (encadenados, grupos, duelos, retos, reacciones, betas) pasa a este móvil.
-- Devuelve el apodo, o null si el PIN no es correcto (5 fallos bloquean una hora).
create or replace function public.claim_nick(p_nick text, p_pin text)
returns text language plpgsql security definer set search_path = '' as $$
declare c public.climbers; me uuid := auth.uid(); old uuid;
begin
  if me is null then raise exception 'sin sesión' using errcode = 'P0002'; end if;
  select * into c from public.climbers where lower(nick) = lower(btrim(p_nick)) for update;
  if c.user_id is null then raise exception 'no existe' using errcode = 'P0003'; end if;
  if c.user_id = me then return c.nick; end if;
  if c.pin_hash is null then raise exception 'sin pin' using errcode = 'P0005'; end if;
  if c.pin_fails >= 5 and c.pin_fail_at > now() - interval '1 hour' then raise exception 'bloqueado' using errcode = 'P0006'; end if;
  if extensions.crypt(coalesce(p_pin, ''), c.pin_hash) <> c.pin_hash then
    update public.climbers set pin_fails = case when pin_fail_at > now() - interval '1 hour' then pin_fails + 1 else 1 end, pin_fail_at = now()
      where user_id = c.user_id;
    return null;
  end if;
  old := c.user_id;
  -- Si en este móvil ya tenías otro apodo, sus grupos pasan al recuperado y ese apodo se borra
  if exists (select 1 from public.climbers where user_id = me) then
    insert into public.group_members (group_id, user_id, joined_at)
      select group_id, old, joined_at from public.group_members where user_id = me on conflict do nothing;
    delete from public.climbers where user_id = me;
  end if;
  -- Encadenados y votos: si hay del mismo bloque en los dos sitios, se queda el encadenado (o el de este móvil)
  delete from public.ratings n using public.ratings o
    where n.user_id = me and o.user_id = old and o.block_id = n.block_id and o.sent and not n.sent;
  delete from public.ratings o using public.ratings n
    where o.user_id = old and n.user_id = me and o.block_id = n.block_id;
  update public.ratings set user_id = me where user_id = old;
  -- Reacciones (dadas y recibidas), betas y mensajes del buzón
  insert into public.reactions (sender, block_id, user_id, emoji, created_at)
    select sender, block_id, me, emoji, created_at from public.reactions where user_id = old and sender <> me on conflict do nothing;
  delete from public.reactions where user_id = old;
  insert into public.reactions (sender, block_id, user_id, emoji, created_at)
    select me, block_id, user_id, emoji, created_at from public.reactions where sender = old and user_id <> me on conflict do nothing;
  delete from public.reactions where sender = old;
  update public.comments set user_id = me where user_id = old;
  update public.suggestions set user_id = me where user_id = old;
  -- El apodo (y con él grupos, duelos, retos y sesiones)
  update public.climbers set user_id = me, pin_fails = 0, pin_fail_at = null where user_id = old;
  return c.nick;
end;
$$;

revoke execute on function public.set_pin(text) from public;
revoke execute on function public.has_pin() from public;
revoke execute on function public.admin_set_pin(text, text) from public;
revoke execute on function public.claim_nick(text, text) from public;
grant execute on function public.set_pin(text) to authenticated;
grant execute on function public.has_pin() to authenticated;
grant execute on function public.admin_set_pin(text, text) to authenticated;
grant execute on function public.claim_nick(text, text) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- ÚLTIMO PASO, cuando hayas creado tu usuario en Authentication → Users:
-- cambia el email y ejecuta solo esta línea.
--
-- insert into public.setters (user_id)
--   select id from auth.users where email = 'TU_EMAIL@ejemplo.com'
--   on conflict do nothing;
