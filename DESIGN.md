# DESIGN.md · Xlp.Boulder — «la cinta de salida»

Sistema visual de Xlp.Boulder, la libreta de bloques de Natural Climb Patraix y Benimaclet. Sigue el formato DESIGN.md (Google Stitch, colección VoltAgent/awesome-design-md): un documento en texto que cualquier agente lee antes de tocar la interfaz.

Es la descripción **de esta app**, no de otra marca. La fuente de verdad son los tokens de `styles.css` (`:root`) y `LEVELS` en `app.js`; si cambias algo allí, cambia este archivo. Las reglas de trabajo para Claude están en `CLAUDE.md`.

## Overview

La estética sale de la pared del rocódromo:
- la **cinta de carrocero** con la que se marcan los niveles de cada bloque;
- el **magnesio**, como grano sobre el fondo;
- las **tuercas T** del muro, como rejilla en las zonas oscuras.

Es una app que se usa con el móvil en la mano, entre intento e intento: filas densas, textos cortos, botones grandes y un solo momento de impacto por pantalla.

Tres capas:
1. **El papel**: fondo claro verdoso (u oscuro, en tema oscuro) con grano de magnesio. Ahí van listas, filtros y fichas.
2. **El muro** (`.is-wall`): pared casi negra con rejilla de tuercas T, igual en los dos temas. Solo para los momentos de impacto: el bloque héroe de Hoy, el modo sesión, Tu mes y la bienvenida.
3. **La cinta**: el color del nivel, cortado como un trozo de cinta pegado. Es lo único que lleva color fuerte.

## Colors

Neutros siempre verdosos, nunca gris ni blanco puros. Cada token existe en claro, en oscuro (dos veces en `styles.css`: `@media (prefers-color-scheme: dark)` y `[data-theme="dark"]`) y dentro del muro.

### Brand & Accent

| Token | Claro | Oscuro / muro | Uso |
|---|---|---|---|
| `--accent` | #0B6B5A | #4CC3A8 | Verde azulado: acción principal, foco, enlaces |
| `--accent-text` | #0B6B5A | #5FD0B5 | Texto en color de acento |
| `--accent-soft` | #D2E7DF | #163430 | Fondos suaves de aviso o selección |
| `--tape` | #F5CE1B | #F5CE1B | Amarillo cinta: «Nuevo», etiqueta del rocódromo, foco sobre el muro. Poco |
| `--tape-ink` | #1E1A07 | — | Texto encima de la cinta amarilla |
| `--tape-text` | #735C00 | #F5CE1B | Texto en amarillo sobre fondo claro (AA) |

### Surface

| Token | Claro | Oscuro | Muro |
|---|---|---|---|
| `--bg` | #E8EDE9 | #0F1513 | #0C1210 |
| `--bg-2` | #DCE4DE | #0A0F0D | #080C0B |
| `--surface` | #F7F9F5 | #17201D | #151E1B |
| `--surface-2` | #EDF2EE | #1F2A26 | #1E2925 |
| `--line` | #C8D2CB | #29352F | #2B3732 |
| `--line-2` | #A9B7AE | #3A4842 | #3D4B45 |

### Text

| Token | Claro | Oscuro | Muro |
|---|---|---|---|
| `--ink` | #13201B | #E8EFEB | #EEF4F1 |
| `--ink-2` | #2A3832 | #C8D3CE | #CAD6D0 |
| `--muted` | #4F5F58 | #98A8A1 | #9AABA4 |

Estado: `--danger` #B3261E / #F2827A, `--star` #C08600 / #F2B634, `--info` #24679F / #7AB6EE.

### Niveles (la cinta)

Los mismos en `--lv-*` (CSS) y `LEVELS` (`app.js`). El texto encima (`fg`) está elegido para cumplir AA.

| Nivel | Fondo | Texto |
|---|---|---|
| Azul | #1E63D6 | #FFFFFF |
| Verde | #2E9D45 | #0B1A10 |
| Naranja | #F07A1A | #1B120A |
| Amarillo | #F5CE1B | #1B1A10 |
| Morado | #7B3FB8 | #FFFFFF |
| Rojo | #D7262C | #FFFFFF |
| Negro | #1C1C1E | #FFFFFF |
| Compe | rayas #1C1C1E / #F4F4F2 a 135° | #1C1C1E |

Modo daltónico: cada nivel lleva además su abreviatura escrita en la cinta («AZUL», «VERDE», «NAR»…). El color nunca va solo.

