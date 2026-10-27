// Inglés / español. La web está escrita en español; en inglés, cada texto se traduce al mostrarse
// (página, avisos, ventanas de confirmación y tarjetas para historias), sin tocar el resto del código.
// Los números se respetan: «3 bloques abiertos» → «3 open problems». Las fechas pasan a formato inglés.

const LANG = (() => { try { const v = JSON.parse(localStorage.getItem("lb-lang")); if (v === "es" || v === "en") return v; } catch (e) {}
  return /^(es|ca|gl|eu)/i.test(navigator.language || "es") ? "es" : "en"; })();
document.documentElement.lang = LANG;

// Textos fijos (sin números)
const I18N = {
  // Niveles, colores de presa, estilos, meses y días
  "Azul": "Blue", "Verde": "Green", "Naranja": "Orange", "Amarillo": "Yellow", "Morado": "Purple", "Rojo": "Red", "Negro": "Black", "Compe": "Comp",
  "azul": "blue", "verde": "green", "naranja": "orange", "amarillo": "yellow", "morado": "purple", "rojo": "red", "negro": "black", "compe": "comp",
  "Rosa": "Pink", "Turquesa": "Turquoise", "Blanco": "White", "Gris": "Grey", "Marrón": "Brown",
  "AZUL": "BLUE", "VERDE": "GREEN", "NAR": "ORA", "AMA": "YEL", "MOR": "PUR", "ROJO": "RED", "NEG": "BLK", "COMP": "COMP",
  "Nar": "Ora", "Ama": "Yel", "Mor": "Pur", "Neg": "Blk", "Comp": "Comp",
  "Az": "Bl", "Ve": "Gr", "Na": "Or", "Am": "Ye", "Mo": "Pu", "Ro": "Rd", "Ne": "Bk", "Co": "Co", "Rs": "Pk", "Tu": "Tq", "Bl": "Wh", "Gr": "Gy", "Ma": "Br",
  "Placa": "Slab", "Vertical": "Vertical", "Desplome": "Overhang", "Techo": "Roof", "Diedro": "Corner", "Arista": "Arête", "Regletas": "Crimps", "Romos": "Slopers",
  "Pinzas": "Pinches", "Bidedos": "Pockets", "Dinámico": "Dynamic", "Coordinación": "Coordination", "Compresión": "Compression", "Talonajes": "Heel hooks", "Equilibrio": "Balance",
  "Técnica": "Technique", "placa": "slab", "desplome": "overhang", "techo": "roof", "regletas": "crimps", "romos": "slopers", "pinzas": "pinches", "dinámico": "dynamic", "técnica": "technique",
  "Los lunes": "Mondays", "Los martes": "Tuesdays", "Los miércoles": "Wednesdays", "Los jueves": "Thursdays", "Los viernes": "Fridays", "Los sábados": "Saturdays", "Los domingos": "Sundays",

  // Cabecera, navegación y pie
  "Todos los problemas abiertos en la sala, por nivel y estilo. Puntúalos, guarda tus favoritos y mira la beta.": "Every open problem in the gym, by grade and style. Rate them, save your favourites and check the beta.",
  "Rocódromo": "Gym", "Bloques": "Problems", "Mapa": "Map", "Ranking": "Ranking", "Grupos": "Groups", "Mi progreso": "My progress", "Estadísticas": "Stats", "Buzón": "Inbox",
  "Secciones": "Sections", "🧗 Empezar sesión": "🧗 Start session", "🧗 Volver a la sesión": "🧗 Back to session", "+ Nuevo bloque": "+ New problem", "Modo equipador": "Setter mode",
  "👁 Daltónico": "👁 Colour-blind", "Modo daltónico": "Colour-blind mode", "Modo daltónico activado: los colores llevan su nombre": "Colour-blind mode on: colours show their name", "Modo daltónico desactivado": "Colour-blind mode off",
  "Xlp.Boulder · bloques equipados en Natural Patraix y Natural Benimaclet": "Xlp.Boulder · problems set at Natural Patraix and Natural Benimaclet",
  "💬 Buzón de sugerencias": "💬 Suggestion box", "📲 Instalar la app · pasar mi progreso": "📲 Install the app · move my progress", "Acceso equipador": "Setter login", "Cerrar sesión de equipador": "Log out (setter)",
  "📲 Instala Xlp.Boulder en tu móvil: icono en la pantalla de inicio y a pantalla completa.": "📲 Install Xlp.Boulder on your phone: home-screen icon and full screen.", "Cómo instalarla": "How to install", "Ahora no": "Not now",

  // Lista de bloques
  "Bloques por nivel": "Problems by grade", "bloques abiertos": "open problems", "bloque abierto": "open problem", "bloques desmontados": "stripped problems",
  "De fácil a difícil · toca un nivel para filtrar": "Easy to hard · tap a grade to filter", "Vista": "View", "Abiertos": "Open", "Novedades": "New", "♥ Favoritos": "♥ Favourites", "Proyectos": "Projects", "Desmontados": "Stripped",
  "Buscar por nombre, sector o beta…": "Search by name, sector or beta…", "Buscar": "Search", "Ordenar": "Sort", "Más recientes": "Newest", "Más fáciles primero": "Easiest first", "Más difíciles primero": "Hardest first", "Mejor puntuados": "Top rated",
  "Filtros": "Filters", "Estilo": "Style", "Presa": "Hold", "Sector": "Sector", "Quitar filtros": "Clear filters", "Equipados por Xlp": "Set by Xlp", "Equipado por Xlp": "Set by Xlp",
  "Nuevo": "New", "En favoritos": "In favourites", "Sin puntuar": "Not rated", "Sin puntuar todavía": "Not rated yet", "· Encadenado": "· Sent", "· ⚡ Flash": "· ⚡ Flash", "· Proyecto": "· Project",
  "Cargando…": "Loading…", "Trayendo los bloques de la sala.": "Fetching the gym's problems.", "Sin conexión": "Offline", "Reintentar": "Retry",
  "No se pudieron cargar los bloques. Comprueba la conexión y vuelve a intentarlo.": "Couldn't load the problems. Check your connection and try again.",
  "Falta configurar": "Not configured", "Rellena config.js con la dirección y la clave pública de tu proyecto de Supabase.": "Fill in config.js with your Supabase project URL and public key.",
  "La libreta está vacía": "No problems yet", "El equipador todavía no ha apuntado ningún bloque. Vuelve pronto.": "The setter hasn't added any problems yet. Check back soon.",
  "Aún no hay bloques": "No problems yet", "Añade el primer bloque que hayas equipado: nivel, sector, estilo y la beta.": "Add the first problem you've set: grade, sector, style and beta.",
  "Nada con estos filtros": "Nothing matches these filters", "Prueba a quitar algún nivel, sector, estilo o color.": "Try removing a grade, sector, style or colour.",
  "Nada nuevo esta semana": "Nothing new this week", "Sin favoritos": "No favourites", "Abre un bloque y toca ♡ Guardar para tenerlo aquí.": "Open a problem and tap ♡ Save to keep it here.",
  "Sin proyectos": "No projects", "Abre un bloque que estés probando y toca «Es mi proyecto». Cuando lo encadenes, sale de aquí.": "Open a problem you're working on and tap “My project”. Once you send it, it leaves this list.",

  // Ficha del bloque
  "Bloque abierto": "Open problem", "Bloque nuevo": "New problem", "Bloque desmontado": "Stripped problem", "Cerrar": "Close", "Ver la foto en grande": "View full-size photo",
  "Beta del equipador": "Setter's beta", "El equipador no ha escrito la beta de este bloque.": "The setter hasn't written beta for this problem.", "▶ Ver vídeo de la beta": "▶ Watch the beta video",
  "Tu puntuación": "Your rating", "¿Lo has encadenado?": "Have you sent it?", "Encadenado": "Sent", "✓ Encadenado": "✓ Sent", "⚡ Flash": "⚡ Flash",
  "Es mi proyecto": "My project", "◎ Es mi proyecto": "◎ My project", "♡ Guardar": "♡ Save", "♥ En favoritos": "♥ Saved", "Compartir": "Share", "📸 Historia": "📸 Story",
  "Sin registro: tus votos, proyectos y favoritos se guardan en este móvil.": "No sign-up: your votes, projects and favourites are saved on this phone.",
  "Intentos": "Attempts", "Un intento menos": "One attempt less", "Un intento más": "One more attempt", "a la primera": "first go", "¿cuántos te costó?": "how many did it take?", "apunta cada pegue": "log every go",
  "Blando": "Soft", "Justo": "Fair", "Duro": "Hard", "Sensación de dificultad": "How hard it feels", "Pruébalo (o apunta un intento) para votar si es blando, justo o duro.": "Try it (or log an attempt) to vote whether it's soft, fair or hard.",
  "¿Depende de la altura?": "Does height matter?", "Mejor si eres bajo": "Better if you're short", "Da igual": "Doesn't matter", "Mejor si eres alto": "Better if you're tall",
  "va mejor si eres alto": "suits tall climbers", "va mejor si eres bajo": "suits short climbers", "da igual la altura": "height doesn't matter",
  "más fácil": "easier", "más duro": "harder", "De los más fáciles": "Among the easiest", "Algo fácil": "A bit soft", "En la media": "Average", "Algo duro": "A bit hard", "De los más duros": "Among the hardest",
  "Aún no hay datos suficientes. Sale cuando 3 personas lo han probado o votado su sensación.": "Not enough data yet. It shows once 3 people have tried it or voted.",
  "Tus amigos": "Your friends", "Nadie de tus grupos lo ha probado todavía. ¡Estrénalo!": "Nobody in your groups has tried it yet. Be the first!", "✓ Encadenado:": "✓ Sent:", "◎ Probando:": "◎ Trying:", "Pídeles la beta 😉": "Ask them for the beta 😉",
  "Betas de la gente": "Community beta", "Nadie ha contado su beta todavía. ¡Sé el primero!": "No one has shared their beta yet. Be the first!", "Nadie de tu altura ha contado su beta todavía.": "No one your height has shared their beta yet.",
  "Cuenta tu beta": "Share your beta", "Cómo lo hiciste tú: pies, secuencia, el truco del paso clave…": "How you did it: feet, sequence, the trick for the crux…", "Tu apodo": "Your nickname", "Enlace a tu vídeo (opcional)": "Link to your video (optional)",
  "Tu altura en cm (opcional)": "Your height in cm (optional)", "Tu altura en centímetros": "Your height in centimetres", "Con tu altura, la gente de tu talla encontrará tu beta. Se guarda en este móvil.": "With your height, people your size will find your beta. Saved on this phone.",
  "Publicar": "Post", "Beta publicada": "Beta posted", "Borrar": "Delete", "¿Borrar? Sí": "Delete? Yes", "▶ Ver su vídeo": "▶ Watch their video",
  "Pon un apodo para firmar tu beta.": "Add a nickname to sign your beta.", "Escribe tu beta o comentario.": "Write your beta or comment.", "Has publicado muchos comentarios seguidos. Espera un rato.": "You've posted a lot in a row. Wait a bit.", "No se pudo publicar. Inténtalo de nuevo.": "Couldn't post. Try again.",
  "Enlace copiado": "Link copied", "Para tus historias": "For your stories", "Guardar imagen": "Save image", "Imagen guardada": "Image saved",
  "En «Compartir» elige Instagram → Historias. Añade la pegatina de enlace con la web para que tus amigos vean el bloque.": "In “Share”, pick Instagram → Stories. Add the link sticker with the website so your friends can see the problem.",
  "Guarda la imagen y súbela a tus historias desde Instagram. Añade la pegatina de enlace con la web.": "Save the image and post it to your Instagram stories. Add the link sticker with the website.",
  "No se pudo compartir. Guarda la imagen y súbela desde Instagram.": "Couldn't share. Save the image and post it from Instagram.", "No se pudo compartir. Prueba a guardar la imagen.": "Couldn't share. Try saving the image.", "No se pudo crear la imagen": "Couldn't create the image",
  "No se pudo guardar": "Couldn't save", "Ahora mismo no se puede guardar": "Can't save right now", "📴 Sin conexión: guardado en el móvil, se subirá solo": "📴 Offline: saved on your phone, it'll upload by itself",
  "🥇 ¡Eres el primero en encadenarlo!": "🥇 You're the first to send it!", "🥇 Primero en encadenarlo:": "🥇 First to send it:",

  // Mapa
  "Plano de la sala": "Gym map", "Toca un sector del plano para ver sus bloques. El número es cuántos hay abiertos; en verde, los sectores con novedades. En el móvil, desliza el plano de lado.": "Tap a sector on the map to see its problems. The number is how many are open; green sectors have new ones. On your phone, swipe the map sideways.",
  "Ver en la lista": "View in list", "Cerrar sector": "Close sector", "Ahora mismo no hay bloques abiertos en este sector.": "There are no open problems in this sector right now.", "Sin sectores todavía": "No sectors yet",
  "Cuando el equipador apunte los sectores de la sala, aparecerán aquí.": "When the setter adds the gym's sectors, they'll show up here.", "Sectores": "Sectors",

  // Mi progreso
  "puntos": "points", "encadenados": "sends", "nivel más alto": "highest grade", "semanas seguidas": "weeks in a row", "semana seguida": "week in a row", "Tu siguiente reto": "Your next challenge",
  "Es tu proyecto": "It's your project", "Recién montado": "Freshly set", "De tu nivel": "At your level", "Para sumar puntos": "To earn points",
  "¡Lo tienes todo encadenado! Vuelve cuando haya bloques nuevos.": "You've sent everything! Come back when there are new problems.", "Cuando haya bloques abiertos, aquí te propondremos tres para ti.": "When there are open problems, we'll suggest three for you here.",
  "Conseguida": "Earned", "Primer flash": "First flash", "Haz un bloque a la primera": "Send a problem first go", "10 flashes": "10 flashes", "Diez bloques a la primera": "Ten problems first go",
  "10 encadenados": "10 sends", "Encadena diez bloques": "Send ten problems", "50 encadenados": "50 sends", "Encadena cincuenta bloques": "Send fifty problems", "100 puntos": "100 points", "Suma cien puntos": "Earn a hundred points",
  "Encadena un bloque en su primera semana": "Send a problem in its first week", "Sector completo": "Full sector", "Encadena todos los bloques abiertos de un sector (mínimo 3)": "Send every open problem in a sector (at least 3)",
  "Todoterreno": "All-rounder", "Encadena bloques de 6 estilos distintos": "Send problems in 6 different styles", "Racha de 4 semanas": "4-week streak", "Encadena algo 4 semanas seguidas": "Send something 4 weeks in a row",
  "Racha de 12 semanas": "12-week streak", "Encadena algo 12 semanas seguidas": "Send something 12 weeks in a row", "Proyectos en curso": "Current projects",
  "Marca «Es mi proyecto» en los bloques que estés probando para tenerlos a mano aquí.": "Mark “My project” on problems you're working on to keep them handy here.",
  "Puntos por color: azul 1, verde 2, naranja 3, amarillo 4, morado 5, rojo 6, negro 7 y compe 8; el flash suma la mitad más. Tu progreso se guarda en este móvil, sin cuenta.": "Points per colour: blue 1, green 2, orange 3, yellow 4, purple 5, red 6, black 7 and comp 8; a flash adds half again. Your progress is saved on this phone, no account needed.",
  "Tu mes": "Your month", "Tus bloques, tu evolución semana a semana, colores, estilo, datos curiosos y tu puesto en el ranking. Cada pantalla se puede compartir en historias.": "Your problems, your week-by-week progress, colours, style, fun facts and your ranking position. Every screen can be shared to stories.",
  "Tu nivel real": "Your real level", "Encadena 3 bloques (en los últimos 90 días) para tener tu nivel real, tu perfil de escalador y tu plan semanal.": "Send 3 problems (in the last 90 days) to get your real level, climber profile and weekly plan.",
  "Tu perfil de escalador": "Your climber profile", "💪 Punto fuerte:": "💪 Strength:", "🎯 A mejorar:": "🎯 To improve:", "📸 Compartir mi perfil": "📸 Share my profile", "Mi perfil de escalador": "My climber profile",
  "MI PERFIL DE ESCALADOR": "MY CLIMBER PROFILE", "nivel real": "real level", "Preparando tu resumen…": "Preparing your recap…", "Todavía no hay encadenados ese mes": "No sends that month yet",
  "Tu resumen del mes": "Your monthly recap", "Anterior": "Previous", "Siguiente": "Next", "📸 Compartir": "📸 Share", "📸 Compartir resumen": "📸 Share recap",

  // «Tu mes» (tarjetas)
  "TU RESUMEN DE": "YOUR RECAP OF", "TU MES HASTA AHORA": "YOUR MONTH SO FAR", "BLOQUE": "PROBLEM", "BLOQUES": "PROBLEMS", "¡Un gran comienzo!": "A great start!",
  "TU EVOLUCIÓN": "YOUR PROGRESS", "SEMANA A SEMANA": "WEEK BY WEEK", "Aún no hay semanas con bloques.": "No weeks with sends yet.", "TUS COLORES": "YOUR COLOURS", "TU BLOQUE MÁS DIFÍCIL": "YOUR HARDEST PROBLEM",
  "⚡ FLASH": "⚡ FLASH", "✓ ENCADENADO": "✓ SENT", "DE": "A", "DATOS CURIOSOS": "FUN FACTS", "TU SECTOR": "YOUR SECTOR", "TU DÍA": "YOUR DAY", "EL MEJOR VALORADO QUE ENCADENASTE": "TOP-RATED PROBLEM YOU SENT",
  "CONSTANCIA": "CONSISTENCY", "¡Todas!": "All of them!", "con algún encadenado": "with a send", "AHORA MISMO VAS": "RIGHT NOW YOU'RE", "MI MES HASTA AHORA": "MY MONTH SO FAR", "MI RESUMEN DE": "MY RECAP OF",
  "COLOR MÁS DIFÍCIL": "HARDEST COLOUR", "ESTILO DEL MES": "STYLE OF THE MONTH", "semana activa": "active week", "semanas activas": "active weeks", "al flash": "flashed", "bloque": "problem", "bloques": "problems",
  "MÁS PUNTOS": "MOST POINTS", "MÁS CONSTANTE": "MOST CONSISTENT", "MÁS FLASHES": "MOST FLASHES", "MÁS INSISTENTE": "MOST PERSISTENT", "ESTE MES EN TU GRUPO": "THIS MONTH IN YOUR GROUP",
  "Más puntos": "Most points", "Más constante": "Most consistent", "Más flashes": "Most flashes", "Más insistente": "Most persistent",

  // Ranking
  "Tu liga": "Your league", "Estás en la liga más alta. ¡A por el primer puesto!": "You're in the top league. Go for first place!", "Apúntate al ranking": "Join the ranking", "Cambiar apodo": "Change nickname",
  "Apuntarme": "Join", "Guardar": "Save", "Cancelar": "Cancel", "Apodo para el ranking": "Nickname for the ranking", "Solo se verá tu apodo, tu liga y tus puntos del mes. Sin email ni contraseña.": "Only your nickname, league and monthly points will show. No email or password.",
  "Participas como": "You're in as", "Salir del ranking": "Leave the ranking", "Mes": "Month", "Termina hoy": "Ends today", "Liga": "League", "Cargando ranking…": "Loading ranking…",
  "No se pudo cargar el ranking. Inténtalo de nuevo en un rato.": "Couldn't load the ranking. Try again in a while.", "Quitar": "Remove", "Más detalles": "More details",
  "Así funciona el ranking": "How the ranking works", "Ahora mismo estás en la liga": "Right now you're in the league", "¡Entendido!": "Got it!",
  "No hace falta ir color a color: si tus primeros 10 de un color son negros, entras directo en la liga Negro. Y nunca se baja de liga.": "No need to go colour by colour: if your first 10 of one colour are blacks, you go straight into the Black league. And you never drop a league.",
  "Dentro de tu liga compites por los puntos del mes (azul 1, verde 2… compe 8; el flash suma la mitad más). El día 1 todo vuelve a cero.": "Within your league you compete for the month's points (blue 1, green 2… comp 8; a flash adds half again). Everything resets on the 1st.",
  "Tu liga es la del": "Your league is the one of the", "en este rocódromo. Si ya tienes 10 de varios colores, cuenta el más difícil.": "in this gym. If you already have 10 in several colours, the hardest one counts.",
  "El apodo tiene que tener entre 2 y 20 letras": "Your nickname must be 2–20 characters", "Ese apodo ya lo usa otra persona": "That nickname is already taken", "Apodo cambiado": "Nickname changed", "¡Ya estás en el ranking!": "You're in the ranking!",
  "Has salido del ranking": "You've left the ranking", "No se pudo salir": "Couldn't leave", "Quitado del ranking": "Removed from the ranking", "No se pudo quitar": "Couldn't remove",
  "¿Salir del ranking? Tus encadenados no se borran; solo dejas de aparecer. Tus grupos de amigos siguen igual.": "Leave the ranking? Your sends aren't deleted; you just stop appearing. Your friend groups stay the same.",

  // Grupos
  "Grupos de amigos": "Friend groups", "Crea un grupo con tu gente (o únete con un código) y tendréis vuestro ranking, lo que va encadenando cada uno, duelos, retos y sesiones juntos.": "Create a group with your crew (or join with a code) and you'll get your own ranking, everyone's sends, duels, challenges and sessions together.",
  "Apodo": "Nickname", "Empezar": "Start", "Guardar y unirme": "Save and join", "Solo tus amigos de grupo ven tu apodo y lo que encadenas. No sales en el ranking público salvo que te apuntes en «Ranking».": "Only your group friends see your nickname and sends. You won't appear in the public ranking unless you join it in “Ranking”.",
  "Ponte un apodo abajo para unirte.": "Add a nickname below to join.", "Unirme": "Join", "+ Crear grupo": "+ Create group", "Unirme con código": "Join with code", "Crear": "Create",
  "Nombre del grupo (p. ej. Los del martes)": "Group name (e.g. Tuesday crew)", "Nombre del grupo": "Group name", "Código de 6 letras": "6-character code", "Código del grupo": "Group code",
  "Aún no estás en ningún grupo. Crea uno e invita a tus amigos por WhatsApp, o únete con el código que te pasen.": "You're not in any group yet. Create one and invite your friends on WhatsApp, or join with a code someone gives you.",
  "➕ Invitar": "➕ Invite", "🧗 Sesión en grupo": "🧗 Group session", "🧗 Unirme a la sesión": "🧗 Join the session", "Sección del grupo": "Group section", "Actividad": "Activity", "Retos": "Challenges", "Gente": "People",
  "Periodo": "Period", "Semana": "Week", "Siempre": "All time", "Todos contra todos, sin ligas: cuentan los puntos de los dos rocódromos (azul 1 … compe 8; el flash suma la mitad más).": "Everyone against everyone, no leagues: points from both gyms count (blue 1 … comp 8; a flash adds half again).",
  "Proyectos compartidos": "Shared projects", "Lo último": "Latest", "Tú": "You", "encadenó": "sent", "hizo flash a": "flashed", "Todavía nadie del grupo ha encadenado nada en los últimos 60 días.": "Nobody in the group has sent anything in the last 60 days.",
  "🎯 Nuevo reto del grupo": "🎯 New group challenge", "⚔️ Retar a alguien": "⚔️ Challenge someone", "Retos del grupo": "Group challenges", "Duelos": "Duels", "Borrar reto": "Delete challenge",
  "Sin retos. Proponed uno: «Entre todos, 50 bloques este mes».": "No challenges. Set one: “Together, 50 problems this month”.", "Sin duelos. Reta a alguien a un bloque o a una semana de puntos.": "No duels. Challenge someone to a problem or a week of points.",
  "¿A quién retas?": "Who are you challenging?", "Rival": "Opponent", "Tipo de duelo": "Duel type", "Una semana: quien más puntos sume": "One week: most points wins", "Un bloque: quien lo encadene antes": "One problem: first to send it wins",
  "Elige el bloque": "Pick the problem", "⚔️ Retar": "⚔️ Challenge", "Entre todos,": "Together,", "Qué se cuenta": "What counts", "de cualquier color": "any colour", "de cualquier estilo": "any style", "en": "in",
  "Duración": "Duration", "1 semana": "1 week", "2 semanas": "2 weeks", "1 mes": "1 month", "🎯 Crear reto": "🎯 Create challenge", "Objetivo": "Target", "Color": "Colour",
  "⚔️ Semana de puntos": "⚔️ Points week", "⚔️ Duelo de bloque": "⚔️ Problem duel", "pendiente": "pending", "Aceptar": "Accept", "Rechazar": "Decline", "Retirar el reto": "Withdraw challenge",
  "¡Conseguido! 🎉": "Done! 🎉", "Terminado": "Finished", "terminó en empate": "ended in a draw", "creó el grupo": "created the group", "Sacar": "Remove", "Borrar el grupo": "Delete group", "Salir del grupo": "Leave group",
  "Elige a quién retas": "Pick who to challenge", "⚔️ Reto enviado": "⚔️ Challenge sent", "No se pudo crear el duelo": "Couldn't create the duel", "⚔️ ¡Duelo aceptado!": "⚔️ Duel accepted!", "Duelo rechazado": "Duel declined",
  "Pon un objetivo": "Set a target", "No se pudo crear el reto": "Couldn't create the challenge", "🎯 Reto creado": "🎯 Challenge created", "¿Borrar este reto?": "Delete this challenge?",
  "Ponle un nombre al grupo": "Give the group a name", "El código tiene 6 letras y números": "The code has 6 letters and numbers", "Primero ponte un apodo": "Add a nickname first", "Ese código no existe": "That code doesn't exist",
  "No se puede: has llegado al límite": "Can't: you've hit the limit", "No se pudo. Inténtalo de nuevo": "Couldn't do it. Try again", "No se pudo": "Couldn't do it", "Grupo borrado": "Group deleted", "Has salido del grupo": "You've left the group",
  "Invitación copiada: pégala en WhatsApp": "Invite copied: paste it in WhatsApp", "Copia la invitación:": "Copy the invite:", "No se pudo empezar la sesión": "Couldn't start the session", "No se pudo unir a la sesión": "Couldn't join the session",
  "Cargando la sesión del grupo…": "Loading the group session…", "📸 Compartir la sesión del grupo": "📸 Share the group session", "SESIÓN EN GRUPO": "GROUP SESSION", "No se pudo guardar el apodo": "Couldn't save the nickname",

  // Sesión
  "Sesión de escalada": "Climbing session", "Minimizar": "Minimise", "Terminar": "Finish", "encadenados ": "sends", "⚡ flash": "⚡ flash", "intentos": "attempts", "Todos los sectores": "All sectors", "Todos": "All",
  "No hay bloques abiertos con estos filtros.": "No open problems with these filters.", "+1 = un pegue sin encadenar · ✓ = encadenado en este pegue (vuelve a tocar para deshacer) · ⚡ = a la primera": "+1 = a go without sending · ✓ = sent on this go (tap again to undo) · ⚡ = first go",
  "Sesión terminada": "Session finished", "Resumen de la sesión": "Session recap", "escalando": "climbing", "¡Buena sesión!": "Good session!", "📸 Compartir sesión": "📸 Share session", "SESIÓN DE HOY": "TODAY'S SESSION", "Abrir": "Open",

  // Instalar y pasar el progreso
  "Instala la app": "Install the app", "Xlp.Boulder se instala desde el navegador, sin tienda de apps: tendrás el icono en tu pantalla de inicio y se abre a pantalla completa, como una app más.": "Xlp.Boulder installs from your browser, no app store: you get an icon on your home screen and it opens full screen, like any other app.",
  "📲 Instalar ahora": "📲 Install now", "Estás dentro de Instagram (u otra app): desde aquí no se puede instalar. Primero ábrela en el navegador, como dice el paso 1.": "You're inside Instagram (or another app): you can't install from here. First open it in your browser, as in step 1.",
  "Tipo de móvil": "Phone type", "iPhone / iPad": "iPhone / iPad", "Abre la web en": "Open the website in", ". Si estás dentro de Instagram, toca": ". If you're inside Instagram, tap", "arriba a la derecha y elige": "at the top right and choose",
  "«Abrir en el navegador externo»": "“Open in external browser”", "«Abrir en Chrome»": "“Open in Chrome”", "Toca el botón": "Tap the", "Compartir": "Share", "icono Compartir": "Share icon",
  ", abajo en el centro de la pantalla (en iPad, arriba a la derecha).": " button, at the bottom centre of the screen (top right on iPad).", "Desliza hacia abajo y toca": "Scroll down and tap", "«Añadir a pantalla de inicio»": "“Add to Home Screen”",
  ". Si no aparece, toca": ". If it's not there, tap", "«Editar acciones»": "“Edit Actions”", "al final de la lista y añádela.": "at the end of the list and add it.", "Toca": "Tap", "«Añadir»": "“Add”", "arriba a la derecha.": "at the top right.",
  "Abre Xlp.Boulder desde el icono nuevo de tu pantalla de inicio y pega tu código de progreso (abajo) para no perder lo que ya tienes.": "Open Xlp.Boulder from the new home-screen icon and paste your progress code (below) so you keep what you already have.",
  "Toca el menú": "Tap the menu", "«Instalar aplicación»": "“Install app”", "o": "or", "Confirma con": "Confirm with", "«Instalar»": "“Install”", ". En un momento aparece el icono en tu pantalla de inicio.": ". The icon appears on your home screen in a moment.",
  "Si venías de Instagram, pega tu código de progreso (abajo) en la app para no perder lo que ya tienes.": "If you came from Instagram, paste your progress code (below) in the app so you keep what you already have.",
  "Con Samsung Internet: menú ≡ abajo a la derecha → «Añadir página a» → «Pantalla de inicio».": "With Samsung Internet: menu ≡ at the bottom right → “Add page to” → “Home screen”.",
  "En Chrome para iPhone también se puede: botón Compartir de la barra de direcciones → «Añadir a pantalla de inicio».": "Chrome for iPhone works too: Share button in the address bar → “Add to Home Screen”.",
  "Pasar tu progreso": "Move your progress", "Lo que guardas (votos, encadenados, puntos, apodo del ranking) vive en este navegador. Para llevarlo a la app instalada o a otro móvil: copia tu código aquí y pégalo allí.": "What you save (votes, sends, points, ranking nickname) lives in this browser. To take it to the installed app or another phone: copy your code here and paste it there.",
  "📋 Copiar mi código": "📋 Copy my code", "Aquí aún no tienes nada guardado.": "You haven't saved anything here yet.", "Pega aquí tu código": "Paste your code here", "Código de progreso": "Progress code", "Recuperar": "Restore",
  "Cada código sirve una vez y caduca en una hora más o menos. No lo compartas: da acceso a tu progreso.": "Each code works once and expires in about an hour. Don't share it: it gives access to your progress.",
  "Código copiado. Pégalo en la app la primera vez que la abras": "Code copied. Paste it in the app the first time you open it", "Copia este código:": "Copy this code:", "¡Progreso recuperado!": "Progress restored!",
  "Ese código no vale o ya se usó. Copia uno nuevo.": "That code is invalid or already used. Copy a new one.", "Lo que tienes guardado aquí se sustituirá por el progreso del código. ¿Seguir?": "What's saved here will be replaced by the code's progress. Continue?",
  "¡Instalada! Ya tienes Xlp.Boulder en tu pantalla de inicio": "Installed! Xlp.Boulder is now on your home screen",

  // Buzón
  "Buzón de sugerencias": "Suggestion box", "¿Qué echas de menos en la sala o en la web? Escribe lo que quieras: ideas, peticiones de bloques, fallos…": "What's missing in the gym or the app? Write whatever you like: ideas, problem requests, bugs…",
  "Sobre qué": "About", "Tipo de mensaje": "Message type", "💡 Idea": "💡 Idea", "🧗 Bloques": "🧗 Problems", "🐞 Algo falla": "🐞 Something's broken", "💬 Otro": "💬 Other", "Tu mensaje": "Your message",
  "Una idea para la web, un bloque que te gustaría ver, algo que no funciona…": "An idea for the app, a problem you'd like to see, something that doesn't work…", "Tu nombre o apodo (opcional)": "Your name or nickname (optional)", "Opcional": "Optional",
  "Enviar": "Send", "Enviando…": "Sending…", "El buzón no tiene respuesta. Es anónimo salvo que pongas tu nombre.": "The suggestion box doesn't reply. It's anonymous unless you add your name.", "Escribe un poco más.": "Write a bit more.",
  "¡Gracias! Mensaje enviado": "Thanks! Message sent", "Has enviado muchos mensajes seguidos. Prueba dentro de un rato.": "You've sent a lot of messages in a row. Try again in a while.", "No se pudo enviar. Inténtalo de nuevo.": "Couldn't send. Try again.",
  "Mensajes": "Messages", "Bandeja": "Inbox", "Archivados": "Archived", "Archivar": "Archive", "Sacar del archivo": "Unarchive", "Archivado": "Archived", "Devuelto a la bandeja": "Back in the inbox", "Mensaje borrado": "Message deleted", "¿Borrar este mensaje?": "Delete this message?",
  "De:": "From:", "Nada por aquí.": "Nothing here.", "Todavía no ha llegado ningún mensaje. La gente escribe desde «💬 Buzón de sugerencias», al pie de la página.": "No messages yet. People write from “💬 Suggestion box” at the bottom of the page.",
  "Nadie sabe si has leído, archivado o borrado su mensaje: el buzón no tiene respuesta ni confirmación de lectura.": "Nobody knows whether you've read, archived or deleted their message: the box has no replies or read receipts.",

  // Equipador: formulario, editor, estadísticas
  "Nuevo bloque": "New problem", "Editar bloque": "Edit problem", "Nivel (de fácil a difícil)": "Grade (easy to hard)", "Nivel": "Grade", "Equipado por mí": "Set by me", "Lleva el sello Xlp en la web": "Shows the Xlp badge in the app",
  "Foto del bloque (opcional)": "Problem photo (optional)", "📷 Añadir foto": "📷 Add photo", "Cambiar foto": "Change photo", "✎ Resaltar presas": "✎ Highlight holds", "Quitar foto": "Remove photo", "Vista previa de la foto": "Photo preview",
  "Color de presa (opcional)": "Hold colour (optional)", "Color de presa": "Hold colour", "Sin especificar": "Not specified", "Nombre (opcional)": "Name (optional)", "p. ej. La Ballena": "e.g. The Whale", "Sector / muro": "Sector / wall", "p. ej. Desplome sur": "e.g. South overhang",
  "Fecha de montaje": "Date set", "Beta": "Beta", "Salida de pies en las regletas negras, mano izquierda al romo grande, talón derecho y lance al top…": "Start with feet on the black crimps, left hand to the big sloper, right heel hook and dyno to the top…",
  "Vídeo de la beta (opcional)": "Beta video (optional)", "Guardar cambios": "Save changes", "Añadir bloque": "Add problem", "Subiendo foto…": "Uploading photo…", "Guardando…": "Saving…",
  "Elige el nivel del bloque.": "Choose the problem's grade.", "No se pudo subir la foto. Prueba con otra imagen.": "Couldn't upload the photo. Try another image.", "Tu cuenta no tiene permiso de equipador.": "Your account doesn't have setter permissions.", "No se pudo guardar. Inténtalo de nuevo.": "Couldn't save. Try again.",
  "Bloque actualizado": "Problem updated", "Bloque añadido": "Problem added", "Editar": "Edit", "Marcar desmontado": "Mark as stripped", "Reabrir bloque": "Reopen problem", "Sí, borrar": "Yes, delete", "Bloque borrado": "Problem deleted",
  "Marcado como desmontado": "Marked as stripped", "Bloque reabierto": "Problem reopened", "No se pudo cambiar el estado": "Couldn't change the status", "No se pudo borrar": "Couldn't delete", "Equipador": "Setter",
  "Email": "Email", "Contraseña": "Password", "Entrar": "Log in", "Email o contraseña incorrectos.": "Wrong email or password.", "Esta cuenta no es de equipador": "This isn't a setter account", "Modo equipador activado": "Setter mode on", "Sesión cerrada": "Logged out",
  "Solo para el equipo que monta los bloques. Para puntuar y guardar favoritos no hace falta cuenta.": "Only for the setting team. You don't need an account to rate or save favourites.",
  "Todos los bloques": "All problems", "Solo los míos": "Only mine", "Qué bloques": "Which problems", "bloques abiertos ": "open problems", "puntuación media": "average rating", "desmontados (histórico)": "stripped (all time)", "comentarios": "comments",
  "Por zona": "By area", "Agrupar por": "Group by", "Salas": "Rooms", "Abiertos ": "Open", "Niveles": "Grades", "Media": "Average", "Encad.": "Sends", "Encad./bloque": "Sends/problem", "Desmont.": "Stripped", "Total": "Total", "Sin sector": "No sector",
  "Comparación entre rocódromos. Toca el otro para cambiar a él.": "Comparison between gyms. Tap the other one to switch to it.", "Toca un sector para ver sus bloques.": "Tap a sector to see its problems.", "No hay bloques todavía.": "No problems yet.",
  "Por nivel (abiertos)": "By grade (open)", "Bloques ": "Problems", "Graduación según la gente": "Grading according to climbers", "Le parece": "Feels", "Votos": "Votes",
  "Ningún bloque parece mal graduado (con 3 votos o más, la mitad dice blando o duro).": "No problem seems off-grade (with 3+ votes, half say soft or hard).", "Estilos (abiertos)": "Styles (open)", "Aún no hay bloques con estilo.": "No problems with a style yet.",
  "Los que más gustan": "Most liked", "Los que menos gustan (2 votos o más)": "Least liked (2+ votes)", "Poco encadenados (montados hace 14 días o más)": "Rarely sent (set 14+ days ago)", "Más proyectados": "Most projected", "Con más comentarios": "Most commented",
  "Todavía nadie ha puntuado.": "No ratings yet.", "Hace falta algún voto más.": "Needs a few more votes.", "Ningún bloque lleva 14 días montado.": "No problem has been up for 14 days.", "Nadie lo ha marcado como proyecto todavía.": "Nobody has marked one as a project yet.", "Sin comentarios todavía.": "No comments yet.",
  "Aún no hay bloques con el sello Xlp en este rocódromo. Márcalo al crear o editar un bloque («Equipado por mí»).": "No problems with the Xlp badge in this gym yet. Tick it when creating or editing a problem (“Set by me”).",
  "Equipador · plano y sectores": "Setter · map and sectors", "Subir imagen del plano": "Upload map image", "Cambiar imagen del plano": "Change map image", "Subiendo plano…": "Uploading map…", "Plano actualizado": "Map updated", "No se pudo subir el plano": "Couldn't upload the map",
  "Vale una foto de un plano dibujado a mano o una captura. Luego dibuja la zona de cada sector rodeándola con el dedo sobre el plano.": "A photo of a hand-drawn map or a screenshot works. Then draw each sector's area by circling it with your finger on the map.",
  "Añadir sector": "Add sector", "Nombre del sector, p. ej. Desplome sur": "Sector name, e.g. South overhang", "Ya hay un sector con ese nombre": "There's already a sector with that name", "No se pudo añadir": "Couldn't add", "Renombrar": "Rename", "Nuevo nombre": "New name", "No se pudo renombrar": "Couldn't rename",
  "Dibujar zona": "Draw area", "Redibujar zona": "Redraw area", "✏️ Cambiar zona": "✏️ Change area", "No se pudo guardar la zona": "Couldn't save the area",
  "Resaltar presas": "Highlight holds", "Analizar toda la foto": "Analyse the whole photo", "Toda la foto": "Whole photo", "Usar esta foto": "Use this photo", "Usar sin editar": "Use unedited", "◇ Volumen": "◇ Volume", "Buscando presas…": "Finding holds…",
  "Paso 1 · Rodea con el dedo la zona a analizar, o arrastra en diagonal para marcar un rectángulo.": "Step 1 · Circle the area to analyse with your finger, or drag diagonally to mark a rectangle.", "Paso 2 · Elige el color de las presas del bloque.": "Step 2 · Choose the problem's hold colour.",
  "Paso 3 · Toca una presa para cambiarla: salida → top → quitar → normal. Si falta alguna, toca encima para añadirla. Los volúmenes del color del muro se añaden con «◇ Volumen».": "Step 3 · Tap a hold to change it: start → top → remove → normal. If one's missing, tap on it to add it. Wall-coloured volumes are added with “◇ Volume”.",
  "Color de las presas": "Hold colour", "Elige primero el color de las presas": "Pick the hold colour first", "Primero marca la zona a analizar": "First mark the area to analyse", "Zona demasiado pequeña. Rodéala con el dedo o arrastra en diagonal.": "Area too small. Circle it with your finger or drag diagonally.",
  "Trazo demasiado pequeño. Rodéalo con el dedo o arrastra en diagonal.": "Stroke too small. Circle it with your finger or drag diagonally.", "Ese punto está fuera del muro marcado": "That point is outside the marked wall", "Ahí no encuentro una presa. Toca en el centro de la presa.": "No hold found there. Tap the centre of the hold.",
  "No he encontrado presas de ese color. Toca las presas para añadirlas a mano.": "I couldn't find holds of that colour. Tap the holds to add them by hand.", "Rodea el volumen con el dedo y suelta para cerrarlo.": "Circle the volume with your finger and let go to close it.",
  "Volumen añadido. Tócalo para marcarlo como salida o top.": "Volume added. Tap it to mark it as start or top.", "Ese volumen queda fuera de la zona o encima de otras presas.": "That volume is outside the area or on top of other holds.", "No se pudo abrir la foto": "Couldn't open the photo",
  "Foto del bloque. Toca una presa para cambiarla.": "Problem photo. Tap a hold to change it.", "SALIDA": "START", "TOP": "TOP",

  // Sin conexión
  "Sin nivel": "No grade", "Bloque": "Problem",

  // Hoy, bienvenida y ajustes
  "Hoy": "Today", "Buenos días": "Good morning", "Buenas tardes": "Good afternoon", "Buenas noches": "Good evening",
  "⚙️ Ajustes": "⚙️ Settings", "Ajustes": "Settings", "Ajustes: idioma, tema, letra y modo daltónico": "Settings: language, theme, text size and colour-blind mode",
  "Ver →": "View →", "Abrir →": "Open →", "Unirme →": "Join →", "Empezar →": "Start →", "🔥 Sin racha": "🔥 No streak", "🗺️ Mapa de la sala": "🗺️ Gym map", "Ver todas →": "See all →",
  "Nada nuevo esta semana. Cuando se monten bloques, saldrán aquí.": "Nothing new this week. New problems will show up here.", "Mi progreso →": "My progress →", "Tus proyectos": "Your projects",
  "En tus grupos": "In your groups", "Grupos →": "Groups →", "Sin novedades de tus amigos en los últimos días.": "No news from your friends in the last few days.",
  "Crea un grupo con tu gente: ranking propio, duelos, retos y sesiones juntos.": "Create a group with your crew: your own ranking, duels, challenges and sessions together.", "Crear o unirme a un grupo": "Create or join a group",
  "Bienvenida": "Welcome", "Bienvenido a Xlp.Boulder": "Welcome to Xlp.Boulder", "Todos los bloques de Natural Patraix y Natural Benimaclet: con su foto, la beta del equipador y el mapa de la sala. Sin registro.": "Every problem at Natural Patraix and Natural Benimaclet: with its photo, the setter's beta and the gym map. No sign-up.",
  "Apunta lo que escalas": "Log what you climb", "Abre un bloque y marca «Encadenado» o «⚡ Flash» (a la primera).": "Open a problem and tap “Sent” or “⚡ Flash” (first go).", "Mientras lo pruebas, suma intentos con «+».": "While you're working it, add attempts with “+”.",
  "En la sala, «🧗 Empezar sesión» lo hace en dos toques.": "At the gym, “🧗 Start session” does it in two taps.", "Vota si te parece blando, justo o duro y cuenta tu beta.": "Vote whether it feels soft, fair or hard, and share your beta.",
  "Y pica a tus amigos": "And challenge your friends", "Ranking del mes por ligas de color.": "Monthly ranking by colour leagues.", "Grupos con tus amigos: duelos, retos y sesiones juntos.": "Groups with your friends: duels, challenges and sessions together.",
  "Medallas, rachas, tu nivel real y tu resumen del mes.": "Badges, streaks, your real level and your monthly recap.", "📲 Instálala en tu móvil": "📲 Install it on your phone", "Saltar": "Skip", "¡Empezar!": "Let's go!",
  "Idioma": "Language", "Tema": "Theme", "Como el móvil": "Like my phone", "☀️ Claro": "☀️ Light", "🌙 Oscuro": "🌙 Dark", "Tamaño de letra": "Text size", "Normal": "Normal", "Grande": "Large", "No": "No", "Sí": "Yes",
  "Cada color de nivel y de presa lleva su abreviatura (Az, Ve, Na, Am…).": "Each grade and hold colour shows its abbreviation (Bl, Gr, Or, Ye…).", "La app": "The app", "📲 Instalar · pasar mi progreso": "📲 Install · move my progress", "Ver la bienvenida otra vez": "Show the welcome again",
};

