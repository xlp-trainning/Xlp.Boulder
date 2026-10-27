-- Buzón de sugerencias: cualquiera (también anónimo) escribe al equipador; cada uno ve sus mensajes
-- y la respuesta; el equipador los lee todos, responde, los marca como hechos o los borra.
-- Ejecútalo una vez en Supabase → SQL Editor. Se puede repetir sin problema.
create table if not exists public.suggestions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  gym_id     text references public.gyms (id),
  kind       text not null default 'otro' check (kind in ('idea', 'bloques', 'fallo', 'otro')),
  body       text not null check (char_length(btrim(body)) between 3 and 2000),
  contact    text not null default '' check (char_length(contact) <= 100),
  status     text not null default 'nuevo' check (status in ('nuevo', 'leido', 'hecho')),
  reply      text not null default '' check (char_length(reply) <= 2000),
  replied_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists suggestions_created_idx on public.suggestions (created_at desc);
alter table public.suggestions enable row level security;
drop policy if exists "cada uno ve los suyos y el equipador todos" on public.suggestions;
create policy "cada uno ve los suyos y el equipador todos" on public.suggestions for select to authenticated
  using (user_id = auth.uid() or public.is_setter());
drop policy if exists "cualquiera escribe" on public.suggestions;
create policy "cualquiera escribe" on public.suggestions for insert to authenticated
  with check (user_id = auth.uid() and status = 'nuevo' and reply = '' and replied_at is null);
drop policy if exists "el equipador responde" on public.suggestions;
create policy "el equipador responde" on public.suggestions for update to authenticated
  using (public.is_setter()) with check (public.is_setter());
drop policy if exists "borrar los propios o el equipador" on public.suggestions;
create policy "borrar los propios o el equipador" on public.suggestions for delete to authenticated
  using (user_id = auth.uid() or public.is_setter());
grant select, insert, update, delete on public.suggestions to authenticated;

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