## Typography

### Font Family

- **Big Shoulders Display** (700–900): números tipo marcador, el logotipo, títulos de los momentos de impacto, abreviatura del nivel en la cinta. En mayúsculas.
- **Figtree** (400–800): todo el texto.
- **JetBrains Mono** (500–600): fechas y datos (`.mono`), con cifras tabulares.

### Hierarchy

| Token | Tamaño | Uso |
|---|---|---|
| `--fs-1` | 12px | Etiquetas pequeñas (`.label`), en frase normal |
| `--fs-2` | 13px | Meta de las filas: sector, fecha, equipador, estilos |
| `--fs-3` | 15px | Texto de botones y campos |
| `--fs-4` | 17px | Nombre del bloque en la fila, títulos de sección |
| `--fs-5` | 20px | Títulos de hoja |
| `--fd-1`…`--fd-5` | 24 / 32 / 44 / 64 / 88px | Condensada: marcadores (`.kpi-n`, `.ses-kpis`, `.rk-pts`), total de bloques, saludo de Hoy |

### Principles

- Los títulos de sección van en frase normal y negrita, en tinta (`.today-head`). Nunca en mayúsculas pequeñas espaciadas.
- Las mayúsculas espaciadas quedan para el muro (marcadores) y la marca (nombre del rocódromo).
- Los campos de texto van a 16px para que iOS no haga zoom.
- Textos con «…» de verdad, nunca «...».

## Layout

### Spacing System

Escala de 4 px: `--s-1` 4 · `--s-2` 8 · `--s-3` 12 · `--s-4` 16 · `--s-5` 20 · `--s-6` 24 · `--s-8` 32 · `--s-10` 40 · `--s-12` 48 · `--s-16` 64.

### Grid & Container

- Contenedor `.wrap` de 1120px como máximo; margen lateral de 16px en el móvil, más el notch (`env(safe-area-inset-*)`).
- Listas: filas densas separadas por una línea (`.grid` con `gap: 1px` sobre `--line`), una columna en el móvil y dos desde 768px.

### Whitespace Philosophy

Densidad de herramienta, no de folleto: el usuario está en la sala y quiere ver bloques. En Bloques, encima de la lista solo van las barras de nivel, las pestañas y una fila con el buscador y «Filtros». La lista empieza en la primera pantalla del móvil.

## Elevation & Depth

| Token | Uso |
|---|---|
| `--sh-1` | Línea de 1px bajo filas y paneles |
| `--sh-2` | Paneles que se separan del papel (bloque héroe) |
| `--sh-3` | Hojas y diálogos que flotan |
| `--sh-tape` | La cinta pegada, que levanta un poco del papel |

### Decorative Depth

- `--grain`: grano de magnesio en SVG sobre el `body`.
- `.is-wall`: rejilla de tuercas T (dos `radial-gradient`) más grano claro.
- Sin degradados de color en fondos ni botones. Sin desenfoques de cristal.

## Shapes

### Border Radius Scale

`--r-1` 3px (cinta) · `--r-2` 6px (chip) · `--r-3` 10px (botón y campo) · `--r-4` 14px (panel) · `--r-5` 20px (bloque héroe) · `--r-pill` (barra de sesión).

### Formas de cinta (`clip-path`)

| Token | Forma | Dónde |
|---|---|---|
| `--cut-v` | Final en V | La cinta del nivel en cada fila |
| `--cut-top` | Muesca arriba | Barras de la tira de niveles |
| `--cut-end` | Muesca al final | «Nuevo», ligas, barras de progreso |
| `--torn` | Rasgada, girada 1,5–2° | Etiqueta del rocódromo, nivel en la ficha, avisos de la bienvenida |

Solo se gira lo que es «cinta pegada». Todo lo demás va recto.

## Components

### Buttons

- `.btn`: superficie con borde `--line-2`, 44px de alto como mínimo. `.btn.primary`: relleno `--accent` con texto `--accent-ink`. `.btn.small`: 36px, en avisos y barras de herramientas (editor), nunca como acción principal.
- `.linkbtn`: texto subrayado para acciones secundarias.
- Al pulsar, `scale(.97)`. Foco: contorno de 3px en `--accent`, o en `--tape` sobre el muro.

### Cards & Containers

