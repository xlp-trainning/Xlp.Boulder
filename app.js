// Circuito de dificultad del rocódromo, de fácil a difícil
const LEVELS = [
  { k: "azul",     name: "Azul",     bg: "#1E63D6", fg: "#FFFFFF" },
  { k: "verde",    name: "Verde",    bg: "#2E9D45", fg: "#FFFFFF" },
  { k: "naranja",  name: "Naranja",  bg: "#F07A1A", fg: "#1B120A" },
  { k: "amarillo", name: "Amarillo", bg: "#F5CE1B", fg: "#1B1A10" },
  { k: "morado",   name: "Morado",   bg: "#7B3FB8", fg: "#FFFFFF" },
  { k: "rojo",     name: "Rojo",     bg: "#D7262C", fg: "#FFFFFF" },
  { k: "negro",    name: "Negro",    bg: "#1C1C1E", fg: "#FFFFFF" },
  { k: "compe",    name: "Compe",    bg: "repeating-linear-gradient(135deg,#1C1C1E 0 10px,#F4F4F2 10px 20px)", fg: "#1C1C1E", solid: "#F4F4F2" },
];
const SHORT = { azul: "Azul", verde: "Verde", naranja: "Nar", amarillo: "Ama", morado: "Mor", rojo: "Rojo", negro: "Neg", compe: "Comp" };
const LV = Object.fromEntries(LEVELS.map(l => [l.k, l]));
const STYLES = ["Placa","Vertical","Desplome","Techo","Diedro","Arista","Regletas","Romos","Pinzas","Bidedos","Dinámico","Coordinación","Compresión","Talonajes","Equilibrio"];
const COLORS = {
  amarillo: { hex: "#F5CE1B", name: "Amarillo" },
  naranja:  { hex: "#F07A1A", name: "Naranja" },
  rojo:     { hex: "#D7262C", name: "Rojo" },
  rosa:     { hex: "#EE6FB0", name: "Rosa" },
  morado:   { hex: "#7B3FB8", name: "Morado" },
  azul:     { hex: "#1E63D6", name: "Azul" },
  turquesa: { hex: "#19B5B0", name: "Turquesa" },
  verde:    { hex: "#2E9D45", name: "Verde" },
  negro:    { hex: "#1C1C1E", name: "Negro" },
  blanco:   { hex: "#F4F4F2", name: "Blanco" },
  gris:     { hex: "#8E9493", name: "Gris" },
  marron:   { hex: "#7A4E2B", name: "Marrón" },
};
const gIdx = k => { const i = LEVELS.findIndex(l => l.k === k); return i < 0 ? 99 : i; };
const lvName = b => LV[b.level]?.name || "Sin nivel";
const title = b => b.name || `Bloque ${lvName(b).toLowerCase()}`;
const today = () => new Date().toISOString().slice(0, 10);

const CFG = window.LIBRETA_CONFIG || {};
const configured = CFG.supabaseUrl && !CFG.supabaseUrl.includes("TU-PROYECTO") && CFG.supabaseKey && !CFG.supabaseKey.startsWith("TU_");
const sb = configured && window.supabase ? window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey) : null;

const S = {
  blocks: [], stats: {}, mine: {}, favs: [],
  session: null, isSetter: false,
  view: "open", level: null, styles: new Set(), colors: new Set(), q: "", sort: "new",
  loaded: false, error: null,
};
const $ = id => document.getElementById(id);
const el = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") n.className = v;
    else if (k === "text") n.textContent = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? "" : v);
  }
  for (const c of kids.flat()) if (c != null) n.append(c.nodeType ? c : document.createTextNode(c));
  return n;
};
function toast(msg) {
  const t = $("toast"); t.textContent = msg; t.hidden = false;
  clearTimeout(toast._t); toast._t = setTimeout(() => t.hidden = true, 2600);
}
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
};
S.view = store.get("lb-view", "open");
S.favs = store.get("lb-favs", []);
if (CFG.gymName) $("gymName").textContent = CFG.gymName;

