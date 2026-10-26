// «Tu mes»: resumen del mes tipo Spotify Wrapped. Pantallas a pantalla completa que se pasan tocando,
// cada una es una imagen de historia (1080x1920) que se puede compartir.
// Usa app.js (S, LEVELS…), progreso.js (mySends, pointsFor, weekIndex), historias.js (lienzo y logo) y ranking.js.

const monthKey = d => { d = new Date(d); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; };
const cap = s => s[0].toUpperCase() + s.slice(1);
const andList = a => a.length > 1 ? a.slice(0, -1).join(", ") + " y " + a[a.length - 1] : a.join("");
const WEEKDAYS = ["Los domingos", "Los lunes", "Los martes", "Los miércoles", "Los jueves", "Los viernes", "Los sábados"];
const topOf = counts => Object.entries(counts).sort((a, b) => b[1] - a[1]);
const countBy = (list, f) => list.reduce((o, x) => { for (const k of [].concat(f(x))) if (k != null && k !== "") o[k] = (o[k] || 0) + 1; return o; }, {});

// Datos del mes (back = 0 este mes, 1 el pasado) en el rocódromo elegido
function wrappedData(back) {
  const m0 = monthStart(back), key = monthKey(m0), prevKey = monthKey(monthStart(back + 1));
  const all = mySends().filter(x => x.m.sent_at);
  const sends = all.filter(x => monthKey(x.m.sent_at) === key);
  const prev = all.filter(x => monthKey(x.m.sent_at) === prevKey);
  const earlier = all.filter(x => new Date(x.m.sent_at) < m0);
  const pts = list => list.reduce((a, x) => a + pointsFor(x.b, x.m.flash), 0);
  // Semanas del mes (de lunes a domingo), hasta hoy si es el mes en curso
  const last = back ? new Date(m0.getFullYear(), m0.getMonth() + 1, 0) : new Date();
  const weeks = [];
  for (let d = new Date(m0); d <= last; d.setDate(d.getDate() + 1)) {
    const w = weekIndex(d);
    if (!weeks.length || weeks[weeks.length - 1].w !== w) weeks.push({ w, from: new Date(d), n: 0 });
  }
  sends.forEach(x => { const wk = weeks.find(k => k.w === weekIndex(x.m.sent_at)); if (wk) wk.n++; });
  const rated = sends.filter(x => statsFor(x.b.id).n > 0).sort((a, b) => statsFor(b.b.id).avg - statsFor(a.b.id).avg || gIdx(b.b.level) - gIdx(a.b.level));
  return {
    back, m0, month: monthName(m0), prevMonth: monthName(monthStart(back + 1)), year: m0.getFullYear(),
    sends, prevN: prev.length, points: pts(sends), prevPoints: pts(prev), flashes: sends.filter(x => x.m.flash).length,
    weeks, activeWeeks: weeks.filter(w => w.n).length,
    hardest: [...sends].sort((a, b) => gIdx(b.b.level) - gIdx(a.b.level) || b.m.flash - a.m.flash)[0],
    newColors: LEVELS.filter(l => sends.some(x => x.b.level === l.k) && !earlier.some(x => x.b.level === l.k)),
    styles: topOf(countBy(sends, x => x.b.styles || [])),
    sector: topOf(countBy(sends, x => x.b.sector))[0],
    weekday: topOf(countBy(sends, x => new Date(x.m.sent_at).getDay()))[0],
    best: rated[0],
  };
}

