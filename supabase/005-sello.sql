-- Sello Xlp: marca los bloques equipados por ti para que se reconozcan en la web.
-- Ejecútalo una vez en Supabase → SQL Editor. Se puede repetir sin problema.
alter table public.blocks add column if not exists xlp boolean not null default false;