/* ---------- datos ---------- */
async function loadBlocks() {
  const [b, s] = await Promise.all([
    sb.from("blocks").select("*").order("created_at", { ascending: false }),
    sb.rpc("block_stats"),
  ]);
  if (b.error) throw b.error;
  S.blocks = b.data;
  S.stats = Object.fromEntries((s.data || []).map(r => [r.block_id, { avg: Number(r.avg_stars) || 0, n: Number(r.votes), sends: Number(r.sends) }]));
}
async function loadMine() {
  S.mine = {};
  if (!S.session) return;
  const { data } = await sb.from("ratings").select("block_id, stars, sent");
  (data || []).forEach(r => S.mine[r.block_id] = { stars: r.stars || 0, sent: r.sent });
}
async function loadSession() {
  const { data } = await sb.auth.getSession();
  S.session = data.session;
  S.isSetter = false;
  if (S.session && !S.session.user.is_anonymous) {
    const r = await sb.rpc("is_setter");
    S.isSetter = r.data === true;
  }
  $("addBtn").hidden = !S.isSetter;
  $("who").textContent = S.isSetter ? "Modo equipador" : "";
  $("loginBtn").textContent = S.session && !S.session.user.is_anonymous ? "Cerrar sesión de equipador" : "Acceso equipador";
}
async function refresh() {
  try {
    await loadSession();
    await Promise.all([loadBlocks(), loadMine()]);
    S.error = null;
  } catch (e) {
    console.error(e);
    S.error = "No se pudieron cargar los bloques. Comprueba la conexión y vuelve a intentarlo.";
  }
  S.loaded = true;
  render();
  if (openId) openDetail(openId);
}

/* ---------- render ---------- */
const statsFor = id => S.stats[id] || { avg: 0, n: 0, sends: 0 };
const starStr = avg => { const r = Math.round(avg); return "★".repeat(r) + "☆".repeat(5 - r); };
const fmtDate = d => { if (!d) return ""; const [y, m, dd] = d.split("-"); return `${dd}/${m}/${y.slice(2)}`; };

function visible() {
  const list = S.blocks.filter(b => {
    if (S.view === "open" && !b.active) return false;
    if (S.view === "old" && b.active) return false;
    if (S.view === "fav" && !S.favs.includes(b.id)) return false;
    if (S.level && b.level !== S.level) return false;
    if (S.styles.size && ![...S.styles].every(s => (b.styles || []).includes(s))) return false;
    if (S.colors.size && !S.colors.has(b.hold_color)) return false;
    if (S.q) {
      const hay = [b.name, b.sector, b.beta, lvName(b), COLORS[b.hold_color]?.name, ...(b.styles || [])].join(" ").toLowerCase();
      if (!hay.includes(S.q.toLowerCase())) return false;
    }
    return true;
  });
  const by = {
    new: (a, b) => (b.set_date || "").localeCompare(a.set_date || "") || (b.created_at || "").localeCompare(a.created_at || ""),
    gradeAsc: (a, b) => gIdx(a.level) - gIdx(b.level),
    gradeDesc: (a, b) => gIdx(b.level) - gIdx(a.level),
    rating: (a, b) => statsFor(b.id).avg - statsFor(a.id).avg,
  }[S.sort];
  return list.sort(by);
}

function renderBars() {
  const pool = S.blocks.filter(b => S.view === "old" ? !b.active : b.active);
  const counts = Object.fromEntries(LEVELS.map(l => [l.k, 0]));
  pool.forEach(b => { if (b.level in counts) counts[b.level]++; });
  const max = Math.max(1, ...Object.values(counts));
  $("totalN").textContent = pool.length;
  $("totalLbl").textContent = S.view === "old" ? "bloques desmontados" : (pool.length === 1 ? "bloque abierto" : "bloques abiertos");
  $("bars").replaceChildren(...LEVELS.map(l => {
    const c = counts[l.k];
    return el("button", { class: "bar" + (c ? " has" : "") + (S.level === l.k ? " sel" : ""), "aria-pressed": S.level === l.k ? "true" : "false", "aria-label": `${l.name}: ${c} bloques`,
      onclick: () => { S.level = S.level === l.k ? null : l.k; render(); } },
      el("span", { class: "n", text: c || "" }),
      el("span", { class: "col", style: `height:${Math.max(4, (c / max) * 70)}px;background:${l.bg}` }),
      el("span", { class: "g" }, el("span", { class: "full", text: l.name }), el("span", { class: "short", text: SHORT[l.k] })));
  }));
}

