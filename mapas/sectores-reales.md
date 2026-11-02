# Natural Patraix · sectores reales (para ajustar el plano)

Lo que ha contado el equipador el 02/11/2026, para adecuar el mapa y acercarlo a la realidad más adelante.

| Zona (palabras del equipador) | Sectores reales | En el plano ahora | Sectores del plano ahora |
|---|---|---|---|
| Sala 1 | 9 | 3 | Banda, Zigzag, Diagonal |
| Sala 2 · la placa | 2 | ¿1? | (¿«Sala 2 · Pared izquierda»?) |
| Sala 2 · la isla | 3 | 1 | Isla |
| Sala 2 · la U | 6 | 1 | La U |
| Sala 3 · la placa de la derecha | 2 | ¿? | (¿«Pared del fondo»?) |
| Sala 3 · la isla grande | 9 | 1 | Isla |
| La pared de la izquierda | 6 | ¿? | (¿de qué sala?) |
| Terraza | 2 | 2 | Panel, Diagonal |
| **Total** | **39** | **10** | |

Ahora mismo el plano de Patraix tiene 10 sectores: Sala 1 · Banda, Zigzag y Diagonal; Sala 2 · La U, Isla y Pared izquierda; Terraza · Panel y Terraza · Diagonal; Sala 3 · Pared del fondo e Isla. Los quitados el 02/11/2026 fueron Sala 1 · Pared izquierda, Sala 3 · Pared baja y Sala 3 · Celosía.

## Dudas para cuando lo hagamos
- «La placa de la sala 2»: ¿es la pared que el plano llama «Sala 2 · Pared izquierda»? (el «Terraza · Panel» es de la terraza)
- «La placa de la derecha» de la sala 3: ¿es la «Pared del fondo»?
- «La pared de la izquierda» (6 sectores): ¿de qué sala es?
- Terraza: 2 sectores, que coinciden con los 2 del plano (Panel y Diagonal). Falta confirmar que son esos.
- Nombres y orden de cada sector (p. ej. «Isla grande 1…9», o nombres propios), y dónde empieza y acaba cada uno: lo ideal es una foto o un dibujo encima del plano.

## Cómo se hará
- Partir las zonas actuales en tantos sectores como haya de verdad, cada uno con su zona tocable (mapas/sectores.py) y un SQL nuevo para Supabase que cree los nuevos y pase los bloques a su sector.
- Si hace falta, retocar el dibujo del plano (mapas/natural-patraix.py) para que las paredes coincidan con la sala.
