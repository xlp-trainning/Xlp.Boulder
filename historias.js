// Tarjetas para historias de Instagram (1080x1920): un bloque encadenado o el resumen del mes.
// Usa el estado y las utilidades de app.js y progreso.js.

const STORY = { w: 1080, h: 1920, bg: "#18201E", ink: "#F8FAF9", muted: "#AEBBB6", accent: "#4CC3A8", url: "xlp-trainning.github.io/Xlp.Boulder" };
const DISPLAY = '"Big Shoulders Display", Impact, "Arial Narrow", sans-serif', BODY = 'Figtree, system-ui, sans-serif';

async function storyCanvas() {
  try { await Promise.all([document.fonts.load(`900 100px ${DISPLAY}`), document.fonts.load(`700 40px ${BODY}`)]); } catch (e) {}
  const c = document.createElement("canvas"); c.width = STORY.w; c.height = STORY.h;
  const x = c.getContext("2d"); x.fillStyle = STORY.bg; x.fillRect(0, 0, STORY.w, STORY.h);
  return [c, x];
}
// Logo: X de dos tiras de cinta y el punto, como el icono de la app
function drawMark(x, cx, cy, s) {
  x.save(); x.translate(cx, cy);
  x.fillStyle = "#26302D"; x.beginPath(); x.roundRect(-s / 2, -s / 2, s, s, s * .22); x.fill();
  const tape = (rot, color) => { x.save(); x.rotate(rot); x.fillStyle = color; x.beginPath(); x.roundRect(-s * .33, -s * .09, s * .66, s * .18, s * .03); x.fill(); x.restore(); };
  x.translate(-s * .04, -s * .04); tape(Math.PI / 4, "#F5CE1B"); tape(-Math.PI / 4, "#4CC3A8"); x.translate(s * .04, s * .04);
  x.fillStyle = STORY.ink; x.beginPath(); x.arc(s * .32, s * .32, s * .085, 0, Math.PI * 2); x.fill();
  x.restore();
}
function drawHeader(x, sub) {
  drawMark(x, 130, 150, 110);
  x.fillStyle = STORY.ink; x.font = `900 84px ${DISPLAY}`; x.textBaseline = "alphabetic";
  x.fillText("XLP", 210, 178); const w = x.measureText("XLP").width;
  x.fillStyle = STORY.accent; x.fillText(".", 210 + w, 178);
  x.fillStyle = STORY.ink; x.fillText("BOULDER", 210 + w + x.measureText(".").width, 178);
  x.fillStyle = STORY.muted; x.font = `600 34px ${BODY}`; x.fillText(sub, 212, 228);
}
function drawFooter(x) {
  LEVELS.forEach((l, i) => {
    x.fillStyle = l.solid ? "#F4F4F2" : l.bg;
    x.fillRect(i * STORY.w / LEVELS.length, STORY.h - 40, STORY.w / LEVELS.length + 1, 40);
  });
  x.fillStyle = STORY.muted; x.font = `600 34px ${BODY}`; x.textAlign = "center";
  x.fillText(STORY.url, STORY.w / 2, STORY.h - 80); x.textAlign = "left";
}
function fitText(x, text, maxW, size, weight = 900, font = DISPLAY) {
  let s = size; do { x.font = `${weight} ${s}px ${font}`; s -= 4; } while (x.measureText(text).width > maxW && s > 30);
}
const loadImg = src => new Promise(res => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
function levelPill(x, l, px, py, h) {
  x.font = `900 ${h * .62}px ${DISPLAY}`;
  const label = l.name.toUpperCase(), w = x.measureText(label).width + h;
  if (l.solid) {   // Compe: rayas como en la app
    x.save(); x.beginPath(); x.roundRect(px, py, w, h, h / 2); x.clip();
    for (let i = -h; i < w + h; i += 24) { x.fillStyle = (i / 24) % 2 ? "#F4F4F2" : "#1C1C1E"; x.beginPath(); x.moveTo(px + i, py); x.lineTo(px + i + 24, py); x.lineTo(px + i + 24 - h, py + h); x.lineTo(px + i - h, py + h); x.fill(); }
    x.restore(); x.fillStyle = "#F4F4F2"; x.beginPath(); x.roundRect(px + h * .3, py + h * .18, w - h * .6, h * .64, h * .3); x.fill();
  } else { x.fillStyle = l.bg; x.beginPath(); x.roundRect(px, py, w, h, h / 2); x.fill(); }
  x.fillStyle = l.solid ? "#1C1C1E" : l.fg; x.textBaseline = "middle"; x.fillText(label, px + h / 2, py + h / 2 + 3); x.textBaseline = "alphabetic";
  return w;
}

async function storyBlock(b, mine) {
  const [c, x] = await storyCanvas();
  const l = LV[b.level] || LEVELS[0];
  drawHeader(x, currentGym()?.name || "");
  // Foto del bloque (o el color del nivel si no tiene)
  const box = { x: 80, y: 300, w: 920, h: 1000 };
  const img = b.photo_path ? await loadImg(photoUrl(b.photo_path)) : null;
  x.save(); x.beginPath(); x.roundRect(box.x, box.y, box.w, box.h, 40); x.clip();
  if (img) {
    const k = Math.max(box.w / img.width, box.h / img.height);
    x.drawImage(img, box.x + (box.w - img.width * k) / 2, box.y + (box.h - img.height * k) / 2, img.width * k, img.height * k);
  } else {
    x.fillStyle = l.solid ? "#2B3532" : l.bg; x.fillRect(box.x, box.y, box.w, box.h);
    x.fillStyle = l.solid ? "#F4F4F2" : l.fg; x.globalAlpha = .9; fitText(x, l.name.toUpperCase(), 760, 260);
    x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(l.name.toUpperCase(), STORY.w / 2, box.y + box.h / 2); x.textAlign = "left"; x.textBaseline = "alphabetic"; x.globalAlpha = 1;
  }
  x.restore();
  // Nivel, nombre y logro
  let y = 1350;
  const pw = levelPill(x, l, 80, y, 76);
  x.fillStyle = mine.flash ? "#F5CE1B" : STORY.accent; x.font = `900 64px ${DISPLAY}`;
  x.fillText(mine.flash ? "⚡ FLASH" : "✓ ENCADENADO", 80 + pw + 28, y + 62);
  y += 190; x.fillStyle = STORY.ink; fitText(x, title(b).toUpperCase(), 920, 150); x.fillText(title(b).toUpperCase(), 80, y);
  y += 80; x.fillStyle = STORY.muted; x.font = `600 40px ${BODY}`;
  x.fillText([b.sector, `+${pointsFor(b, mine.flash)} puntos`, fmtDate(mine.sent_at || new Date().toISOString())].filter(Boolean).join("  ·  "), 80, y);
  drawFooter(x);
  showStory(c, `${title(b)} · ${lvName(b)}`);
}

async function storyMonth() {
  const [c, x] = await storyCanvas();
  const p = progressCtx(), st = p.streak;
  const month = new Date().toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  drawHeader(x, currentGym()?.name || "");
  x.fillStyle = STORY.muted; x.font = `700 44px ${BODY}`; x.fillText("MI MES DE ESCALADA", 80, 420);
  x.fillStyle = STORY.ink; fitText(x, month.toUpperCase(), 920, 130); x.fillText(month.toUpperCase(), 80, 550);
  // Cifras del mes
  const stats = [[p.monthPoints, "puntos"], [p.monthSends.length, "bloques"], [p.monthSends.filter(s => s.m.flash).length, "al flash"], [st.cur, st.cur === 1 ? "semana de racha" : "semanas de racha"]];
  stats.forEach(([n, label], i) => {
    const cx = 80 + (i % 2) * 470, cy = 650 + Math.floor(i / 2) * 290;
    x.fillStyle = "#222B28"; x.beginPath(); x.roundRect(cx, cy, 450, 260, 32); x.fill();
    x.fillStyle = i === 0 ? STORY.accent : STORY.ink; x.font = `900 150px ${DISPLAY}`; x.fillText(String(n), cx + 36, cy + 160);
    x.fillStyle = STORY.muted; x.font = `600 38px ${BODY}`; x.fillText(label, cx + 40, cy + 220);
  });
  // Bloques del mes por color
  const y0 = 1290; x.fillStyle = STORY.muted; x.font = `700 36px ${BODY}`; x.fillText("POR COLOR", 80, y0 - 30);
  const counts = LEVELS.map(l => p.monthSends.filter(s => s.b.level === l.k).length), max = Math.max(1, ...counts);
  LEVELS.forEach((l, i) => {
    const bw = 920 / LEVELS.length - 14, bx = 80 + i * (920 / LEVELS.length), bh = counts[i] / max * 280;
    x.fillStyle = l.solid ? "#F4F4F2" : l.bg; x.globalAlpha = counts[i] ? 1 : .25;
    x.beginPath(); x.roundRect(bx, y0 + 340 - Math.max(bh, 10), bw, Math.max(bh, 10), 10); x.fill(); x.globalAlpha = 1;
    x.fillStyle = STORY.ink; x.font = `900 44px ${DISPLAY}`; x.textAlign = "center";
    if (counts[i]) x.fillText(String(counts[i]), bx + bw / 2, y0 + 320 - bh);
    x.fillStyle = STORY.muted; x.font = `700 26px ${BODY}`; x.fillText(SHORT[l.k].toUpperCase(), bx + bw / 2, y0 + 385); x.textAlign = "left";
  });
  if (p.top) { x.fillStyle = STORY.ink; x.font = `700 40px ${BODY}`; x.fillText(`Nivel más alto: ${p.top.name}`, 80, 1760); }
  drawFooter(x);
  showStory(c, `Mi mes en ${currentGym()?.name || "el rocódromo"}`);
}

// Vista previa con «Compartir» (Instagram, WhatsApp…) y «Guardar imagen»
function showStory(canvas, name) {
  canvas.toBlob(blob => {
    if (!blob) return toast("No se pudo crear la imagen");
    const file = new File([blob], "xlp-boulder.png", { type: "image/png" }), url = URL.createObjectURL(blob);
    const canShare = !!(navigator.canShare && navigator.canShare({ files: [file] }));
    sheet(head("Para tus historias", true),
      el("img", { class: "story-preview", src: url, alt: `Tarjeta para historias: ${name}` }),
      el("div", { class: "actions" },
        canShare ? el("button", { class: "btn primary", onclick: async () => {
          try { await navigator.share({ files: [file], title: name, text: `${name} · ${STORY.url}` }); }
          catch (e) { if (e?.name !== "AbortError") toast("No se pudo compartir. Guarda la imagen y súbela desde Instagram."); }
        } }, "Compartir") : null,
        el("a", { class: "btn" + (canShare ? "" : " primary"), href: url, download: "xlp-boulder.png" }, "Guardar imagen")),
      el("p", { class: "note", text: canShare
        ? "En «Compartir» elige Instagram → Historias. Añade la pegatina de enlace con la web para que tus amigos vean el bloque."
        : "Guarda la imagen y súbela a tus historias desde Instagram. Añade la pegatina de enlace con la web." }));
  }, "image/png");
}
