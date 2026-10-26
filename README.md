# Xlp.Boulder

**Xlp.Boulder** es la web pública con los bloques de **Natural Patraix** y **Natural Benimaclet**, con un selector arriba para cambiar de rocódromo. Los bloques van por nivel (Azul → Verde → Naranja → Amarillo → Morado → Rojo → Negro → Compe) y estilo.

- **Cualquiera** la abre sin registrarse y puede:
  - ver los bloques con su foto y la beta;
  - puntuarlos, marcarlos como encadenados o como proyecto, y guardar favoritos (los votos se guardan por dispositivo);
  - contar su propia beta con un apodo, con enlace a vídeo opcional.
- **Novedades**: los bloques montados en los últimos 7 días llevan la marca «Nuevo» y tienen su pestaña.
- **Mapa**: el plano de cada rocódromo dividido en **sectores que se pueden tocar** (uno por muro, con su nombre y el número de bloques abiertos). Al tocar un sector se resalta y salen debajo sus bloques, de fácil a difícil; «Ver en la lista» lo lleva a la lista filtrada. El equipador puede redibujar la zona de cada sector con el dedo.
- **Mi progreso**, pensado para que la gente vuelva:
  - **Flash o encadenado**: en cada bloque se marca «Encadenado» o «⚡ Flash» (a la primera), con la fecha.
  - **Puntos por color** (azul 1 … compe 8; el flash suma la mitad más), en total y del mes.
  - **Rachas**: semanas seguidas encadenando algo, con aviso si la racha está a punto de perderse.
  - **Medallas** (primer bloque de cada color, flashes, 10/50 encadenados, 100 puntos, recién montado, sector completo, 6 estilos, rachas de 4 y 12 semanas), con barra de avance.
  - **Tu siguiente reto**: tres bloques abiertos recomendados según tu nivel, los estilos que menos tocas, tus proyectos y los recién montados.
  - **Tarjetas para historias de Instagram** (1080×1920): una por bloque encadenado y otra con el resumen del mes, para compartir o guardar.
  - Encadenados por nivel ("Rojo 4/9") y proyectos en curso.
- **Ranking** mensual por **ligas de color**, en cada rocódromo:
  - Todos empiezan en la liga Azul. Para subir a la liga de un color hay que encadenar **10 bloques de ese color**; nunca se baja.
  - Dentro de cada liga gana quien más puntos sume en el mes. Se reinicia el día 1 y se puede ver el mes pasado.
  - Es voluntario: cada uno se apunta con un apodo (sin email). El equipador puede quitar a alguien del ranking.
  - La fecha de cada encadenado la pone el servidor, así que no se puede trampear con fechas, y no cuentan los bloques marcados después de desmontarse.
- **El equipador** entra con email y contraseña ("Acceso equipador", al pie de la página) y puede:
  - crear, editar, desmontar o borrar bloques, con foto;
  - **resaltar presas** en la foto, en tres pasos: 1) marcas la zona a analizar rodeando el muro con el dedo (o arrastrando en diagonal para un rectángulo, o «Analizar toda la foto»); 2) eliges el color de las presas y la web deja en color solo esas, oscureciendo el resto; 3) tocas las presas para marcar la **salida** y el **top**, añadir las que falten o quitar las que sobren. Los **volúmenes estructurales** (madera, negro o gris, del color del muro) se marcan rodeándolos con «◇ Volumen» y funcionan como una presa más;
  - gestionar el plano y los sectores (renombrarlos, añadirlos y dibujar su zona en el plano);
  - borrar comentarios;
  - ver **Estadísticas**: bloques por nivel y estilo, los que más y menos gustan, los poco encadenados, los más proyectados y los más comentados.
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
| `styles.css` | diseño (claro y oscuro según el móvil) |
| `app.js` | lógica: carga, filtros, votos, formulario del equipador |
| `progreso.js` | Mi progreso: puntos, rachas, medallas y siguiente reto |
| `ranking.js` | ranking mensual por ligas de color |
| `historias.js` | tarjetas para historias de Instagram |
| `editor.js` | editor de la foto del bloque: resaltar presas por color, salida y top |
| `config.js` | dirección y clave pública de Supabase |
| `supabase/schema.sql` | tablas y reglas de acceso |
| `manifest.webmanifest`, `icon*` | instalación en la pantalla de inicio, con el logo de Xlp.Boulder |
| `og.png` | imagen de vista previa al compartir el enlace |
| `mapas/` | planos de Natural Patraix y Natural Benimaclet (PNG, SVG y el script que los genera) y `sectores.py`, que calcula las zonas de los sectores |
| `supabase/002-sectores.sql` | crea los sectores de los dos planos con sus zonas (ejecutar una vez) |
| `supabase/003-progreso.sql` | añade flash y fecha de encadenado a los votos (ejecutar una vez) |
| `supabase/004-ranking.sql` | ranking por ligas: apodos y cálculo del ranking (ejecutar una vez) |

## Añadir otro rocódromo

En **SQL Editor**, cambia los datos y ejecuta:
```sql
insert into public.gyms (id, name, sort, map_path) values ('ruzafa', 'Natural Ruzafa', 3, '');
```
El `id` es el que va en el enlace (`…/#ruzafa`). El plano se sube luego desde la app.