/* ---------- dibujo ---------- */
function wrapLines(x, text, maxW) {
  const lines = []; let cur = "";
  for (const w of text.split(" ")) { const t = cur ? cur + " " + w : w; if (cur && x.measureText(t).width > maxW) { lines.push(cur); cur = w; } else cur = t; }
  return cur ? [...lines, cur] : lines;
}
function para(x, text, px, py, maxW, lh) { const ls = wrapLines(x, text, maxW); ls.forEach((l, i) => x.fillText(l, px, py + i * lh)); return py + ls.length * lh; }
async function slideCanvas(bg, sub) {
  const [c, x] = await storyCanvas();
  x.fillStyle = bg; x.fillRect(0, 0, STORY.w, STORY.h);
  drawHeader(x, sub); drawFooter(x);
  return [c, x];
}
const kicker = (x, text, y, color = STORY.muted) => { x.fillStyle = color; x.font = `700 46px ${BODY}`; x.fillText(text.toUpperCase(), 80, y); };
const lvColor = l => l.solid ? "#F4F4F2" : l.bg;
const nf = n => n.toLocaleString("es-ES", { maximumFractionDigits: 1 });

async function buildSlides(d, rank) {
  const gym = currentGym()?.name || "";
  const M = cap(d.month), out = [];
  const add = (c, label) => out.push({ c, label });

  // 1 · Portada
  { const [c, x] = await slideCanvas("#0D6B5B", gym);
    LEVELS.forEach((l, i) => { x.save(); x.translate(-160 + i * 175, 1880); x.rotate(-Math.PI / 5); x.fillStyle = lvColor(l); x.beginPath(); x.roundRect(0, 0, 900, 110, 55); x.fill(); x.restore(); });
    kicker(x, d.back ? "Tu resumen de" : "Tu mes hasta ahora", 560, "#BFE3DA");
    x.fillStyle = STORY.ink; fitText(x, M.toUpperCase(), 920, 260); x.fillText(M.toUpperCase(), 76, 790);
    x.fillStyle = "#BFE3DA"; x.font = `700 56px ${BODY}`; x.fillText(String(d.year), 80, 880);
    add(c, `Tu resumen de ${d.month} en ${gym}`); }

  // 2 · Bloques
  { const [c, x] = await slideCanvas(STORY.bg, gym);
    kicker(x, `En ${d.month} encadenaste`, 520);
    x.fillStyle = STORY.accent; x.font = `900 440px ${DISPLAY}`; x.fillText(String(d.sends.length), 64, 920);
    x.fillStyle = STORY.ink; x.font = `900 96px ${DISPLAY}`; x.fillText(d.sends.length === 1 ? "BLOQUE" : "BLOQUES", 80, 1040);
    const diff = d.sends.length - d.prevN;
    const cmp = !d.prevN ? "¡Un gran comienzo!" : diff > 0 ? `${diff} más que en ${d.prevMonth} 📈` : diff < 0 ? `${-diff} menos que en ${d.prevMonth}. ¡A por el siguiente!` : `Los mismos que en ${d.prevMonth}`;
    x.fillStyle = STORY.muted; x.font = `600 50px ${BODY}`; let y = para(x, cmp, 80, 1160, 920, 66);
    x.fillStyle = "#F5CE1B"; x.font = `800 64px ${BODY}`; x.fillText(`⚡ ${d.flashes} al flash`, 80, y + 110);
    x.fillStyle = STORY.ink; x.fillText(`+${d.points} puntos`, 80, y + 210);
    add(c, `Encadenaste ${d.sends.length} bloques, ${d.flashes} al flash, ${d.points} puntos. ${cmp}`); }

  // 3 · Evolución por semanas
  { const [c, x] = await slideCanvas("#17222E", gym);
    kicker(x, "Tu evolución", 420); x.fillStyle = STORY.ink; fitText(x, "SEMANA A SEMANA", 920, 120); x.fillText("SEMANA A SEMANA", 76, 540);
    const max = Math.max(1, ...d.weeks.map(w => w.n)), n = d.weeks.length, gap = 30, bw = (920 - gap * (n - 1)) / n, base = 1330, hmax = 620;
    const bestW = d.weeks.reduce((a, w) => w.n > a.n ? w : a, d.weeks[0]);
    d.weeks.forEach((w, i) => {
      const h = Math.max(14, w.n / max * hmax), bx = 80 + i * (bw + gap);
      x.fillStyle = w === bestW && w.n ? STORY.accent : w.n ? "#5B7A8E" : "#2A3644"; x.beginPath(); x.roundRect(bx, base - h, bw, h, 18); x.fill();
      x.textAlign = "center"; x.fillStyle = STORY.ink; x.font = `900 64px ${DISPLAY}`; if (w.n) x.fillText(String(w.n), bx + bw / 2, base - h - 24);
      x.fillStyle = STORY.muted; x.font = `700 34px ${BODY}`; x.fillText(`${w.from.getDate()}/${w.from.getMonth() + 1}`, bx + bw / 2, base + 56); x.textAlign = "left";
    });
    x.fillStyle = STORY.ink; x.font = `700 52px ${BODY}`;
    let y = para(x, bestW.n ? `Tu mejor semana fue la del ${bestW.from.toLocaleDateString("es-ES", { day: "numeric", month: "long" })}: ${bestW.n} ${bestW.n === 1 ? "bloque" : "bloques"}.` : "Aún no hay semanas con bloques.", 80, 1510, 920, 68);
    x.fillStyle = STORY.muted; x.font = `600 46px ${BODY}`;
    para(x, `Escalaste ${d.activeWeeks} de ${d.weeks.length} semanas · ${d.points} puntos${d.prevN ? ` (${d.points >= d.prevPoints ? "+" : "−"}${Math.abs(d.points - d.prevPoints)} vs ${d.prevMonth})` : ""}`, 80, y + 30, 920, 60);
    add(c, `Bloques por semana: ${d.weeks.map(w => w.n).join(", ")}. Escalaste ${d.activeWeeks} de ${d.weeks.length} semanas.`); }

  // 4 · Colores
  { const [c, x] = await slideCanvas(STORY.bg, gym);
    kicker(x, "Tus colores", 420);
    const used = LEVELS.map(l => [l, d.sends.filter(s => s.b.level === l.k).length]).filter(([, n]) => n);
    const max = Math.max(...used.map(([, n]) => n));
    let y = 500;
    used.forEach(([l, n]) => {
      levelPill(x, l, 80, y, 72);
      x.fillStyle = lvColor(l); x.globalAlpha = .9; x.beginPath(); x.roundRect(400, y + 14, Math.max(20, 500 * n / max), 44, 22); x.fill(); x.globalAlpha = 1;
      x.fillStyle = STORY.ink; x.font = `900 60px ${DISPLAY}`; x.textAlign = "right"; x.fillText(String(n), 1000, y + 58); x.textAlign = "left";
      y += 104;
    });
    y = Math.max(y + 60, 1200);
    if (d.hardest) {
      kicker(x, "Tu bloque más difícil", y); const l = LV[d.hardest.b.level];
      const pw = levelPill(x, l, 80, y + 40, 72);
      if (d.hardest.m.flash) { x.fillStyle = "#F5CE1B"; x.font = `900 56px ${DISPLAY}`; x.fillText("⚡ FLASH", 80 + pw + 24, y + 96); }
      x.fillStyle = STORY.ink; fitText(x, title(d.hardest.b).toUpperCase(), 920, 110); x.fillText(title(d.hardest.b).toUpperCase(), 80, y + 230);
      y += 300;
    }
    if (d.newColors.length) { x.fillStyle = STORY.accent; x.font = `800 52px ${BODY}`; para(x, `🎉 Estrenaste ${andList(d.newColors.map(l => l.name.toLowerCase()))}`, 80, y + 20, 920, 66); }
    add(c, `Por colores: ${used.map(([l, n]) => `${l.name} ${n}`).join(", ")}.` + (d.hardest ? ` Tu bloque más difícil: ${title(d.hardest.b)} (${lvName(d.hardest.b)}).` : "") + (d.newColors.length ? ` Estrenaste ${andList(d.newColors.map(l => l.name))}.` : "")); }

  // 5 · Estilo
  if (d.styles.length) {
    const [c, x] = await slideCanvas("#2B1F3F", gym);
    const [st] = d.styles[0];
    kicker(x, `Este ${d.back ? "mes fuiste" : "mes estás siendo"}`, 560, "#CBB8E8");
    x.fillStyle = "#CBB8E8"; x.font = `900 110px ${DISPLAY}`; x.fillText("DE", 76, 690);
    x.fillStyle = STORY.ink; fitText(x, st.toUpperCase(), 920, 250); x.fillText(st.toUpperCase(), 72, 920);
    let y = 1120;
    d.styles.slice(0, 4).forEach(([s, n], i) => {
      x.fillStyle = i ? STORY.muted : "#F5CE1B"; x.font = `800 56px ${BODY}`; x.fillText(`${i + 1}. ${s}`, 80, y);
      x.textAlign = "right"; x.fillText(`${n} ${n === 1 ? "bloque" : "bloques"}`, 1000, y); x.textAlign = "left"; y += 100;
    });
    add(c, `Tu estilo del mes: ${st}. ${d.styles.slice(0, 4).map(([s, n]) => `${s} ${n}`).join(", ")}.`);
  }

  // 6 · Datos curiosos
  const facts = [
    d.sector && d.sector[1] > 1 ? ["📍", "Tu sector", d.sector[0], `${d.sector[1]} bloques`] : null,
    d.weekday && d.sends.length >= 3 ? ["📅", "Tu día", `${WEEKDAYS[d.weekday[0]]} son lo tuyo`, `${d.weekday[1]} bloques`] : null,
    d.best ? ["⭐", "El mejor valorado que encadenaste", title(d.best.b), `★ ${nf(statsFor(d.best.b.id).avg)} · ${lvName(d.best.b)}`] : null,
    d.activeWeeks ? ["🔥", "Constancia", `${d.activeWeeks} de ${d.weeks.length} semanas`, d.activeWeeks === d.weeks.length ? "¡Todas!" : "con algún encadenado"] : null,
  ].filter(Boolean);
  if (facts.length >= 2) {
    const [c, x] = await slideCanvas("#33231A", gym);
    kicker(x, "Datos curiosos", 420, "#E8C9A8");
    let y = 560;
    facts.forEach(([icon, label, value, extra]) => {
      x.font = `80px ${BODY}`; x.fillText(icon, 80, y + 70);
      x.fillStyle = "#E8C9A8"; x.font = `700 38px ${BODY}`; x.fillText(label.toUpperCase(), 210, y + 10);
      x.fillStyle = STORY.ink; fitText(x, value, 790, 76, 800, BODY); x.fillText(value, 210, y + 95);
      x.fillStyle = STORY.muted; x.font = `600 40px ${BODY}`; x.fillText(extra, 210, y + 150);
      y += 290;
    });
    add(c, facts.map(f => `${f[1]}: ${f[2]} (${f[3]})`).join(". "));
  }

  // 7 · Ranking
  if (rank) {
    const [c, x] = await slideCanvas("#12302A", gym);
    const l = LV[rank.league];
    kicker(x, d.back ? `Terminaste ${d.month}` : "Ahora mismo vas", 520, "#A7D9CC");
    x.fillStyle = rank.pos <= 3 ? "#F5CE1B" : STORY.ink; x.font = `900 460px ${DISPLAY}`; x.fillText(`${rank.pos}.º`, 64, 940);
    x.fillStyle = STORY.ink; x.font = `700 56px ${BODY}`; x.fillText(`de ${rank.total} en la liga`, 80, 1060);
    levelPill(x, l, 80, 1110, 90);
    x.fillStyle = "#A7D9CC"; x.font = `800 64px ${BODY}`; x.fillText(`${rank.points} puntos${["", " · 🥇", " · 🥈", " · 🥉"][rank.pos] || ""}`, 80, 1320);
    add(c, `${d.back ? "Terminaste" : "Vas"} ${rank.pos}.º de ${rank.total} en la liga ${l.name} con ${rank.points} puntos.`);
  }

  // 8 · Resumen para compartir
  { const [c, x] = await slideCanvas(STORY.bg, gym);
    kicker(x, d.back ? "Mi resumen de" : "Mi mes hasta ahora", 400);
    x.fillStyle = STORY.ink; fitText(x, `${M.toUpperCase()} ${d.year}`, 920, 140); x.fillText(`${M.toUpperCase()} ${d.year}`, 76, 540);
    const top = d.hardest ? LV[d.hardest.b.level] : null;
    const tiles = [[d.sends.length, d.sends.length === 1 ? "bloque" : "bloques"], [d.points, "puntos"], [d.flashes, "al flash"],
      rank ? [`${rank.pos}.º`, `liga ${LV[rank.league].name.toLowerCase()}`] : [d.activeWeeks, d.activeWeeks === 1 ? "semana activa" : "semanas activas"]];
    tiles.forEach(([n, label], i) => {
      const cx = 80 + (i % 2) * 470, cy = 620 + Math.floor(i / 2) * 290;
      x.fillStyle = "#222B28"; x.beginPath(); x.roundRect(cx, cy, 450, 260, 32); x.fill();
      x.fillStyle = i === 1 ? STORY.accent : STORY.ink; x.font = `900 150px ${DISPLAY}`; x.fillText(String(n), cx + 36, cy + 160);
      x.fillStyle = STORY.muted; x.font = `600 38px ${BODY}`; x.fillText(label, cx + 40, cy + 220);
    });
    let y = 1280;
    if (top) { kicker(x, "Color más difícil", y); levelPill(x, top, 80, y + 36, 80); y += 190; }
    if (d.styles.length) { kicker(x, "Estilo del mes", y); x.fillStyle = STORY.ink; x.font = `900 92px ${DISPLAY}`; x.fillText(d.styles[0][0].toUpperCase(), 80, y + 100); }
    add(c, `Resumen: ${d.sends.length} bloques, ${d.points} puntos, ${d.flashes} al flash.`); }

  for (const s of out) s.blob = await new Promise(r => s.c.toBlob(r, "image/png"));
  return out;
}

