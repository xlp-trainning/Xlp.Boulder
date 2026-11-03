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

## Sistema visual
- **`DESIGN.md`** (en la raíz) describe este sistema en el formato DESIGN.md: colores, tipografía, espacios, formas, componentes, qué hacer y qué no, y el comportamiento por anchos. Léelo antes de tocar la interfaz y actualízalo cuando cambies un token o un componente.
- No copies el DESIGN.md de otra marca (la colección awesome-design-md): la app tiene su propia identidad.
Plano y moderno: superficies lisas, radios cortos y color a bloques; el color fuerte lo llevan las cintas de nivel y la acción principal (girasol #FFC933). Sin ilustraciones ni patrones de fondo: el panel geométrico de presas y volúmenes se probó y el usuario pidió quitarlo de todas las páginas; no lo vuelvas a poner. Todo está en `styles.css` (secciones numeradas) e `icons.js`.

- **Tokens** (`:root` en `styles.css`). No escribas colores ni medidas sueltos: usa siempre los tokens.
  - Color: `--bg`, `--bg-2`, `--surface`, `--surface-2`, `--ink`, `--ink-2`, `--muted`, `--line`, `--line-2`, `--accent` (negro #15171C en claro; girasol #FFC933 en oscuro y sobre el muro), `--accent-text`, `--accent-soft`, `--tape` (amarillo cinta #F5CE1B: poco, solo para destacar), `--tape-text`, `--danger`, `--star`.
  - Neutros cálidos (blanco tiza #EEEDE9, carbón #22252C en oscuro), nunca gris ni blanco puros. El tema oscuro redefine los mismos tokens dos veces: dentro de `@media (prefers-color-scheme: dark)` y en `[data-theme="dark"]`. Si cambias uno, cambia los dos.
  - Espacio: `--s-1` … `--s-16`, en pasos de 4 px.
  - Radios cortos (2–10 px): `--r-1` (cinta), `--r-2` (chip), `--r-3` (botón y campo), `--r-4` (panel), `--r-5`.
  - Sombras: `--sh-1` y `--sh-2` valen `none` (en reposo nada flota); `--sh-3` solo para hojas y diálogos. Tiempos: `--d-1` 150 ms, `--d-2` 200 ms, `--d-3` 250 ms, con `--ease`.
  - Tamaños táctiles: `--tap` 44 px, `--tap-lg` 52 px, `--tap-xl` 64 px (los botones del modo sesión).
- **Formas**: `--cut-diag` (borde de abajo en diagonal: la tira de niveles de Bloques), `--cut-v` (final en V: la cinta del nivel en las filas), `--cut-top` (barras de la tira de niveles), `--cut-end` (muesca: «Nuevo», ligas, barras de progreso) y `--torn` (cinta rasgada y girada 1,5–2°: etiqueta del rocódromo, nivel en la ficha, avisos de la bienvenida). Gira solo lo que es «cinta pegada»; el resto va recto.
- **Logo**: se mantiene el original (la X de dos tiras de cinta, amarilla y verde azulada #4CC3A8, sobre #18201E), en la cabecera, el sello Xlp, las historias y los iconos. No lo cambies por la paleta nueva.
- **Sin texturas** (`--grain: none`). La clase `.is-wall` convierte cualquier zona en «muro»: panel liso #15171C en los dos temas, que redefine los tokens dentro.
  - Se usa en los momentos de impacto: portada de Hoy (`.today-hero`), tira de niveles de Bloques (`.dist`), modo sesión (`.session`), Tu mes (`.wrapped`) y bienvenida (`.wl`).
- **Tipografía**:
  - Big Shoulders Display para números tipo marcador y títulos en mayúsculas.
  - Figtree para el texto.
  - Fechas y datos (`.mono`): Figtree con cifras tabulares. No hay tercera familia.
  - Los números grandes van en condensada (`.kpi-n`, `.ses-kpis`, `.today-chip b`, `.rk-pts`).
- **Composición**:
  - Hoy: la portada en el muro con la rejilla de tuercas, el saludo en grande, tu marcador y «Empezar sesión»; debajo, listas. (Se probó una portada con el bloque destacado y el panel, y el usuario prefirió esta.)
  - Bloques: encima de la lista solo van las barras de nivel, las pestañas y una fila con el buscador y «Filtros» (orden, estilo, equipador y presa en un panel que se abre). La lista empieza en la primera pantalla del móvil. En las filas, los estilos y el equipador van como texto, sin recuadro.
  - Títulos de sección en frase normal y negrita (`.today-head`), nunca en mayúsculas pequeñas. Las mayúsculas espaciadas quedan para el muro y la marca.
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

## Skill de diseño · taste-skill
- Instalada en `.claude/skills/taste-skill/` (de [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill), licencia MIT, commit 12af471). Se usa para revisar y pulir pantallas, no para rediseñar la app desde cero.
- **Manda el sistema visual de arriba .** La app es una *app screen*: sigue `references/app-screens.md`, usa `draw.mjs --app --keep palette,type` y respeta los tokens, tipografías e iconos de arriba.
- Choques conocidos que son decisiones de marca y se mantienen (en el inspector, `--allow` para esa regla):
  - Las estrellas ★ de la puntuación (el inspector las cuenta como emoji).
  - Big Shoulders en mayúsculas.
  - Las líneas de 1 px entre filas (`.grid`).
  - La cinta girada.
  - Los sectores numerados, que son nombres reales.
- Para revisar: `node .claude/skills/taste-skill/scripts/lint.mjs <archivos>` y `node .claude/skills/taste-skill/scripts/inspect.mjs index.html --app`. Requiere Node 22 y Chromium.
- `assets.mjs` busca imágenes en archivos públicos y necesita red. No lo uses sin que el usuario lo pida.

## Skill de revisión · web-design-guidelines
- Está instalada en `.claude/skills/web-design-guidelines/`. Viene de `vercel-labs/agent-skills` y tiene licencia MIT. Revisa accesibilidad, formularios, animación, tipografía, móvil, tema oscuro e idioma, y da los problemas en formato `archivo:línea`.
- Las reglas están copiadas y fijas en `guidelines.md` (commit 434b7f9). No se descargan de internet. Para actualizarlas, primero se lee el texto nuevo.
- Las adaptaciones están en su `SKILL.md`:
  - Sin React: ignora las reglas de hidratación y de `<Link>`.
  - Español en frase normal, sin «Title Case», y comillas «».
  - En estilo manda el sistema visual de `DESIGN.md`.
  - Guardar el estado en la URL se propone antes de hacerlo.
