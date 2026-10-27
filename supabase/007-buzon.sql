-- Buzón de sugerencias, sin respuesta ni confirmación de lectura: cualquiera (también anónimo) escribe
-- y ya está; solo el equipador lee los mensajes, y nadie sabe si los ha leído.
-- Ejecútalo en Supabase → SQL Editor. Se puede repetir sin problema (y sirve también si ya
-- ejecutaste la versión anterior de este archivo, la que tenía respuestas).
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
