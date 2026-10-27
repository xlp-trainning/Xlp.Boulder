// Grado real de cada bloque dentro de su color, tu nivel real (tipo Elo), tu perfil de escalador por estilos
// y el plan de la semana contra tu punto débil. Todo sale de lo que ya apunta la gente (intentos, flashes, sensaciones).
// Usa app.js (S, statsFor, LEVELS…) y progreso.js (weekIndex).

const BASE = Object.fromEntries(LEVELS.map((l, i) => [l.k, 1000 + i * 150]));   // azul 1000 … compe 2050
const DIFF_MIN = 3;    // gente que lo ha probado o votado para fiarse del dato
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Dificultad «en bruto» de un bloque según la gente: sensación, intentos, flashes y cuántos lo sacan de los que lo prueban
function rawDiff(id) {
  const st = statsFor(id);
  const feelN = st.soft + st.fair + st.hard, tried = st.sends + st.projects;
  const n = Math.max(feelN, tried);
  if (n < DIFF_MIN) return null;
  const feel = feelN ? (st.hard - st.soft) / feelN : 0;
  const att = st.attempts ? clamp((st.attempts - 2.5) / 3, -1, 1) : 0;
  const flash = st.sends ? clamp((st.flashes / st.sends - .3) / .3, -1, 1) : 0;
  const rate = tried ? clamp((st.sends / tried - .6) / .4, -1, 1) : 0;
  return .45 * feel + .25 * att - .15 * flash - .15 * rate;
}
// Posición del bloque entre los de su color (0 = el más fácil, 1 = el más duro), si hay datos
function blockDiff(b) {
  const r = rawDiff(b.id);
  if (r == null) return null;
  const peers = S.blocks.filter(x => x.level === b.level && x.id !== b.id).map(x => rawDiff(x.id)).filter(v => v != null);
  const p = peers.length >= 2 ? peers.filter(v => v < r).length / peers.length + peers.filter(v => v === r).length / (2 * peers.length) : (r + 1) / 2;
  return clamp(p, 0, 1);
}
const DIFF_LABELS = ["de los más fáciles", "algo fácil", "en la media", "algo duro", "de los más duros"];
const diffLabel = p => DIFF_LABELS[Math.min(4, Math.floor(p * 5))];
// Valor de un bloque en la escala de nivel: base del color ± 60 según su dificultad real
const blockRating = b => (BASE[b.level] || 1000) + Math.round(((blockDiff(b) ?? .5) - .5) * 120);

// En la ficha: termómetro de dificultad dentro del color
function diffBox(b) {
  const p = blockDiff(b), l = LV[b.level];
  return el("div", { class: "diff" },
    el("span", { class: "label", text: `Dificultad para ser ${l.name.toLowerCase()}` }),
    p == null ? el("p", { class: "note", text: "Aún no hay datos suficientes. Sale cuando 3 personas lo han probado o votado su sensación." })
      : [el("div", { class: "diff-bar", role: "img", "aria-label": `${Math.round(p * 100)} de 100: ${diffLabel(p)}` },
          el("span", { class: "diff-mark", style: `left:${p * 100}%` })),
        el("div", { class: "diff-ends" }, el("span", { text: "más fácil" }), el("strong", { text: cap(diffLabel(p)) }), el("span", { text: "más duro" }))]);
}

/* ---------- tu nivel real ---------- */
// Cada encadenado vale lo que el bloque, más un extra si fue con pocos intentos
const sendPerf = (b, m) => blockRating(b) + (m.flash ? 50 : m.attempts === 2 ? 25 : m.attempts === 3 ? 15 : m.attempts > 0 && m.attempts <= 5 ? 5 : 0);
// Nivel = media de tus 10 mejores encadenados de los últimos 90 días (en este rocódromo); hacen falta 3
function levelAt(t = Date.now()) {
  const from = t - 90 * 864e5;
  const perfs = S.blocks.filter(b => { const m = S.mine[b.id]; if (!m?.sent || !m.sent_at) return false; const s = new Date(m.sent_at).getTime(); return s <= t && s >= from; })
    .map(b => sendPerf(b, S.mine[b.id])).sort((a, b) => b - a).slice(0, 10);
  return perfs.length >= 3 ? Math.round(perfs.reduce((a, v) => a + v, 0) / perfs.length) : null;
}
const levelColor = v => [...LEVELS].reverse().find(l => v >= BASE[l.k] - 75) || LEVELS[0];

/* ---------- perfil: estilos de escalada y tipos de agarre ---------- */
// Dos arañas de 6 ejes cada una. Cada eje junta las etiquetas del bloque que se parecen
const STYLE_AXES = [["Placa", ["Placa", "Equilibrio"]], ["Vertical", ["Vertical", "Diedro", "Arista"]], ["Desplome", ["Desplome"]],
  ["Techo", ["Techo", "Talonajes"]], ["Dinámico", ["Dinámico", "Coordinación"]], ["Compresión", ["Compresión"]]];