function renderChips() {
  const sc = $("styleChips"); sc.replaceChildren(el("span", { class: "label", text: "Estilo" }));
  STYLES.forEach(s => sc.append(el("button", { class: "chip", "aria-pressed": S.styles.has(s) ? "true" : "false",
    onclick: () => { S.styles.has(s) ? S.styles.delete(s) : S.styles.add(s); render(); } }, s)));
  const cc = $("colorChips"); cc.replaceChildren(el("span", { class: "label", text: "Presa" }));
  const used = new Set(S.blocks.map(b => b.hold_color).filter(Boolean));
  Object.entries(COLORS).filter(([k]) => used.has(k)).forEach(([k, c]) => cc.append(el("button", { class: "chip", "aria-pressed": S.colors.has(k) ? "true" : "false",
    onclick: () => { S.colors.has(k) ? S.colors.delete(k) : S.colors.add(k); render(); } },
    el("span", { class: "dot", style: `background:${c.hex}` }), c.name)));
  const filtering = S.level || S.styles.size || S.colors.size || S.q;
  if (filtering) cc.append(el("button", { class: "clear", onclick: () => { S.level = null; S.styles.clear(); S.colors.clear(); S.q = ""; $("q").value = ""; render(); } }, "Quitar filtros"));
  cc.hidden = used.size === 0 && !filtering;
  ["open", "fav", "old"].forEach(v => $("tab-" + v).setAttribute("aria-pressed", S.view === v ? "true" : "false"));
}

function tape(b) {
  const l = LV[b.level] || { bg: "var(--line)", fg: "var(--ink)", name: "?" };
  const inner = el("span", { class: "grade", text: l.name });
  // En "Compe" el texto va sobre una pastilla clara para leerse encima de las rayas
  if (l.solid) inner.style.cssText = `background:${l.solid};padding:2px 5px;border-radius:3px`;
  return el("div", { class: "tape", style: `background:${l.bg};color:${l.fg}` }, inner);
}
const holdMeta = b => COLORS[b.hold_color] ? el("span", { class: "hold" }, el("span", { class: "dot", style: `background:${COLORS[b.hold_color].hex}` }), "Presa " + COLORS[b.hold_color].name.toLowerCase()) : null;
const starsLine = (st, long) => el("div", { class: "stars-line" },
  st.n ? [el("span", { class: "s", text: starStr(st.avg) }), el("span", { text: long ? `${st.avg.toFixed(1)} de 5 · ${st.n} ${st.n === 1 ? "voto" : "votos"}` : `${st.avg.toFixed(1)} · ${st.n}` })]
       : el("span", { text: long ? "Sin puntuar todavía" : "Sin puntuar" }));

function card(b) {
  const fav = S.favs.includes(b.id);
  const line = starsLine(statsFor(b.id));
  if (S.mine[b.id]?.sent) line.append(el("span", { class: "sent-badge", text: "· Encadenado" }));
  return el("button", { class: "card" + (b.active ? "" : " off"), onclick: () => openDetail(b.id), "aria-label": `Ver ${title(b)}` },
    tape(b),
    el("div", { class: "card-body" },
      el("div", { class: "card-top" }, el("h3", { text: title(b) }), fav ? el("span", { class: "fav-ind", title: "En favoritos", text: "♥" }) : null),
      el("div", { class: "meta" }, b.sector ? el("span", { text: b.sector }) : null, holdMeta(b), b.set_date ? el("span", { class: "mono", text: fmtDate(b.set_date) }) : null),
      (b.styles || []).length ? el("div", { class: "styles" }, b.styles.map(s => el("span", { class: "tag", text: s }))) : null,
      line));
}

