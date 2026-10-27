# Xlp.Boulder

**Xlp.Boulder** es la web pública con los bloques de **Natural Patraix** y **Natural Benimaclet**, con un selector arriba para cambiar de rocódromo. Los bloques van por nivel (Azul → Verde → Naranja → Amarillo → Morado → Rojo → Negro → Compe) y estilo.

- **Cualquiera** la abre sin registrarse y puede:
  - ver los bloques con su foto y la beta;
  - puntuarlos, marcarlos como encadenados o como proyecto, y guardar favoritos (los votos se guardan por dispositivo);
  - contar su propia beta con un apodo, con enlace a vídeo opcional.
- **Sello Xlp**: los bloques equipados por el dueño de la web llevan el distintivo Xlp (la X del logo) en la lista, en la ficha y en la tarjeta para historias, y se pueden filtrar con «Equipados por Xlp». Se marca con la casilla «Equipado por mí» al crear o editar un bloque (al crear, recuerda la última elección).
- **Idioma**: español e inglés, con el botón «🌐 EN / ES» arriba. Sale en el idioma del móvil y recuerda la elección. Se traduce todo al mostrarse (`i18n.js`): textos, avisos, ventanas, tarjetas para historias y fechas.
- **Modo daltónico** («👁 Daltónico», arriba): cada punto de color de nivel o de presa lleva su abreviatura (Az, Ve, Na, Am, Mo, Ro, Ne, Co…).
- **Sin cobertura**: la web se abre sin conexión con la última copia guardada (bloques, estadísticas y lo tuyo) y lo que apuntas (encadenados, intentos, votos) se guarda en el móvil y se sube solo al volver la conexión. Un aviso arriba lo indica.
- **Grado real del bloque**: con la sensación de la gente, los intentos, los flashes y cuántos lo sacan, cada bloque muestra dónde cae dentro de su color (de los más fáciles … de los más duros). Sale con 3 personas que lo hayan probado o votado.
- **Tu nivel real** (en «Mi progreso»): un número tipo Elo (azul ≈ 1000 … compe ≈ 2050) que sale de tus 10 mejores encadenados de los últimos 90 días, según el color, la dificultad real de cada bloque y los intentos, con la variación del mes.
- **Tu perfil de escalador**: gráfico de araña por estilos (placa, desplome, regletas, romos, pinzas, dinámico, técnica) con tu punto fuerte y el que mejorar; se comparte en historias.
- **Plan de la semana**: tres bloques abiertos de tu estilo más flojo cerca de tu nivel; cambia cada lunes.
- **Beta según tu altura**: quien cuenta su beta puede poner su altura; las betas muestran la altura, se resaltan las de gente de tu talla (± 7 cm) y se pueden filtrar. Quien ha probado el bloque vota si va mejor siendo bajo, alto o da igual («morfo»).
- **En cada bloque**, además:
  - **Intentos**: un contador (− / +) para apuntar cada pegue; al encadenar queda «encadenado al 4.º intento» (1 intento = flash). La ficha muestra los intentos medios de la gente.
  - **Sensación de dificultad**: quien lo ha probado vota si, para su color, le parece **blando, justo o duro**; todo el mundo ve el reparto («20 % blando · 50 % justo · 30 % duro»).
  - **Primero en encadenarlo**: el apodo de la primera persona del ranking que lo encadenó, con la fecha. Quien lo consigue recibe el aviso «🥇 ¡Eres el primero en encadenarlo!».