// Textos con números: los números se escriben como {n} y se respetan en el mismo orden
const I18N_N = {
  "{n} bloques abiertos": "{n} open problems", "{n} bloque abierto": "{n} open problem", "{n} bloques": "{n} problems", "{n} bloque": "{n} problem", "Novedades · {n}": "New · {n}",
  "{n} de {n} · {n} votos": "{n} of {n} · {n} votes", "{n} de {n} · {n} voto": "{n} of {n} · {n} vote", "{n} de {n} entre todos": "{n} of {n} together", "tú: {n}": "you: {n}", "{n} personas lo han encadenado": "{n} people have sent it", "{n} persona lo ha encadenado": "{n} person has sent it",
  "⚡ {n} al flash": "⚡ {n} flashed", "{n} lo están probando": "{n} are trying it", "{n} lo está probando": "{n} is trying it", "de media en {n} intentos": "sent in {n} attempts on average",
  "Montado {n}/{n}/{n}": "Set {n}/{n}/{n}", "Desmontado {n}/{n}/{n}": "Stripped {n}/{n}/{n}", "{n} intentos": "{n} attempts", "{n} intento": "{n} attempt", "llevas {n}": "{n} so far", "{n} int.": "{n} att.",
  "Encadenado el {n}/{n}/{n}": "Sent on {n}/{n}/{n}", "Flash el {n}/{n}/{n}": "Flashed on {n}/{n}/{n}", "Encadenado el {n}/{n}/{n} al {n}.º intento": "Sent on {n}/{n}/{n} on attempt {n}",
  "+{n} puntos": "+{n} points", "+{n} puntos ⚡": "+{n} points ⚡", "{n} puntos": "{n} points", "{n} este mes": "{n} this month", "+{n} este mes": "+{n} this month", "−{n} este mes": "−{n} this month", "Mejor racha: {n}": "Best streak: {n}",
  "🔥 {n}": "🔥 {n}", "Medallas · {n} de {n}": "Badges · {n} of {n}", "Por nivel · {n} de {n} abiertos": "By grade · {n} of {n} open", "{n}/{n}": "{n}/{n}",
  "🔥 Encadena algo esta semana para no perder tu racha de {n} semanas.": "🔥 Send something this week to keep your {n}-week streak.", "🔥 Encadena algo esta semana para no perder tu racha de {n} semana.": "🔥 Send something this week to keep your {n}-week streak.",
"Este mes: {n} puntos · puesto {n} de {n}": "This month: {n} points · position {n} of {n}",
  "Quedan {n} días": "{n} days left", "quedan {n} días": "{n} days left", "{n} miembros · código {x}": "{n} members · code {x}", "{n} miembro · código {x}": "{n} member · code {x}",
  "hace {n} min": "{n} min ago", "hace {n} h": "{n} h ago", "hace {n} días": "{n} days ago", "ayer": "yesterday", "al {n}.º intento": "on attempt {n}", "✓ al {n}.º": "✓ attempt {n}", "al {n}.º": "attempt {n}", "(al {n}.º)": "(attempt {n})", "({n} int.)": "({n} att.)",
  "{n} de {n} entre todos · tú: {n}": "{n} of {n} together · you: {n}", "Entre {n}: {n} bloques": "Between {n}: {n} problems", "Entre {n}: {n} bloque": "Between {n}: {n} problem", "{n} ⚡": "{n} ⚡", "+{n} puntos ": "+{n} points",
  "máx. {x}": "max. {x}", "{n} · +{n}": "{n} · +{n}", "desde {n}/{n}/{n}": "since {n}/{n}/{n}", "{n} {x} – {n} {x}": "{n} {x} – {n} {x}",
  "{n} de {n} bloques abiertos son tuyos ({n} %).": "{n} of {n} open problems are yours ({n} %).", "Tus bloques: {n} ★ · los demás: {n} ★": "Your problems: {n} ★ · others: {n} ★",
  "{n} ★ · {n}": "{n} ★ · {n}", "{n} encad.": "{n} sends", "{n} probando": "{n} trying", "{n} coment.": "{n} comments", "Duro {n} %": "Hard {n} %", "Blando {n} %": "Soft {n} %", "montados en {n} días": "set in the last {n} days",
  "{n} % blando · {n} % justo · {n} % duro ({n} votos)": "{n} % soft · {n} % fair · {n} % hard ({n} votes)", "{n} % blando · {n} % justo · {n} % duro ({n} voto)": "{n} % soft · {n} % fair · {n} % hard ({n} vote)",
  "📏 {n} m": "📏 {n} m", "Solo betas de gente de tu altura ({n} cm ± {n})": "Only beta from people your height ({n} cm ± {n})",
  "{n} min": "{n} min", "{n} h {n} min": "{n} h {n} min", "Sesión · {n} min · {n} ✓ · +{n}": "Session · {n} min · {n} ✓ · +{n}", "Sesión · {n} h {n} min · {n} ✓ · +{n}": "Session · {n} h {n} min · {n} ✓ · +{n}",
  "¡{n} bloques!": "{n} problems!", "¡{n} bloque!": "{n} problem!", "Probaste {n} bloques. ¡La próxima cae!": "You tried {n} problems. Next time it goes!", "Probaste {n} bloque. ¡La próxima cae!": "You tried {n} problem. Next time it goes!",
  "y {n} más": "and {n} more", "{n} de 10 hechos": "{n} of 10 done", "Buzón · {n}": "Inbox · {n}", "Grupos · {n}": "Groups · {n}", "Pendientes · {n}": "Pending · {n}", "Bandeja · {n}": "Inbox · {n}", "Archivados · {n}": "Archived · {n}",
  "Hechos · {n}": "Done · {n}", "Todos · {n}": "All · {n}", "Encadena {n} bloques (en los últimos {n} días) para tener tu nivel real, tu perfil de escalador y tu plan semanal.": "Send {n} problems (in the last {n} days) to get your real level, climber profile and weekly plan.",
  "Mientras no tengas {n} de ningún color, estás en la liga Azul.": "Until you have {n} in any colour, you're in the Blue league.", "primer color del que encadenes {n} bloques": "first colour in which you send {n} problems",
  "{n} de 100: {x}": "{n} of 100: {x}", "Aquí salen los bloques montados en los últimos {n} días.": "Problems set in the last {n} days show up here.", "☁️ Subido lo que apuntaste sin conexión ({n})": "☁️ Uploaded what you logged offline ({n})",
  "☁️ Subiendo {n} cambios que apuntaste sin conexión…": "☁️ Uploading {n} changes you logged offline…", "☁️ Subiendo {n} cambio que apuntaste sin conexión…": "☁️ Uploading {n} change you logged offline…",
  "{n} de {n} semanas": "{n} of {n} weeks", "{n} semanas": "{n} weeks", "{n} semana": "{n} week", "{n} flashes": "{n} flashes", "{n} flash": "{n} flash", "{n} puntos ": "{n} points", "{n} punto": "{n} point", "{n} intentos ": "{n} attempts",
  "Tú: {n}.º de {n} en puntos": "You: #{n} of {n} on points", "de {n} en la liga": "of {n} in the league", "{n}.º": "#{n}",
  "{n} más que en {x} 📈": "{n} more than in {x} 📈", "{n} menos que en {x}. ¡A por el siguiente!": "{n} fewer than in {x}. On to the next one!", "{n} encadenados": "{n} sends", "{n} encadenado": "{n} send",
  "Encadenaste {n} bloques, {n} al flash, {n} puntos.": "You sent {n} problems, {n} flashed, {n} points.", "Resumen: {n} bloques, {n} puntos, {n} al flash.": "Recap: {n} problems, {n} points, {n} flashed.",
  "Escalaste {n} de {n} semanas": "You climbed {n} of {n} weeks", "+{n} vs {x}": "+{n} vs {x}", "{n} de {n}. {x}": "{n} of {n}. {x}", "{n} estrellas": "{n} stars",
  "{n} presas · {n} de salida · {n} de top": "{n} holds · {n} start · {n} top", "{n} presa · {n} de salida · {n} de top": "{n} hold · {n} start · {n} top", "{n} abiertos": "{n} open",
  "🔥 {n} semanas": "🔥 {n} weeks", "🔥 {n} semana": "🔥 {n} week", "{n} puntos este mes": "{n} points this month", "Nivel {n}": "Level {n}", "Pantalla {n} de {n}": "Screen {n} of {n}",
  "🧗 Tienes una sesión en marcha ({n} min)": "🧗 You have a session going ({n} min)", "🧗 Tienes una sesión en marcha ({n} h {n} min)": "🧗 You have a session going ({n} h {n} min)",
  "{n} amigos han hecho «{x}»; ¿y tú?": "{n} friends have sent “{x}”; what about you?",
};

