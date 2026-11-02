// Editor de foto de bloque: resalta las presas de un color, oscurece el resto y marca salida y top.
// Todo se hace en el navegador. Usa COLORS, el() y toast() de app.js.

// Rangos de color de presa en HSV (tono en grados, saturación y valor de 0 a 1).
// Los negros, blancos y grises se distinguen peor del muro: ahí cuentan más las correcciones a mano.
const HOLD_RANGES = {
  amarillo: (h, s, v) => h >= 42 && h <= 66 && s >= .45 && v >= .4,   // la madera del muro llega a .37
  naranja:  (h, s, v) => h >= 12 && h < 42 && s >= .5 && v >= .4,
  rojo:     (h, s, v) => (h < 12 || h >= 344) && s >= .42 && v >= .25,
  rosa:     (h, s, v) => h >= 310 && h < 344 && s >= .22 && v >= .45,
  morado:   (h, s, v) => h >= 240 && h <= 342 && s >= .137 && v >= .137,   // morados de 248-256° en fotos reales
  azul:     (h, s, v) => h >= 196 && h < 240 && s >= .35 && v >= .3,   // el techo de noche es azul muy oscuro (.2)
  turquesa: (h, s, v) => h >= 165 && h < 196 && s >= .3 && v >= .25,
  verde:    (h, s, v) => h >= 72 && h < 165 && s >= .28 && v >= .2,
  negro:    (h, s, v) => v < .2,
  blanco:   (h, s, v) => s < .14 && v > .78,
  gris:     (h, s, v) => s < .14 && v > .35 && v <= .78,
  marron:   (h, s, v) => h >= 8 && h < 38 && s >= .35 && v >= .12 && v < .5,
};
// Color en CIELAB (sRGB, D65): las distancias se parecen más a lo que ve el ojo que en RGB o HSV
const SRGB_LIN = Float32Array.from({ length: 256 }, (_, i) => { const c = i / 255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; });
function labOf(r, g, b) {
  r = SRGB_LIN[r]; g = SRGB_LIN[g]; b = SRGB_LIN[b];
  const f = t => t > .008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
  const fx = f((r * .4124 + g * .3576 + b * .1805) / .95047), fy = f(r * .2126 + g * .7152 + b * .0722), fz = f((r * .0193 + g * .1192 + b * .9505) / 1.08883);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
const dE = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const median = a => { const s = Float32Array.from(a).sort(); return s[s.length >> 1]; };
const medianLab = list => [median(list.map(c => c[0])), median(list.map(c => c[1])), median(list.map(c => c[2]))];
// Sensibilidad (1 menos ruido … 5 más presas): cuánto se relajan los umbrales y la distancia de color
const SENS = { 1: { f: .78, tol: 11 }, 2: { f: .89, tol: 14 }, 3: { f: 1, tol: 17 }, 4: { f: 1.14, tol: 21 }, 5: { f: 1.3, tol: 26 } };
// Para contar como presa, un color tiene que estar bastante más cerca de la presa que del muro (no a medio camino)
const MARGIN = .6;
const STATES = ["normal", "start", "top", "off"];
const MARK = { start: { color: "#4CC3A8", text: "SALIDA", rings: 1 }, top: { color: "#F5CE1B", text: "TOP", rings: 2 } };

function hsvAt(d, i) {
  const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), c = max - min;
  let h = 0;
  if (c) h = max === r ? 60 * (((g - b) / c) % 6) : max === g ? 60 * ((b - r) / c + 2) : 60 * ((r - g) / c + 4);
  if (h < 0) h += 360;
  return [h, max ? c / max : 0, max];
}

// Dilatación o erosión binaria con ventana cuadrada (sumas acumuladas por filas y columnas)
function box(src, W, H, r, erode) {
  const tmp = new Uint8Array(W * H), out = new Uint8Array(W * H), acc = new Int32Array(Math.max(W, H) + 1);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) acc[x + 1] = acc[x] + src[y * W + x];
    for (let x = 0; x < W; x++) {
      const a = Math.max(0, x - r), b = Math.min(W, x + r + 1), sum = acc[b] - acc[a];
      tmp[y * W + x] = erode ? (sum === b - a ? 1 : 0) : (sum > 0 ? 1 : 0);
    }
  }
  for (let x = 0; x < W; x++) {
    for (let y = 0; y < H; y++) acc[y + 1] = acc[y] + tmp[y * W + x];
    for (let y = 0; y < H; y++) {
      const a = Math.max(0, y - r), b = Math.min(H, y + r + 1), sum = acc[b] - acc[a];
      out[y * W + x] = erode ? (sum === b - a ? 1 : 0) : (sum > 0 ? 1 : 0);
    }
  }
  return out;
}