/* ---------- visor a pantalla completa ---------- */
async function myRankFor(back) {
  if (!S.session) return null;
  try {
    const r = await Promise.race([sb.rpc("ranking", { p_gym: S.gym, p_month: back ? ymd(monthStart(back)) : null }), new Promise(res => setTimeout(() => res({ error: "tiempo" }), 4000))]);
    const me = (r.data || []).find(x => x.is_me);
    if (r.error || !me || !me.sends) return null;
    const league = r.data.filter(x => x.league === me.league);
    return { league: me.league, points: me.points, pos: league.indexOf(me) + 1, total: league.length };
  } catch (e) { return null; }
}

async function shareSlide(s, name) {
  const file = new File([s.blob], "xlp-boulder.png", { type: "image/png" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name, text: `${name} · ${STORY.url}` }); }
    catch (e) { if (e?.name !== "AbortError") toast("No se pudo compartir. Prueba a guardar la imagen."); }
    return;
  }
  const a = el("a", { href: URL.createObjectURL(s.blob), download: "xlp-boulder.png" });
  document.body.append(a); a.click(); a.remove(); toast("Imagen guardada");
}

const seenWrapped = () => store.get("lb-wrapped-seen", []);
const wrappedId = back => `${S.gym}|${monthKey(monthStart(back))}`;
async function openWrapped(back) {
  const d = wrappedData(back);
  if (!d.sends.length) return toast("Todavía no hay encadenados ese mes");
  if (back) { store.set("lb-wrapped-seen", [...new Set([...seenWrapped(), wrappedId(back)])].slice(-24)); render(); }
  const loading = el("div", { class: "wrapped", role: "dialog", "aria-modal": "true", "aria-label": "Tu resumen del mes" }, el("p", { class: "wr-loading", text: "Preparando tu resumen…" }));
  document.body.append(loading); document.body.style.overflow = "hidden";
  const slides = await buildSlides(d, await myRankFor(back));
  loading.remove();
  wrappedViewer(slides, `Mi ${d.month} en ${currentGym()?.name || "el rocódromo"}`);
}

