-- Usuarios: el máster ve cuántos hay y qué hacen, y puede bloquear o borrar a alguien.
-- · Cada móvil es un usuario (cuenta anónima); con apodo, además sale en ranking, grupos y betas.
-- · Bloquear: no puede apuntar encadenados, votar, comentar, escribir al buzón, crear ni unirse a grupos, retar ni
--   reaccionar; sale del ranking y sus betas dejan de verse. Se puede desbloquear y todo vuelve (salvo el ranking,
--   al que se apunta de nuevo él mismo).
-- · Borrar: elimina la cuenta y todo lo suyo. Los grupos que había creado pasan al miembro más antiguo.
-- · Los equipadores no se pueden bloquear ni borrar desde aquí (primero se les quita el acceso).
-- Ejecútalo una vez en Supabase → SQL Editor, después de 014. Se puede repetir sin problema.

-- 1) Lista de bloqueados (solo la lee y la cambia el máster, a través de las funciones de abajo)
create table if not exists public.blocked_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  reason     text not null default '' check (char_length(reason) <= 200),
  blocked_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.blocked_users enable row level security;
revoke all on public.blocked_users from anon, authenticated;

create or replace function public.is_blocked(p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.blocked_users where user_id = p_user);
$$;
revoke execute on function public.is_blocked(uuid) from public;
grant execute on function public.is_blocked(uuid) to anon, authenticated;

-- 2) Un bloqueado no escribe nada. Es un trigger, así que también para las funciones (crear grupo, unirse…)
create or replace function public.no_blocked_writes()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null and public.is_blocked(auth.uid()) then
    raise exception 'cuenta bloqueada' using errcode = '42501', hint = 'bloqueado';
  end if;
  return coalesce(new, old);
end $$;
do $$
declare t text;
begin
  foreach t in array array['ratings', 'comments', 'suggestions', 'climbers', 'groups', 'group_members', 'reactions',
                           'duels', 'group_challenges', 'group_sessions', 'group_session_members'] loop
    if to_regclass('public.' || t) is not null then
      execute format('drop trigger if exists no_blocked_writes on public.%I', t);
      execute format('create trigger no_blocked_writes before insert or update on public.%I for each row execute function public.no_blocked_writes()', t);
    end if;
  end loop;
end $$;

-- 3) Las betas de un bloqueado no se ven
drop policy if exists "no se ven las betas de bloqueados" on public.comments;
create policy "no se ven las betas de bloqueados" on public.comments as restrictive for select to anon, authenticated
  using (not public.is_blocked(user_id));

-- 4) Resumen para el máster
create or replace function public.admin_user_summary()
returns json language plpgsql stable security definer set search_path = '' as $$
declare r json;
begin
  if not public.is_master() then raise exception 'solo el máster' using errcode = '42501'; end if;
  with act as (
    select u.id, u.created_at,
           greatest(u.last_sign_in_at, (select max(updated_at) from public.ratings x where x.user_id = u.id),
                    (select max(created_at) from public.comments c where c.user_id = u.id)) as seen
    from auth.users u
  )
  select json_build_object(
    'total',     (select count(*) from act),
    'with_nick', (select count(*) from public.climbers),
    'ranking',   (select count(*) from public.climbers where in_ranking),
    'active_7',  (select count(*) from act where seen > now() - interval '7 days'),
    'active_30', (select count(*) from act where seen > now() - interval '30 days'),
    'new_7',     (select count(*) from act where created_at > now() - interval '7 days'),
    'sending',   (select count(distinct user_id) from public.ratings where sent),
    'blocked',   (select count(*) from public.blocked_users)
  ) into r;
  return r;
end $$;