// Extiende cada etiqueta n píxeles hacia fuera (las zonas sin etiqueta valen -1)
function growLabels(lab, W, H, n) {
  let cur = lab.slice();
  for (let k = 0; k < n; k++) {
    const next = cur.slice();
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (cur[i] >= 0) continue;
      const v = (x > 0 && cur[i - 1] >= 0) ? cur[i - 1] : (x < W - 1 && cur[i + 1] >= 0) ? cur[i + 1]
        : (y > 0 && cur[i - W] >= 0) ? cur[i - W] : (y < H - 1 && cur[i + W] >= 0) ? cur[i + W] : -1;
      if (v >= 0) next[i] = v;
    }
    cur = next;
  }
  return cur;
}

function openHoldEditor({ source, color }) {
  return new Promise(async resolve => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = typeof source === "string" ? source : URL.createObjectURL(source);
    try { await img.decode(); } catch (e) { toast("No se pudo abrir la foto"); return resolve(null); }

    const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    const W = Math.round(img.naturalWidth * k), H = Math.round(img.naturalHeight * k);
    const sc = Math.max(W, H) / 2000;                        // escala de marcas y bordes respecto a una foto de 2000 px
    const canvas = el("canvas", { class: "ed-canvas", width: W, height: H, "aria-label": "Foto del bloque. Toca una presa para cambiarla." });
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, W, H);
    const orig = ctx.getImageData(0, 0, W, H).data;
    // Corrección de la luz (mundo gris): el muro y las zonas neutras deberían salir grises. Solo para analizar;
    // la foto que se guarda es la original
    const cor = (() => {
      let n = 0, sr = 0, sg = 0, sb = 0;
      for (let i = 0; i < orig.length; i += 16) {
        const [, s_, v_] = hsvAt(orig, i);
        if (s_ < .25 && v_ > .2 && v_ < .95) { sr += orig[i]; sg += orig[i + 1]; sb += orig[i + 2]; n++; }
      }
      if (n < 500) return orig;
      const m = (sr + sg + sb) / 3, gain = c => Math.min(1.25, Math.max(.8, m / c)), gr = gain(sr), gg = gain(sg), gb = gain(sb);
      if (Math.abs(gr - 1) < .03 && Math.abs(gg - 1) < .03 && Math.abs(gb - 1) < .03) return orig;
      const c = new Uint8ClampedArray(orig.length);
      for (let i = 0; i < orig.length; i += 4) { c[i] = orig[i] * gr; c[i + 1] = orig[i + 1] * gg; c[i + 2] = orig[i + 2] * gb; c[i + 3] = 255; }
      return c;
    })();
    const labAt = i => labOf(cor[i * 4], cor[i * 4 + 1], cor[i * 4 + 2]);
    const dark = new Uint8ClampedArray(orig.length);
    for (let i = 0; i < orig.length; i += 4) {
      const g = (orig[i] * .299 + orig[i + 1] * .587 + orig[i + 2] * .114) * .38;
      dark[i] = dark[i + 1] = dark[i + 2] = g; dark[i + 3] = 255;
    }

    let holds = [], lab = new Int32Array(W * H).fill(-1), disp = lab, ring = lab, chosen = color && HOLD_RANGES[color] ? color : "";
    // Afinar: colores tomados tocando presas del bloque (en Lab) y sensibilidad elegida
    let samples = [], sampling = false, sens = 3;
    // Zona del muro: si está marcada, solo se buscan presas dentro (fuera quedan techo, colchoneta…)
    // Paso 1: marcar la zona (o elegir toda la foto). Hasta entonces no se busca nada.
    let zone = null, zonePts = [], zoneReady = false, analyzed = false, drawMode = true, drawing = false, livePts = [], skipClick = false;
    // Volúmenes estructurales: son del color del muro, así que se marcan a mano y se conservan al volver a analizar
    let drawKind = "zone", volumes = [];
    const inZone = i => !zone || zone[i] === 1;

    function relabel() {
      disp = growLabels(lab, W, H, Math.max(2, Math.round(4 * sc)));
      const outer = growLabels(disp, W, H, Math.max(2, Math.round(5 * sc)));
      ring = new Int32Array(W * H).fill(-1);
      for (let i = 0; i < ring.length; i++) if (disp[i] < 0 && outer[i] >= 0) ring[i] = outer[i];
    }

    // Colores del muro: los grupos de color que ocupan buena parte de la zona (pared negra, madera, gris…).
    // Las presas ocupan poco, así que no salen aquí. Se calcula una vez por zona
    let walls = null;
    function wallColors() {
      if (walls) return walls;
      const pts = [], step = Math.max(1, Math.floor(W * H / 5000));
      for (let i = 0; i < W * H; i += step) if (inZone(i)) pts.push(labAt(i));
      if (pts.length < 50) return walls = [];
      const K = 5; let cs = Array.from({ length: K }, (_, k) => pts[Math.floor((k + .5) * pts.length / K)]);
      let asg = new Int32Array(pts.length);
      for (let it = 0; it < 10; it++) {
        pts.forEach((c, i) => { let b = 0, bd = Infinity; cs.forEach((m, k) => { const d = dE(c, m); if (d < bd) { bd = d; b = k; } }); asg[i] = b; });
        cs = cs.map((m, k) => { const g = pts.filter((_, i) => asg[i] === k); return g.length ? [g.reduce((a, c) => a + c[0], 0) / g.length, g.reduce((a, c) => a + c[1], 0) / g.length, g.reduce((a, c) => a + c[2], 0) / g.length] : m; });
      }
      return walls = cs.filter((_, k) => asg.filter(a => a === k).length / pts.length >= .12);
    }
    const wallDist = c => Math.min(Infinity, ...wallColors().map(w => dE(c, w)));
    function detect() {
      const N = W * H, { f, tol } = SENS[sens], test = HOLD_RANGES[chosen];
      let m = new Uint8Array(N);
      // Rangos de color por presa, con la luz corregida y la sensibilidad elegida
      for (let i = 0; i < N; i++) { if (!inZone(i)) continue; const [h, s_, v] = hsvAt(cor, i * 4); if (test(h, Math.min(1, s_ * f), Math.min(1, v * f))) m[i] = 1; }
      const base = samples.length ? m.slice() : null;   // lo que vio la detección normal, antes de las muestras
      // Con presas de muestra («Afinar color»): además, lo que se parece a una muestra más que al muro
      if (samples.length) for (let i = 0; i < N; i++) {
        if (m[i] || !inZone(i)) continue;
        const c = labAt(i), d = Math.min(...samples.map(s0 => dE(c, s0)));
        if (d < tol && d < wallDist(c) * MARGIN) m[i] = 1;
      }
      m = box(box(m, W, H, 1, true), W, H, 1, false);                       // quitar puntitos sueltos
      const rc = Math.max(2, Math.round(4 * sc));
      m = box(box(m, W, H, rc, false), W, H, rc, true);                     // unir trozos de una misma presa
      let comps = components(m);
      // Completar cada presa con su propio color: recupera bordes en sombra y brillos sin crear presas nuevas
      // (no en blanco, gris y negro: sin tono, se confunden con el magnesio y el muro)
      if (!samples.length && comps.length && !["blanco", "gris", "negro"].includes(chosen)) {
        const own = comps.slice().sort((a, b) => b.length - a.length).slice(0, 8)
          .map(px => medianLab(px.filter((_, k) => k % Math.max(1, Math.floor(px.length / 300)) === 0).map(labAt)))
          .filter(c => wallDist(c) > 14);
        if (own.length) {
          const near = box(m, W, H, Math.max(3, Math.round(7 * sc)), false);
          let grew = 0;
          for (let i = 0; i < N; i++) {
            if (!near[i] || m[i] || !inZone(i)) continue;
            const c = labAt(i), d = Math.min(...own.map(o => dE(c, o)));
            if (d < tol * .9 && d < wallDist(c) * MARGIN) { m[i] = 1; grew++; }
          }
          if (grew) { m = box(box(m, W, H, rc, false), W, H, rc, true); comps = components(m); }
        }
      }
      const minArea = Math.max(25, Math.round(70 * (Math.max(W, H) / 2016) ** 2));
      lab = new Int32Array(N).fill(-1); holds = [];
      // Una mancha que solo aparece por las muestras y es mucho mayor que cualquier presa normal es muro bien iluminado
      const baseMax = base ? Math.max(1500, ...comps.map(px => px.filter(i => base[i]).length)) : 0;
      const tooBig = px => base && px.length > 3 * baseMax && px.filter(i => base[i]).length < .3 * px.length;
      // Ninguna presa ocupa una parte enorme de lo analizado: eso es techo, suelo o pared del mismo color
      let area = 0; for (let i = 0; i < N; i++) if (inZone(i)) area++;
      const huge = px => px.length > .12 * area;
      // Las presas de color tienen luz: una mancha muy oscura (techo, sombra, pared negra) no es presa
      const dim = px => !["negro", "marron", "gris", "morado"].includes(chosen) && median(px.filter((_, k) => k % Math.max(1, Math.floor(px.length / 200)) === 0).map(i => hsvAt(cor, i * 4)[2])) < .3;
      for (const px of comps) if (px.length >= minArea && holdShape(px) && !tooBig(px) && !huge(px) && !dim(px)) addHold(px);
      volumes.forEach(addVolume);
      relabel();
    }
    // Zonas conectadas de una máscara (listas de píxeles)
    function components(m) {
      const N = W * H, tmp = new Uint8Array(N), out = [], stack = [];
      for (let i = 0; i < N; i++) {
        if (!m[i] || tmp[i]) continue;
        const px = []; tmp[i] = 1; stack.push(i);
        while (stack.length) {
          const p = stack.pop(); px.push(p);
          const x = p % W, y = (p - x) / W;
          for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1])
            if (q >= 0 && m[q] && !tmp[q]) { tmp[q] = 1; stack.push(q); }
        }
        out.push(px);
      }
      return out;
    }
    // ¿Tiene forma de presa? Fuera tiras largas y finas (vigas, bordes de panel, líneas del suelo) y formas muy huecas
    // El alargamiento se mide con el eje principal de la forma, así también caen las tiras en diagonal
    function holdShape(px) {
      let x0 = W, y0 = H, x1 = 0, y1 = 0, sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0;
      for (const p of px) {
        const x = p % W, y = (p - x) / W;
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y;
      }
      const n = px.length, mx = sx / n, my = sy / n, a = sxx / n - mx * mx, c = syy / n - my * my, b = sxy / n - mx * my;
      const d = Math.sqrt(((a - c) / 2) ** 2 + b * b), l1 = (a + c) / 2 + d, l2 = Math.max(1e-6, (a + c) / 2 - d);
      const long = Math.sqrt(l1 / l2), fill = n / ((x1 - x0 + 1) * (y1 - y0 + 1));
      // Tira larga y fina (viga, borde de panel, línea del suelo). Las presas alargadas tipo barra tienen grosor y se quedan
      const thick = 4 * Math.sqrt(l2);
      if (long > 4.5 && 4 * Math.sqrt(l1) > 70 * sc && thick < 22 * sc) return false;
      if (long > 14) return false;
      if (fill < .12) return false;
      return true;
    }

    // Píxeles dentro de un contorno dibujado (y de la zona)
    function polygonPixels(pts) {
      const oc = document.createElement("canvas"); oc.width = W; oc.height = H;
      const o = oc.getContext("2d"); o.fillStyle = "#fff"; o.beginPath();
      pts.forEach(([x, y], i) => i ? o.lineTo(x, y) : o.moveTo(x, y)); o.closePath(); o.fill();
      const a = o.getImageData(0, 0, W, H).data, px = [];
      for (let i = 0; i < W * H; i++) if (a[i * 4 + 3] > 0 && inZone(i)) px.push(i);
      return px;
    }
    // Un volumen ocupa su contorno salvo las presas que tenga encima, que siguen siendo presas aparte
    function addVolume(v) {
      const px = polygonPixels(v.pts).filter(i => lab[i] < 0);
      if (px.length < 20) return;
      addHold(px, false, { volume: v }); holds[holds.length - 1].state = v.state;
    }
    // Añade una presa a partir de sus píxeles, rellenando los huecos (el agujero del tornillo)
    function addHold(px, fillHoles = true, extra = {}) {
      const id = holds.length;
      let x0 = W, y0 = H, x1 = 0, y1 = 0;
      for (const p of px) { const x = p % W, y = (p - x) / W; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      const bw = x1 - x0 + 3, bh = y1 - y0 + 3, inside = new Uint8Array(bw * bh), out = new Uint8Array(bw * bh);
      for (const p of px) { const x = p % W, y = (p - x) / W; inside[(y - y0 + 1) * bw + (x - x0 + 1)] = 1; }
      const st = [0]; out[0] = 1;
      while (st.length) {
        const p = st.pop(), x = p % bw, y = (p - x) / bw;
        for (const q of [x > 0 ? p - 1 : -1, x < bw - 1 ? p + 1 : -1, y > 0 ? p - bw : -1, y < bh - 1 ? p + bw : -1])
          if (q >= 0 && !inside[q] && !out[q]) { out[q] = 1; st.push(q); }
      }
      if (fillHoles) {
        for (let y = 1; y < bh - 1; y++) for (let x = 1; x < bw - 1; x++)
          if (!out[y * bw + x]) lab[(y + y0 - 1) * W + (x + x0 - 1)] = id;
      } else for (const p of px) lab[p] = id;
      holds.push({ x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, state: "normal", ...extra });
    }

    // Presa que la detección no ha visto: crece desde el toque por color parecido
    function growFrom(x, y) {
      const i0 = y * W + x, r0 = orig[i0 * 4], g0 = orig[i0 * 4 + 1], b0 = orig[i0 * 4 + 2];
      const R = Math.round(90 * sc), seen = new Uint8Array(W * H), px = [], st = [i0]; seen[i0] = 1;
      while (st.length && px.length < 40000) {
        const p = st.pop(); px.push(p);
        const px_ = p % W, py = (p - px_) / W;
        for (const q of [px_ > 0 ? p - 1 : -1, px_ < W - 1 ? p + 1 : -1, py > 0 ? p - W : -1, py < H - 1 ? p + W : -1]) {
          if (q < 0 || seen[q] || lab[q] >= 0 || !inZone(q)) continue;
          const qx = q % W, qy = (q - qx) / W;
          if (Math.abs(qx - x) > R || Math.abs(qy - y) > R) continue;
          const dr = orig[q * 4] - r0, dg = orig[q * 4 + 1] - g0, db = orig[q * 4 + 2] - b0;
          if (dr * dr + dg * dg + db * db < 38 * 38) { seen[q] = 1; st.push(q); }
        }
      }
      if (px.length < 12) return false;
      addHold(px); relabel(); return true;
    }

    function draw(forExport) {
      const out = ctx.createImageData(W, H), o = out.data;
      if (!analyzed) {
        for (let i = 0, j = 0; i < W * H; i++, j += 4) {
          const src = (zoneReady || drawing || zone) && !inZone(i) ? dark : orig;
          o[j] = src[j]; o[j + 1] = src[j + 1]; o[j + 2] = src[j + 2]; o[j + 3] = 255;
        }
        ctx.putImageData(out, 0, 0); drawOutline(); return updateInfo();
      }
      for (let i = 0, j = 0; i < disp.length; i++, j += 4) {
        const L = disp[i], Rl = ring[i];
        if (L >= 0 && holds[L].state !== "off") { o[j] = orig[j]; o[j + 1] = orig[j + 1]; o[j + 2] = orig[j + 2]; }
        else if (Rl >= 0 && holds[Rl].state !== "off") { o[j] = dark[j] * .35 + 166; o[j + 1] = dark[j + 1] * .35 + 166; o[j + 2] = dark[j + 2] * .35 + 166; }
        else { o[j] = dark[j]; o[j + 1] = dark[j + 1]; o[j + 2] = dark[j + 2]; }
        o[j + 3] = 255;
      }
      ctx.putImageData(out, 0, 0);
      const font = Math.round(30 * sc * 1.4);
      ctx.font = `800 ${font}px Figtree, system-ui, sans-serif`;
      for (const h of holds) {
        const cx = h.x + h.w / 2, cy = h.y + h.h / 2, rad = Math.max(h.w, h.h) / 2 + 22 * sc * 1.2;
        if (h.state === "off") {
          if (forExport) continue;
          ctx.setLineDash([8 * sc, 8 * sc]); ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 3 * sc;
          ctx.beginPath(); ctx.arc(cx, cy, rad * .8, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
          continue;
        }
        const mk = MARK[h.state]; if (!mk) continue;
        ctx.strokeStyle = mk.color; ctx.lineWidth = 8 * sc * 1.2;
        for (let r = 0; r < mk.rings; r++) { ctx.beginPath(); ctx.arc(cx, cy, rad + r * 14 * sc * 1.2, 0, Math.PI * 2); ctx.stroke(); }
        const tw = ctx.measureText(mk.text).width, padX = font * .55, ph = font * 1.5;
        const top = cy - rad - (mk.rings - 1) * 14 * sc * 1.2 - ph - 10 * sc;
        const px = Math.min(Math.max(cx - tw / 2 - padX, 4), W - tw - padX * 2 - 4), py = Math.max(top, 4);
        ctx.fillStyle = mk.color; ctx.beginPath(); ctx.roundRect(px, py, tw + padX * 2, ph, ph / 2); ctx.fill();
        ctx.fillStyle = "#141A18"; ctx.textBaseline = "middle"; ctx.fillText(mk.text, px + padX, py + ph / 2 + 1);
      }
      if (!forExport) { drawOutline(); updateInfo(); }
    }
    function drawOutline() {
      const pts = drawing ? livePts : zonePts;
      if (pts.length < 2) return;
      ctx.save(); ctx.lineWidth = 5 * sc * 1.2; ctx.setLineDash([16 * sc, 10 * sc]); ctx.strokeStyle = "rgba(255,255,255,.9)";
      ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = 6 * sc;
      ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); if (!drawing) ctx.closePath(); ctx.stroke(); ctx.restore();
    }

    // ---------- interfaz ----------
    const info = el("div", { class: "ed-info", role: "status" });
    const chips = el("div", { class: "row ed-colors", role: "group", "aria-label": "Color de las presas" });
    const useBtn = el("button", { class: "btn primary", disabled: true, onclick: async () => {
      useBtn.disabled = true; draw(true);
      canvas.toBlob(b => { close(); resolve(b ? { blob: b, color: chosen } : null); }, "image/jpeg", .9);
    } }, "Usar esta foto");
    function updateInfo() {
      const on = holds.filter(h => h.state !== "off");
      const n = s => holds.filter(h => h.state === s).length;
      info.textContent = sampling ? "Toca el centro de una presa del bloque para aprender su color."
        : drawMode && drawKind === "volume" ? "Rodea el volumen con el dedo y suelta para cerrarlo."
        : drawMode ? "Paso 1 · Rodea con el dedo la zona a analizar, o arrastra en diagonal para marcar un rectángulo."
        : !chosen ? "Paso 2 · Elige el color de las presas del bloque."
        : `${on.length} ${on.length === 1 ? "presa" : "presas"} · ${n("start")} de salida · ${n("top")} de top` + (samples.length ? ` · color afinado (${samples.length})` : "");
      useBtn.disabled = !analyzed;
    }
    function drawChips() {
      chips.replaceChildren(...Object.entries(COLORS).map(([key, c]) => el("button", { type: "button", class: "chip", "aria-pressed": chosen === key ? "true" : "false",
        onclick: () => { chosen = key; samples = []; drawChips(); if (zoneReady) run(); else updateInfo(); } }, colorDot(key, c.hex), c.name)));
    }
    function run() {
      info.textContent = "Buscando presas…";
      requestAnimationFrame(() => setTimeout(() => {
        detect(); analyzed = true; drawZoneBtns(); draw();
        if (!holds.length) info.textContent = "No he encontrado presas de ese color. Toca las presas para añadirlas a mano.";
      }, 20));
    }
    // Afinar: la muestra es el color mediano de un círculo alrededor del toque
    // Si el toque cae en una presa ya encontrada, se aprende el color de toda la presa (más fiable)
    function sampleAt(x, y) {
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      const id = lab[y * W + x], cs = [];
      if (id >= 0) { for (let i = 0; i < W * H; i++) if (lab[i] === id && cs.length < 4000) cs.push(labAt(i)); }
      else {
        const r = Math.max(3, Math.round(9 * sc));
        for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
          const xx = x + dx, yy = y + dy;
          if (dx * dx + dy * dy <= r * r && xx >= 0 && yy >= 0 && xx < W && yy < H) cs.push(labAt(yy * W + xx));
        }
      }
      const c = medianLab(cs);
      sampling = false; drawZoneBtns();
      if (wallDist(c) < 10) { updateInfo(); return toast("Eso parece el muro. Toca el centro de una presa del bloque."); }
      samples.push(c); run();
    }
    canvas.addEventListener("click", e => {
      if (drawMode || skipClick) { skipClick = false; return; }
      if (sampling) { const r = canvas.getBoundingClientRect(); return sampleAt(Math.round((e.clientX - r.left) / r.width * W), Math.round((e.clientY - r.top) / r.height * H)); }
      if (!analyzed) return toast(zoneReady ? "Elige primero el color de las presas" : "Primero marca la zona a analizar");
      const r = canvas.getBoundingClientRect();
      const x = Math.round((e.clientX - r.left) / r.width * W), y = Math.round((e.clientY - r.top) / r.height * H);
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      if (!inZone(y * W + x)) return toast("Ese punto está fuera del muro marcado");
      let id = disp[y * W + x];
      if (id < 0) id = ring[y * W + x];
      if (id < 0) {   // la presa más cercana, si el toque cae justo al lado
        let best = -1, bd = (40 * sc * 1.5) ** 2;
        holds.forEach((h, i) => { const dx = h.x + h.w / 2 - x, dy = h.y + h.h / 2 - y, dd = dx * dx + dy * dy; if (dd < bd) { bd = dd; best = i; } });
        id = best;
      }
      if (id >= 0) {
        const h = holds[id], next = STATES[(STATES.indexOf(h.state) + 1) % STATES.length];
        h.state = next; if (h.volume) h.volume.state = next;
      } else if (!growFrom(x, y)) return toast("Ahí no encuentro una presa. Toca en el centro de la presa.");
      draw();
    });

    const toImg = e => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
    canvas.addEventListener("pointerdown", e => {
      if (!drawMode) return;
      e.preventDefault(); drawing = true; livePts = [toImg(e)]; canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener("pointermove", e => {
      if (!drawing) return;
      const p = toImg(e), q = livePts[livePts.length - 1];
      if (Math.hypot(p[0] - q[0], p[1] - q[1]) > 6 * sc) { livePts.push(p); draw(); }
    });
    const endDraw = () => {
      if (!drawing) return;
      drawing = false; drawMode = false; skipClick = true; canvas.classList.remove("drawing");
      let pts = livePts; livePts = [];
      const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
      const bw = Math.max(...xs) - Math.min(...xs), bh = Math.max(...ys) - Math.min(...ys);
      if (pts.length < 2 || bw < 30 * sc || bh < 30 * sc) {
        drawMode = drawKind === "zone" && !zoneReady; drawKind = "zone"; canvas.classList.toggle("drawing", drawMode); drawZoneBtns(); draw();
        return toast("Trazo demasiado pequeño. Rodéalo con el dedo o arrastra en diagonal.");
      }
      let area = 0;
      pts.forEach(([x, y], i) => { const [x2, y2] = pts[(i + 1) % pts.length]; area += x * y2 - x2 * y; });
      if (Math.abs(area) / 2 < .2 * bw * bh) {   // casi una línea: rectángulo entre el principio y el final
        const [x0, y0] = pts[0], [x1, y1] = pts[pts.length - 1];
        pts = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
      }
      if (drawKind === "volume") {
        const v = { pts, state: "normal" }; volumes.push(v);
        const n = holds.length; addVolume(v);
        drawKind = "zone"; drawZoneBtns();
        if (holds.length === n) { volumes.pop(); draw(); return toast("Ese volumen queda fuera de la zona o encima de otras presas."); }
        relabel(); draw(); return toast("Volumen añadido. Tócalo para marcarlo como salida o top.");
      }
      zonePts = pts;
      const oc = document.createElement("canvas"); oc.width = W; oc.height = H;
      const o = oc.getContext("2d"); o.fillStyle = "#fff"; o.beginPath();
      zonePts.forEach(([x, y], i) => i ? o.lineTo(x, y) : o.moveTo(x, y)); o.closePath(); o.fill();
      const a = o.getImageData(0, 0, W, H).data; zone = new Uint8Array(W * H);
      for (let i = 0; i < zone.length; i++) zone[i] = a[i * 4 + 3] > 0 ? 1 : 0;
      zoneReady = true; walls = null; drawZoneBtns();
      if (chosen) run(); else draw();
    };
    canvas.addEventListener("pointerup", endDraw);
    canvas.addEventListener("pointercancel", endDraw);
    const zoneBtns = el("div", { class: "actions ed-tools" });
    const setDrawMode = (on, kind = "zone") => { drawMode = on; drawKind = kind; canvas.classList.toggle("drawing", on); drawZoneBtns(); updateInfo(); };
    const wholePhoto = () => { zone = null; zonePts = []; zoneReady = true; walls = null; setDrawMode(false); if (chosen) run(); else draw(); };
    function drawZoneBtns() {
      zoneBtns.replaceChildren(...(drawMode && drawKind === "volume"
        ? [el("button", { type: "button", class: "btn small", onclick: () => setDrawMode(false) }, "Cancelar")]
        : drawMode
        ? [el("button", { type: "button", class: "btn small", onclick: wholePhoto }, "Analizar toda la foto"),
           zoneReady ? el("button", { type: "button", class: "btn small", onclick: () => setDrawMode(false) }, "Cancelar") : null]
        : sampling ? [el("button", { type: "button", class: "btn small", onclick: () => { sampling = false; drawZoneBtns(); updateInfo(); } }, "Cancelar")]
        : [el("button", { type: "button", class: "btn small", onclick: () => setDrawMode(true) }, ico("pencil", "sm"), "Zona"),
           el("button", { type: "button", class: "btn small", disabled: !zone, onclick: wholePhoto }, "Toda la foto"),
           el("button", { type: "button", class: "btn small", disabled: !analyzed, onclick: () => setDrawMode(true, "volume") }, ico("layers", "sm"), "Volumen"),
           el("button", { type: "button", class: "btn small" + (samples.length ? " primary" : ""), disabled: !analyzed, onclick: () => { sampling = true; drawZoneBtns(); updateInfo(); } }, ico("target", "sm"), "Afinar color"),
           samples.length ? el("button", { type: "button", class: "btn small", onclick: () => { samples = []; drawZoneBtns(); run(); } }, "Quitar ajuste") : null]
      ).filter(Boolean));
    }
    drawZoneBtns();

    const root = el("div", { class: "ed-scrim", role: "dialog", "aria-modal": "true", "aria-label": "Resaltar presas" },
      el("div", { class: "ed-panel" },
        el("div", { class: "sheet-head" }, el("h2", { class: "sheet-title", text: "Resaltar presas" }),
          el("button", { class: "x", type: "button", "aria-label": "Cancelar", onclick: () => { close(); resolve(null); } }, ico("x"))),
        info,
        zoneBtns,
        el("div", { class: "ed-stage" }, canvas),
        el("div", { class: "field" }, el("span", { class: "label", text: "Color de las presas" }), chips),
        el("label", { class: "field ed-sens" }, el("span", { class: "label", text: "Sensibilidad" }),
          el("input", { type: "range", min: "1", max: "5", step: "1", value: String(sens), "aria-label": "Sensibilidad de la búsqueda de presas",
            onchange: e => { sens = +e.target.value; if (analyzed) run(); } }),
          el("span", { class: "ed-sens-ends note" }, el("span", { text: "Menos ruido" }), el("span", { text: "Más presas" }))),
        el("p", { class: "note ed-help", text: "Paso 3 · Toca una presa para cambiarla: salida → top → quitar → normal. Si falta alguna, toca encima para añadirla. Si se cuelan cosas o faltan muchas, usa «Afinar color» y toca una presa del bloque, o mueve la sensibilidad. Los volúmenes del color del muro se añaden con «Volumen»." }),
        el("div", { class: "actions" }, useBtn,
          el("button", { class: "btn", type: "button", onclick: () => { close(); resolve({ blob: null, color: chosen }); } }, "Usar sin editar"))));
    function close() { root.remove(); if (typeof source !== "string") URL.revokeObjectURL(img.src); }
    document.body.append(root);
    drawChips();
    canvas.classList.add("drawing");
    draw();
  });
}
