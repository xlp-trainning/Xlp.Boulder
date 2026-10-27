// Pantalla «Hoy» (resumen al abrir la app), bienvenida de 3 pantallas para quien entra por primera vez
// y Ajustes (idioma, tema, tamaño de letra y modo daltónico).
// Usa app.js, progreso.js, nivel.js, wrapped.js, grupos.js, sesion.js e instalar.js.

/* ---------- Hoy ---------- */
function greeting() { const h = new Date().getHours(); return h < 6 ? "Buenas noches" : h < 14 ? "Buenos días" : h < 21 ? "Buenas tardes" : "Buenas noches"; }
const todayHead = (label, more, go) => el("div", { class: "today-head" }, el("span", { class: "label", text: label }), more ? el("button", { class: "linkbtn", onclick: go }, more) : null);
const alertBtn = (text, go, cta) => el("button", { class: "today-alert", onclick: go }, el("span", { text }), el("span", { class: "go", text: cta || "Ver →" }));

function renderHoy() {
  const root = $("page-hoy");
  if (!S.loaded) return;
  const st = streaks(), c = progressCtx(), lvl = levelAt(), nick = G.me?.nick;
  const fresh = S.blocks.filter(isNew).sort((a, b) => (b.set_date || "").localeCompare(a.set_date || ""));
  const pf = profile(), plan = weekPlan(pf), recs = plan ? [] : recommendations(3);
  const projects = S.blocks.filter(b => b.active && S.mine[b.id]?.project && !S.mine[b.id]?.sent).slice(0, 3);
  const ses = sesActive();

  // Avisos: lo que conviene hacer ya
  const alerts = [
    ses ? alertBtn(`🧗 Tienes una sesión en marcha (${fmtMins(sesSummary(ses).mins)})`, () => { SES.open = true; render(); }, "Abrir →") : null,
    ...G.active.filter(a => !a.am_in).map(a => alertBtn(`🧗 ${a.starter} ha empezado una sesión en grupo en «${a.group_name}»`, () => joinGroupSession(a), "Unirme →")),
    ...(G.pending || []).map(({ g, d }) => alertBtn(`⚔️ ${d.challenger_nick} te ha retado a un duelo en «${g.name}»`, () => { G.sel = g.id; G.tab = "retos"; setPage("grupos"); })),
    wrappedPending() ? alertBtn(`🎁 Tu resumen de ${monthName(monthStart(1))} está listo`, () => openWrapped(1)) : null,
    st.cur > 0 && !st.thisWeek ? alertBtn(`🔥 Encadena algo esta semana para no perder tu racha de ${st.cur} ${st.cur === 1 ? "semana" : "semanas"}.`, () => startSession(), "Empezar →") : null,
  ].filter(Boolean);

  root.replaceChildren(el("div", { class: "today" }, ...[
    el("section", { class: "section" },
      el("h2", { class: "today-hi", text: nick ? `${greeting()}, ${nick}` : greeting() }),
      el("div", { class: "today-chips" },
        el("button", { class: "today-chip", onclick: () => setPage("progreso") }, st.cur ? `🔥 ${st.cur} ${st.cur === 1 ? "semana" : "semanas"}` : "🔥 Sin racha"),
        el("button", { class: "today-chip", onclick: () => setPage("progreso") }, `${c.monthPoints} puntos este mes`),
        lvl != null ? el("button", { class: "today-chip", onclick: () => setPage("progreso") }, `Nivel ${lvl.toLocaleString("es-ES")}`) : null,
        el("button", { class: "today-chip", onclick: () => setPage("progreso") }, `${c.sends.length} encadenados`))),
    alerts.length ? el("div", { class: "today-alerts" }, alerts) : null,
    el("div", { class: "actions" },
      el("button", { class: "btn primary", onclick: () => startSession() }, ses ? "🧗 Volver a la sesión" : "🧗 Empezar sesión"),
      el("button", { class: "btn", onclick: () => setPage("mapa") }, "🗺️ Mapa de la sala"),
      el("button", { class: "btn", onclick: () => setPage("bloques") }, "Todos los bloques")),
    el("section", { class: "section" }, todayHead(fresh.length ? `Novedades · ${fresh.length}` : "Novedades", fresh.length > 4 ? "Ver todas →" : null, () => { S.view = "new"; store.set("lb-view", "new"); setPage("bloques"); }),
      fresh.length ? el("div", { class: "grid" }, fresh.slice(0, 4).map(card)) : el("p", { class: "note", text: "Nada nuevo esta semana. Cuando se monten bloques, saldrán aquí." })),
    plan ? el("section", { class: "section" }, todayHead(`Tu plan de la semana · ${plan.axis.toLowerCase()}`, "Mi progreso →", () => setPage("progreso")), el("div", { class: "grid" }, plan.blocks.map(card)))
      : recs.length ? el("section", { class: "section" }, todayHead("Tu siguiente reto"), el("div", { class: "grid" }, recs.map(r => el("div", { class: "rec" }, el("span", { class: "rec-why", text: r.why }), card(r.b))))) : null,
    projects.length ? el("section", { class: "section" }, todayHead("Tus proyectos"), el("div", { class: "grid" }, projects.map(card))) : null,
    G.groups.length ? el("section", { class: "section" }, todayHead("En tus grupos", "Grupos →", () => setPage("grupos")),
      (G.latest || []).length ? el("ul", { class: "g-feed" }, G.latest.slice(0, 4).map(f => el("li", { class: "g-item" },
        el("p", {}, el("strong", { text: f.nick }), f.flash ? " hizo flash a " : " encadenó ", blockLink(f), el("span", { class: "note", text: ` · ${ago(f.sent_at)}` })))))
        : el("p", { class: "note", text: "Sin novedades de tus amigos en los últimos días." }))
      : el("section", { class: "section" }, todayHead("Grupos de amigos"), el("p", { class: "note", text: "Crea un grupo con tu gente: ranking propio, duelos, retos y sesiones juntos." }),
          el("div", { class: "actions" }, el("button", { class: "btn", onclick: () => setPage("grupos") }, "Crear o unirme a un grupo"))),
  ].filter(Boolean)));
}

