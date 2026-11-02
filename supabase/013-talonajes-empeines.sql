-- La etiqueta «Talonajes» pasa a llamarse «Talonajes/Empeines».
-- Ejecútalo una vez en Supabase → SQL Editor. Se puede repetir sin problema.
update public.blocks
set styles = array_replace(styles, 'Talonajes', 'Talonajes/Empeines')
where 'Talonajes' = any(styles);