function emptyBox(h, p, btn) {
  return el("div", { class: "empty" }, el("h2", { text: h }), el("p", { text: p }), btn || null);
}
function render() {
  renderBars(); renderChips();
  const list = $("list");
  if (!sb) return list.replaceChildren(emptyBox("Falta configurar", "Rellena config.js con la dirección y la clave pública de tu proyecto de Supabase."));
  if (!S.loaded) return list.replaceChildren(emptyBox("Cargando…", "Trayendo los bloques de la sala."));
  if (S.error) return list.replaceChildren(emptyBox("Sin conexión", S.error, el("button", { class: "btn", onclick: refresh }, "Reintentar")));
  const items = visible();
  if (items.length) return list.replaceChildren(el("div", { class: "grid" }, items.map(card)));
  const none = S.blocks.length === 0;
  const [h, p] = none
    ? (S.isSetter ? ["La libreta está vacía", "Añade el primer bloque que hayas equipado: nivel, sector, estilo y la beta."] : ["Aún no hay bloques", "El equipador todavía no ha apuntado ningún bloque. Vuelve pronto."])
    : S.view === "fav" ? ["Sin favoritos", "Abre un bloque y toca ♡ Guardar para tenerlo aquí."]
    : ["Nada con estos filtros", "Prueba a quitar algún nivel, estilo o color."];
  list.replaceChildren(emptyBox(h, p, none && S.isSetter ? el("button", { class: "btn primary", onclick: () => openForm() }, "+ Nuevo bloque") : null));
}

/* ---------- hoja lateral ---------- */
let openId = null, lastFocus = null;
function closeSheet() {
  $("sheetRoot").replaceChildren(); openId = null;
  document.body.style.overflow = "";
  if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  lastFocus?.focus?.(); lastFocus = null;
}
function sheet(...kids) {
  if (!$("sheetRoot").firstChild) lastFocus = document.activeElement;
  const scrim = el("div", { class: "scrim", onclick: e => { if (e.target === scrim) closeSheet(); } },
    el("div", { class: "sheet", role: "dialog", "aria-modal": "true" }, ...kids));
  $("sheetRoot").replaceChildren(scrim);
  document.body.style.overflow = "hidden";
  setTimeout(() => scrim.querySelector(".x")?.focus(), 30);
}
document.addEventListener("keydown", e => { if (e.key === "Escape" && $("sheetRoot").firstChild) closeSheet(); });
const head = (label, big) => el("div", { class: "sheet-head" },
  big ? el("h2", { class: "sheet-title", text: label }) : el("span", { class: "label", text: label }),
  el("button", { class: "x", type: "button", "aria-label": "Cerrar", onclick: closeSheet }, "×"));

async function shareBlock(b) {
  const url = location.origin + location.pathname + "#b-" + b.id;
  const text = `${title(b)} · ${lvName(b)}`;
  try {
    if (navigator.share) { await navigator.share({ title: text, url }); return; }
    await navigator.clipboard.writeText(url); toast("Enlace copiado");
  } catch (e) { if (e?.name !== "AbortError") toast(url); }
}

