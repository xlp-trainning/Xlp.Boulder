-- Nombres oficiales de los rocódromos: Natural Climb Valencia (el de Patraix) y Natural Climb Benimaclet.
-- Ejecútalo una vez en Supabase → SQL Editor. Se puede repetir sin problema.
update public.gyms set name = 'Natural Climb Valencia' where id = 'patraix';
update public.gyms set name = 'Natural Climb Benimaclet' where id = 'benimaclet';
select id, name from public.gyms order by sort;
