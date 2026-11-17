// Editor de foto de bloque: la foto se queda tal cual y el equipador marca a mano las presas de salida y de top.
// (Hasta noviembre de 2026 había una búsqueda automática de presas; se quitó a petición del equipador.)
// Todo se hace en el navegador. Usa el(), ico() y toast() de app.js.

const MARK = { start: { color: "#3DD6A3", text: "SALIDA", rings: 1 }, top: { color: "#F5CE1B", text: "TOP", rings: 2 } };

// Devuelve { blob } con la foto marcada, { blob: null } para usarla sin marcas, o null si se cancela
function openHoldEditor({ source }) {
  return new Promise(async resolve => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = typeof source === "string" ? source : URL.createObjectURL(source);
    try { await img.decode(); } catch (e) { toast("No se pudo abrir la foto"); return resolve(null); }

    const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    const W = Math.round(img.naturalWidth * k), H = Math.round(img.naturalHeight * k);
    const sc = Math.max(W, H) / 2000;                       // escala de aros y etiquetas respecto a una foto de 2000 px
    const R0 = Math.round(55 * sc * 1.2);                   // tamaño del aro con un toque
    const canvas = el("canvas", { class: "ed-canvas", width: W, height: H, "aria-label": "Foto del bloque. Toca una presa para marcarla." });
    const ctx = canvas.getContext("2d");

    let kind = "start", marks = [], hist = [], live = null;   // live: la marca que se está colocando (con el dedo aún abajo)

    function drawMark(m) {
      const mk = MARK[m.kind], font = Math.round(30 * sc * 1.4);
      ctx.strokeStyle = mk.color; ctx.lineWidth = 8 * sc * 1.2;
      ctx.shadowColor = "rgba(0,0,0,.45)"; ctx.shadowBlur = 6 * sc;
      for (let r = 0; r < mk.rings; r++) { ctx.beginPath(); ctx.arc(m.x, m.y, m.r + r * 14 * sc * 1.2, 0, Math.PI * 2); ctx.stroke(); }
      ctx.shadowBlur = 0;
      ctx.font = `800 ${font}px Figtree, system-ui, sans-serif`;
      const tw = ctx.measureText(mk.text).width, padX = font * .55, ph = font * 1.5;
      const top = m.y - m.r - (mk.rings - 1) * 14 * sc * 1.2 - ph - 10 * sc;
      const px = Math.min(Math.max(m.x - tw / 2 - padX, 4), W - tw - padX * 2 - 4), py = top < 4 ? m.y + m.r + (mk.rings - 1) * 14 * sc * 1.2 + 10 * sc : top;
      ctx.fillStyle = mk.color; ctx.beginPath(); ctx.roundRect(px, py, tw + padX * 2, ph, ph / 2); ctx.fill();
      ctx.fillStyle = "#141A18"; ctx.textBaseline = "middle"; ctx.fillText(mk.text, px + padX, py + ph / 2 + 1);
    }
    function draw() {
      ctx.drawImage(img, 0, 0, W, H);
      marks.forEach(drawMark);
      if (live) drawMark(live);
      updateInfo();
    }

    // ---------- tocar y arrastrar ----------
    const toImg = e => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
    const hit = (x, y) => { for (let i = marks.length - 1; i >= 0; i--) { const m = marks[i]; if (Math.hypot(m.x - x, m.y - y) <= m.r + 20 * sc) return i; } return -1; };
    canvas.addEventListener("pointerdown", e => {
      e.preventDefault(); canvas.setPointerCapture(e.pointerId);
      const [x, y] = toImg(e), i = hit(x, y);
      if (i >= 0) {   // tocar una marca la quita
        const [m] = marks.splice(i, 1); hist.push({ type: "del", m, i });
        toast(m.kind === "start" ? "Salida quitada" : "Top quitado"); return draw();
      }
      live = { kind, x, y, r: R0, x0: x, y0: y }; draw();
    });
    canvas.addEventListener("pointermove", e => {
      if (!live) return;
      const [x, y] = toImg(e), d = Math.hypot(x - live.x0, y - live.y0);
      if (d > 12 * sc) { live.r = Math.max(18 * sc, d); draw(); }   // arrastrar: el aro se ajusta al tamaño de la presa
    });
    const end = () => {
      if (!live) return;
      const m = { kind: live.kind, x: live.x, y: live.y, r: live.r }; live = null;
      marks.push(m); hist.push({ type: "add", m }); draw();
    };
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", () => { live = null; draw(); });
    function undo() {
      const a = hist.pop(); if (!a) return;
      if (a.type === "add") marks = marks.filter(m => m !== a.m); else marks.splice(a.i, 0, a.m);
      draw();
    }

    // ---------- interfaz ----------
    const info = el("div", { class: "ed-info", role: "status" });
    const kindBox = el("div", { class: "tabs ed-kind", role: "group", "aria-label": "Qué marcas" });
    const undoBtn = el("button", { type: "button", class: "btn small", onclick: undo }, ico("undo", "sm"), "Deshacer");
    function drawKind() {
      kindBox.replaceChildren(...[["start", "Salida"], ["top", "Top"]].map(([k, t]) =>
        el("button", { type: "button", "aria-pressed": kind === k ? "true" : "false", onclick: () => { kind = k; drawKind(); updateInfo(); } },
          el("span", { class: "ed-dot", style: `background:${MARK[k].color}` }), t)));
    }
    function updateInfo() {
      const n = k => marks.filter(m => m.kind === k).length;
      info.textContent = `${n("start")} de salida · ${n("top")} de top. Toca una presa para marcarla como ${kind === "start" ? "salida" : "top"}`
        + " (arrastra para ajustar el tamaño del aro). Toca una marca para quitarla.";
      undoBtn.disabled = !hist.length;
    }
    const useBtn = el("button", { class: "btn primary", onclick: () => {
      useBtn.disabled = true; draw();
      canvas.toBlob(b => { close(); resolve(b ? { blob: b } : null); }, "image/jpeg", .9);
    } }, "Usar esta foto");

    const root = el("div", { class: "ed-scrim", role: "dialog", "aria-modal": "true", "aria-label": "Marcar salida y top" },
      el("div", { class: "ed-panel" },
        el("div", { class: "sheet-head" }, el("h2", { class: "sheet-title", text: "Salida y top" }),
          el("button", { class: "x", type: "button", "aria-label": "Cancelar", onclick: () => { close(); resolve(null); } }, ico("x"))),
        el("div", { class: "actions ed-tools" }, kindBox, undoBtn),
        info,
        el("div", { class: "ed-stage" }, canvas),
        el("div", { class: "actions" }, useBtn,
          el("button", { class: "btn", type: "button", onclick: () => { close(); resolve({ blob: null }); } }, "Usar sin marcar"))));
    function close() { root.remove(); if (typeof source !== "string") URL.revokeObjectURL(img.src); }
    document.body.append(root);
    drawKind(); draw();
  });
}