/* ---------- Bienvenida ---------- */
// Tres pantallas con la estética de la marca: fondo oscuro, cintas de los colores del circuito y
// pequeñas ilustraciones hechas con la propia interfaz (una ficha de bloque, una clasificación).
const lvl = k => LEVELS.find(l => l.k === k);
const tapeStyle = l => l.solid ? "background:repeating-linear-gradient(135deg,#1C1C1E 0 9px,#F4F4F2 9px 18px)" : `background:${l.bg}`;
const wlSteps = steps => el("ol", { class: "wl-steps" }, steps.map(([t, d], n) =>
  el("li", {}, el("span", { class: "wl-n", text: String(n + 1).padStart(2, "0") }), el("span", {}, el("strong", { text: t }), el("span", { text: d })))));

const WELCOME = [
  { art: () => {
      // Cintas de salida de los ocho colores cruzando la pantalla, y el logo encima
      const tapes = el("div", { class: "wl-tapes", "aria-hidden": "true" },
        LEVELS.map((l, i) => el("span", { style: `${tapeStyle(l)};--i:${i}` })));
      const mark = document.querySelector(".wordmark .mark")?.cloneNode(true);
      return el("div", { class: "wl-art wl-art-1" }, tapes,
        el("div", { class: "wl-logo" }, mark, el("span", {}, "XLP", el("i", { text: "." }), "BOULDER")));
    },
    kicker: "Bienvenido", title: null,
    body: () => el("p", { class: "wl-lead", text: "Todos los bloques de Natural Climb Patraix y Natural Climb Benimaclet." }) },
  { art: () => {
      // Una ficha de bloque de mentira: así se apunta
      const y = lvl("amarillo");
      return el("div", { class: "wl-art wl-art-2", "aria-hidden": "true" },
        el("div", { class: "wl-card" },
          el("div", { class: "wl-card-tape", style: tapeStyle(y) }, el("span", { text: "AMARILLO" })),
          el("div", { class: "wl-card-body" },
            el("strong", { text: "El techo" }), el("span", { class: "wl-card-meta", text: "Sala 2 · La U" }),
            el("div", { class: "wl-card-btns" }, el("span", { class: "wl-pill on", text: "Encadenado" }), el("span", { class: "wl-pill", text: "Flash" })),
            el("div", { class: "wl-card-att" }, el("span", { class: "wl-key", text: "−" }), el("b", { text: "3" }), el("span", { class: "wl-key", text: "+" }), el("span", { class: "wl-card-meta", text: "intentos" })))));
    },
    kicker: "Paso a paso", title: "Apunta lo que escalas",
    body: () => wlSteps([["Encadenado o flash", "Abre el bloque y márcalo con un toque."], ["Cuenta tus intentos", "Suma uno cada vez que lo pruebes."], ["Modo sesión", "En la sala, todo en dos toques y sin abrir fichas."]]) },
  { art: () => {
      // Una clasificación de liga de mentira
      const o = lvl("naranja"), y = lvl("amarillo");
      const row = (pos, name, pts, me) => el("div", { class: "wl-row" + (me ? " me" : "") }, el("span", { class: "wl-pos", text: pos }), el("span", { class: "wl-name", text: name }), el("b", { text: pts }));
      return el("div", { class: "wl-art wl-art-3", "aria-hidden": "true" },
        el("div", { class: "wl-board" },
          el("div", { class: "wl-board-head" }, el("span", { class: "wl-chip", style: tapeStyle(o) + `;color:${o.fg}`, text: "LIGA NARANJA" }), el("span", { class: "wl-card-meta", text: "este mes" })),
          row("1", "Bea", "42"), row("2", "Tú", "38", true), row("3", "Dani", "31"),
          el("div", { class: "wl-up" }, el("span", { class: "wl-card-meta", text: "7 de 10 amarillos para subir de liga" }), el("span", { class: "wl-bar" }, el("span", { style: `width:70%;background:${y.bg}` })))));
    },
    kicker: "Con tu gente", title: "Y pica a tus amigos",
    body: () => wlSteps([["Ligas por color", "Cada mes compites con los de tu nivel."], ["Grupos y duelos", "Ranking propio, retos y sesiones juntos."], ["Tu nivel real", "Medallas, rachas y el resumen de tu mes."]]) },
];

