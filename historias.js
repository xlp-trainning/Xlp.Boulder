// Tarjetas para historias de Instagram (1080x1920) de un bloque encadenado. El resumen del mes está en wrapped.js.
// Usa el estado y las utilidades de app.js y progreso.js.

const STORY = { w: 1080, h: 1920, bg: "#0C1210", ink: "#EEF4F1", muted: "#A3B3AC", accent: "#4CC3A8", tape: "#F5CE1B", tapeInk: "#1E1A07", line: "#2B3732",
  url: "xlp-trainning.github.io/Xlp.Boulder" };
const DISPLAY = '"Big Shoulders Display", Impact, "Arial Narrow", sans-serif', BODY = 'Figtree, system-ui, sans-serif';

async function storyCanvas() {
  try { await Promise.all([document.fonts.load(`900 100px ${DISPLAY}`), document.fonts.load(`700 40px ${BODY}`)]); } catch (e) {}
  const c = document.createElement("canvas"); c.width = STORY.w; c.height = STORY.h;
  const x = c.getContext("2d"); wallBg(x, STORY.bg);
  return [c, x];
}
// Fondo de póster: color liso, rejilla de tuercas T y grano de magnesio (el mismo grano en cada tarjeta)
function wallBg(x, bg) {
  x.fillStyle = bg; x.fillRect(0, 0, STORY.w, STORY.h);
  x.save(); x.globalAlpha = .07; x.strokeStyle = "#FFFFFF"; x.fillStyle = "#FFFFFF"; x.lineWidth = 2.5;
  for (let py = 60; py < STORY.h; py += 108) for (let px = 54; px < STORY.w; px += 108) {
    x.beginPath(); x.arc(px, py, 5, 0, Math.PI * 2); x.fill(); x.beginPath(); x.arc(px, py, 12, 0, Math.PI * 2); x.stroke();
  }
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  x.globalAlpha = .05; for (let i = 0; i < 9000; i++) x.fillRect(rnd() * STORY.w, rnd() * STORY.h, 2, 2);
  x.restore();
}
// Trozo de cinta: rectángulo con los extremos rasgados, girado; texto dentro en condensada
function tapeLabel(x, text, px, py, h, bg = STORY.tape, ink = STORY.tapeInk, rot = -.03) {
  x.save(); x.font = `800 ${h * .44}px ${BODY}`;
  const w = x.measureText(text).width + h * 1.1;
  x.translate(px, py); x.rotate(rot);
  x.fillStyle = bg; x.beginPath(); x.moveTo(0, h * .08);
  [[.2, 0], [.5, .05], [.8, 0], [1, .06]].forEach(([fx, fy]) => x.lineTo(w * fx, h * fy));
  x.lineTo(w - h * .1, h * .5); x.lineTo(w, h * .96);
  [[.7, 1], [.4, .95], [.1, 1], [0, .92]].forEach(([fx, fy]) => x.lineTo(w * fx, h * fy));
  x.lineTo(h * .08, h * .5); x.closePath(); x.fill();
  x.fillStyle = ink; x.textBaseline = "middle"; x.fillText(text, h * .5, h * .54); x.textBaseline = "alphabetic";
  x.restore(); return w;
}
// Marcador: números grandes en condensada separados por líneas finas, de dos en dos
function scoreboard(x, items, top, accentIdx = 1) {
  x.save(); x.strokeStyle = STORY.line; x.lineWidth = 3;
  items.forEach(([n, label], i) => {
    const cx = 80 + (i % 2) * 470, cy = top + Math.floor(i / 2) * 280;
    if (i % 2) { x.beginPath(); x.moveTo(cx - 30, cy + 10); x.lineTo(cx - 30, cy + 240); x.stroke(); }
    if (i >= 2 && !(i % 2)) { x.beginPath(); x.moveTo(80, cy - 20); x.lineTo(1000, cy - 20); x.stroke(); }
    x.fillStyle = i === accentIdx ? STORY.tape : STORY.ink; fitText(x, String(n), 420, 180); x.fillText(String(n), cx - 4, cy + 170);
    x.fillStyle = STORY.muted; x.font = `800 34px ${BODY}`; x.fillText(String(label).toUpperCase(), cx, cy + 228);
  });
  x.restore();
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
  if (sub) tapeLabel(x, sub.toUpperCase(), 206, 206, 58);
}
// Pie: las cintas de los ocho niveles, cortadas en V por arriba, y la dirección de la web
function drawFooter(x) {
  const w = STORY.w / LEVELS.length;
  LEVELS.forEach((l, i) => {
    x.fillStyle = l.solid ? "#F4F4F2" : l.bg;
    x.beginPath(); x.moveTo(i * w, STORY.h - 52); x.lineTo(i * w + w / 2, STORY.h - 40); x.lineTo(i * w + w + 1, STORY.h - 52); x.lineTo(i * w + w + 1, STORY.h); x.lineTo(i * w, STORY.h); x.fill();
  });
  x.fillStyle = STORY.muted; x.font = `600 32px "JetBrains Mono", ui-monospace, monospace`; x.textAlign = "center";
  x.fillText(STORY.url, STORY.w / 2, STORY.h - 92); x.textAlign = "left";
}
function fitText(x, text, maxW, size, weight = 900, font = DISPLAY) {
  let s = size; do { x.font = `${weight} ${s}px ${font}`; s -= 4; } while (x.measureText(text).width > maxW && s > 30);
}
const loadImg = src => new Promise(res => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
// Cinta del nivel: rectángulo con muesca al final, como en la app
function levelPill(x, l, px, py, h) {
  x.font = `900 ${h * .62}px ${DISPLAY}`;
  const label = l.name.toUpperCase(), w = x.measureText(label).width + h;
  const shape = () => { x.beginPath(); x.moveTo(px, py); x.lineTo(px + w, py); x.lineTo(px + w - h * .18, py + h / 2); x.lineTo(px + w, py + h); x.lineTo(px, py + h); x.closePath(); };
  if (l.solid) {   // Compe: rayas como en la app
    x.save(); shape(); x.clip();
    for (let i = -h; i < w + h; i += 24) { x.fillStyle = (i / 24) % 2 ? "#F4F4F2" : "#1C1C1E"; x.beginPath(); x.moveTo(px + i, py); x.lineTo(px + i + 24, py); x.lineTo(px + i + 24 - h, py + h); x.lineTo(px + i - h, py + h); x.fill(); }
    x.restore(); x.fillStyle = "#F4F4F2"; x.fillRect(px + h * .3, py + h * .18, w - h * .7, h * .64);
  } else { x.fillStyle = l.bg; shape(); x.fill(); }
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
  x.save(); x.beginPath(); x.roundRect(box.x, box.y, box.w, box.h, 18); x.clip();
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
  drawIco(x, mine.flash ? "zap" : "check", 80 + pw + 62, y + 38, 60, mine.flash ? STORY.tape : STORY.accent, 2.8);
  x.fillStyle = mine.flash ? STORY.tape : STORY.accent; x.font = `900 64px ${DISPLAY}`;
  x.fillText(mine.flash ? "FLASH" : "ENCADENADO", 80 + pw + 104, y + 62);
  y += 190; x.fillStyle = STORY.ink; fitText(x, title(b).toUpperCase(), 920, 150); x.fillText(title(b).toUpperCase(), 80, y);
  y += 80; x.fillStyle = STORY.muted; x.font = `600 40px ${BODY}`;
  x.fillText([b.sector, !mine.flash && mine.attempts > 1 ? `al ${mine.attempts}.º intento` : null, `+${pointsFor(b, mine.flash)} puntos`, fmtDate(mine.sent_at || new Date().toISOString())].filter(Boolean).join("  ·  "), 80, y);
  if (b.xlp) { y += 40; tapeLabel(x, "EQUIPADO POR XLP", 80, y, 56); }
  drawFooter(x);
  showStory(c, `${title(b)} · ${lvName(b)}`);
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