- **Fila de bloque** (`.card`): cinta del nivel a la izquierda, nombre a 17px, una línea de meta (sector · fecha · equipador con su inicial), estilos como texto («Placa · Técnico»), estrellas y estado (Flash, Encadenado, Proyecto). Sin recuadros dentro.
- **Bloque héroe** (`.today-hero`): un solo bloque en el muro, con el saludo y los marcadores.
- **Hoja** (`.sheet`): ficha y formularios, a pantalla completa en el móvil, con `overscroll-behavior: contain`.

### Inputs & Forms

Campos a 44px de alto y 16px de letra, borde `--line-2`, radio `--r-3`. Siempre con etiqueta visible o `aria-label`; el texto de ejemplo termina en «…».

### Navigation

Barra de pestañas de texto (`.mainnav`): Hoy, Bloques, Mapa, Ranking, Grupos, Equipadores, Mi progreso. La activa se marca con tinta y una línea amarilla debajo. Sin iconos en la navegación.

### Pills, Tags, and Chips

- `.chip`: filtros (estilo, agarre, equipador, presa), dentro del panel «Filtros». Pulsado: relleno `--ink`.
- `.new-badge`: «Nuevo» en cinta amarilla con muesca.
- Etiqueta de equipador: su inicial en un cuadradito `--accent` y su nombre en texto.

### Signature Components

- **La cinta del nivel** (`tape()`), con su abreviatura en condensada.
- **La tira de niveles** (`.bars`): cuántos bloques hay de cada color, que además sirve de filtro.
- **El modo sesión**: pantalla completa en el muro con botones de 64px (`--tap-xl`).
- **La celebración** (`cheer()`): tira de cinta a pantalla completa y `navigator.vibrate` al encadenar.
- **Historias** (lienzo 1080×1920, `historias.js`): `wallBg`, `tapeLabel`, `scoreboard`, `levelPill`, `drawFooter`.
- **Iconos**: `ico()` de `icons.js`, trazo de 2px estilo Lucide. Sin emojis, salvo las reacciones de grupos (🔥 👏 💪).

## Do's and Don'ts

### Do

- Usa siempre los tokens; nada de colores ni medidas sueltos.
- Un momento de impacto por pantalla, en el muro.
- Color fuerte solo en la cinta del nivel y en la acción principal.
- Esqueleto (`skeleton()`) mientras carga; `emptyBox()` con trozo de cinta si no hay nada o hay error.
- Animaciones de 150–250ms con `--ease`, solo `transform` y `opacity`; con `prefers-reduced-motion`, 1ms.
- Comprueba a 360, 390 y 768px, en claro, en oscuro y con letra grande.

### Don't

- Gris o blanco puros.
- Tarjetas iguales en rejilla, o iconos dentro de cuadrados de color.
- Títulos en mayúsculas pequeñas espaciadas fuera del muro.
- Degradados, brillos o fondos desenfocados.
- Emojis como iconos.
- Copiar el sistema visual de otra marca o app: este documento es el de Xlp.Boulder.

## Responsive Behavior

### Breakpoints

| Ancho | Cambio |
|---|---|
| ≤ 380px | Botones del editor más estrechos |
| ≤ 560px | Se oculta la frase de la cabecera |
| ≤ 767px | «Empezar sesión» solo en Hoy; listas a una columna |
| ≥ 768px | Listas a dos columnas |
| Alto bajo | La bienvenida reduce su parte central y deja hacer scroll |

### Touch Targets

44px como mínimo (`--tap`), 52px en acciones importantes (`--tap-lg`) y 64px en el modo sesión (`--tap-xl`). `touch-action: manipulation` en todo lo que se toca.

### Collapsing Strategy

- Filtros: buscador más «Filtros · n», y el resto en un panel que se abre. Con el panel cerrado, una línea dice qué se filtra.
- El aviso de instalar la app solo sale en Hoy.
- Las pestañas y las etiquetas se desplazan de lado dentro de su fila; la página nunca.

### Image Behavior

- Fotos de bloque en miniatura en la fila, a lo ancho en la ficha, con `loading="lazy"`.
- Los planos llevan sus medidas reales (`MAP_DIMS`) para que la página no salte al cargar.

## Iteration Guide

1. Lee este archivo y la sección «Sistema visual» de `CLAUDE.md`.
2. Cambia primero los tokens en `styles.css` (los dos bloques del tema oscuro) y luego los componentes.
3. Revisa con la taste-skill (`inspect.mjs --app`) y con web-design-guidelines.
4. Sube la versión `CACHE` de `sw.js`.
5. Actualiza este archivo si has cambiado un token, un componente o una regla.
