# Xlp.Boulder

**Xlp.Boulder** es la web pública con los bloques de **Natural Patraix** y **Natural Benimaclet**, con un selector arriba para cambiar de rocódromo. Los bloques van por nivel (Azul → Verde → Naranja → Amarillo → Morado → Rojo → Negro → Compe) y estilo.

- **Cualquiera** la abre sin registrarse y puede:
  - ver los bloques con su foto y la beta;
  - puntuarlos, marcarlos como encadenados o como proyecto, y guardar favoritos (los votos se guardan por dispositivo);
  - contar su propia beta con un apodo, con enlace a vídeo opcional.
- **Novedades**: los bloques montados en los últimos 7 días llevan la marca «Nuevo» y tienen su pestaña.
- **Mapa**: el plano de cada rocódromo (vienen ya puestos los de `mapas/`; se pueden cambiar desde la app) con un marcador por sector y el número de bloques abiertos. Al tocar un sector se filtra la lista.
- **Mi progreso**: encadenados por nivel ("Rojo 4/9"), el nivel más alto conseguido y los proyectos en curso.
- **El equipador** entra con email y contraseña ("Acceso equipador", al pie de la página) y puede:
  - crear, editar, desmontar o borrar bloques, con foto;
  - **resaltar presas** en la foto: eliges el color y la web deja en color solo las presas del bloque, oscurece el resto y te deja marcar la **salida** y el **top** tocando las presas (también añadir las que falten o quitar las que sobren);
  - gestionar el plano y los sectores;
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
| `editor.js` | editor de la foto del bloque: resaltar presas por color, salida y top |
| `config.js` | dirección y clave pública de Supabase |
| `supabase/schema.sql` | tablas y reglas de acceso |
| `manifest.webmanifest`, `icon*` | instalación en la pantalla de inicio, con el logo de Xlp.Boulder |
| `og.png` | imagen de vista previa al compartir el enlace |
| `mapas/` | planos de Natural Patraix y Natural Benimaclet (PNG, SVG y el script que los genera) |

## Añadir otro rocódromo

En **SQL Editor**, cambia los datos y ejecuta:
```sql
insert into public.gyms (id, name, sort, map_path) values ('ruzafa', 'Natural Ruzafa', 3, '');
```
El `id` es el que va en el enlace (`…/#ruzafa`). El plano se sube luego desde la app.
