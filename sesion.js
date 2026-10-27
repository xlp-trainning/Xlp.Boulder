// Modo sesión: vista rápida para apuntar entre pegue y pegue (+1 intento, encadenado, flash) sin abrir fichas,
// y al terminar un resumen que se puede compartir. La sesión en curso se guarda en el móvil (sobrevive a recargar).
// Usa app.js (S, saveMine…), progreso.js (pointsFor) e historias.js (lienzo de historias).

const SES = { open: false, timer: 0, ended: null };
const sesGet = () => store.get("lb-session", null);
const sesSet = v => store.set("lb-session", v);
const SES_MAX_H = 8;

function sesActive() {
  const s = sesGet();
  if (s && Date.now() - new Date(s.start) > SES_MAX_H * 36e5) { sesSet(null); return null; }   // olvidada abierta
  return s && s.gym === S.gym ? s : null;
}
function startSession() {
  if (!sesActive()) sesSet({ start: new Date().toISOString(), gym: S.gym, tries: {}, sector: S.sector || "", level: "" });
  SES.open = true; render();
}
function sesTry(id, n = 1) { const s = sesGet(); s.tries[id] = Math.max(0, (s.tries[id] || 0) + n); if (!s.tries[id]) delete s.tries[id]; sesSet(s); }

// Lo hecho en la sesión: encadenados desde que empezó e intentos apuntados en ella
function sesSummary(s) {
  const t0 = new Date(s.start);
  const sends = S.blocks.filter(b => S.mine[b.id]?.sent && S.mine[b.id].sent_at && new Date(S.mine[b.id].sent_at) >= t0)
    .map(b => ({ b, m: S.mine[b.id] })).sort((a, b) => gIdx(b.b.level) - gIdx(a.b.level));
  return {
    sends, flashes: sends.filter(x => x.m.flash).length,
    tries: Object.values(s.tries).reduce((a, n) => a + n, 0),
    tried: new Set([...Object.keys(s.tries), ...sends.map(x => x.b.id)]).size,
    points: sends.reduce((a, x) => a + pointsFor(x.b, x.m.flash), 0),
    mins: Math.max(1, Math.round((Date.now() - t0) / 6e4)),
  };
}
const fmtMins = m => m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")} min`;

// Acciones rápidas
function sesPlus(b) {
  const mine = { ...(S.mine[b.id] || {}) };
  sesTry(b.id); saveMine(b.id, { ...mine, attempts: (mine.attempts || 0) + 1 });
}
function sesSend(b) {
  const mine = { ...(S.mine[b.id] || {}) };
  if (mine.sent) {   // deshacer
    if (mine.attempts) sesTry(b.id, -1);
    return saveMine(b.id, { ...mine, sent: false, flash: false, attempts: mine.flash ? null : (mine.attempts > 1 ? mine.attempts - 1 : null) });
  }
  sesTry(b.id);
  const att = mine.attempts ? mine.attempts + 1 : null;
  saveMine(b.id, { ...mine, sent: true, flash: att === 1, attempts: att });
}
function sesFlash(b) {
  const mine = { ...(S.mine[b.id] || {}) };
  sesTry(b.id); saveMine(b.id, { ...mine, sent: true, flash: true, attempts: 1 });
}

/* ---------- vista ---------- */
function markSession() {
  const s = sesActive();
  const btn = $("sessionBtn");
  if (btn) { btn.hidden = !S.loaded || !!S.error || !S.blocks.some(b => b.active); btn.textContent = s ? "🧗 Volver a la sesión" : "🧗 Empezar sesión"; btn.classList.toggle("primary", !!s); }
  const bar = $("sessionBar");
  if (bar) {
    const show = !!s && !SES.open;
    bar.hidden = !show; document.body.classList.toggle("has-session-bar", show);
    if (show) { const r = sesSummary(s); bar.querySelector(".sb-txt").textContent = `Sesión · ${fmtMins(r.mins)} · ${r.sends.length} ✓ · +${r.points}`; }
  }
  const root = $("sessionRoot");
  if (SES.ended) return;
  if (s && SES.open) renderSession(s);
  else if (root.firstChild) closeSessionView();
}
function closeSessionView() { $("sessionRoot").replaceChildren(); clearInterval(SES.timer); SES.timer = 0; document.body.style.overflow = ""; }