function openDetail(id) {
  const b = S.blocks.find(x => x.id === id); if (!b) return closeSheet();
  openId = id;
  if (location.hash !== "#b-" + id) history.replaceState(null, "", "#b-" + id);
  const st = statsFor(id);
  const mine = S.mine[id] || { stars: 0, sent: false };
  const fav = S.favs.includes(id);

  const rate = el("div", { class: "rate", role: "group", "aria-label": "Tu puntuación" },
    [1, 2, 3, 4, 5].map(n => el("button", { class: n <= mine.stars ? "on" : "", "aria-label": `${n} estrellas`,
      onclick: () => saveMine(id, { stars: mine.stars === n ? 0 : n, sent: mine.sent }) }, "★")));

  let confirmDel = false;
  const adminBox = el("div", { class: "actions" });
  const drawAdmin = () => adminBox.replaceChildren(
    el("button", { class: "btn", onclick: () => openForm(b) }, "Editar"),
    el("button", { class: "btn", onclick: () => toggleActive(b) }, b.active ? "Marcar desmontado" : "Reabrir bloque"),
    confirmDel
      ? el("span", { class: "row" }, el("button", { class: "btn danger solid", onclick: () => removeBlock(b) }, "Sí, borrar"),
          el("button", { class: "btn", onclick: () => { confirmDel = false; drawAdmin(); } }, "Cancelar"))
      : el("button", { class: "btn danger", onclick: () => { confirmDel = true; drawAdmin(); } }, "Borrar"));
  drawAdmin();

  sheet(
    head(b.active ? "Bloque abierto" : "Bloque desmontado"),
    el("div", { class: "hero-tag" }, tape(b),
      el("div", { class: "info" },
        el("h2", { text: title(b) }),
        el("div", { class: "meta" }, b.sector ? el("span", { text: b.sector }) : null, holdMeta(b),
          b.set_date ? el("span", { class: "mono", text: "Montado " + fmtDate(b.set_date) }) : null,
          !b.active && b.removed_date ? el("span", { class: "mono", text: "Desmontado " + fmtDate(b.removed_date) }) : null),
        (b.styles || []).length ? el("div", { class: "styles" }, b.styles.map(s => el("span", { class: "tag", text: s }))) : null,
        starsLine(st, true),
        el("div", { class: "note", text: `${st.sends} ${st.sends === 1 ? "persona lo ha encadenado" : "personas lo han encadenado"}` }))),
    el("div", { class: "section" }, el("span", { class: "label", text: "Beta" }),
      el("div", { class: "beta" + (b.beta ? "" : " none"), text: b.beta || "El equipador no ha escrito la beta de este bloque." }),
      b.video ? el("a", { class: "link", href: b.video, target: "_blank", rel: "noopener" }, "▶ Ver vídeo de la beta") : null),
    el("div", { class: "section" }, el("span", { class: "label", text: "Tu puntuación" }), rate,
      el("div", { class: "actions" },
        el("button", { class: "btn" + (fav ? " primary" : ""), onclick: () => toggleFav(id) }, fav ? "♥ En favoritos" : "♡ Guardar"),
        el("button", { class: "btn" + (mine.sent ? " primary" : ""), onclick: () => saveMine(id, { stars: mine.stars, sent: !mine.sent }) }, mine.sent ? "✓ Encadenado" : "Marcar encadenado"),
        el("button", { class: "btn", onclick: () => shareBlock(b) }, "Compartir")),
      el("div", { class: "note", text: "Sin registro: tus votos y favoritos se guardan en este móvil." })),
    S.isSetter ? el("div", { class: "section" }, el("span", { class: "label", text: "Equipador" }), adminBox) : null,
  );
}