const I18N_NX = Object.entries(I18N_N).filter(([k]) => k.includes("{x}")).map(([k, v]) => [k, v,
  new RegExp("^" + k.replace(/[.*+?^$()[\]\\|]/g, "\\$&").replace(/\{n\}/g, "([+−-]?\\d+(?:[.,]\\d+)*)").replace(/\{x\}/g, "(.+?)") + "$")]);

// Textos con nombres dentro (niveles, meses, apodos…): expresión → traducción
const tw = s => I18N[s] || I18N[cap1(s)]?.toLowerCase() || s;      // traduce una palabra suelta (nivel, estilo, mes)
const cap1 = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const I18N_RX = [
  [/^(Buenos días|Buenas tardes|Buenas noches), (.+)$/, m => `${I18N[m[1]]}, ${m[2]}`],
  [/^Dificultad para ser (.+)$/, m => `Difficulty for a ${tw(m[1])}`],
  [/^Para ser (.+), te parece…$/, m => `For a ${tw(m[1])}, it feels…`],
  [/^Liga (.+) · (.+)$/, m => `${tw(m[1])} league · ${m[2]}`],
  [/^Primer (.+)$/, m => `First ${tw(m[1])}`],
  [/^Encadena un bloque (.+)$/, m => `Send a ${tw(m[1])} problem`],
  [/^Un paso más: (.+)$/, m => `One step up: ${tw(m[1])}`],
  [/^Estilo nuevo para ti: (.+)$/, m => `New style for you: ${tw(m[1])}`],
  [/^Bloque (\S+)$/, m => `${cap1(tw(m[1]))} problem`],
  [/^solo (.+)$/, m => `only ${tw(m[1])}`],
  [/^Tu (.+) hasta ahora$/, m => `Your ${m[1]} so far`],
  [/^🎁 Resumen de (.+)$/, m => `🎁 ${cap1(m[1])} recap`],
  [/^🎁 Tu resumen de (.+) está listo$/, m => `🎁 Your ${m[1]} recap is ready`],
  [/^🎁 Tu resumen de (.+) está listo en «Mi progreso»$/, m => `🎁 Your ${m[1]} recap is ready in “My progress”`],
  [/^Tu resumen de (.+) en (.+)$/, m => `Your ${m[1]} recap at ${m[2]}`],
  [/^En (.+) encadenaste$/i, m => `In ${m[1]} you sent`],
  [/^Los mismos que en (.+)$/, m => `Same as in ${m[1]}`],
  [/^Tu mejor semana fue la del (.+): (\d+) bloques?\.$/, m => `Your best week was the week of ${m[1]}: ${m[2]} problem${m[2] === "1" ? "" : "s"}.`],
  [/^Este mes (fuiste|estás siendo)$/i, m => m[1].toLowerCase() === "fuiste" ? "This month you were" : "This month you're"],
  [/^Tu estilo del mes: (.+?)\. (.+)$/, m => `Your style of the month: ${tw(m[1])}. ${m[2].split(", ").map(x => x.replace(/^(\D+) (\d+)$/, (_, a, b) => `${tw(a)} ${b}`)).join(", ")}`],
  [/^(Terminaste|Vas) (\d+)\.º de (\d+) en la liga (\S+) con (\d+) puntos\.$/, m => `${m[1] === "Vas" ? "You're" : "You finished"} #${m[2]} of ${m[3]} in the ${tw(m[4])} league with ${m[5]} points.`],
  [/^Terminaste (.+)$/i, m => `You finished ${m[1]}`],
  [/^(.+) en tu grupo$/i, m => `${m[1]} in your group`],
  [/^Mi (.+) en (.+)$/, m => `My ${m[1]} at ${m[2]}`],
  [/^Mi sesión en (.+)$/, m => `My session at ${m[1]}`],
  [/^Sesión de (.+)$/, m => `${m[1]} session`],
  [/^Sesión en grupo · (.+)$/, m => `Group session · ${m[1]}`],
  [/^Sesión · (.+)$/, m => `Session · ${m[1]}`],
  [/^Tarjeta para historias: (.+)$/, m => `Story card: ${m[1]}`],
  [/^Tu plan de la semana · (.+)$/, m => `Your plan this week · ${tw(m[1])}`],
  [/^Tres bloques de (.+) cerca de tu nivel para mejorar tu punto débil\. (\d+) de (\d+) hechos( 🎉)?\. Cada lunes, plan nuevo\.$/, m => `Three ${tw(m[1])} problems near your level to work on your weak spot. ${m[2]} of ${m[3]} done${m[4] || ""}. New plan every Monday.`],
  [/^Como un (\S+) (alto|bajo|medio)\. Sale de .*$/, m => `Like a ${{ alto: "high", bajo: "low", medio: "mid" }[m[2]]} ${tw(m[1])}. It comes from your 10 best sends in the last 90 days: the colour, how hard each problem is according to climbers, and how many attempts it took you.`],
  [/^Perfil por estilos: (.+)$/, m => `Style profile: ${m[1].split(", ").map(x => x.replace(/^(\D+) (\d+)$/, (_, a, b) => `${tw(a)} ${b}`)).join(", ")}`],
  [/^(\d+) de (\d+) (\D+) para subir a la liga$/, m => `${m[1]} of ${m[2]} ${({ azules: "blues", verdes: "greens", naranjas: "oranges", amarillos: "yellows", morados: "purples", rojos: "reds", negros: "blacks", "bloques compe": "comp problems" })[m[3]] || m[3]} to move up to the league`],
  [/^Nadie ha puntuado todavía en la liga (\S+) este mes\. ¡Estrénala!$/, m => `Nobody has scored in the ${tw(m[1])} league this month yet. Be the first!`],
  [/^Nadie puntuó en la liga (\S+) ese mes\.$/, m => `Nobody scored in the ${tw(m[1])} league that month.`],
  [/^⬆️ ¡Subes a la liga (\S+)!$/, m => `⬆️ You're up to the ${tw(m[1])} league!`],
  [/^Tu liga es el color más difícil del que hayas encadenado (\d+) bloques .*$/, m => `Your league is the hardest colour in which you've sent ${m[1]} problems in this gym (no need to go colour by colour, and you never drop). Within each league, whoever scores most points in the month wins. `],
  [/^(.+) \(tú\)$/, m => `${m[1]} (you)`],
  [/^(.+) reta a (.+)$/, m => `${m[1]} challenges ${m[2]}`],
  [/^(.+) vs (.+) · nadie lo ha encadenado aún$/, m => `${m[1]} vs ${m[2]} · nobody has sent it yet`],
  [/^🏆 (.+) lo encadenó primero$/, m => `🏆 ${m[1]} sent it first`],
  [/^🏆 ganó (.+)$/, m => `🏆 ${m[1]} won`],
  [/^propuesto por (.+)$/, m => `proposed by ${m[1]}`],
  [/^🎯 (\d+) (encadenados?|puntos?|flash(?:es)?)(?: de (.+?))?(?: de (.+))?$/, m => `🎯 ${m[1]} ${{ encadenados: "sends", encadenado: "send", puntos: "points", punto: "point", flashes: "flashes", flash: "flash" }[m[2]]}${m[3] ? " of " + tw(m[3]) : ""}${m[4] ? " of " + tw(m[4]) : ""}`],
  [/^✓ Ya lo sacó: (.+)$/, m => `✓ Already sent: ${m[1]}`],
  [/^¿Quién lo saca primero\?$/, () => "Who'll send it first?"],
  [/^Proyecto compartido: (.+) y tú\. ¿Quién lo saca antes\?$/, m => `Shared project: ${m[1]} and you. Who'll send it first?`],
  [/^🧗 Sesión en grupo en marcha: (.+) \(desde (.+)\)\.$/, m => `🧗 Group session on: ${m[1]} (started ${tr(m[2])}).`],
  [/^🧗 (.+) ha empezado una sesión en grupo en «(.+)»$/, m => `🧗 ${m[1]} started a group session in “${m[2]}”`],
  [/^🧗 Sesión en grupo con «(.+)»: avisa a tu gente$/, m => `🧗 Group session with “${m[1]}”: tell your crew`],
  [/^⚔️ (.+) te ha retado a un duelo en «(.+)»$/, m => `⚔️ ${m[1]} challenged you to a duel in “${m[2]}”`],
  [/^📉 (.+) te ha adelantado en «(.+)»$/, m => `📉 ${m[1]} overtook you in “${m[2]}”`],
  [/^(.+) encadenó «(.+)» \((.*)\)$/, m => `${m[1]} sent “${m[2]}” (${tw(m[3])})`],
  [/^¡Bienvenido a «(.+)»!$/, m => `Welcome to “${m[1]}”!`],
  [/^Grupo creado\. Invita con el código (.+)$/, m => `Group created. Invite people with code ${m[1]}`],
  [/^¿Borrar el grupo «(.+)» para todos\?$/, m => `Delete the group “${m[1]}” for everyone?`],
  [/^¿Salir de «(.+)»\?$/, m => `Leave “${m[1]}”?`],
  [/^¿Sacar a (.+) del grupo\?$/, m => `Remove ${m[1]} from the group?`],
  [/^¿Quitar a «(.+)» del ranking\?$/, m => `Remove “${m[1]}” from the ranking?`],
  [/^Quitar a (.+)$/, m => `Remove ${m[1]}`],
  [/^Únete a mi grupo «(.+)» en Xlp\.Boulder: (\S+) \(código (.+)\)$/, m => `Join my group “${m[1]}” on Xlp.Boulder: ${m[2]} (code ${m[3]})`],
  [/^Te han invitado a un grupo \(código$/, () => "You've been invited to a group (code"],
  [/^Rodea con el dedo la zona de «(.+)» en el plano\.$/, m => `Circle the area of “${m[1]}” on the map with your finger.`],
  [/^Zona de (.+) guardada$/, m => `Area of ${m[1]} saved`],
  [/^(.+): (\d+) bloques abiertos$/, m => `${m[1]}: ${m[2]} open problems`],
  [/^(.+): (\d+) bloques$/, m => `${tw(m[1])}: ${m[2]} problems`],
  [/^Ver (.+)$/, m => `View ${m[1]}`],
  [/^Foto de (.+) en el muro$/, m => `Photo of ${m[1]} on the wall`],
  [/^Deshacer encadenado de (.+)$/, m => `Undo send of ${m[1]}`],
  [/^Un intento más en (.+)$/, m => `One more attempt on ${m[1]}`],
  [/^Encadenado (?!el )(.+)$/, m => `Sent ${m[1]}`],
  [/^Flash (?!el )(.+)$/, m => `Flash ${m[1]}`],
  [/^📏 (\d+) % dice que (.+) \((\d+) votos?\)$/, m => `📏 ${m[1]} % say it ${tr(m[2]).replace(/^suits/, "suits")} (${m[3]} vote${m[3] === "1" ? "" : "s"})`],
  [/^(.+) · (\S+) · (.+) · Xlp\.Boulder$/, m => m[0]],
  [/^(\S+) · (.+)$/, m => (I18N[m[1]] ? `${I18N[m[1]]} · ${m[2]}` : null)],
  [/^Tu sector$/, () => "Your sector"], [/^Tu día$/, () => "Your day"],
  [/^(Los \S+) son lo tuyo$/, m => `${tw(m[1])} are your thing`],
  [/^(Más puntos|Más constante|Más flashes|Más insistente): (.+) \((\d+) (\S+)\)\.?$/, m => `${I18N[m[1]]}: ${m[2]} (${m[3]} ${{ puntos: "points", punto: "point", semanas: "weeks", semana: "week", flashes: "flashes", flash: "flash", intentos: "attempts", intento: "attempt" }[m[4]] || m[4]}).`],
  [/^Tú: (\d+)\.º de (\d+)\.?$/, m => `You: #${m[1]} of ${m[2]}.`],
  [/^Presa (.+)$/, m => `${cap1(tw(m[1]))} holds`],
  [/^(.+)\. La sala es la parte del nombre del sector antes del «·» .*$/, m => `${m[1]}. The room is the part of the sector name before the “·” (e.g. “Sala 2” in “Sala 2 · La U”).` + (m[0].includes("Toca un sector") ? " Tap a sector to see its problems." : "")],
  [/^En (.+?): (.+)$/, m => `In ${m[1]}: ${m[2].replace(/Más puntos/g, "Most points").replace(/Más constante/g, "Most consistent").replace(/Más flashes/g, "Most flashes").replace(/Más insistente/g, "Most persistent").replace(/ semanas?\)/g, s => s.includes("semanas") ? " weeks)" : " week)").replace(/ intentos?\)/g, " attempts)").replace(/ puntos?\)/g, " points)").replace(/Tú: (\d+)\.º de (\d+)/, "You: #$1 of $2")}`],
  [/^Por colores: (.+)$/, m => `By colour: ${m[1].replace(/\b(Azul|Verde|Naranja|Amarillo|Morado|Rojo|Negro|Compe)\b/g, w => I18N[w]).replace("Tu bloque más difícil:", "Your hardest problem:").replace("Estrenaste", "First ever").replace(/ y /g, " and ")}`],
  [/^Bloques por semana: (.+)$/, m => `Problems per week: ${m[1].replace(/Escalaste (\d+) de (\d+) semanas/, "You climbed $1 of $2 weeks")}`],
  [/^🎉 Estrenaste (.+)$/, m => `🎉 Your first ${m[1].split(/, | y /).map(tw).join(" and ")}`],
  [/^Tu sector: .+$/, m => m[0].replace("Tu sector", "Your sector").replace("Tu día", "Your day").replace(/Los (\S+) son lo tuyo/, (_, d) => `${tw("Los " + d)} are your thing`).replace("El mejor valorado que encadenaste", "Top-rated problem you sent").replace("Constancia", "Consistency").replace(/ bloques\)/g, " problems)").replace(/ semanas/g, " weeks").replace("con algún encadenado", "with a send")],
];

