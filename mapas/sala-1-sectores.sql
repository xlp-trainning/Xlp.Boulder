-- Sectores de la sala 1 colocados sobre mapas/sala-1.svg.
-- Ejecútalo en Supabase → SQL Editor después de schema.sql. Luego sube el plano desde la app
-- (Mapa → Subir imagen del plano). Puedes renombrar los sectores desde la app cuando quieras.
insert into public.sectors (name, x, y) values
  ('1', 0.0298, 0.728),
  ('2', 0.0893, 0.608),
  ('3', 0.1005, 0.76),
  ('4', 0.1926, 0.474),
  ('4.1', 0.1619, 0.712),
  ('4.2', 0.12, 0.644),
  ('4.3', 0.1712, 0.61),
  ('5', 0.1302, 0.304),
  ('6', 0.0893, 0.05),
  ('7', 0.2326, 0.848),
  ('8', 0.6726, 0.372),
  ('8.1', 0.4279, 0.372),
  ('8.2', 0.5386, 0.406),
  ('8.3', 0.5619, 0.472),
  ('8.4', 0.6419, 0.456),
  ('8.5', 0.693, 0.456),
  ('8.6', 0.8772, 0.138),
  ('8.7', 0.9488, 0.44)
on conflict (name) do update set x = excluded.x, y = excluded.y;
