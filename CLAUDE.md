# Xlp.Boulder — instrucciones para Claude

## Preferencias del usuario
- Cada vez que se actualice la web (cambios subidos a `main` en GitHub, que publica GitHub Pages), termina el mensaje al usuario con un "✅" bien visible para indicar que la web ya está actualizada.
- Escribe en español.

## Ideas pendientes
- `IDEAS.md` guarda las ideas aprobadas para más adelante y las propuestas sin decidir. Consúltalo cuando el usuario pregunte qué queda pendiente o pida nuevas ideas, y actualízalo cuando se implemente o se apruebe alguna.

## Proyecto
- Web estática (HTML, CSS y JS sin compilar) en GitHub Pages: https://xlp-trainning.github.io/Xlp.Boulder/
- Datos en Supabase (proyecto `przbceryckqmmvocyele`); esquema en `supabase/schema.sql`.
- Dos rocódromos: Natural Patraix y Natural Benimaclet. Planos en `mapas/`.
- `editor.js`: editor de la foto del bloque (zona a analizar, presas por color, volúmenes, salida y top).

## Sistema visual · «la cinta de salida»
La estética sale de la pared del rocódromo: cinta de carrocero para los niveles, magnesio y tuercas T. Todo está en `styles.css` (secciones numeradas) e `icons.js`.

- **Tokens** (`:root` en `styles.css`). No escribas colores ni medidas sueltos: usa siempre los tokens.
  - Color: `--bg`, `--bg-2`, `--surface`, `--surface-2`, `--ink`, `--ink-2`, `--muted`, `--line`, `--line-2`, `--accent` (verde azulado, el color principal), `--accent-text`, `--accent-soft`, `--tape` (amarillo cinta #F5CE1B: poco, solo para destacar), `--tape-text`, `--danger`, `--star`.
  - Neutros siempre verdosos, nunca gris ni blanco puros. El tema oscuro redefine los mismos tokens dos veces: dentro de `@media (prefers-color-scheme: dark)` y en `[data-theme="dark"]`. Si cambias uno, cambia los dos.
  - Espacio: `--s-1` … `--s-16`, en pasos de 4 px.
  - Radios: `--r-1` (cinta), `--r-2` (chip), `--r-3` (botón y campo), `--r-4` (panel), `--r-5` (bloque héroe).
  - Sombras: `--sh-1` … `--sh-3`. Tiempos: `--d-1` 150 ms, `--d-2` 200 ms, `--d-3` 250 ms, con `--ease`.
  - Tamaños táctiles: `--tap` 44 px, `--tap-lg` 52 px, `--tap-xl` 64 px (los botones del modo sesión).
- **Formas de cinta**: `--cut-v` (final en V: la cinta del nivel en las filas), `--cut-top` (barras de la tira de niveles), `--cut-end` (muesca: «Nuevo», ligas, barras de progreso) y `--torn` (cinta rasgada y girada 1,5–2°: etiqueta del rocódromo, nivel en la ficha, avisos de la bienvenida). Gira solo lo que es «cinta pegada»; el resto va recto.
- **Texturas**: el `body` lleva `--grain` (grano de magnesio, SVG). La clase `.is-wall` convierte cualquier zona en «muro»: pared oscura con rejilla de tuercas T, en los dos temas. Además redefine los tokens dentro, así que lo que va dentro se adapta solo.
  - Se usa en los momentos de impacto: bloque héroe de Hoy (`.today-hero`), modo sesión (`.session`), visor de Tu mes (`.wrapped`) y bienvenida (`.wl`).
- **Tipografía**:
  - Big Shoulders Display para números tipo marcador y títulos en mayúsculas.
  - Figtree para el texto.
  - JetBrains Mono para fechas y datos.
  - Los números grandes van en condensada (`.kpi-n`, `.ses-kpis`, `.today-chip b`, `.rk-pts`).
- **Composición**:
  - Hoy: un solo bloque héroe y, debajo, listas.
  - Bloques y demás listas: filas densas separadas por una línea (`.grid` con `gap: 1px` sobre `--line`, dos columnas desde 768 px), nunca tarjetas iguales.
  - Momentos a pantalla completa: sesión, celebración (`cheer()` en `progreso.js`), Tu mes y bienvenida.
- **Iconos**: `ico(nombre, clase)` de `icons.js` (trazo de 2 px, estilo Lucide). En el HTML fijo, `<span data-ico="nombre">`. En los lienzos de historias, `drawIco()`.
  - No uses emojis como iconos. Solo las reacciones de grupos (🔥 👏 💪) siguen siendo emoji.
  - Si un texto pierde su emoji, `i18n.js` deriva solo la traducción sin emoji (claves y expresiones).
- **Interacción**:
  - Todo lo táctil mide al menos 44 px.
  - Al pulsar, `scale(.97)`.
  - Foco visible: contorno de 3 px en `--accent`, o en amarillo cinta sobre el muro.
  - Las animaciones duran entre 150 y 250 ms. `prefers-reduced-motion` las deja en 1 ms, y la celebración pasa a un fundido.
  - Al encadenar: tira de cinta a pantalla completa más `navigator.vibrate`.
  - Mientras carga: esqueleto (`skeleton()`). Sin resultados o con error: `emptyBox(…, error)` con trozo de cinta.
- **Historias (lienzo 1080×1920)**: `wallBg`, `tapeLabel`, `scoreboard`, `levelPill` y `drawFooter`, en `historias.js`. Con ellos todas las tarjetas tienen el mismo aire de póster.
- **Contraste**: los pares de tokens cumplen WCAG AA en los dos temas y en el muro. El texto de la cinta verde va oscuro (`fg` en `LEVELS`).
- **Al cambiar estilos**:
  - Sube la versión `CACHE` de `sw.js`.
  - Prueba a 360, 390 y 768 px en claro y oscuro (y con letra grande).
