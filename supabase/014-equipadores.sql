-- Equipadores: varios equipadores, cada uno con su nombre, y un máster (el dueño de la web).
-- · Cada bloque lleva quién lo ha equipado (blocks.setter_id). Los bloques con el sello Xlp pasan a ser del máster.
-- · Cualquier equipador crea, edita, desmonta y borra cualquier bloque, y ve estadísticas y buzón.
-- · Solo el máster cambia el plano y los sectores, y da o quita acceso a equipadores.
-- · El equipador nuevo se registra en la app con su email; el máster le da acceso escribiendo ese email.
-- Ejecútalo una vez en Supabase → SQL Editor. Se puede repetir sin problema.

-- 1) Nombre y máster. Los equipadores que ya había son el máster
alter table public.setters add column if not exists name text not null default '' check (char_length(name) <= 30);
alter table public.setters add column if not exists is_master boolean not null default false;
alter table public.setters add column if not exists created_at timestamptz not null default now();
do $$ begin
  if not exists (select 1 from public.setters where is_master) then update public.setters set is_master = true; end if;
end $$;
update public.setters set name = 'Xlp' where is_master and name = '';

create or replace function public.is_master()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.setters where user_id = auth.uid() and is_master);
$$;
revoke execute on function public.is_master() from public;
grant execute on function public.is_master() to anon, authenticated;

-- 2) Quién ha equipado cada bloque (al crear, quien lo crea; se puede cambiar en el formulario)
alter table public.blocks add column if not exists setter_id uuid references public.setters (user_id) on delete set null;
alter table public.blocks alter column setter_id set default auth.uid();
update public.blocks set setter_id = (select user_id from public.setters where is_master order by created_at limit 1)
  where xlp and setter_id is null;
-- Un bloque solo puede firmarlo un equipador que exista
create or replace function public.blocks_setter_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.setter_id is not null and not exists (select 1 from public.setters where user_id = new.setter_id) then
    new.setter_id := null;
  end if;
  return new;
end $$;
drop trigger if exists blocks_setter_guard on public.blocks;
create trigger blocks_setter_guard before insert or update on public.blocks for each row execute function public.blocks_setter_guard();

-- 3) Plano y sectores: solo el máster
drop policy if exists "el equipador cambia los rocódromos" on public.gyms;
drop policy if exists "el máster cambia los rocódromos" on public.gyms;
create policy "el máster cambia los rocódromos" on public.gyms for update to authenticated
  using (public.is_master()) with check (public.is_master());
drop policy if exists "el equipador gestiona sectores" on public.sectors;
drop policy if exists "el máster gestiona sectores" on public.sectors;
create policy "el máster gestiona sectores" on public.sectors for all to authenticated
  using (public.is_master()) with check (public.is_master());

-- 4) Lista pública de equipadores (solo id, nombre y si es el máster; nunca el email)
create or replace function public.setters_public()
returns table (user_id uuid, name text, is_master boolean)
language sql stable security definer set search_path = '' as $$
  select s.user_id, coalesce(nullif(s.name, ''), 'Equipador'), s.is_master from public.setters s order by s.is_master desc, s.created_at;
$$;
revoke execute on function public.setters_public() from public;
grant execute on function public.setters_public() to anon, authenticated;

-- 5) Gestión, solo el máster: lista con email, dar acceso, cambiar nombre y quitar acceso
create or replace function public.setter_admin_list()
returns table (user_id uuid, name text, email text, is_master boolean, created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_master() then raise exception 'solo el máster' using errcode = '42501'; end if;
  return query select s.user_id, s.name, u.email::text, s.is_master, s.created_at
    from public.setters s join auth.users u on u.id = s.user_id order by s.is_master desc, s.created_at;
end $$;

create or replace function public.grant_setter(p_email text, p_name text)
returns text language plpgsql security definer set search_path = '' as $$
declare uid uuid; nm text := btrim(coalesce(p_name, ''));
begin
  if not public.is_master() then raise exception 'solo el máster' using errcode = '42501'; end if;
  if char_length(nm) < 2 or char_length(nm) > 30 then raise exception 'nombre de 2 a 30 letras' using errcode = '22023'; end if;
  select id into uid from auth.users where lower(email) = lower(btrim(p_email)) and not coalesce(is_anonymous, false) limit 1;
  if uid is null then raise exception 'no hay ninguna cuenta con ese email' using errcode = 'P0003'; end if;
  insert into public.setters (user_id, name) values (uid, nm)
    on conflict (user_id) do update set name = excluded.name;
  return nm;
end $$;

create or replace function public.rename_setter(p_user uuid, p_name text)
returns void language plpgsql security definer set search_path = '' as $$
declare nm text := btrim(coalesce(p_name, ''));
begin
  if not (public.is_master() or p_user = auth.uid()) then raise exception 'sin permiso' using errcode = '42501'; end if;
  if char_length(nm) < 2 or char_length(nm) > 30 then raise exception 'nombre de 2 a 30 letras' using errcode = '22023'; end if;
  update public.setters set name = nm where user_id = p_user;
end $$;

create or replace function public.revoke_setter(p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_master() then raise exception 'solo el máster' using errcode = '42501'; end if;
  if exists (select 1 from public.setters where user_id = p_user and is_master) then raise exception 'el máster no se puede quitar' using errcode = '42501'; end if;
  delete from public.setters where user_id = p_user;   -- sus bloques se quedan, sin firma
end $$;

revoke execute on function public.setter_admin_list() from public;
revoke execute on function public.grant_setter(text, text) from public;
revoke execute on function public.rename_setter(uuid, text) from public;
revoke execute on function public.revoke_setter(uuid) from public;
grant execute on function public.setter_admin_list() to authenticated;
grant execute on function public.grant_setter(text, text) to authenticated;
grant execute on function public.rename_setter(uuid, text) to authenticated;
grant execute on function public.revoke_setter(uuid) to authenticated;

notify pgrst, 'reload schema';
