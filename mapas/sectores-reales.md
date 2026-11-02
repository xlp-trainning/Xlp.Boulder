# Natural Patraix · sectores reales

Lo que ha contado el equipador (02/11/2026), para acercar el mapa a la realidad. Ya está puesto en el plano
(`mapas/sectores.py`, `mapas/sectores.json` y `supabase/012-sectores-numerados.sql`). En el plano cada sector se ve
solo con su número; en la base de datos se llama «Sala 1 · 4», «Terraza · 39»…

## Los 40 sectores

| Números | Dónde | Orden |
|---|---|---|
| 1–9 | Sala 1 · banda (1–3), zigzag (4–6) y pared diagonal hacia la terraza (7–9) | repartidos para que ocupen lo mismo |
| 10–11 | Sala 2 · placa, la de la izquierda conforme entras | de abajo arriba |
| 12–14 | Sala 2 · isla | al revés de las agujas del reloj, empezando por la cara que se ve al entrar en la sala |
| 15–20 | Sala 2 · la U | desde arriba hasta conectar con la sala 1 |
| 21–22 | Sala 3 · placa de la derecha = la celosía (abajo en el plano) | de izquierda a derecha |
| 23–31 | Sala 3 · isla grande | al revés de las agujas del reloj, desde la punta del lado de la entrada |
| 32–37 | Sala 3 · pared de la izquierda (sin contar la isla), la de arriba en el plano | hacia la esquina |
| 38 | Sala 3 · fondo, a partir de la esquina | un solo sector |
| 39–40 | Terraza · panel, dividido en dos | |

## Lo que dijo el equipador
- A la sala 3 se entra por donde conecta con la terraza. Entrando, la pared de la izquierda (sin contar la isla) es la de arriba en el plano; la de la derecha es la celosía.
- La pared baja de la sala 3 no tiene sectores, pero se queda dibujada en el plano. La celosía es la pared de la derecha.
- La pared izquierda de la sala 1 es la que ahora en la app se llama «slab»: ya no es sector, pero se queda dibujada.
- «Terraza · Diagonal» fuera; la terraza son dos sectores.
- En el plano, solo números.
- Los bloques ya montados los pasa él a su número (Editar → tocar la zona en el plano).
- Benimaclet, después.

## Pendiente
- Límites de verdad de cada sector: el equipador los marcará con el ordenador. Ahora cada pared está repartida en tramos iguales.
- Ejecutar `supabase/012-sectores-numerados.sql` en Supabase.
- Benimaclet: contar sectores y numerarlos igual.
