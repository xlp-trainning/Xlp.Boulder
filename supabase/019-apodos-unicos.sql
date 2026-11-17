-- Apodos únicos de verdad: no se puede crear uno que se vea igual que otro.
-- · Al guardar, se quitan los caracteres invisibles y los espacios de más.
-- · Dos apodos son el mismo si solo cambian mayúsculas, tildes, espacios o caracteres invisibles
--   («Pau», «pau», «Páu», «P au» y «Pa​u» con un espacio invisible cuentan como el mismo).
-- Si ya hubiera dos apodos así, el índice no se crea y se avisa con un NOTICE: cambia uno y vuelve a ejecutarlo.
-- Ejecútalo una vez en Supabase → SQL Editor. Se puede repetir sin problema.

-- Clave de comparación de un apodo
create or replace function public.nick_key(p text)
returns text language sql immutable parallel safe set search_path = '' as $$
  select lower(translate(
    regexp_replace(coalesce(p, ''), '[\s​-‏ - ⁠-⁯﻿­]', '', 'g'),
    'ÁÉÍÓÚÀÈÌÒÙÄËÏÖÜÂÊÎÔÛÑÇáéíóúàèìòùäëïöüâêîôûñç',
    'AEIOUAEIOUAEIOUAEIOUNCaeiouaeiouaeiouaeiounc'));
$$;

-- Limpieza al guardar (también en las funciones que crean o recuperan apodos)
create or replace function public.clean_nick()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.nick := btrim(regexp_replace(regexp_replace(new.nick, '[​-‏ - ⁠-⁯﻿­]', '', 'g'), '\s+', ' ', 'g'));
  return new;
end $$;
drop trigger if exists clean_nick on public.climbers;
create trigger clean_nick before insert or update of nick on public.climbers for each row execute function public.clean_nick();

-- Los que ya existen, limpios
update public.climbers set nick = nick where nick ~ '[​-‏ - ⁠-⁯﻿­]|\s\s|^\s|\s$';

-- Índice único por la clave (si no hay ya duplicados que lo impidan)
do $$
declare dups text;
begin
  select string_agg(n, ' · ') into dups from (
    select string_agg(nick, ' = ' order by nick) as n from public.climbers group by public.nick_key(nick) having count(*) > 1) d;
  if dups is not null then
    raise notice 'Hay apodos que se ven iguales y no se puede crear el índice todavía: %. Cambia uno de cada pareja y vuelve a ejecutar.', dups;
  else
    create unique index if not exists climbers_nick_key_idx on public.climbers (public.nick_key(nick));
  end if;
end $$;

notify pgrst, 'reload schema';