- **Novedades**: los bloques montados en los últimos 7 días llevan la marca «Nuevo» y tienen su pestaña.
- **Mapa**: el plano de cada rocódromo dividido en **sectores que se pueden tocar** (uno por muro, con su nombre y el número de bloques abiertos). Al tocar un sector se resalta y salen debajo sus bloques, de fácil a difícil; «Ver en la lista» lo lleva a la lista filtrada. El equipador puede redibujar la zona de cada sector con el dedo.
- **Mi progreso**, pensado para que la gente vuelva:
  - **Flash o encadenado**: en cada bloque se marca «Encadenado» o «⚡ Flash» (a la primera), con la fecha.
  - **Puntos por color** (azul 1 … compe 8; el flash suma la mitad más), en total y del mes.
  - **Rachas**: semanas seguidas encadenando algo, con aviso si la racha está a punto de perderse.
  - **Medallas** (primer bloque de cada color, flashes, 10/50 encadenados, 100 puntos, recién montado, sector completo, 6 estilos, rachas de 4 y 12 semanas), con barra de avance.
  - **Tu siguiente reto**: tres bloques abiertos recomendados según tu nivel, los estilos que menos tocas, tus proyectos y los recién montados.
  - **Tarjeta para historias de Instagram** (1080×1920) de cada bloque encadenado, para compartir o guardar.
  - **Tu mes**, un resumen tipo Spotify Wrapped: pantallas a pantalla completa que se pasan tocando (o solas cada 6 segundos), con los bloques del mes y la comparación con el anterior, la evolución semana a semana, los colores (y los estrenados), el bloque más difícil, el estilo del mes, datos curiosos (sector, día favorito, el mejor valorado) y el puesto en el ranking. Cada pantalla se comparte en historias. A principio de mes un aviso y un punto en «Mi progreso» anuncian que el resumen del mes pasado está listo.
  - Encadenados por nivel ("Rojo 4/9") y proyectos en curso.
- **Ranking** mensual por **ligas de color**, en cada rocódromo:
  - Tu liga es la del **primer color del que encadenes 10 bloques** (si tienes 10 de varios, el más difícil). No hace falta ir color a color y nunca se baja; mientras no tengas 10 de ninguno, estás en Azul.
  - La primera vez que alguien entra en el ranking, una ventana le explica cómo se asigna la liga y en cuál está.
  - Dentro de cada liga gana quien más puntos sume en el mes. Se reinicia el día 1 y se puede ver el mes pasado.
  - Es voluntario: cada uno se apunta con un apodo (sin email). El equipador puede quitar a alguien del ranking.
  - La fecha de cada encadenado la pone el servidor, así que no se puede trampear con fechas, y no cuentan los bloques marcados después de desmontarse.
- **Grupos de amigos** (pestaña «Grupos»; hace falta un apodo, que no obliga a salir en el ranking público):
  - crear un grupo o **unirse con su código** o con el enlace de invitación (`…/#g-CODIGO`), que se comparte por WhatsApp;
  - **ranking del grupo** por semana, mes o desde siempre, todos contra todos y con los dos rocódromos;
  - **actividad**: lo que encadena cada uno (con intentos y flash) y **reacciones** 🔥 👏 💪; arriba, los **proyectos compartidos** (bloques en los que andan metidos varios) y quién lo sacó primero;
  - **«Tus amigos»** en la ficha de cada bloque: quién lo ha encadenado (y cómo) y quién lo está probando;
  - **duelos**: retar a alguien del grupo a un bloque (quien lo encadene antes) o a una semana de puntos; se aceptan o rechazan;
  - **retos del grupo**: «entre todos, 50 encadenados de techo en un mes», con barra de avance y lo que aporta cada uno;
  - **sesión en grupo**: alguien la empieza, el resto se une desde la pestaña, y al terminar sale el resumen conjunto y su tarjeta para historias;
  - en **«Tu mes»**, una pantalla con los premios del mes en el grupo (más puntos, más constante, más flashes, más insistente);
  - **avisos al abrir la app** y número en la pestaña: retos de duelo, quién te ha adelantado, bloques que han hecho varios amigos y tú no, y sesiones en grupo en marcha.
  El creador del grupo puede sacar a gente o borrarlo; cada uno puede salir cuando quiera.
