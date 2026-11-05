-- Favoritos en Supabase: hasta ahora solo estaban en el móvil. Van en la misma fila del voto (ratings.fav),
-- así que cada uno solo ve los suyos, no cuentan en las estadísticas y, al recuperar el apodo con el PIN
-- en otro móvil o en otra dirección de la web, viajan con el resto del progreso.
-- La primera vez que cada móvil abre la app después de esto, sube solo los favoritos que tenía guardados.
-- Ejecútalo una vez en Supabase → SQL Editor. Se puede repetir sin problema.
alter table public.ratings add column if not exists fav boolean not null default false;
notify pgrst, 'reload schema';