// Traductor: frase entera → con números → con nombres → por trozos separados por « · »
function tr(text) {
  if (LANG === "es" || !text) return text;
  const m = text.match(/^(\s*)([\s\S]*?)(\s*)$/), core = m[2];
  if (!core) return text;
  const out = trCore(core);
  return out == null ? text : m[1] + out + m[3];
}
function trCore(s) {
  if (s in I18N) return I18N[s];
  if (s.startsWith("· ")) { const t = trCore(s.slice(2)); return t == null ? null : "· " + t; }
  if (s === s.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(s)) { const low = s.toLowerCase(), c = cap1(low); const t = I18N[c] || I18N[low] || trNum(c) || trRx(c); if (t) return t.toUpperCase(); }
  const n = trNum(s); if (n != null) return n;
  const r = trRx(s); if (r != null) return r;
  const em = s.match(/^((?:\p{Extended_Pictographic}|[✓⚡◎♡♥▶✎◇⬆])\uFE0F?\s*)(.+)$/u);   // emoji delante
  if (em) { const t = trCore(em[2]); if (t != null) return em[1] + t; }
  if (/[.!?]\s+\S/.test(s)) {   // varias frases: cada una por su cuenta
    const parts = s.split(/(?<=[.!?])\s+/);
    if (parts.length > 1) { const t = parts.map(p => trCore(p) ?? p); if (t.some((x, i) => x !== parts[i])) return t.join(" "); }
  }
  if (/\s·\s/.test(s)) {   // trozos separados por « · »: cada uno por su cuenta
    const parts = s.split(/(\s+·\s+)/);
    const t = parts.map((p, i) => i % 2 ? p : (trCore(p.trim()) ?? p));
    if (t.some((x, i) => x !== parts[i])) return t.join("");
  }
  return null;
}
function trNum(s) {
  const nums = [], words = [];
  const key = s.replace(/[+−-]?\d+(?:[.,]\d+)*/g, v => { nums.push(v); return "{n}"; });
  if (!nums.length) return null;
  if (key in I18N_N) { let i = 0; return I18N_N[key].replace(/\{n\}/g, () => nums[i++]).replace(/\{x\}/g, () => ""); }
  // con una palabra suelta además de los números ({x})
  for (const [k, v, rx] of I18N_NX) {
    const mm = s.match(rx); if (!mm) continue;
    const order = [...k.matchAll(/\{(n|x)\}/g)].map(x => x[1]); let ni = 0, xi = 0; const ns = [], xs = [];
    order.forEach((t, i) => (t === "n" ? ns : xs).push(mm[i + 1]));
    return v.replace(/\{(n|x)\}/g, (_, t) => t === "n" ? ns[ni++] : tw(xs[xi++]));
  }
  return null;
}
function trRx(s) { for (const [rx, f] of I18N_RX) { const m = s.match(rx); if (m) { const r = f(m); if (r != null) return r.replace(/(\d+)\.º/g, "#$1"); } } return null; }