-- 5) Lista para el máster: los que tienen algo (apodo, votos o betas), lo más reciente primero
create or replace function public.admin_users(p_q text default '', p_limit int default 200)
returns table (user_id uuid, nick text, in_ranking boolean, has_pin boolean, created_at timestamptz, last_seen timestamptz,
               sends int, sends_30 int, rated int, comments int, groups int, is_setter boolean, blocked boolean, reason text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_master() then raise exception 'solo el máster' using errcode = '42501'; end if;
  return query
  with base as (
    select u.id, u.created_at, u.last_sign_in_at, c.nick, coalesce(c.in_ranking, false) as in_ranking, c.pin_hash is not null as has_pin
    from auth.users u left join public.climbers c on c.user_id = u.id
  ), agg as (
    select b.*,
      (select count(*)::int from public.ratings r where r.user_id = b.id and r.sent) as sends,
      (select count(*)::int from public.ratings r where r.user_id = b.id and r.sent and r.sent_at > now() - interval '30 days') as sends_30,
      (select count(*)::int from public.ratings r where r.user_id = b.id) as rated,
      (select count(*)::int from public.comments m where m.user_id = b.id) as comments,
      (select count(*)::int from public.group_members g where g.user_id = b.id) as groups,
      greatest(b.last_sign_in_at, (select max(r.updated_at) from public.ratings r where r.user_id = b.id),
               (select max(m.created_at) from public.comments m where m.user_id = b.id)) as last_seen
    from base b
  )
  select a.id, a.nick, a.in_ranking, a.has_pin, a.created_at, a.last_seen, a.sends, a.sends_30, a.rated, a.comments, a.groups,
         exists (select 1 from public.setters s where s.user_id = a.id),
         exists (select 1 from public.blocked_users k where k.user_id = a.id),
         (select k.reason from public.blocked_users k where k.user_id = a.id)
  from agg a
  where (a.nick is not null or a.rated > 0 or a.comments > 0 or exists (select 1 from public.blocked_users k where k.user_id = a.id))
    and (coalesce(btrim(p_q), '') = '' or a.nick ilike '%' || btrim(p_q) || '%')
  order by a.last_seen desc nulls last
  limit greatest(1, least(coalesce(p_limit, 200), 1000));
end $$;

-- 6) Bloquear y desbloquear
create or replace function public.admin_block_user(p_user uuid, p_reason text default '')
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_master() then raise exception 'solo el máster' using errcode = '42501'; end if;
  if exists (select 1 from public.setters where user_id = p_user) then raise exception 'es equipador: quítale antes el acceso' using errcode = '42501'; end if;
  insert into public.blocked_users (user_id, reason, blocked_by) values (p_user, left(coalesce(btrim(p_reason), ''), 200), auth.uid())
    on conflict (user_id) do update set reason = excluded.reason, blocked_by = excluded.blocked_by, created_at = now();
  -- fuera del ranking (el trigger de climbers no salta: quien escribe es el máster)
  update public.climbers set in_ranking = false where user_id = p_user;
end $$;

create or replace function public.admin_unblock_user(p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_master() then raise exception 'solo el máster' using errcode = '42501'; end if;
  delete from public.blocked_users where user_id = p_user;
end $$;

-- 7) Borrar una cuenta y todo lo suyo
create or replace function public.admin_delete_user(p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare g record; heir uuid;
begin
  if not public.is_master() then raise exception 'solo el máster' using errcode = '42501'; end if;
  if p_user = auth.uid() then raise exception 'no puedes borrarte a ti' using errcode = '42501'; end if;
  if exists (select 1 from public.setters where user_id = p_user) then raise exception 'es equipador: quítale antes el acceso' using errcode = '42501'; end if;
  -- Sus grupos no desaparecen: pasan al miembro más antiguo (si no queda nadie, se borran)
  if to_regclass('public.groups') is not null then
    for g in select id from public.groups where owner = p_user loop
      select m.user_id into heir from public.group_members m where m.group_id = g.id and m.user_id <> p_user order by m.joined_at limit 1;
      if heir is not null then update public.groups set owner = heir where id = g.id; end if;
    end loop;
  end if;
  -- La cuenta: votos, encadenados, betas, apodo, grupos y demás se van en cascada
  delete from auth.users where id = p_user;
end $$;

revoke execute on function public.admin_user_summary() from public;
revoke execute on function public.admin_users(text, int) from public;
revoke execute on function public.admin_block_user(uuid, text) from public;
revoke execute on function public.admin_unblock_user(uuid) from public;
revoke execute on function public.admin_delete_user(uuid) from public;
grant execute on function public.admin_user_summary() to authenticated;
grant execute on function public.admin_users(text, int) to authenticated;
grant execute on function public.admin_block_user(uuid, text) to authenticated;
grant execute on function public.admin_unblock_user(uuid) to authenticated;
grant execute on function public.admin_delete_user(uuid) to authenticated;

notify pgrst, 'reload schema';
