# Natural Patraix · sectores reales (para ajustar el plano)

Lo que ha contado el equipador el 02/11/2026, para adecuar el mapa y acercarlo a la realidad más adelante.

| Zona (palabras del equipador) | Sectores reales | En el plano ahora | Sectores del plano ahora |
|---|---|---|---|
| Sala 1 | 9 | 3 | Banda, Zigzag, Diagonal |
| Sala 2 · la placa (izquierda al entrar) | 2 | 1 | Pared izquierda |
| Sala 2 · la isla | 3 | 1 | Isla |
| Sala 2 · la U | 6 | 1 | La U |
| Sala 3 · la placa de la derecha | 2 | 0 | (no está en el plano) |
| Sala 3 · la isla grande | 9 | 1 | Isla |
| Sala 3 · la pared de la izquierda | 6 | 0 | (no está en el plano) |
| Terraza | 2 | 2 | Panel, Diagonal (¿Diagonal fuera?) |
| **Total** | **39** | **10** | |

Ahora mismo el plano de Patraix tiene 10 sectores: Sala 1 · Banda, Zigzag y Diagonal; Sala 2 · La U, Isla y Pared izquierda; Terraza · Panel y Terraza · Diagonal; Sala 3 · Pared del fondo e Isla. Los quitados el 02/11/2026 fueron Sala 1 · Pared izquierda, Sala 3 · Pared baja y Sala 3 · Celosía.

## Respuestas del equipador (02/11/2026)
- **Placa de la Sala 2 (2 sectores):** la de la izquierda conforme entras. En el plano es «Sala 2 · Pared izquierda».
- **Placa de la derecha de la Sala 3 (2 sectores):** la pared que hay a la derecha de la Sala 3 (no es la «Pared del fondo»).
- **Pared de la izquierda (6 sectores):** es de la Sala 3.
- **«Terraza · Diagonal»:** fuera. Pendiente de confirmar, porque también ha dicho que la terraza tiene 2 sectores y en el plano la terraza solo tiene «Panel» y «Diagonal»: ¿cuál es el segundo?
- **Límites y nombres de cada sector:** los delimitará él con el ordenador.

## Lo que queda por saber
- El segundo sector de la terraza (si «Diagonal» se quita).
- Qué pasa con la «Sala 3 · Pared del fondo»: no está en la lista.
- Nombre y límites de cada uno de los 39 sectores (los marcará el equipador).

## Cómo se hará
- Partir las zonas actuales en tantos sectores como haya de verdad, cada uno con su zona tocable (mapas/sectores.py) y un SQL nuevo para Supabase que cree los nuevos y pase los bloques a su sector.
- Si hace falta, retocar el dibujo del plano (mapas/natural-patraix.py) para que las paredes coincidan con la sala.
