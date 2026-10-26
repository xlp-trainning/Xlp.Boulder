// Mi progreso: puntos por color, rachas semanales, medallas y «tu siguiente reto».
// Usa el estado y las utilidades de app.js (S, LEVELS, el(), card(), toast()…).

// Puntos por nivel; el flash suma la mitad más (redondeando hacia arriba)
const POINTS = { azul: 1, verde: 2, naranja: 3, amarillo: 4, morado: 5, rojo: 6, negro: 7, compe: 8 };
const pointsFor = (b, flash) => { const p = POINTS[b.level] || 0; return p + (flash ? Math.ceil(p / 2) : 0); };

// Encadenados de este rocódromo, también de bloques ya desmontados
const mySends = () => S.blocks.filter(b => S.mine[b.id]?.sent).map(b => ({ b, m: S.mine[b.id] }));

// Semana (de lunes a domingo) en la que cae una fecha, como número correlativo
function weekIndex(d) {
  const t = new Date(d); t.setHours(12, 0, 0, 0); t.setDate(t.getDate() - (t.getDay() + 6) % 7);
  return Math.round(t.getTime() / (7 * 864e5));
}
// Rachas: semanas seguidas con al menos un encadenado, en cualquier rocódromo
function streaks() {
  const weeks = new Set(Object.values(S.mine).filter(m => m.sent && m.sent_at).map(m => weekIndex(m.sent_at)));
  const now = weekIndex(Date.now());
  let cur = 0, w = weeks.has(now) ? now : now - 1;
  while (weeks.has(w)) { cur++; w--; }
  let best = 0;
  for (const x of weeks) if (!weeks.has(x - 1)) { let n = 0; while (weeks.has(x + n)) n++; best = Math.max(best, n); }
  return { cur, best, thisWeek: weeks.has(now) };
}

function progressCtx() {
  const sends = mySends();
  const month = new Date().toISOString().slice(0, 7);
  const monthSends = sends.filter(x => (x.m.sent_at || "").slice(0, 7) === month);
  const styles = new Set(sends.flatMap(x => x.b.styles || []));
  // Sector completo: todos los bloques abiertos de un sector (con 3 o más) encadenados
  const bySector = {};
  S.blocks.filter(b => b.active && b.sector).forEach(b => (bySector[b.sector] ||= []).push(b));
  const fullSector = Object.values(bySector).some(list => list.length >= 3 && list.every(b => S.mine[b.id]?.sent));
  const st = streaks();
  return {
    sends, monthSends, styles: styles.size, fullSector, streak: st,
    flashes: sends.filter(x => x.m.flash).length,
    points: sends.reduce((a, x) => a + pointsFor(x.b, x.m.flash), 0),
    monthPoints: monthSends.reduce((a, x) => a + pointsFor(x.b, x.m.flash), 0),
    top: [...LEVELS].reverse().find(l => sends.some(x => x.b.level === l.k)),
  };
}

