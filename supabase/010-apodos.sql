-- Recuperar el apodo: un PIN por apodo para recuperarlo (con sus grupos y su progreso) en otro móvil o navegador,
-- o si la identidad anónima del móvil se ha perdido. El equipador puede poner un PIN a un apodo que no lo tenga.
-- Ejecútalo una vez en Supabase → SQL Editor, DESPUÉS de 008. Se puede repetir sin problema.
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
