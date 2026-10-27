// Modo sin cobertura: la web guarda en el móvil una copia de los bloques para abrirse sin conexión,
// y lo que apuntas sin red (encadenados, intentos, votos) se guarda en una cola que se sube sola al volver.
// El service worker (sw.js) guarda los archivos de la web. Usa el estado y las utilidades de app.js.

const OFF = { flushing: false, timer: 0 };
const isNetErr = e => !navigator.onLine || /failed to fetch|networkerror|load failed|network request failed|fetch/i.test(e?.message || String(e || ""));
const outbox = () => store.get("lb-outbox", {});

// Copia local de los datos del rocódromo (y de lo tuyo) tras cada carga buena
function saveSnapshot() {
  if (!S.gym || !S.blocks.length) return;
  store.set(`lb-snap-${S.gym}`, { t: Date.now(), gyms: S.gyms, blocks: S.blocks, stats: S.stats, firsts: S.firsts, sectors: S.sectors, mapPath: S.mapPath });
  store.set("lb-snap-mine", S.mine);
}
function loadSnapshot() {
  const snap = store.get(`lb-snap-${S.gym}`, null) || (() => { const k = Object.keys(localStorage).find(k => k.startsWith("lb-snap-") && k !== "lb-snap-mine"); return k ? store.get(k, null) : null; })();
  if (!snap) return false;
  Object.assign(S, { gyms: snap.gyms, blocks: snap.blocks, stats: snap.stats, firsts: snap.firsts || {}, sectors: snap.sectors || [], mapPath: snap.mapPath || "" });
  if (!S.gyms.some(g => g.id === S.gym)) S.gym = S.gyms[0]?.id;
  S.mine = { ...store.get("lb-snap-mine", {}) };
  Object.entries(outbox()).forEach(([id, m]) => S.mine[id] = { ...S.mine[id], ...m });
  S.offline = snap.t;
  return true;
}

// Cola de lo apuntado sin conexión: por bloque, lo último que hiciste
function queueMine(id, m) {
  const box = outbox();
  box[id] = { stars: m.stars || null, sent: !!m.sent, project: !!m.project, flash: !!m.flash, sent_at: m.sent_at || null, feel: m.feel ?? null, attempts: m.attempts || null, morpho: m.morpho ?? null };
  store.set("lb-outbox", box); store.set("lb-snap-mine", S.mine); markNet();
  clearInterval(OFF.timer); OFF.timer = setInterval(flushOutbox, 60000);
}
function unqueue(id) { const box = outbox(); if (id in box) { delete box[id]; store.set("lb-outbox", box); markNet(); } }
async function flushOutbox() {
  const box = outbox(), ids = Object.keys(box);
  if (!ids.length) { clearInterval(OFF.timer); return markNet(); }
  if (OFF.flushing || !navigator.onLine) return;
  OFF.flushing = true;
  let sent = 0;
  try {
    if (!(await ensureVoter())) return;
    for (const id of ids) {
      const { error } = await sb.from("ratings").upsert({ ...box[id], user_id: S.session.user.id, block_id: id, updated_at: new Date().toISOString() });
      if (error && isNetErr(error)) break;
      delete box[id]; store.set("lb-outbox", box); if (!error) sent++;
    }
    if (sent) {
      const s = await sb.rpc("block_stats"); if (!s.error) S.stats = toStats(s.data);
      invalidateRanking(); invalidateGroups();
      toast(`☁️ Subido lo que apuntaste sin conexión (${sent})`);
    }
  } finally {
    OFF.flushing = false;
    if (!Object.keys(outbox()).length) clearInterval(OFF.timer);
    markNet(); render();
  }
}

// Aviso arriba: sin conexión, datos guardados o cosas pendientes de subir
function markNet() {
  const b = $("netBanner"); if (!b) return;
  const n = Object.keys(outbox()).length, off = !navigator.onLine || S.offline;
  b.hidden = !off && !n;
  if (b.hidden) return;
  const age = S.offline ? Math.round((Date.now() - S.offline) / 6e4) : null;
  b.textContent = off
    ? `📴 Sin conexión${age != null ? ` · datos guardados ${age < 60 ? `hace ${Math.max(1, age)} min` : age < 1440 ? `hace ${Math.round(age / 60)} h` : `hace ${Math.round(age / 1440)} días`}` : ""}. Lo que apuntes se guarda en el móvil${n ? ` (${n} pendiente${n === 1 ? "" : "s"})` : ""} y se sube solo al volver la conexión.`
    : `☁️ Subiendo ${n} ${n === 1 ? "cambio" : "cambios"} que apuntaste sin conexión…`;
}
addEventListener("online", () => { S.offline = false; markNet(); if (sb) refresh(); });
addEventListener("offline", markNet);

// Fotos guardadas en el móvil (sw.js): cada 12 h, la web le pasa las fotos que siguen en uso
// (bloques abiertos de los dos rocódromos, con sus miniaturas, y los planos) y el resto se borra
async function sendPhotosInUse(force) {
  const sw = navigator.serviceWorker?.controller;
  if (!sw || (!force && Date.now() - store.get("lb-photo-gc", 0) < 12 * 36e5)) return;
  const { data, error } = await sb.from("blocks").select("photo_path").eq("active", true);
  if (error) return;
  const paths = [...(data || []).map(b => b.photo_path), ...S.gyms.map(g => g.map_path)].filter(p => p && !isStatic(p));
  const urls = paths.flatMap(p => [photoUrl(p), thumbPath(p) ? photoUrl(thumbPath(p)) : null]).filter(Boolean);
  sw.postMessage({ type: "fotos-en-uso", urls });
  store.set("lb-photo-gc", Date.now());
}