- **Modo sesión** («🧗 Empezar sesión», arriba): una vista rápida para apuntar entre pegue y pegue, con filtros por sector y color y tres botones por bloque: **+1** (un pegue sin encadenar), **✓** (encadenado en este pegue; se deshace tocando otra vez) y **⚡** (a la primera). Arriba, el marcador de la sesión (encadenados, flashes, intentos y puntos). Se puede minimizar (queda una barra «Sesión en curso») y sigue aunque se cierre la web. Al terminar, resumen con lo encadenado y tarjeta para historias.
- **Instalar la app**: a partir de la 2.ª visita o tras el primer encadenado, un aviso invita a instalarla; los pasos para **iPhone** (Safari → Compartir → «Añadir a pantalla de inicio») y **Android** (Chrome → ⋮ → «Instalar aplicación») salen según el móvil, con botón de instalar directo cuando el navegador lo permite. También desde «📲 Instalar la app», al pie.
- **Pasar el progreso**: como en iPhone la app instalada no comparte datos con Safari (ni Safari con el navegador de Instagram), «Copiar mi código» y «Recuperar» llevan los votos, encadenados y apodo de un sitio a otro.
- **Buzón de sugerencias** («💬 Buzón de sugerencias», al pie de todas las páginas): cualquiera escribe al equipador sin registrarse (idea, bloques, algo falla u otro), con su nombre si quiere. **Sin respuesta ni confirmación de lectura**: quien escribe no ve sus mensajes ni sabe si se han leído. Como mucho 5 mensajes por persona y hora.
- **El equipador** entra con email y contraseña ("Acceso equipador", al pie de la página) y puede:
  - crear, editar, desmontar o borrar bloques, con foto;
  - **resaltar presas** en la foto, en tres pasos: 1) marcas la zona a analizar rodeando el muro con el dedo (o arrastrando en diagonal para un rectángulo, o «Analizar toda la foto»); 2) eliges el color de las presas y la web deja en color solo esas, oscureciendo el resto; 3) tocas las presas para marcar la **salida** y el **top**, añadir las que falten o quitar las que sobren. Los **volúmenes estructurales** (madera, negro o gris, del color del muro) se marcan rodeándolos con «◇ Volumen» y funcionan como una presa más;
  - gestionar el plano y los sectores (renombrarlos, añadirlos y dibujar su zona en el plano);
  - borrar comentarios;
  - leer el **buzón** en su pestaña «Buzón» (con el número de mensajes nuevos), archivar o borrar mensajes, sin que nadie lo sepa;
  - ver **Estadísticas** de **todos los bloques** o **solo de los suyos** (sello Xlp):
    - **por zona**, agrupando por **rocódromo** (con el total de los dos), por **sala** (la parte del sector antes del «·», p. ej. «Sala 2») o por **sector**: bloques abiertos, mezcla de niveles, media de estrellas, encadenados, encadenados por bloque y desmontados;
    - con «Solo los míos», qué parte de los bloques abiertos son suyos y cómo puntúan frente a los demás;
    - **graduación según la gente**: los bloques que la mayoría ve blandos o duros para su color (con 3 votos o más), e intentos medios por nivel;
    - bloques por nivel y estilo, los que más y menos gustan, los poco encadenados, los más proyectados y los más comentados.
- Cada rocódromo tiene sus bloques, sectores, plano y estadísticas. La web recuerda el rocódromo elegido en cada móvil.
- Enlaces directos: `…/#patraix` y `…/#benimaclet` abren cada rocódromo. Cada bloque tiene su enlace (`…/#b-<id>`) y un botón **Compartir**, útil para historias de Instagram; si el bloque es del otro rocódromo, la web cambia sola.
- Se puede añadir a la pantalla de inicio del móvil como una app.

Las fotos se reducen en el propio móvil antes de subirlas (máximo 1600 px). Cada persona puede publicar como mucho 10 comentarios por hora.

Es HTML, CSS y JavaScript sin compilar. Los datos viven en Supabase y la web se sirve con GitHub Pages.

## Puesta en marcha

### 1. Supabase

1. Entra en tu proyecto → **SQL Editor** → **New query**, pega todo `supabase/schema.sql` y pulsa **Run**. Crea también el espacio de fotos (`fotos`) con sus permisos.
2. **Authentication → Sign In / Providers** → activa **Allow anonymous sign-ins** (así votan los visitantes sin registrarse).
3. **Authentication → Users → Add user → Create new user**: tu email y una contraseña, con **Auto Confirm User** marcado.
4. Vuelve al **SQL Editor** y ejecuta, con tu email:
   ```sql
   insert into public.setters (user_id)
     select id from auth.users where email = 'TU_EMAIL@ejemplo.com'
     on conflict do nothing;
   ```
