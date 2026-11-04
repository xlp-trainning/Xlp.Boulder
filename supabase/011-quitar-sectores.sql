-- Quita del plano de Natural Climb Valencia tres sectores que ya no existen:
-- Sala 1 · Pared izquierda, Sala 3 · Pared baja y Sala 3 · Celosía.
-- Ejecútalo una vez en Supabase → SQL Editor. Los bloques no se tocan.

-- 1) Antes de borrar, mira qué hay (si un nombre no sale, puede que lo renombraras en la app)
select s.name, count(b.id) filter (where b.active) as bloques_abiertos, count(b.id) as bloques_total
from public.sectors s
left join public.blocks b on b.gym_id = s.gym_id and b.sector = s.name
where s.gym_id = 'patraix' and s.name in ('Sala 1 · Pared izquierda', 'Sala 3 · Pared baja', 'Sala 3 · Celosía')
group by s.name;

-- 2) Borrarlos
delete from public.sectors
where gym_id = 'patraix' and name in ('Sala 1 · Pared izquierda', 'Sala 3 · Pared baja', 'Sala 3 · Celosía');