function wrappedViewer(slides, name) {
  const DUR = 6000, reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let i = 0, t = 0, last = 0, paused = false, raf = 0, downAt = 0;
  const bars = slides.map(() => el("span", { class: "wr-bar" }, el("i")));
  const stage = el("div", { class: "wr-stage" });
  const live = el("p", { class: "sr-only", "aria-live": "polite" });
  const shareBtn = el("button", { class: "btn primary", onclick: () => shareSlide(slides[i], name) }, "📸 Compartir");
  const root = el("div", { class: "wrapped", role: "dialog", "aria-modal": "true", "aria-label": name },
    el("div", { class: "wr-bars" }, bars),
    el("button", { class: "wr-x", "aria-label": "Cerrar", onclick: close }, "×"),
    stage, live,
    el("div", { class: "wr-actions" },
      el("button", { class: "btn", "aria-label": "Anterior", onclick: () => go(i - 1) }, "‹"), shareBtn,
      el("button", { class: "btn", "aria-label": "Siguiente", onclick: () => go(i + 1) }, "›")));
  function show() {
    const s = slides[i];
    s.c.className = "wr-slide" + (reduce ? "" : " in"); s.c.setAttribute("role", "img"); s.c.setAttribute("aria-label", s.label);
    stage.replaceChildren(s.c); live.textContent = `${i + 1} de ${slides.length}. ${s.label}`;
    bars.forEach((b, k) => b.firstChild.style.width = k < i ? "100%" : "0%");
    shareBtn.textContent = i === slides.length - 1 ? "📸 Compartir resumen" : "📸 Compartir";
    t = 0;
  }
  function go(n) { if (n < 0) n = 0; if (n >= slides.length) return; i = n; show(); }
  function tick(now) {
    if (last && !paused && i < slides.length - 1) { t += now - last; if (t >= DUR) go(i + 1); }
    if (i === slides.length - 1) t = DUR;
    bars[i].firstChild.style.width = Math.min(100, t / DUR * 100) + "%";
    last = now; raf = requestAnimationFrame(tick);
  }
  function close() { cancelAnimationFrame(raf); document.removeEventListener("keydown", onKey); root.remove(); document.body.style.overflow = ""; }
  function onKey(e) { if (e.key === "Escape") close(); if (e.key === "ArrowRight") go(i + 1); if (e.key === "ArrowLeft") go(i - 1); }
  // Tocar a la izquierda vuelve, a la derecha avanza; mantener pulsado pausa
  stage.addEventListener("pointerdown", () => { paused = true; downAt = Date.now(); });
  stage.addEventListener("pointercancel", () => paused = false);
  stage.addEventListener("pointerup", e => {
    paused = false;
    if (Date.now() - downAt > 300) return;
    const r = stage.getBoundingClientRect();
    go(e.clientX - r.left < r.width / 3 ? i - 1 : i + 1);
  });
  document.addEventListener("keydown", onKey);
  document.body.append(root); document.body.style.overflow = "hidden";
  show(); raf = requestAnimationFrame(tick);
  root.querySelector(".wr-x").focus();
}

// Aviso de que el resumen del mes pasado está listo: punto en «Mi progreso» y un aviso una vez al mes
function wrappedPending() { return S.loaded && !S.error && wrappedData(1).sends.length > 0 && !seenWrapped().includes(wrappedId(1)); }
function markWrapped() {
  const pending = wrappedPending();
  document.querySelector('[data-page="progreso"]')?.classList.toggle("has-new", pending);
  if (pending && store.get("lb-wrapped-toast", "") !== wrappedId(1)) {
    store.set("lb-wrapped-toast", wrappedId(1));
    setTimeout(() => toast(`🎁 Tu resumen de ${monthName(monthStart(1))} está listo en «Mi progreso»`), 600);
  }
}