function openWelcome(i = 0) {
  const w = WELCOME[i], last = i === WELCOME.length - 1;
  let root = $("welcomeRoot");
  if (!root) {
    root = el("div", { id: "welcomeRoot", class: "wl", role: "dialog", "aria-modal": "true", "aria-label": "Bienvenida", tabindex: "-1" });
    // Deslizar con el dedo para pasar de pantalla
    let x0 = null;
    root.addEventListener("pointerdown", e => { x0 = e.clientX; });
    root.addEventListener("pointerup", e => { if (x0 == null) return; const dx = e.clientX - x0; x0 = null;
      const cur = +root.dataset.i; if (Math.abs(dx) > 60) { if (dx < 0 && cur < WELCOME.length - 1) openWelcome(cur + 1); if (dx > 0 && cur > 0) openWelcome(cur - 1); } });
    document.body.append(root);
  }
  root.dataset.i = i;
  document.body.style.overflow = "hidden";
  root.replaceChildren(
    el("div", { class: "wl-top" },
      el("div", { class: "wl-progress", "aria-label": `Pantalla ${i + 1} de ${WELCOME.length}` }, WELCOME.map((_, k) => el("span", { class: k <= i ? "on" : "" }))),
      last ? el("span") : el("button", { class: "wl-skip", onclick: closeWelcome }, "Saltar")),
    el("div", { class: "wl-main" },
      w.art(),
      el("div", { class: "wl-text" },
        el("span", { class: "wl-kicker", text: w.kicker }),
        w.title ? el("h2", { class: "wl-title", text: w.title }) : null,
        w.body())),
    el("div", { class: "wl-bottom" },
      el("button", { class: "wl-next", onclick: () => last ? closeWelcome() : openWelcome(i + 1) }, last ? "Empezar" : "Siguiente"),
      i === 0 ? el("button", { class: "wl-link", translate: "no", onclick: () => { try { localStorage.setItem("lb-lang", JSON.stringify(LANG === "es" ? "en" : "es")); } catch (e) {} location.reload(); } },
          LANG === "es" ? "Read it in English" : "Leer en español")
        : last ? el("button", { class: "wl-link", onclick: () => { closeWelcome(); openInstall(); } }, "Instalar la app en el móvil") : el("span", { class: "wl-link-space" })));
  root.focus({ preventScroll: true });
}
function closeWelcome() { store.set("lb-welcome", 1); $("welcomeRoot")?.remove(); document.body.style.overflow = ""; }

