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
const WELCOME = [
  { icon: "🧗", title: "Bienvenido a Xlp.Boulder", body: [el => el("p", { text: "Todos los bloques de Natural Patraix y Natural Benimaclet: con su foto, la beta del equipador y el mapa de la sala. Sin registro." })] },
  { icon: "✅", title: "Apunta lo que escalas", body: [el => el("ul", {},
      el("li", { text: "Abre un bloque y marca «Encadenado» o «⚡ Flash» (a la primera)." }),
      el("li", { text: "Mientras lo pruebas, suma intentos con «+»." }),
      el("li", { text: "En la sala, «🧗 Empezar sesión» lo hace en dos toques." }),
      el("li", { text: "Vota si te parece blando, justo o duro y cuenta tu beta." }))] },
  { icon: "🏆", title: "Y pica a tus amigos", body: [el => el("ul", {},
      el("li", { text: "Ranking del mes por ligas de color." }),
      el("li", { text: "Grupos con tus amigos: duelos, retos y sesiones juntos." }),
      el("li", { text: "Medallas, rachas, tu nivel real y tu resumen del mes." })),
    el => el("button", { class: "btn", onclick: () => { closeWelcome(); openInstall(); } }, "📲 Instálala en tu móvil")] },
];
function openWelcome(i = 0) {
  const w = WELCOME[i], last = i === WELCOME.length - 1;
  let root = $("welcomeRoot");
  if (!root) { root = el("div", { id: "welcomeRoot", class: "welcome", role: "dialog", "aria-modal": "true", "aria-label": "Bienvenida" }); document.body.append(root); }
  document.body.style.overflow = "hidden";
  root.replaceChildren(el("div", { class: "welcome-card" },
    el("div", { class: "welcome-emoji", "aria-hidden": "true", text: w.icon }),
    el("h2", { text: w.title }),
    ...w.body.map(f => f(el)),
    i === 0 ? el("button", { class: "linkbtn", translate: "no", onclick: () => { try { localStorage.setItem("lb-lang", JSON.stringify(LANG === "es" ? "en" : "es")); } catch (e) {} location.reload(); } },
      LANG === "es" ? "🌐 Read it in English" : "🌐 Leer en español") : null,
    el("div", { class: "welcome-actions" },
      el("div", { class: "welcome-dots", "aria-label": `Pantalla ${i + 1} de ${WELCOME.length}` }, WELCOME.map((_, k) => el("span", { class: k === i ? "on" : "" }))),
      el("div", { class: "row" },
        last ? null : el("button", { class: "btn", onclick: closeWelcome }, "Saltar"),
        el("button", { class: "btn primary", onclick: () => last ? closeWelcome() : openWelcome(i + 1) }, last ? "¡Empezar!" : "Siguiente")))));
  root.querySelector(".btn.primary").focus();
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