const MEDALS = [
  ...LEVELS.map(l => ({ id: "first-" + l.k, icon: "🎯", color: l.bg, name: `Primer ${l.name.toLowerCase()}`, desc: `Encadena un bloque ${l.name.toLowerCase()}`,
    test: c => c.sends.some(x => x.b.level === l.k) })),
  { id: "flash1", icon: "⚡", name: "Primer flash", desc: "Haz un bloque a la primera", test: c => c.flashes >= 1 },
  { id: "flash10", icon: "⚡", name: "10 flashes", desc: "Diez bloques a la primera", goal: c => [c.flashes, 10] },
  { id: "sends10", icon: "🧗", name: "10 encadenados", desc: "Encadena diez bloques", goal: c => [c.sends.length, 10] },
  { id: "sends50", icon: "🧗", name: "50 encadenados", desc: "Encadena cincuenta bloques", goal: c => [c.sends.length, 50] },
  { id: "pts100", icon: "💯", name: "100 puntos", desc: "Suma cien puntos", goal: c => [c.points, 100] },
  { id: "fresh", icon: "🆕", name: "Recién montado", desc: "Encadena un bloque en su primera semana",
    test: c => c.sends.some(x => x.m.sent_at && x.b.set_date && (new Date(x.m.sent_at) - new Date(x.b.set_date + "T00:00:00")) / 864e5 < 7) },
  { id: "sector", icon: "🗺️", name: "Sector completo", desc: "Encadena todos los bloques abiertos de un sector (mínimo 3)", test: c => c.fullSector },
  { id: "styles", icon: "🎨", name: "Todoterreno", desc: "Encadena bloques de 6 estilos distintos", goal: c => [c.styles, 6] },
  { id: "streak4", icon: "🔥", name: "Racha de 4 semanas", desc: "Encadena algo 4 semanas seguidas", goal: c => [c.streak.best, 4] },
  { id: "streak12", icon: "🔥", name: "Racha de 12 semanas", desc: "Encadena algo 12 semanas seguidas", goal: c => [c.streak.best, 12] },
];
const medalDone = (m, c) => m.test ? m.test(c) : (([v, g]) => v >= g)(m.goal(c));
const earnedMedals = () => { const c = progressCtx(); return new Set(MEDALS.filter(m => medalDone(m, c)).map(m => m.id)); };

// Al encadenar: puntos ganados y medallas nuevas
function celebrate(id, next, before) {
  const b = S.blocks.find(x => x.id === id); if (!b) return;
  const fresh = [...earnedMedals()].filter(m => !before.medals.has(m)).map(m => MEDALS.find(x => x.id === m));
  const lg = myLeague();
  toast([`+${pointsFor(b, next.flash)} puntos${next.flash ? " ⚡" : ""}`,
    lg.ord > before.league ? `⬆️ ¡Subes a la liga ${lg.l.name}!` : null,
    fresh.length ? `🏅 ${fresh.map(m => m.name).join(", ")}` : null].filter(Boolean).join(" · "));
}

// «Tu siguiente reto»: bloques abiertos sin encadenar, cerca de tu nivel, de estilos que tocas poco
function recommendations(n = 3) {
  const sends = mySends();
  const lvl = sends.length ? Math.max(...sends.map(x => gIdx(x.b.level))) : 0;
  const used = {}; sends.forEach(x => (x.b.styles || []).forEach(s => used[s] = (used[s] || 0) + 1));
  return S.blocks.filter(b => b.active && !S.mine[b.id]?.sent).map(b => {
    const d = gIdx(b.level) - lvl;
    let score = { 0: 3, 1: 2.6, "-1": 1.4, 2: .6 }[d] ?? -3;
    const fresh = (b.styles || []).filter(s => !used[s]);
    score += Math.min(1.5, (b.styles || []).reduce((a, s) => a + 1 / (1 + (used[s] || 0)), 0) * .6);
    if (isNew(b)) score += .8;
    if (S.mine[b.id]?.project) score += 1;
    score += (statsFor(b.id).avg || 0) * .15;
    const why = S.mine[b.id]?.project ? "Es tu proyecto"
      : d >= 1 ? `Un paso más: ${lvName(b).toLowerCase()}`
      : fresh.length && sends.length ? `Estilo nuevo para ti: ${fresh[0].toLowerCase()}`
      : isNew(b) ? "Recién montado" : d === 0 ? "De tu nivel" : "Para sumar puntos";
    return { b, score, why };
  }).sort((a, b) => b.score - a.score).slice(0, n);
}