5. **Project Settings → API** (o el botón **Connect**): copia la **Project URL** y la clave **anon** / **publishable** a `config.js`.
   La clave anon es pública por diseño; la seguridad la ponen las reglas del esquema. No uses nunca la `service_role` / `secret`.

### 2. GitHub Pages

En el repositorio: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, rama `main`, carpeta `/ (root)`, **Save**.
En un par de minutos la web queda en `https://xlp-trainning.github.io/Xlp.Boulder/`. Ese es el enlace para la bio de Instagram.

Si el repositorio o el dominio son otros, cambia la dirección de `og:image` en `index.html`: es la imagen (`og.png`) que sale al compartir el enlace en Instagram o WhatsApp.

## Añadir otro equipador

Crea su usuario en **Authentication → Users** y repite el paso 4 con su email.

## Archivos

| archivo | qué es |
| --- | --- |
| `index.html` | estructura de la página |
| `IDEAS.md` | ideas aprobadas para más adelante y propuestas sin decidir |
| `styles.css` | diseño (claro y oscuro según el móvil) |
| `app.js` | lógica: carga, filtros, votos, formulario del equipador |
| `progreso.js` | Mi progreso: puntos, rachas, medallas y siguiente reto |
| `ranking.js` | ranking mensual por ligas de color |
| `historias.js` | tarjeta para historias de Instagram de un bloque |
| `estadisticas.js` | estadísticas del equipador: todos o solo los suyos, por rocódromo, sala y sector |
| `buzon.js` | buzón de sugerencias: formulario y pestaña del equipador |
| `sesion.js` | modo sesión: apuntar rápido en la sala y resumen de la sesión |
| `instalar.js` | invitación e instrucciones para instalar la app, y código para pasar el progreso |
| `sw.js` | service worker: instalar la web y abrirla sin conexión (primero la red; si no hay, la copia guardada) |
| `grupos.js` | grupos de amigos: ranking, actividad, reacciones, duelos, retos, sesiones en grupo y avisos |
| `nivel.js` | grado real de cada bloque, nivel real, perfil por estilos y plan de la semana |
| `i18n.js` | traducción al inglés y botón de idioma |
| `offline.js` | copia local de los datos y cola de lo apuntado sin conexión |
| `wrapped.js` | «Tu mes»: el resumen del mes tipo Wrapped |
| `editor.js` | editor de la foto del bloque: resaltar presas por color, salida y top |
| `config.js` | dirección y clave pública de Supabase |
| `supabase/schema.sql` | tablas y reglas de acceso |
| `manifest.webmanifest`, `icon*` | instalación en la pantalla de inicio, con el logo de Xlp.Boulder |
| `og.png` | imagen de vista previa al compartir el enlace |
| `mapas/` | planos de Natural Patraix y Natural Benimaclet (PNG, SVG y el script que los genera) y `sectores.py`, que calcula las zonas de los sectores |
| `supabase/002-sectores.sql` | crea los sectores de los dos planos con sus zonas (ejecutar una vez) |
| `supabase/003-progreso.sql` | añade flash y fecha de encadenado a los votos (ejecutar una vez) |
| `supabase/004-ranking.sql` | ranking por ligas: apodos y cálculo del ranking (ejecutar una vez) |
| `supabase/005-sello.sql` | añade el sello Xlp a los bloques (ejecutar una vez) |
| `supabase/007-buzon.sql` | buzón de sugerencias (ejecutar una vez) |
| `supabase/008-grupos.sql` | grupos de amigos (ejecutar una vez, después de 004, 006 y 007) |
| `supabase/009-altura.sql` | altura en las betas y voto «morfo» (ejecutar una vez, después de 006) |
| `supabase/006-sensaciones.sql` | sensación de dificultad, intentos y «primero en encadenarlo» (ejecutar una vez, después de 004) |

## Añadir otro rocódromo

En **SQL Editor**, cambia los datos y ejecuta:
```sql
insert into public.gyms (id, name, sort, map_path) values ('ruzafa', 'Natural Ruzafa', 3, '');
```
El `id` es el que va en el enlace (`…/#ruzafa`). El plano se sube luego desde la app.