/* ---------- Ajustes ---------- */
function applyLook() {
  const t = store.get("lb-theme", "auto");
  if (t === "auto") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
  document.documentElement.classList.toggle("big-text", !!store.get("lb-big", false));
}
function openSettings() {
  const tabs = (label, cur, opts, set) => el("div", { class: "field" }, el("span", { class: "label", text: label }),
    el("div", { class: "tabs", role: "group", "aria-label": label }, opts.map(([k, t]) =>
      el("button", { "aria-pressed": cur === k ? "true" : "false", onclick: () => { set(k); openSettings(); } }, t))));
  const cb = document.body.classList.contains("cb");
  openId = null;
  sheet(head("Ajustes", true), el("div", { class: "settings" },
    el("div", { class: "field" }, el("span", { class: "label", text: "Idioma · Language" }),
      el("div", { class: "tabs", role: "group", "aria-label": "Idioma", translate: "no" }, [["es", "Español"], ["en", "English"]].map(([k, t]) =>
        el("button", { "aria-pressed": LANG === k ? "true" : "false", onclick: () => { if (k === LANG) return; try { localStorage.setItem("lb-lang", JSON.stringify(k)); } catch (e) {} location.reload(); } }, t)))),
    tabs("Tema", store.get("lb-theme", "auto"), [["auto", "Como el móvil"], ["light", "☀️ Claro"], ["dark", "🌙 Oscuro"]], k => { store.set("lb-theme", k); applyLook(); }),
    tabs("Tamaño de letra", store.get("lb-big", false) ? "big" : "normal", [["normal", "Normal"], ["big", "Grande"]], k => { store.set("lb-big", k === "big"); applyLook(); }),
    el("div", { class: "field" }, el("span", { class: "label", text: "Modo daltónico" }),
      el("div", { class: "tabs", role: "group", "aria-label": "Modo daltónico" },
        el("button", { "aria-pressed": cb ? "false" : "true", onclick: () => { setColorBlind(false); render(); openSettings(); } }, "No"),
        el("button", { id: "cbBtn", "aria-pressed": cb ? "true" : "false", onclick: () => { setColorBlind(true); render(); openSettings(); } }, "Sí")),
      el("p", { class: "note", text: "Cada color de nivel y de presa lleva su abreviatura (Az, Ve, Na, Am…)." })),
    el("div", { class: "field" }, el("span", { class: "label", text: "La app" }),
      el("div", { class: "row" },
        el("button", { class: "btn", onclick: () => openInstall() }, "📲 Instalar · pasar mi progreso"),
        el("button", { class: "btn", onclick: () => { closeSheet(); openWelcome(); } }, "Ver la bienvenida otra vez")))));
}

applyLook();
document.addEventListener("DOMContentLoaded", () => {
  $("settingsBtn")?.addEventListener("click", openSettings);
  if (!store.get("lb-welcome", 0) && !/^#(b|g)-/.test(location.hash)) openWelcome();
});