function openForm(b) {
  const edit = !!b;
  const d = b ? { level: b.level, color: b.hold_color, styles: [...(b.styles || [])] } : { level: "", color: "", styles: [] };
  const errBox = el("div", { class: "err", hidden: true });
  const fail = msg => { errBox.textContent = msg; errBox.hidden = false; };

  const lvBox = el("div", { class: "row", role: "group", "aria-label": "Nivel" });
  const drawLv = () => lvBox.replaceChildren(...LEVELS.map(l => el("button", { type: "button", class: "chip", "aria-pressed": d.level === l.k ? "true" : "false",
    onclick: () => { d.level = l.k; drawLv(); } }, el("span", { class: "dot", style: `background:${l.bg}` }), l.name)));
  drawLv();
  const sw = el("div", { class: "swatches", role: "group", "aria-label": "Color de presa" });
  const drawSw = () => sw.replaceChildren(
    el("button", { type: "button", class: "none-sw", title: "Sin especificar", "aria-label": "Sin especificar", "aria-pressed": !d.color ? "true" : "false", onclick: () => { d.color = ""; drawSw(); } }, "–"),
    ...Object.entries(COLORS).map(([k, c]) => el("button", { type: "button", title: c.name, "aria-label": c.name, "aria-pressed": d.color === k ? "true" : "false", style: `background:${c.hex}`,
      onclick: () => { d.color = k; drawSw(); } })));
  drawSw();
  const stc = el("div", { class: "row" });
  const drawSt = () => stc.replaceChildren(...STYLES.map(s => el("button", { type: "button", class: "chip", "aria-pressed": d.styles.includes(s) ? "true" : "false",
    onclick: () => { d.styles = d.styles.includes(s) ? d.styles.filter(x => x !== s) : [...d.styles, s]; drawSt(); } }, s)));
  drawSt();

  const inp = (id, val, attrs = {}) => el("input", { id, value: val || "", ...attrs });
  const fName = inp("f-name", b?.name, { placeholder: "p. ej. La Ballena", maxlength: "60" });
  const fSector = inp("f-sector", b?.sector, { placeholder: "p. ej. Desplome sur", maxlength: "40" });
  const fDate = inp("f-date", b?.set_date || today(), { type: "date" });
  const fVideo = inp("f-video", b?.video, { type: "url", placeholder: "https://…" });
  const fBeta = el("textarea", { id: "f-beta", maxlength: "4000", placeholder: "Salida de pies en las regletas negras, mano izquierda al romo grande, talón derecho y lance al top…" });
  fBeta.value = b?.beta || "";
  const saveBtn = el("button", { class: "btn primary", type: "submit" }, edit ? "Guardar cambios" : "Añadir bloque");

  const form = el("form", { class: "f", onsubmit: async e => {
    e.preventDefault();
    if (!d.level) return fail("Elige el nivel del bloque.");
    const video = fVideo.value.trim();
    if (video && !/^https?:\/\//i.test(video)) return fail("El enlace del vídeo debe empezar por https://");
    const body = { name: fName.value.trim(), level: d.level, hold_color: d.color, sector: fSector.value.trim(), styles: d.styles,
      set_date: fDate.value || today(), beta: fBeta.value.trim(), video };
    saveBtn.disabled = true;
    const { data, error } = edit
      ? await sb.from("blocks").update(body).eq("id", b.id).select().single()
      : await sb.from("blocks").insert(body).select().single();
    if (error) { saveBtn.disabled = false; return fail(error.code === "42501" ? "Tu cuenta no tiene permiso de equipador." : "No se pudo guardar. Inténtalo de nuevo."); }
    S.blocks = edit ? S.blocks.map(x => x.id === data.id ? data : x) : [data, ...S.blocks];
    toast(edit ? "Bloque actualizado" : "Bloque añadido");
    render(); openDetail(data.id);
  } },
    el("div", { class: "field" }, el("span", { class: "label", text: "Nivel (de fácil a difícil)" }), lvBox),
    el("div", { class: "field" }, el("span", { class: "label", text: "Color de presa (opcional)" }), sw),
    el("label", { class: "field" }, el("span", { class: "label", text: "Fecha de montaje" }), fDate),
    el("div", { class: "two" },
      el("label", { class: "field" }, el("span", { class: "label", text: "Nombre (opcional)" }), fName),
      el("label", { class: "field" }, el("span", { class: "label", text: "Sector / muro" }), fSector)),
    el("div", { class: "field" }, el("span", { class: "label", text: "Estilo" }), stc),
    el("label", { class: "field" }, el("span", { class: "label", text: "Beta" }), fBeta),
    el("label", { class: "field" }, el("span", { class: "label", text: "Vídeo de la beta (opcional)" }), fVideo),
    errBox,
    el("div", { class: "actions" }, saveBtn, el("button", { class: "btn", type: "button", onclick: () => edit ? openDetail(b.id) : closeSheet() }, "Cancelar")));

  openId = null;
  sheet(head(edit ? "Editar bloque" : "Nuevo bloque", true), form);
}

function openLogin() {
  const errBox = el("div", { class: "err", hidden: true });
  const email = el("input", { id: "l-email", type: "email", autocomplete: "username", required: true });
  const pass = el("input", { id: "l-pass", type: "password", autocomplete: "current-password", required: true });
  const go = el("button", { class: "btn primary", type: "submit" }, "Entrar");
  sheet(head("Acceso equipador", true),
    el("p", { class: "note", text: "Solo para el equipo que monta los bloques. Para puntuar y guardar favoritos no hace falta cuenta." }),
    el("form", { class: "f", onsubmit: async e => {
      e.preventDefault(); go.disabled = true; errBox.hidden = true;
      const { error } = await sb.auth.signInWithPassword({ email: email.value.trim(), password: pass.value });
      go.disabled = false;
      if (error) { errBox.textContent = "Email o contraseña incorrectos."; errBox.hidden = false; return; }
      await refresh();
      closeSheet();
      toast(S.isSetter ? "Modo equipador activado" : "Esta cuenta no es de equipador");
    } },
      el("label", { class: "field" }, el("span", { class: "label", text: "Email" }), email),
      el("label", { class: "field" }, el("span", { class: "label", text: "Contraseña" }), pass),
      errBox, el("div", { class: "actions" }, go)));
}

/* ---------- escrituras ---------- */
async function ensureVoter() {
  if (S.session) return true;
  const { data, error } = await sb.auth.signInAnonymously();
  if (error) { toast("Ahora mismo no se pueden guardar votos"); console.error(error); return false; }
  S.session = data.session;
  return true;
}
let mineBusy = Promise.resolve();
function saveMine(id, next) {
  const prev = S.mine[id];
  S.mine[id] = next;
  render(); if (openId === id) openDetail(id);
  mineBusy = mineBusy.then(async () => {
    if (!(await ensureVoter())) throw new Error("sin sesión");
    const { error } = await sb.from("ratings").upsert({ user_id: S.session.user.id, block_id: id, stars: next.stars || null, sent: next.sent, updated_at: new Date().toISOString() });
    if (error) throw error;
    const s = await sb.rpc("block_stats");
    if (!s.error) S.stats = Object.fromEntries(s.data.map(r => [r.block_id, { avg: Number(r.avg_stars) || 0, n: Number(r.votes), sends: Number(r.sends) }]));
  }).catch(e => {
    console.error(e);
    if (prev) S.mine[id] = prev; else delete S.mine[id];
    toast("No se pudo guardar tu voto");
  }).finally(() => { render(); if (openId === id) openDetail(id); });
}
function toggleFav(id) {
  S.favs = S.favs.includes(id) ? S.favs.filter(x => x !== id) : [...S.favs, id];
  store.set("lb-favs", S.favs);
  render(); if (openId === id) openDetail(id);
}
async function toggleActive(b) {
  const patch = { active: !b.active, removed_date: b.active ? today() : null };
  const { data, error } = await sb.from("blocks").update(patch).eq("id", b.id).select().single();
  if (error) return toast("No se pudo cambiar el estado");
  S.blocks = S.blocks.map(x => x.id === b.id ? data : x);
  toast(b.active ? "Marcado como desmontado" : "Bloque reabierto");
  render(); openDetail(b.id);
}
async function removeBlock(b) {
  const { error } = await sb.from("blocks").delete().eq("id", b.id);
  if (error) return toast("No se pudo borrar");
  S.blocks = S.blocks.filter(x => x.id !== b.id);
  closeSheet(); render(); toast("Bloque borrado");
}

/* ---------- arranque ---------- */
["open", "fav", "old"].forEach(v => $("tab-" + v).addEventListener("click", () => { S.view = v; store.set("lb-view", v); render(); }));
$("q").addEventListener("input", e => { S.q = e.target.value.trim(); render(); });
$("sort").addEventListener("change", e => { S.sort = e.target.value; render(); });
$("addBtn").addEventListener("click", () => openForm());
$("loginBtn").addEventListener("click", async () => {
  if (!sb) return;
  if (S.session && !S.session.user.is_anonymous) { await sb.auth.signOut(); await refresh(); toast("Sesión cerrada"); }
  else openLogin();
});
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && sb && S.loaded) refresh(); });

render();
if (sb) refresh().then(() => {
  const m = location.hash.match(/^#b-([0-9a-f-]{36})$/);
  if (m) openDetail(m[1]);
});