function renderSession(s) {
  const root = $("sessionRoot");
  const keepScroll = root.querySelector(".ses-list")?.scrollTop || 0;
  const r = sesSummary(s);
  const open = S.blocks.filter(b => b.active);
  const sectors = [...new Set(open.map(b => b.sector).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
  const list = open.filter(b => (!s.sector || b.sector === s.sector) && (!s.level || b.level === s.level))
    .sort((a, b) => gIdx(a.level) - gIdx(b.level) || title(a).localeCompare(title(b), "es"));
  const setF = patch => { sesSet({ ...sesGet(), ...patch }); render(); };
  const row = b => {
    const m = S.mine[b.id] || {}, l = LV[b.level];
    const state = m.sent ? (m.flash ? "⚡ Flash" : m.attempts > 1 ? `✓ al ${m.attempts}.º` : "✓ Encadenado") : m.attempts ? `${m.attempts} ${m.attempts === 1 ? "intento" : "intentos"}` : "";
    return el("li", { class: "ses-row" + (m.sent ? " done" : "") },
      el("span", { class: "ses-tape", style: `background:${l.bg};color:${l.fg}`, text: SHORT[b.level] }),
      el("span", { class: "ses-name" }, el("strong", { text: title(b) }), el("span", { class: "note", text: [b.sector, state].filter(Boolean).join(" · ") })),
      el("span", { class: "ses-btns" },
        el("button", { class: "btn", disabled: !!m.sent, "aria-label": `Un intento más en ${title(b)}`, onclick: () => sesPlus(b) }, "+1"),
        el("button", { class: "btn" + (m.sent && !m.flash ? " primary" : ""), "aria-label": m.sent ? `Deshacer encadenado de ${title(b)}` : `Encadenado ${title(b)}`, onclick: () => sesSend(b) }, "✓"),
        el("button", { class: "btn" + (m.flash ? " primary" : ""), disabled: !!m.sent || !!m.attempts, "aria-label": `Flash ${title(b)}`, onclick: () => sesFlash(b) }, "⚡")));
  };
  root.replaceChildren(el("div", { class: "session", role: "dialog", "aria-modal": "true", "aria-label": "Sesión de escalada" },
    el("div", { class: "ses-head" },
      el("div", {}, el("span", { class: "label", text: `Sesión · ${(currentGym()?.name || "").replace(/^Natural /, "")}` }), el("div", { class: "ses-clock", text: fmtMins(r.mins) })),
      el("div", { class: "row" },
        el("button", { class: "btn", onclick: () => { SES.open = false; render(); } }, "Minimizar"),
        el("button", { class: "btn primary", onclick: endSession }, "Terminar"))),
    el("div", { class: "ses-kpis" },
      [[r.sends.length, "encadenados"], [r.flashes, "⚡ flash"], [r.tries, "intentos"], ["+" + r.points, "puntos"]].map(([n, t]) =>
        el("span", {}, el("strong", { text: String(n) }), el("span", { class: "note", text: t })))),
    el("div", { class: "ses-filters" },
      el("div", { class: "lg-chips" }, el("button", { class: "chip", "aria-pressed": !s.sector ? "true" : "false", onclick: () => setF({ sector: "" }) }, "Todos los sectores"),
        sectors.map(n => el("button", { class: "chip", "aria-pressed": s.sector === n ? "true" : "false", onclick: () => setF({ sector: n }) }, n))),
      el("div", { class: "lg-chips" }, el("button", { class: "chip", "aria-pressed": !s.level ? "true" : "false", onclick: () => setF({ level: "" }) }, "Todos"),
        LEVELS.filter(l => open.some(b => b.level === l.k)).map(l => el("button", { class: "chip", "aria-pressed": s.level === l.k ? "true" : "false", onclick: () => setF({ level: l.k }) }, levelDot(l.k), l.name)))),
    list.length ? el("ul", { class: "ses-list" }, list.map(row)) : el("p", { class: "note ses-empty", text: "No hay bloques abiertos con estos filtros." }),
    el("p", { class: "note ses-help", text: "+1 = un pegue sin encadenar · ✓ = encadenado en este pegue (vuelve a tocar para deshacer) · ⚡ = a la primera" })));
  root.querySelector(".ses-list") && (root.querySelector(".ses-list").scrollTop = keepScroll);
  document.body.style.overflow = "hidden";
  if (!SES.timer) SES.timer = setInterval(() => { const c = root.querySelector(".ses-clock"); const cur = sesActive(); if (c && cur) c.textContent = fmtMins(sesSummary(cur).mins); }, 30000);
}

// Terminar: resumen con lo hecho y tarjeta para historias
function endSession() {
  const s = sesActive(); if (!s) return;
  const r = sesSummary(s);
  sesSet(null); SES.open = false; clearInterval(SES.timer); SES.timer = 0;
  if (!r.sends.length && !r.tries) { closeSessionView(); render(); return toast("Sesión terminada"); }
  SES.ended = r;
  const root = $("sessionRoot");
  root.replaceChildren(el("div", { class: "session ses-end", role: "dialog", "aria-modal": "true", "aria-label": "Resumen de la sesión" },
    el("span", { class: "label", text: "Sesión terminada" }),
    el("h2", { class: "ses-title", text: r.sends.length ? `¡${r.sends.length} ${r.sends.length === 1 ? "bloque" : "bloques"}!` : "¡Buena sesión!" }),
    el("div", { class: "ses-kpis" },
      [[fmtMins(r.mins), "escalando"], [r.tries, "intentos"], [r.flashes, "⚡ flash"], ["+" + r.points, "puntos"]].map(([n, t]) =>
        el("span", {}, el("strong", { text: String(n) }), el("span", { class: "note", text: t })))),
    r.sends.length ? el("ul", { class: "ses-sent" }, r.sends.map(({ b, m }) => el("li", {},
      el("span", { class: "ses-tape", style: `background:${LV[b.level].bg};color:${LV[b.level].fg}`, text: SHORT[b.level] }),
      el("strong", { text: title(b) }), el("span", { class: "note", text: m.flash ? "⚡ flash" : m.attempts > 1 ? `al ${m.attempts}.º intento` : "encadenado" })))) : el("p", { class: "note", text: `Probaste ${r.tried} ${r.tried === 1 ? "bloque" : "bloques"}. ¡La próxima cae!` }),
    el("div", { class: "actions" },
      el("button", { class: "btn primary", onclick: () => storySession(r) }, "📸 Compartir sesión"),
      el("button", { class: "btn", onclick: () => { SES.ended = null; closeSessionView(); render(); } }, "Cerrar"))));
  render();
}

async function storySession(r) {
  SES.ended = null; closeSessionView(); render();   // la vista previa de la historia va en la hoja lateral
  const [c, x] = await storyCanvas();
  drawHeader(x, currentGym()?.name || ""); drawFooter(x);
  const date = new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  x.fillStyle = STORY.muted; x.font = `700 46px ${BODY}`; x.fillText("SESIÓN DE HOY", 80, 400);
  x.fillStyle = STORY.ink; fitText(x, date.toUpperCase(), 920, 110); x.fillText(date.toUpperCase(), 76, 520);
  [[r.sends.length, r.sends.length === 1 ? "bloque" : "bloques"], [`+${r.points}`, "puntos"], [r.tries, "intentos"], [fmtMins(r.mins), "escalando"]].forEach(([n, label], i) => {
    const cx = 80 + (i % 2) * 470, cy = 600 + Math.floor(i / 2) * 290;
    x.fillStyle = "#222B28"; x.beginPath(); x.roundRect(cx, cy, 450, 260, 32); x.fill();
    x.fillStyle = i === 1 ? STORY.accent : STORY.ink; fitText(x, String(n), 380, 150); x.fillText(String(n), cx + 36, cy + 160);
    x.fillStyle = STORY.muted; x.font = `600 38px ${BODY}`; x.fillText(label, cx + 40, cy + 220);
  });
  let y = 1260;
  r.sends.slice(0, 5).forEach(({ b, m }) => {
    const pw = levelPill(x, LV[b.level], 80, y, 64);
    x.fillStyle = STORY.ink; fitText(x, title(b), 900 - pw - 30, 52, 800, BODY); x.fillText(title(b), 80 + pw + 24, y + 48);
    if (m.flash) { x.fillStyle = "#F5CE1B"; x.font = `800 44px ${BODY}`; x.textAlign = "right"; x.fillText("⚡", 1000, y + 48); x.textAlign = "left"; }
    y += 92;
  });
  if (r.sends.length > 5) { x.fillStyle = STORY.muted; x.font = `600 40px ${BODY}`; x.fillText(`y ${r.sends.length - 5} más`, 80, y + 30); }
  showStory(c, `Mi sesión en ${currentGym()?.name || "el rocódromo"}`);
}
