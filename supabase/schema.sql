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

-- Bloques
create table if not exists public.blocks (
  id           uuid primary key default gen_random_uuid(),
  name         text not null default '' check (char_length(name) <= 60),
  level        text not null check (level in ('azul','verde','naranja','amarillo','morado','rojo','negro','compe')),
  hold_color   text not null default '' check (char_length(hold_color) <= 20),
  sector       text not null default '' check (char_length(sector) <= 40),
  styles       text[] not null default '{}' check (cardinality(styles) <= 15),
  set_date     date not null default current_date,
  removed_date date,
  beta         text not null default '' check (char_length(beta) <= 4000),
  video        text not null default '' check (video = '' or video ~* '^https?://'),
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);
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
  updated_at timestamptz not null default now(),
  primary key (user_id, block_id)
);
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
create or replace function public.block_stats()
returns table (block_id uuid, avg_stars numeric, votes bigint, sends bigint)
language sql stable security definer
set search_path = ''
as $$
  select r.block_id,
         round(avg(r.stars), 2),
         count(r.stars),
         count(*) filter (where r.sent)
  from public.ratings r
  group by r.block_id;
$$;

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