if (LANG === "en") {
  // Fechas y números en formato inglés
  const swap = l => (l === "es-ES" || l === "es") ? "en-GB" : l;
  const dts = Date.prototype.toLocaleDateString, nts = Number.prototype.toLocaleString;
  Date.prototype.toLocaleDateString = function (l, o) { return dts.call(this, swap(l), o); };
  Number.prototype.toLocaleString = function (l, o) { return nts.call(this, swap(l), o); };
  // Ventanas del navegador
  const cf = window.confirm.bind(window), pr = window.prompt.bind(window), al = window.alert.bind(window);
  window.confirm = m => cf(tr(m)); window.prompt = (m, d) => pr(tr(m), d); window.alert = m => al(tr(m));
  // Tarjetas para historias (lienzo)
  const C2 = CanvasRenderingContext2D.prototype, fill = C2.fillText, meas = C2.measureText;
  C2.fillText = function (t, ...a) { return fill.call(this, tr(String(t)), ...a); };
  C2.measureText = function (t) { return meas.call(this, tr(String(t))); };
  // Página: textos y atributos, también los que aparecen después
  const done = new WeakMap(), ATTRS = ["placeholder", "aria-label", "title", "alt"];
  const node = n => {
    if (n.nodeType === 3) { if (done.get(n) === n.data || n.parentElement?.closest("[translate=no]")) return; const t = tr(n.data); if (t !== n.data) n.data = t; done.set(n, n.data); return; }
    if (n.nodeType !== 1 || n.closest?.("[translate=no]")) return;
    if (/^(SCRIPT|STYLE)$/.test(n.nodeName)) return;
    for (const a of ATTRS) { const v = n.getAttribute(a); if (v) { const t = tr(v); if (t !== v) n.setAttribute(a, t); } }
    if (n.nodeName === "TEXTAREA") return;
    for (const c of n.childNodes) node(c);
  };
  const obs = new MutationObserver(ms => { for (const m of ms) { if (m.type === "characterData") node(m.target); else if (m.type === "attributes") node(m.target); else m.addedNodes.forEach(node); } });
  const start = () => { node(document.body); obs.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS }); };
  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
  document.title = "Xlp.Boulder";
}

// Botón de idioma
document.addEventListener("DOMContentLoaded", () => {
  const b = document.getElementById("langBtn"); if (!b) return;
  b.textContent = LANG === "es" ? "🌐 EN" : "🌐 ES";
  b.setAttribute("aria-label", LANG === "es" ? "Change language to English" : "Cambiar el idioma a español");
  b.setAttribute("translate", "no");
  b.addEventListener("click", () => { try { localStorage.setItem("lb-lang", JSON.stringify(LANG === "es" ? "en" : "es")); } catch (e) {} location.reload(); });
});