function renderProgreso() {
  const root = $("page-progreso");
  const c = progressCtx(), st = c.streak;
  const open = S.blocks.filter(b => b.active);
  const sentOpen = open.filter(b => S.mine[b.id]?.sent);
  const projects = S.blocks.filter(b => b.active && S.mine[b.id]?.project && !S.mine[b.id]?.sent);
  const recs = recommendations();
  const kpi = (n, l, extra) => el("div", { class: "kpi" }, el("span", { class: "kpi-n", text: n }), el("span", { class: "note", text: l }), extra || null);
  const earned = MEDALS.filter(m => medalDone(m, c)), pending = MEDALS.filter(m => !medalDone(m, c));
  const medal = (m, done) => {
    const g = m.goal ? m.goal(c) : null;
    return el("div", { class: "medal" + (done ? " done" : ""), title: m.desc },
      el("span", { class: "medal-icon", style: m.color ? `--medal:${m.color}` : null, text: m.icon }),
      el("span", { class: "medal-name", text: m.name }),
      done ? el("span", { class: "note", text: "Conseguida" })
        : g ? el("span", { class: "medal-bar" }, el("span", { style: `width:${Math.min(100, g[0] / g[1] * 100)}%` }), el("em", { text: `${Math.min(g[0], g[1])}/${g[1]}` }))
        : el("span", { class: "note", text: m.desc }));
  };

  root.replaceChildren(...[
    el("div", { class: "kpis" },
      kpi(c.points, "puntos", el("span", { class: "note", text: `${c.monthPoints} este mes` })),
      kpi(st.cur ? `🔥 ${st.cur}` : "0", st.cur === 1 ? "semana seguida" : "semanas seguidas", el("span", { class: "note", text: `Mejor racha: ${st.best}` })),
      kpi(c.sends.length, "encadenados", el("span", { class: "note", text: `⚡ ${c.flashes} al flash` })),
      kpi(c.top ? c.top.name : "—", "nivel más alto", c.top ? el("span", { class: "kpi-tape", style: `background:${c.top.bg}` }) : null)),
    st.cur > 0 && !st.thisWeek ? el("div", { class: "banner" }, `🔥 Encadena algo esta semana para no perder tu racha de ${st.cur} ${st.cur === 1 ? "semana" : "semanas"}.`) : null,

    el("section", { class: "section" }, el("span", { class: "label", text: "Tu siguiente reto" }),
      recs.length ? el("div", { class: "grid" }, recs.map(r => el("div", { class: "rec" }, el("span", { class: "rec-why", text: r.why }), card(r.b))))
        : el("p", { class: "note", text: open.length ? "¡Lo tienes todo encadenado! Vuelve cuando haya bloques nuevos." : "Cuando haya bloques abiertos, aquí te propondremos tres para ti." })),

    el("section", { class: "section" }, el("span", { class: "label", text: `Medallas · ${earned.length} de ${MEDALS.length}` }),
      el("div", { class: "medals" }, earned.map(m => medal(m, true)), pending.map(m => medal(m, false)))),

    el("section", { class: "section" }, el("span", { class: "label", text: `Por nivel · ${sentOpen.length} de ${open.length} abiertos` }),
      el("div", { class: "levels" }, LEVELS.map(l => {
        const tot = open.filter(b => b.level === l.k).length;
        const got = sentOpen.filter(b => b.level === l.k).length;
        return el("button", { class: "lvl-row", disabled: !tot, onclick: () => { S.level = l.k; S.view = "open"; setPage("bloques"); } },
          el("span", { class: "lvl-name" }, levelDot(l.k), l.name),
          el("span", { class: "lvl-track" }, el("span", { class: "lvl-fill", style: `width:${tot ? got / tot * 100 : 0}%;background:${l.bg}` })),
          el("span", { class: "mono lvl-n", text: tot ? `${got}/${tot}` : "—" }));
      }))),

    el("section", { class: "section" }, el("span", { class: "label", text: "Proyectos en curso" }),
      projects.length ? el("div", { class: "grid" }, projects.map(card))
        : el("p", { class: "note", text: "Marca «Es mi proyecto» en los bloques que estés probando para tenerlos a mano aquí." })),

    el("div", { class: "actions" }, el("button", { class: "btn primary", disabled: !c.monthSends.length, onclick: storyMonth }, "📸 Compartir mi mes en historias")),
    el("p", { class: "note", text: "Puntos por color: azul 1, verde 2, naranja 3, amarillo 4, morado 5, rojo 6, negro 7 y compe 8; el flash suma la mitad más. Tu progreso se guarda en este móvil, sin cuenta." })].filter(Boolean));
}