const GRIP_AXES = GRIPS.map(g => [g, [g]]);
const AXES = [...STYLE_AXES, ...GRIP_AXES];
const inAxis = (b, ax) => (b.styles || []).some(s => ax[1].includes(s));
function profile() {
  const lvl = levelAt();
  if (lvl == null) return null;
  const axes = AXES.map(ax => {
    const perfs = S.blocks.filter(b => S.mine[b.id]?.sent && inAxis(b, ax)).map(b => sendPerf(b, S.mine[b.id])).sort((a, b) => b - a).slice(0, 3);
    const v = perfs.length ? perfs.reduce((a, x) => a + x, 0) / perfs.length : null;
    return { name: ax[0], styles: ax[1], n: perfs.length, score: v == null ? 0 : Math.round(clamp((v - (lvl - 450)) / 500, 0, 1) * 100) };
  });
  // Para el punto fuerte y el débil solo cuentan los ejes con bloques abiertos (si no, no hay con qué entrenarlo)
  const avail = axes.filter(a => S.blocks.some(b => b.active && inAxis(b, [a.name, a.styles])));
  const rank = list => [...list].sort((a, b) => a.score - b.score);
  const group = list => { const r = rank(list.filter(a => avail.includes(a))); return { axes: list, weak: r[0] || null, strong: r.length > 1 ? r[r.length - 1] : null }; };
  const ranked = rank(avail);
  return { lvl, axes, ranked, styles: group(axes.slice(0, STYLE_AXES.length)), grips: group(axes.slice(STYLE_AXES.length)), weak: ranked[0], strong: ranked[ranked.length - 1] };
}
function radarSvg(axes, size = 260) {
  const c = size / 2, r = size / 2 - 40, N = axes.length;
  const pt = (i, f) => { const a = -Math.PI / 2 + i * 2 * Math.PI / N; return [c + Math.cos(a) * r * f, c + Math.sin(a) * r * f]; };
  const ring = f => axes.map((_, i) => pt(i, f).join(",")).join(" ");
  const shape = axes.map((a, i) => pt(i, Math.max(.04, a.score / 100)).join(",")).join(" ");
  const svg = `<svg viewBox="0 0 ${size} ${size}" class="radar" role="img" aria-label="Perfil por estilos: ${axes.map(a => `${a.name} ${a.score}`).join(", ")}">
    ${[.25, .5, .75, 1].map(f => `<polygon points="${ring(f)}" class="radar-ring"/>`).join("")}
    ${axes.map((_, i) => `<line x1="${c}" y1="${c}" x2="${pt(i, 1)[0]}" y2="${pt(i, 1)[1]}" class="radar-ring"/>`).join("")}
    <polygon points="${shape}" class="radar-shape"/>
    ${axes.map((a, i) => { const [x, y] = pt(i, 1.2); return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" class="radar-label">${a.name}</text>`; }).join("")}
  </svg>`;
  const s = el("div", { class: "radar-box" }); s.innerHTML = svg; return s;
}

/* ---------- plan de la semana ---------- */
function weekPlan(pf) {
  if (!pf?.weak) return null;
  const key = `lb-plan-${S.gym}-${weekIndex(Date.now())}`;
  let plan = store.get(key, null);
  const valid = id => S.blocks.some(b => b.id === id && b.active);
  if (!plan || plan.ids.filter(valid).length < Math.min(3, plan.ids.length)) {
    // El estilo más flojo que tenga bloques abiertos sin hacer
    plan = null;
    for (const a of pf.ranked) {
      const ax = AXES.find(x => x[0] === a.name);
      const pick = S.blocks.filter(b => b.active && !S.mine[b.id]?.sent && inAxis(b, ax))
        .map(b => ({ b, d: Math.abs(blockRating(b) - (pf.lvl - 50)) })).sort((x, y) => x.d - y.d).slice(0, 3).map(x => x.b.id);
      if (pick.length) { plan = { axis: a.name, ids: pick }; break; }
    }
    if (!plan) return null;
    store.set(key, plan);
  }
  return { axis: plan.axis, blocks: plan.ids.map(id => S.blocks.find(b => b.id === id)).filter(Boolean) };
}

/* ---------- sección en «Mi progreso» ---------- */
function levelSection() {
  const lvl = levelAt();
  if (lvl == null) return el("section", { class: "section" }, el("span", { class: "label", text: "Tu nivel real" }),
    el("p", { class: "note", text: "Encadena 3 bloques (en los últimos 90 días) para tener tu nivel real, tu perfil de escalador y tu plan semanal." }));
  const before = levelAt(Date.now() - 30 * 864e5), delta = before == null ? null : lvl - before;
  const pf = profile(), plan = weekPlan(pf), lc = levelColor(lvl);
  const done = plan ? plan.blocks.filter(b => S.mine[b.id]?.sent).length : 0;
  return el("div", { class: "lvl-wrap" },
    el("section", { class: "section lvl-card", style: `--lg:${lc.solid ? "#8A8F8C" : lc.bg}` },
      el("span", { class: "label", text: "Tu nivel real" }),
      el("div", { class: "lvl-big" }, el("strong", { text: lvl.toLocaleString("es-ES") }),
        delta != null ? el("span", { class: "lvl-delta" + (delta >= 0 ? " up" : " down"), text: `${delta >= 0 ? "+" : "−"}${Math.abs(delta)} este mes` }) : null),
      el("p", { class: "note", text: `Como un ${lc.name.toLowerCase()} ${lvl >= BASE[lc.k] + 40 ? "alto" : lvl <= BASE[lc.k] - 40 ? "bajo" : "medio"}. Sale de tus 10 mejores encadenados de los últimos 90 días: cuenta el color, lo duro que es cada bloque según la gente y los intentos que te costó.` })),
    pf ? el("section", { class: "section" }, el("span", { class: "label", text: "Tu perfil de escalador" }),
      el("div", { class: "radars" },
        [["Estilos de escalada", pf.styles], ["Tipos de agarre", pf.grips]].map(([t, g]) => el("div", { class: "radar-card" },
          el("h3", { class: "radar-title", text: t }),
          radarSvg(g.axes),
          g.strong || g.weak ? el("p", { class: "note pf-line" },
            g.strong ? [el("span", {}, ico("trendUp", "sm"), "Punto fuerte:"), el("strong", { text: g.strong.name })] : null,
            g.weak ? [el("span", {}, ico("target", "sm"), "A mejorar:"), el("strong", { text: g.weak.name })] : null) : null))),
      el("p", { class: "note", text: "Cada eje sale de tus mejores encadenados con esa etiqueta. Los ejes sin bloques abiertos no cuentan para el punto débil." }),
      el("div", { class: "actions" }, el("button", { class: "btn", onclick: () => storyProfile(pf) }, ico("camera"), "Compartir mi perfil"))) : null,
    plan ? el("section", { class: "section" }, el("span", { class: "label", text: `Tu plan de la semana · ${plan.axis.toLowerCase()}` }),
      el("p", { class: "note", text: `Tres bloques de ${plan.axis.toLowerCase()} cerca de tu nivel para mejorar tu punto débil. ${done} de ${plan.blocks.length} hechos${done === plan.blocks.length ? ". ¡Completo!" : ""}. Cada lunes, plan nuevo.` }),
      el("div", { class: "grid" }, plan.blocks.map(card))) : null);
}

async function storyProfile(pf) {
  const [c, x] = await storyCanvas();
  drawHeader(x, currentGym()?.name || ""); drawFooter(x);
  x.fillStyle = STORY.muted; x.font = `800 44px ${BODY}`; x.fillText("MI PERFIL DE ESCALADOR", 80, 380);
  x.fillStyle = STORY.accent; x.font = `900 150px ${DISPLAY}`; x.fillText(pf.lvl.toLocaleString("es-ES"), 72, 530);
  const lw = x.measureText(pf.lvl.toLocaleString("es-ES")).width;
  x.fillStyle = STORY.ink; x.font = `700 44px ${BODY}`; x.fillText("nivel real", 100 + lw, 528);
  // Dos arañas, una debajo de otra: estilos y agarres
  const radar = (g, title, top) => {
    tapeLabel(x, title.toUpperCase(), 80, top, 56);
    const cx = 540, cy = top + 320, r = 190, N = g.axes.length;
    const pt = (i, f) => { const a = -Math.PI / 2 + i * 2 * Math.PI / N; return [cx + Math.cos(a) * r * f, cy + Math.sin(a) * r * f]; };
    x.strokeStyle = "#3A4642"; x.lineWidth = 3;
    [.25, .5, .75, 1].forEach(f => { x.beginPath(); g.axes.forEach((_, i) => { const [px, py] = pt(i, f); i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.closePath(); x.stroke(); });
    x.beginPath(); g.axes.forEach((a, i) => { const [px, py] = pt(i, Math.max(.04, a.score / 100)); i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.closePath();
    x.fillStyle = "rgba(76,195,168,.45)"; x.fill(); x.strokeStyle = STORY.accent; x.lineWidth = 6; x.stroke();
    x.fillStyle = STORY.ink; x.font = `800 36px ${BODY}`; x.textAlign = "center"; x.textBaseline = "middle";
    g.axes.forEach((a, i) => { const [px, py] = pt(i, 1.24); x.fillText(a.name, px, py); });
    x.textAlign = "left"; x.textBaseline = "alphabetic";
    if (g.strong) { x.fillStyle = STORY.ink; x.font = `700 34px ${BODY}`; x.textAlign = "right"; x.fillText(`Fuerte: ${g.strong.name}`, 1000, top + 30); x.textAlign = "left"; }
  };
  radar(pf.styles, "Estilos", 580);
  radar(pf.grips, "Agarres", 1190);
  showStory(c, "Mi perfil de escalador");
}
