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
const NEW_DAYS = 7;
const gIdx = k => { const i = LEVELS.findIndex(l => l.k === k); return i < 0 ? 99 : i; };
const lvName = b => LV[b.level]?.name || "Sin nivel";
const title = b => b.name || `Bloque ${lvName(b).toLowerCase()}`;
const today = () => new Date().toISOString().slice(0, 10);
const daysSince = d => d ? Math.floor((Date.now() - new Date(d + "T00:00:00").getTime()) / 864e5) : 999;
const isNew = b => b.active && daysSince(b.set_date) < NEW_DAYS;

const CFG = window.LIBRETA_CONFIG || {};
const configured = CFG.supabaseUrl && !CFG.supabaseUrl.includes("TU-PROYECTO") && CFG.supabaseKey && !CFG.supabaseKey.startsWith("TU_");
const sb = configured && window.supabase ? window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey) : null;
const photoUrl = path => path ? sb.storage.from("fotos").getPublicUrl(path).data.publicUrl : "";

const S = {
  blocks: [], stats: {}, mine: {}, favs: [], sectors: [], mapPath: "",
  comments: {}, drafts: {},
  session: null, isSetter: false,
  page: "bloques", view: "open", level: null, sector: null, styles: new Set(), colors: new Set(), q: "", sort: "new",
  placing: null, loaded: false, error: null,
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
  for (const c of kids.flat()) if (c != null && c !== false) n.append(c.nodeType ? c : document.createTextNode(c));
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
S.page = store.get("lb-page", "bloques");
S.favs = store.get("lb-favs", []);
if (CFG.gymName) $("gymName").textContent = CFG.gymName;

/* ---------- datos ---------- */
const toStats = rows => Object.fromEntries((rows || []).map(r => [r.block_id,
  { avg: Number(r.avg_stars) || 0, n: Number(r.votes), sends: Number(r.sends), projects: Number(r.projects) || 0 }]));
async function loadAll() {
  const [b, s, sec, set] = await Promise.all([
    sb.from("blocks").select("*").order("created_at", { ascending: false }),
    sb.rpc("block_stats"),
    sb.from("sectors").select("*").order("name"),
    sb.from("settings").select("map_path").eq("id", 1).maybeSingle(),
  ]);
  if (b.error) throw b.error;
  S.blocks = b.data;
  S.stats = toStats(s.data);
  S.sectors = sec.data || [];
  S.mapPath = set.data?.map_path || "";
}
async function loadMine() {
  S.mine = {};
  if (!S.session) return;
  const { data } = await sb.from("ratings").select("block_id, stars, sent, project");
  (data || []).forEach(r => S.mine[r.block_id] = { stars: r.stars || 0, sent: r.sent, project: r.project });
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
  document.querySelector('[data-page="stats"]').hidden = !S.isSetter;
  if (!S.isSetter && S.page === "stats") S.page = "bloques";
  $("who").textContent = S.isSetter ? "Modo equipador" : "";
  $("loginBtn").textContent = S.session && !S.session.user.is_anonymous ? "Cerrar sesión de equipador" : "Acceso equipador";
}
async function refresh() {
  try {
    await loadSession();
    await Promise.all([loadAll(), loadMine()]);
    S.comments = {};
    if (S.isSetter) await loadAllComments();
    S.error = null;
  } catch (e) {
    console.error(e);
    S.error = "No se pudieron cargar los bloques. Comprueba la conexión y vuelve a intentarlo.";
  }
  S.loaded = true;
  render();
  if (openId) openDetail(openId);
}
async function loadComments(id) {
  const { data, error } = await sb.from("comments").select("*").eq("block_id", id).order("created_at");
  S.comments[id] = error ? [] : data;
}
let allComments = [];
async function loadAllComments() {
  const { data } = await sb.from("comments").select("block_id, created_at");
  allComments = data || [];
}

/* ---------- utilidades de pintado ---------- */
const statsFor = id => S.stats[id] || { avg: 0, n: 0, sends: 0, projects: 0 };
const starStr = avg => { const r = Math.round(avg); return "★".repeat(r) + "☆".repeat(5 - r); };
const fmtDate = d => { if (!d) return ""; const [y, m, dd] = d.slice(0, 10).split("-"); return `${dd}/${m}/${y.slice(2)}`; };
const sectorNames = () => [...new Set([...S.sectors.map(s => s.name), ...S.blocks.map(b => b.sector).filter(Boolean)])].sort((a, b) => a.localeCompare(b, "es"));

function tape(b) {
  const l = LV[b.level] || { bg: "var(--line)", fg: "var(--ink)", name: "?" };
  const inner = el("span", { class: "grade", text: l.name });
  // En "Compe" el texto va sobre una pastilla clara para leerse encima de las rayas
  if (l.solid) inner.style.cssText = `background:${l.solid};padding:2px 5px;border-radius:3px`;
  return el("div", { class: "tape", style: `background:${l.bg};color:${l.fg}` }, inner);
}
const levelDot = k => el("span", { class: "dot", style: `background:${LV[k].bg}` });
const holdMeta = b => COLORS[b.hold_color] ? el("span", { class: "hold" }, el("span", { class: "dot", style: `background:${COLORS[b.hold_color].hex}` }), "Presa " + COLORS[b.hold_color].name.toLowerCase()) : null;
const starsLine = (st, long) => el("div", { class: "stars-line" },
  st.n ? [el("span", { class: "s", text: starStr(st.avg) }), el("span", { text: long ? `${st.avg.toFixed(1)} de 5 · ${st.n} ${st.n === 1 ? "voto" : "votos"}` : `${st.avg.toFixed(1)} · ${st.n}` })]
       : el("span", { text: long ? "Sin puntuar todavía" : "Sin puntuar" }));
const emptyBox = (h, p, btn) => el("div", { class: "empty" }, el("h2", { text: h }), p ? el("p", { text: p }) : null, btn || null);

function card(b) {
  const fav = S.favs.includes(b.id), mine = S.mine[b.id] || {};
  const line = starsLine(statsFor(b.id));
  if (mine.sent) line.append(el("span", { class: "sent-badge", text: "· Encadenado" }));
  else if (mine.project) line.append(el("span", { class: "proj-badge", text: "· Proyecto" }));
  return el("button", { class: "card" + (b.active ? "" : " off") + (b.photo_path ? " has-photo" : ""), onclick: () => openDetail(b.id), "aria-label": `Ver ${title(b)}` },
    tape(b),
    el("div", { class: "card-body" },
      el("div", { class: "card-top" }, el("h3", { text: title(b) }),
        isNew(b) ? el("span", { class: "new-badge", text: "Nuevo" }) : null,
        fav ? el("span", { class: "fav-ind", title: "En favoritos", text: "♥" }) : null),
      el("div", { class: "meta" }, b.sector ? el("span", { text: b.sector }) : null, holdMeta(b), b.set_date ? el("span", { class: "mono", text: fmtDate(b.set_date) }) : null),
      (b.styles || []).length ? el("div", { class: "styles" }, b.styles.map(s => el("span", { class: "tag", text: s }))) : null,
      line),
    b.photo_path ? el("img", { class: "thumb", src: photoUrl(b.photo_path), alt: "", loading: "lazy" }) : null);
}

/* ---------- página: bloques ---------- */
function visible() {
  const list = S.blocks.filter(b => {
    const v = S.view;
    if ((v === "open" || v === "new") && !b.active) return false;
    if (v === "new" && !isNew(b)) return false;
    if (v === "old" && b.active) return false;
    if (v === "fav" && !S.favs.includes(b.id)) return false;
    if (v === "proj" && !(S.mine[b.id]?.project && !S.mine[b.id]?.sent)) return false;
    if (S.level && b.level !== S.level) return false;
    if (S.sector && b.sector !== S.sector) return false;
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
  const newCount = S.blocks.filter(isNew).length;
  document.querySelectorAll("[data-view]").forEach(b => {
    b.setAttribute("aria-pressed", S.view === b.dataset.view ? "true" : "false");
    if (b.dataset.view === "new") b.textContent = newCount ? `Novedades · ${newCount}` : "Novedades";
  });
  const sc = $("styleChips"); sc.replaceChildren(el("span", { class: "label", text: "Estilo" }));
  STYLES.forEach(s => sc.append(el("button", { class: "chip", "aria-pressed": S.styles.has(s) ? "true" : "false",
    onclick: () => { S.styles.has(s) ? S.styles.delete(s) : S.styles.add(s); render(); } }, s)));
  const cc = $("colorChips"); cc.replaceChildren();
  if (S.sector) cc.append(el("span", { class: "label", text: "Sector" }),
    el("button", { class: "chip", "aria-pressed": "true", onclick: () => { S.sector = null; render(); } }, S.sector + "  ×"));
  const used = new Set(S.blocks.map(b => b.hold_color).filter(Boolean));
  if (used.size) cc.append(el("span", { class: "label", text: "Presa" }));
  Object.entries(COLORS).filter(([k]) => used.has(k)).forEach(([k, c]) => cc.append(el("button", { class: "chip", "aria-pressed": S.colors.has(k) ? "true" : "false",
    onclick: () => { S.colors.has(k) ? S.colors.delete(k) : S.colors.add(k); render(); } },
    el("span", { class: "dot", style: `background:${c.hex}` }), c.name)));
  const filtering = S.level || S.sector || S.styles.size || S.colors.size || S.q;
  if (filtering) cc.append(el("button", { class: "clear", onclick: () => { S.level = null; S.sector = null; S.styles.clear(); S.colors.clear(); S.q = ""; $("q").value = ""; render(); } }, "Quitar filtros"));
  cc.hidden = !cc.firstChild;
}

function renderBloques() {
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
    : S.view === "proj" ? ["Sin proyectos", "Abre un bloque que estés probando y toca «Es mi proyecto». Cuando lo encadenes, sale de aquí."]
    : S.view === "new" ? ["Nada nuevo esta semana", `Aquí salen los bloques montados en los últimos ${NEW_DAYS} días.`]
    : ["Nada con estos filtros", "Prueba a quitar algún nivel, sector, estilo o color."];
  list.replaceChildren(emptyBox(h, p, none && S.isSetter ? el("button", { class: "btn primary", onclick: () => openForm() }, "+ Nuevo bloque") : null));
}

/* ---------- página: mapa ---------- */
function goSector(name) { S.sector = name; S.level = null; S.view = "open"; setPage("bloques"); window.scrollTo({ top: 0 }); }
function renderMapa() {
  const root = $("page-mapa");
  const openBy = {};
  S.blocks.filter(b => b.active).forEach(b => { if (b.sector) openBy[b.sector] = (openBy[b.sector] || 0) + 1; });
  const newBy = {};
  S.blocks.filter(isNew).forEach(b => { if (b.sector) newBy[b.sector] = (newBy[b.sector] || 0) + 1; });
  const names = sectorNames();
  const kids = [];

  if (S.mapPath) {
    const placingSec = S.sectors.find(s => s.id === S.placing);
    const plan = el("div", { class: "plan" + (placingSec ? " placing" : "") },
      el("img", { src: photoUrl(S.mapPath), alt: "Plano de la sala" }),
      S.sectors.filter(s => s.x != null && s.y != null).map(s => el("button", { class: "pin" + (newBy[s.name] ? " fresh" : ""), style: `left:${s.x * 100}%;top:${s.y * 100}%`,
        "aria-label": `${s.name}: ${openBy[s.name] || 0} bloques`, onclick: e => { e.stopPropagation(); if (!S.placing) goSector(s.name); } },
        el("span", { class: "pin-name", text: s.name }), el("span", { class: "pin-n", text: openBy[s.name] || 0 }))));
    if (placingSec) plan.addEventListener("click", async e => {
      const r = plan.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
      const { error } = await sb.from("sectors").update({ x, y }).eq("id", placingSec.id);
      if (error) return toast("No se pudo colocar");
      placingSec.x = x; placingSec.y = y; S.placing = null; render(); toast(`${placingSec.name} colocado`);
    });
    if (placingSec) kids.push(el("div", { class: "banner" }, `Toca el plano donde está «${placingSec.name}».`, el("button", { class: "linkbtn", onclick: () => { S.placing = null; render(); } }, "Cancelar")));
    kids.push(el("div", { class: "plan-scroll" }, plan));
    kids.push(el("p", { class: "note", text: "Toca un sector para ver sus bloques. El número es cuántos hay abiertos; en verde, los que tienen novedades." }));
  }

  if (names.length) {
    kids.push(el("div", { class: "section" }, el("span", { class: "label", text: "Sectores" }),
      el("div", { class: "sector-grid" }, names.map(n => el("button", { class: "sector-btn", onclick: () => goSector(n) },
        el("span", { class: "sector-name", text: n }),
        el("span", { class: "note", text: `${openBy[n] || 0} abiertos` + (newBy[n] ? ` · ${newBy[n]} nuevos` : "") }))))));
  } else if (!S.isSetter) kids.push(emptyBox("Sin sectores todavía", "Cuando el equipador apunte los sectores de la sala, aparecerán aquí."));

  if (S.isSetter) kids.push(mapEditor());
  root.replaceChildren(...kids);
}

function mapEditor() {
  const box = el("div", { class: "section editor" }, el("span", { class: "label", text: "Equipador · plano y sectores" }));
  const file = el("input", { type: "file", accept: "image/*", id: "map-file", hidden: true, onchange: async () => {
    const f = file.files[0]; if (!f) return;
    toast("Subiendo plano…");
    try {
      const path = await uploadPhoto(f, "plano", 2000);
      const old = S.mapPath;
      const { error } = await sb.from("settings").upsert({ id: 1, map_path: path });
      if (error) throw error;
      S.mapPath = path; if (old) removePhoto(old);
      render(); toast("Plano actualizado");
    } catch (e) { console.error(e); toast("No se pudo subir el plano"); }
  } });
  box.append(el("div", { class: "actions" }, file,
    el("button", { class: "btn", onclick: () => file.click() }, S.mapPath ? "Cambiar imagen del plano" : "Subir imagen del plano")),
    el("p", { class: "note", text: "Vale una foto de un plano dibujado a mano o una captura. Luego coloca cada sector tocando el plano." }));

  const nameIn = el("input", { id: "new-sector", placeholder: "Nombre del sector, p. ej. Desplome sur", maxlength: "40" });
  box.append(el("form", { class: "row", onsubmit: async e => {
    e.preventDefault();
    const name = nameIn.value.trim(); if (!name) return;
    const { data, error } = await sb.from("sectors").insert({ name }).select().single();
    if (error) return toast(error.code === "23505" ? "Ya hay un sector con ese nombre" : "No se pudo añadir");
    S.sectors.push(data); nameIn.value = ""; render();
  } }, el("div", { class: "field grow" }, nameIn), el("button", { class: "btn", type: "submit" }, "Añadir sector")));

  S.sectors.forEach(s => {
    let mode = "view";
    const row = el("div", { class: "sector-row" });
    const draw = () => {
      if (mode === "rename") {
        const inp = el("input", { value: s.name, maxlength: "40", "aria-label": "Nuevo nombre" });
        row.replaceChildren(el("form", { class: "row grow", onsubmit: async e => {
          e.preventDefault(); const nn = inp.value.trim(); if (!nn || nn === s.name) { mode = "view"; return draw(); }
          const { error } = await sb.from("sectors").update({ name: nn }).eq("id", s.id);
          if (error) return toast(error.code === "23505" ? "Ya hay un sector con ese nombre" : "No se pudo renombrar");
          await sb.from("blocks").update({ sector: nn }).eq("sector", s.name);
          S.blocks.forEach(b => { if (b.sector === s.name) b.sector = nn; });
          s.name = nn; render();
        } }, el("div", { class: "field grow" }, inp), el("button", { class: "btn primary", type: "submit" }, "Guardar"),
          el("button", { class: "btn", type: "button", onclick: () => { mode = "view"; draw(); } }, "Cancelar")));
        return;
      }
      row.replaceChildren(el("span", { class: "grow", text: s.name + (s.x == null ? " · sin colocar" : "") }),
        S.mapPath ? el("button", { class: "btn small", onclick: () => { S.placing = s.id; render(); window.scrollTo({ top: 0, behavior: "smooth" }); } }, s.x == null ? "Colocar" : "Mover") : null,
        el("button", { class: "btn small", onclick: () => { mode = "rename"; draw(); } }, "Renombrar"),
        mode === "confirm"
          ? el("button", { class: "btn small danger solid", onclick: async () => {
              const { error } = await sb.from("sectors").delete().eq("id", s.id);
              if (error) return toast("No se pudo borrar");
              S.sectors = S.sectors.filter(x => x.id !== s.id); render();
            } }, "Sí, borrar")
          : el("button", { class: "btn small danger", onclick: () => { mode = "confirm"; draw(); } }, "Borrar"));
    };
    draw(); box.append(row);
  });
  return box;
}

/* ---------- página: mi progreso ---------- */
function renderProgreso() {
  const root = $("page-progreso");
  const open = S.blocks.filter(b => b.active);
  const sent = open.filter(b => S.mine[b.id]?.sent);
  const projects = S.blocks.filter(b => b.active && S.mine[b.id]?.project && !S.mine[b.id]?.sent);
  const oldSent = S.blocks.filter(b => !b.active && S.mine[b.id]?.sent).length;
  const pct = open.length ? Math.round(sent.length / open.length * 100) : 0;
  // El nivel más alto con al menos un encadenado
  const top = [...LEVELS].reverse().find(l => sent.some(b => b.level === l.k));

  root.replaceChildren(
    el("section", { class: "dist progress-head" },
      el("div", { class: "dist-head" },
        el("div", { class: "total" }, el("span", { text: sent.length }), el("small", { text: `de ${open.length} bloques abiertos encadenados` })),
        el("span", { class: "big-pct mono", text: pct + "%" })),
      el("div", { class: "meta" },
        top ? el("span", { class: "hold" }, levelDot(top.k), `Tu nivel más alto: ${top.name}`) : el("span", { text: "Marca tus primeros encadenados en cada bloque." }),
        oldSent ? el("span", { text: `${oldSent} más en bloques ya desmontados` }) : null)),
    el("section", { class: "section" }, el("span", { class: "label", text: "Por nivel" }),
      el("div", { class: "levels" }, LEVELS.map(l => {
        const tot = open.filter(b => b.level === l.k).length;
        const got = sent.filter(b => b.level === l.k).length;
        return el("button", { class: "lvl-row", disabled: !tot, onclick: () => { S.level = l.k; S.view = "open"; setPage("bloques"); } },
          el("span", { class: "lvl-name" }, levelDot(l.k), l.name),
          el("span", { class: "lvl-track" }, el("span", { class: "lvl-fill", style: `width:${tot ? got / tot * 100 : 0}%;background:${l.bg}` })),
          el("span", { class: "mono lvl-n", text: tot ? `${got}/${tot}` : "—" }));
      }))),
    el("section", { class: "section" }, el("span", { class: "label", text: "Proyectos en curso" }),
      projects.length ? el("div", { class: "grid" }, projects.map(card))
        : el("p", { class: "note", text: "Marca «Es mi proyecto» en los bloques que estés probando para tenerlos a mano aquí." })),
    el("p", { class: "note", text: "Tu progreso se guarda en este móvil, sin cuenta. Si cambias de móvil o borras los datos del navegador, empezarás de cero." }));
}

/* ---------- página: estadísticas (equipador) ---------- */
function renderStats() {
  const root = $("page-stats");
  const open = S.blocks.filter(b => b.active);
  const st = id => statsFor(id);
  const sum = (arr, f) => arr.reduce((a, b) => a + f(b), 0);
  const commentsBy = {}; allComments.forEach(c => commentsBy[c.block_id] = (commentsBy[c.block_id] || 0) + 1);
  const kpi = (n, l) => el("div", { class: "kpi" }, el("span", { class: "kpi-n", text: n }), el("span", { class: "note", text: l }));
  const rated = open.filter(b => st(b.id).n);
  const avgAll = rated.length ? sum(rated, b => st(b.id).avg * st(b.id).n) / sum(rated, b => st(b.id).n) : 0;

  const table = (cols, rows) => el("div", { class: "table-scroll" }, el("table", {},
    el("thead", {}, el("tr", {}, cols.map(c => el("th", { text: c })))),
    el("tbody", {}, rows)));
  const blockCell = b => el("td", {}, el("button", { class: "linkbtn strong", onclick: () => openDetail(b.id) }, levelDot(b.level), " ", title(b)));

  const byLevel = LEVELS.map(l => {
    const bl = open.filter(b => b.level === l.k);
    const r = bl.filter(b => st(b.id).n);
    const avg = r.length ? sum(r, b => st(b.id).avg) / r.length : 0;
    return el("tr", {}, el("td", {}, el("span", { class: "hold" }, levelDot(l.k), l.name)),
      el("td", { class: "num", text: bl.length }),
      el("td", { class: "num", text: avg ? avg.toFixed(1) + " ★" : "—" }),
      el("td", { class: "num", text: bl.length ? (sum(bl, b => st(b.id).sends) / bl.length).toFixed(1) : "—" }));
  });
  const styleCounts = STYLES.map(s => [s, open.filter(b => (b.styles || []).includes(s)).length]).filter(([, n]) => n).sort((a, b) => b[1] - a[1]);
  const maxStyle = Math.max(1, ...styleCounts.map(([, n]) => n));

  const ranking = (label, list, value, empty) => el("section", { class: "section" }, el("span", { class: "label", text: label }),
    list.length ? table(["Bloque", ""], list.map(b => el("tr", {}, blockCell(b), el("td", { class: "num", text: value(b) })))) : el("p", { class: "note", text: empty }));
  const best = rated.slice().sort((a, b) => st(b.id).avg - st(a.id).avg || st(b.id).n - st(a.id).n).slice(0, 5);
  const worst = rated.filter(b => st(b.id).n >= 2).sort((a, b) => st(a.id).avg - st(b.id).avg).slice(0, 5);
  const fewSends = open.filter(b => daysSince(b.set_date) >= 14).sort((a, b) => st(a.id).sends - st(b.id).sends).slice(0, 5);
  const projected = open.filter(b => st(b.id).projects).sort((a, b) => st(b.id).projects - st(a.id).projects).slice(0, 5);
  const talked = open.filter(b => commentsBy[b.id]).sort((a, b) => commentsBy[b.id] - commentsBy[a.id]).slice(0, 5);

  root.replaceChildren(
    el("div", { class: "kpis" },
      kpi(open.length, "bloques abiertos"),
      kpi(S.blocks.filter(isNew).length, `montados en ${NEW_DAYS} días`),
      kpi(avgAll ? avgAll.toFixed(1) + " ★" : "—", "puntuación media"),
      kpi(sum(open, b => st(b.id).sends), "encadenados"),
      kpi(allComments.length, "comentarios")),
    el("section", { class: "section" }, el("span", { class: "label", text: "Por nivel (abiertos)" }),
      table(["Nivel", "Bloques", "Media", "Encad."], byLevel)),
    el("section", { class: "section" }, el("span", { class: "label", text: "Estilos (abiertos)" }),
      styleCounts.length ? el("div", { class: "hbars" }, styleCounts.map(([s, n]) => el("div", { class: "hbar" },
        el("span", { text: s }), el("span", { class: "hbar-track" }, el("span", { class: "hbar-fill", style: `width:${n / maxStyle * 100}%` })), el("span", { class: "mono", text: n }))))
        : el("p", { class: "note", text: "Aún no hay bloques con estilo." })),
    ranking("Los que más gustan", best, b => `${st(b.id).avg.toFixed(1)} ★ · ${st(b.id).n}`, "Todavía nadie ha puntuado."),
    ranking("Los que menos gustan (2 votos o más)", worst, b => `${st(b.id).avg.toFixed(1)} ★ · ${st(b.id).n}`, "Hace falta algún voto más."),
    ranking("Poco encadenados (montados hace 14 días o más)", fewSends, b => `${st(b.id).sends} encad.`, "Ningún bloque lleva 14 días montado."),
    ranking("Más proyectados", projected, b => `${st(b.id).projects} probando`, "Nadie lo ha marcado como proyecto todavía."),
    ranking("Con más comentarios", talked, b => `${commentsBy[b.id]} coment.`, "Sin comentarios todavía."));
}

/* ---------- navegación ---------- */
function setPage(p) { S.page = p; store.set("lb-page", p); render(); }
function render() {
  // Sin datos todavía, todas las secciones enseñan el estado de la lista (cargando, error, sin configurar)
  const page = !sb || !S.loaded || S.error ? "bloques" : S.page;
  document.querySelectorAll("[data-page]").forEach(b => b.setAttribute("aria-current", b.dataset.page === S.page ? "page" : "false"));
  document.querySelectorAll(".page").forEach(p => p.hidden = p.id !== "page-" + page);
  if (page === "bloques") return renderBloques();
  if (S.page === "mapa") renderMapa();
  if (S.page === "progreso") renderProgreso();
  if (S.page === "stats") renderStats();
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
  const fresh = !$("sheetRoot").firstChild;
  if (fresh) lastFocus = document.activeElement;
  const prevScroll = $("sheetRoot").querySelector(".sheet")?.scrollTop || 0;
  const scrim = el("div", { class: "scrim", onclick: e => { if (e.target === scrim) closeSheet(); } },
    el("div", { class: "sheet", role: "dialog", "aria-modal": "true" }, ...kids));
  $("sheetRoot").replaceChildren(scrim);
  document.body.style.overflow = "hidden";
  if (fresh) setTimeout(() => scrim.querySelector(".x")?.focus(), 30);
  else scrim.querySelector(".sheet").scrollTop = prevScroll;
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

function commentsSection(b) {
  const id = b.id;
  const list = S.comments[id];
  if (!list) loadComments(id).then(() => { if (openId === id) openDetail(id); });
  const myId = S.session?.user.id;
  const d = S.drafts[id] ||= { body: "", video: "" };
  const nick = el("input", { id: "c-nick", value: store.get("lb-nick", ""), maxlength: "30", placeholder: "Tu apodo", autocomplete: "nickname",
    oninput: e => store.set("lb-nick", e.target.value) });
  const body = el("textarea", { id: "c-body", maxlength: "1000", placeholder: "Cómo lo hiciste tú: pies, secuencia, el truco del paso clave…", oninput: e => d.body = e.target.value });
  body.value = d.body;
  const video = el("input", { id: "c-video", type: "url", value: d.video, placeholder: "Enlace a tu vídeo (opcional)", oninput: e => d.video = e.target.value });
  const err = el("div", { class: "err", hidden: true });
  const send = el("button", { class: "btn primary", type: "submit" }, "Publicar");

  const items = (list || []).map(c => {
    const canDel = c.user_id === myId || S.isSetter;
    let confirm = false;
    const del = el("span");
    const drawDel = () => del.replaceChildren(!canDel ? "" : confirm
      ? el("button", { class: "linkbtn danger", onclick: async () => {
          const { error } = await sb.from("comments").delete().eq("id", c.id);
          if (error) return toast("No se pudo borrar");
          S.comments[id] = S.comments[id].filter(x => x.id !== c.id); allComments = allComments.filter(x => x.id !== c.id);
          openDetail(id);
        } }, "¿Borrar? Sí")
      : el("button", { class: "linkbtn", onclick: () => { confirm = true; drawDel(); } }, "Borrar"));
    drawDel();
    return el("li", { class: "comment" },
      el("div", { class: "comment-head" }, el("strong", { text: c.author }), el("span", { class: "mono note", text: fmtDate(c.created_at) }), del),
      el("p", { text: c.body }),
      c.video ? el("a", { class: "link", href: c.video, target: "_blank", rel: "noopener" }, "▶ Ver su vídeo") : null);
  });

  return el("div", { class: "section" }, el("span", { class: "label", text: `Betas de la gente${list?.length ? " · " + list.length : ""}` }),
    !list ? el("p", { class: "note", text: "Cargando…" }) : items.length ? el("ul", { class: "comments" }, items) : el("p", { class: "note", text: "Nadie ha contado su beta todavía. ¡Sé el primero!" }),
    el("form", { class: "f comment-form", onsubmit: async e => {
      e.preventDefault(); err.hidden = true;
      const author = nick.value.trim(), text = body.value.trim(), vid = video.value.trim();
      if (!author) { err.textContent = "Pon un apodo para firmar tu beta."; err.hidden = false; return; }
      if (!text) { err.textContent = "Escribe tu beta o comentario."; err.hidden = false; return; }
      if (vid && !/^https?:\/\//i.test(vid)) { err.textContent = "El enlace del vídeo debe empezar por https://"; err.hidden = false; return; }
      send.disabled = true;
      if (!(await ensureVoter())) { send.disabled = false; return; }
      const { data, error } = await sb.from("comments").insert({ block_id: id, user_id: S.session.user.id, author, body: text, video: vid }).select().single();
      send.disabled = false;
      if (error) { err.textContent = error.code === "P0001" ? "Has publicado muchos comentarios seguidos. Espera un rato." : "No se pudo publicar. Inténtalo de nuevo."; err.hidden = false; return; }
      (S.comments[id] ||= []).push(data); allComments.push(data);
      S.drafts[id] = { body: "", video: "" };
      toast("Beta publicada"); openDetail(id);
    } },
      el("label", { class: "field" }, el("span", { class: "label", text: "Cuenta tu beta" }), body),
      el("div", { class: "two" }, el("div", { class: "field" }, nick), el("div", { class: "field" }, video)),
      err, el("div", { class: "actions" }, send)));
}

function openDetail(id) {
  const b = S.blocks.find(x => x.id === id); if (!b) return closeSheet();
  openId = id;
  if (location.hash !== "#b-" + id) history.replaceState(null, "", "#b-" + id);
  const st = statsFor(id);
  const mine = { stars: 0, sent: false, project: false, ...S.mine[id] };
  const fav = S.favs.includes(id);

  const rate = el("div", { class: "rate", role: "group", "aria-label": "Tu puntuación" },
    [1, 2, 3, 4, 5].map(n => el("button", { class: n <= mine.stars ? "on" : "", "aria-label": `${n} estrellas`,
      onclick: () => saveMine(id, { ...mine, stars: mine.stars === n ? 0 : n }) }, "★")));

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
    head(b.active ? (isNew(b) ? "Bloque nuevo" : "Bloque abierto") : "Bloque desmontado"),
    b.photo_path ? el("a", { class: "photo-link", href: photoUrl(b.photo_path), target: "_blank", rel: "noopener", "aria-label": "Ver la foto en grande" },
      el("img", { class: "photo", src: photoUrl(b.photo_path), alt: `Foto de ${title(b)} en el muro` })) : null,
    el("div", { class: "hero-tag" }, tape(b),
      el("div", { class: "info" },
        el("h2", { text: title(b) }),
        el("div", { class: "meta" }, b.sector ? el("button", { class: "linkbtn", onclick: () => { closeSheet(); goSector(b.sector); } }, b.sector) : null, holdMeta(b),
          b.set_date ? el("span", { class: "mono", text: "Montado " + fmtDate(b.set_date) }) : null,
          !b.active && b.removed_date ? el("span", { class: "mono", text: "Desmontado " + fmtDate(b.removed_date) }) : null),
        (b.styles || []).length ? el("div", { class: "styles" }, b.styles.map(s => el("span", { class: "tag", text: s }))) : null,
        starsLine(st, true),
        el("div", { class: "note", text: `${st.sends} ${st.sends === 1 ? "persona lo ha encadenado" : "personas lo han encadenado"}` + (st.projects ? ` · ${st.projects} lo ${st.projects === 1 ? "está" : "están"} probando` : "") }))),
    el("div", { class: "section" }, el("span", { class: "label", text: "Beta del equipador" }),
      el("div", { class: "beta" + (b.beta ? "" : " none"), text: b.beta || "El equipador no ha escrito la beta de este bloque." }),
      b.video ? el("a", { class: "link", href: b.video, target: "_blank", rel: "noopener" }, "▶ Ver vídeo de la beta") : null),
    el("div", { class: "section" }, el("span", { class: "label", text: "Tu puntuación" }), rate,
      el("div", { class: "actions" },
        el("button", { class: "btn" + (mine.sent ? " primary" : ""), onclick: () => saveMine(id, { ...mine, sent: !mine.sent }) }, mine.sent ? "✓ Encadenado" : "Marcar encadenado"),
        mine.sent ? null : el("button", { class: "btn" + (mine.project ? " primary" : ""), onclick: () => saveMine(id, { ...mine, project: !mine.project }) }, mine.project ? "◎ Es mi proyecto" : "Es mi proyecto"),
        el("button", { class: "btn" + (fav ? " primary" : ""), onclick: () => toggleFav(id) }, fav ? "♥ En favoritos" : "♡ Guardar"),
        el("button", { class: "btn", onclick: () => shareBlock(b) }, "Compartir")),
      el("div", { class: "note", text: "Sin registro: tus votos, proyectos y favoritos se guardan en este móvil." })),
    commentsSection(b),
    S.isSetter ? el("div", { class: "section" }, el("span", { class: "label", text: "Equipador" }), adminBox) : null,
  );
}

/* ---------- fotos ---------- */
async function resizeImage(file, max) {
  let src;
  try { src = await createImageBitmap(file, { imageOrientation: "from-image" }); }
  catch (e) {
    src = new Image(); src.src = URL.createObjectURL(file); await src.decode();
  }
  const w = src.width, h = src.height, k = Math.min(1, max / Math.max(w, h));
  const c = document.createElement("canvas"); c.width = Math.round(w * k); c.height = Math.round(h * k);
  c.getContext("2d").drawImage(src, 0, 0, c.width, c.height);
  return new Promise((res, rej) => c.toBlob(b => b ? res(b) : rej(new Error("toBlob")), "image/jpeg", 0.82));
}
async function uploadPhoto(file, folder, max = 1600) {
  const blob = await resizeImage(file, max);
  const path = `${folder}/${crypto.randomUUID()}.jpg`;
  const { error } = await sb.storage.from("fotos").upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000" });
  if (error) throw error;
  return path;
}
function removePhoto(path) { if (path) sb.storage.from("fotos").remove([path]); }

/* ---------- formulario del equipador ---------- */
function openForm(b) {
  const edit = !!b;
  const d = b ? { level: b.level, color: b.hold_color, styles: [...(b.styles || [])], photo: b.photo_path || "", file: null }
              : { level: "", color: "", styles: [], photo: "", file: null };
  const errBox = el("div", { class: "err", hidden: true });
  const fail = msg => { errBox.textContent = msg; errBox.hidden = false; };

  const lvBox = el("div", { class: "row", role: "group", "aria-label": "Nivel" });
  const drawLv = () => lvBox.replaceChildren(...LEVELS.map(l => el("button", { type: "button", class: "chip", "aria-pressed": d.level === l.k ? "true" : "false",
    onclick: () => { d.level = l.k; drawLv(); } }, levelDot(l.k), l.name)));
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

  const photoBox = el("div", { class: "photo-edit" });
  const fileIn = el("input", { type: "file", accept: "image/*", id: "f-photo", hidden: true, onchange: () => { d.file = fileIn.files[0] || null; drawPhoto(); } });
  const drawPhoto = () => {
    const src = d.file ? URL.createObjectURL(d.file) : d.photo ? photoUrl(d.photo) : "";
    photoBox.replaceChildren(fileIn,
      src ? el("img", { class: "photo", src, alt: "Vista previa de la foto" }) : null,
      el("div", { class: "actions" },
        el("button", { type: "button", class: "btn", onclick: () => fileIn.click() }, src ? "Cambiar foto" : "📷 Añadir foto"),
        src ? el("button", { type: "button", class: "btn danger", onclick: () => { d.file = null; d.photo = ""; fileIn.value = ""; drawPhoto(); } }, "Quitar foto") : null));
  };
  drawPhoto();

  const inp = (id, val, attrs = {}) => el("input", { id, value: val || "", ...attrs });
  const fName = inp("f-name", b?.name, { placeholder: "p. ej. La Ballena", maxlength: "60" });
  const fSector = inp("f-sector", b?.sector, { placeholder: "p. ej. Desplome sur", maxlength: "40", list: "sector-list" });
  const sectorList = el("datalist", { id: "sector-list" }, sectorNames().map(n => el("option", { value: n })));
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
    saveBtn.disabled = true; saveBtn.textContent = d.file ? "Subiendo foto…" : "Guardando…";
    let photo_path = d.photo;
    try { if (d.file) photo_path = await uploadPhoto(d.file, "bloques"); }
    catch (err) { console.error(err); saveBtn.disabled = false; saveBtn.textContent = edit ? "Guardar cambios" : "Añadir bloque"; return fail("No se pudo subir la foto. Prueba con otra imagen."); }
    const sector = fSector.value.trim();
    const body = { name: fName.value.trim(), level: d.level, hold_color: d.color, sector, styles: d.styles,
      set_date: fDate.value || today(), beta: fBeta.value.trim(), video, photo_path };
    const { data, error } = edit
      ? await sb.from("blocks").update(body).eq("id", b.id).select().single()
      : await sb.from("blocks").insert(body).select().single();
    if (error) {
      if (photo_path !== d.photo) removePhoto(photo_path);
      saveBtn.disabled = false; saveBtn.textContent = edit ? "Guardar cambios" : "Añadir bloque";
      return fail(error.code === "42501" ? "Tu cuenta no tiene permiso de equipador." : "No se pudo guardar. Inténtalo de nuevo.");
    }
    if (edit && b.photo_path && b.photo_path !== photo_path) removePhoto(b.photo_path);
    // Un sector nuevo escrito a mano pasa a la lista de sectores para poder colocarlo en el plano
    if (sector && !S.sectors.some(s => s.name === sector)) {
      const r = await sb.from("sectors").insert({ name: sector }).select().single();
      if (!r.error) S.sectors.push(r.data);
    }
    S.blocks = edit ? S.blocks.map(x => x.id === data.id ? data : x) : [data, ...S.blocks];
    toast(edit ? "Bloque actualizado" : "Bloque añadido");
    render(); openDetail(data.id);
  } },
    el("div", { class: "field" }, el("span", { class: "label", text: "Nivel (de fácil a difícil)" }), lvBox),
    el("div", { class: "field" }, el("span", { class: "label", text: "Foto del bloque (opcional)" }), photoBox),
    el("div", { class: "field" }, el("span", { class: "label", text: "Color de presa (opcional)" }), sw),
    el("div", { class: "two" },
      el("label", { class: "field" }, el("span", { class: "label", text: "Nombre (opcional)" }), fName),
      el("label", { class: "field" }, el("span", { class: "label", text: "Sector / muro" }), fSector, sectorList)),
    el("label", { class: "field" }, el("span", { class: "label", text: "Fecha de montaje" }), fDate),
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

/* ---------- escrituras de los escaladores ---------- */
async function ensureVoter() {
  if (S.session) return true;
  const { data, error } = await sb.auth.signInAnonymously();
  if (error) { toast("Ahora mismo no se puede guardar"); console.error(error); return false; }
  S.session = data.session;
  return true;
}
let mineBusy = Promise.resolve();
function saveMine(id, next) {
  // Al encadenar, el proyecto queda cumplido
  if (next.sent) next = { ...next, project: false };
  const prev = S.mine[id];
  S.mine[id] = next;
  render(); if (openId === id) openDetail(id);
  mineBusy = mineBusy.then(async () => {
    if (!(await ensureVoter())) throw new Error("sin sesión");
    const { error } = await sb.from("ratings").upsert({ user_id: S.session.user.id, block_id: id, stars: next.stars || null, sent: next.sent, project: next.project, updated_at: new Date().toISOString() });
    if (error) throw error;
    const s = await sb.rpc("block_stats");
    if (!s.error) S.stats = toStats(s.data);
  }).catch(e => {
    console.error(e);
    if (prev) S.mine[id] = prev; else delete S.mine[id];
    toast("No se pudo guardar");
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
  removePhoto(b.photo_path);
  S.blocks = S.blocks.filter(x => x.id !== b.id);
  closeSheet(); render(); toast("Bloque borrado");
}

/* ---------- arranque ---------- */
document.querySelectorAll("[data-page]").forEach(b => b.addEventListener("click", () => setPage(b.dataset.page)));
document.querySelectorAll("[data-view]").forEach(b => b.addEventListener("click", () => { S.view = b.dataset.view; store.set("lb-view", S.view); render(); }));
$("q").addEventListener("input", e => { S.q = e.target.value.trim(); render(); });
$("sort").addEventListener("change", e => { S.sort = e.target.value; render(); });
$("addBtn").addEventListener("click", () => openForm());
$("loginBtn").addEventListener("click", async () => {
  if (!sb) return;
  if (S.session && !S.session.user.is_anonymous) { await sb.auth.signOut(); await refresh(); toast("Sesión cerrada"); }
  else openLogin();
});
// Al volver a la app, traer cambios; si hay un formulario abierto, no tocar nada para no perder lo escrito
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && sb && S.loaded && !document.querySelector(".sheet form:not(.comment-form)")) refresh();
});

render();
if (sb) refresh().then(() => {
  const m = location.hash.match(/^#b-([0-9a-f-]{36})$/);
  if (m) openDetail(m[1]);
});
