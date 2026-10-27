// Service worker: permite instalar la web como app y abrirla sin conexión.
// - Archivos de la web: primero la red (así siempre llega la última versión) y, si no hay, la copia guardada.
// - Fotos de Supabase (bucket público «fotos»): primero la copia del móvil. Cada foto tiene un nombre único
//   que no cambia, así que nunca se queda vieja; se ahorra transferencia y se ven sin conexión.
// Los datos de Supabase no pasan por aquí: los guarda la propia web (offline.js).
const CACHE = "xlp-web-v3";
const PHOTOS = "xlp-fotos-v1";
const PHOTO_PATH = "/storage/v1/object/public/fotos/";
const MAX_BYTES = 30 * 1024 * 1024, MAX_COUNT = 600;    // tope de la caché de fotos (~30 MB)
const META = "/__xlp-fotos-meta__";                       // tamaño y último uso de cada foto
const SAME = self.location.origin;
const CDN = ["https://cdn.jsdelivr.net", "https://fonts.googleapis.com", "https://fonts.gstatic.com"];

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE && k !== PHOTOS) await caches.delete(k);
  await self.clients.claim();
})()));

const isPhoto = url => url.pathname.includes(PHOTO_PATH);
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;
  if (isPhoto(url)) return e.respondWith(photo(url));
  if (!(url.origin === SAME || CDN.includes(url.origin))) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await fetch(req);
      if (res.ok || res.type === "opaque") cache.put(req, res.clone());
      return res;
    } catch (err) {
      const hit = await cache.match(req, { ignoreSearch: req.mode === "navigate" }) || (req.mode === "navigate" && await cache.match("./"));
      if (hit) return hit;
      throw err;
    }
  })());
});

/* ---------- fotos: primero la caché ---------- */
let meta = null, metaLoading = null, saveTimer = 0;
function loadMeta(cache) {
  if (meta) return meta;
  return metaLoading ||= (async () => {
    try { const r = await cache.match(META); meta = r ? await r.json() : {}; } catch (e) { meta = {}; }
    return meta;
  })();
}
function saveMeta(cache) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => cache.put(META, new Response(JSON.stringify(meta), { headers: { "Content-Type": "application/json" } })), 1500);
}
async function photo(url) {
  const key = url.origin + url.pathname;          // sin parámetros
  const cache = await caches.open(PHOTOS);
  await loadMeta(cache);
  const hit = await cache.match(key);
  if (hit) {
    // Si se perdió su anotación (el móvil cerró el service worker antes de guardarla), se vuelve a apuntar
    meta[key] = { s: meta[key]?.s ?? (await hit.clone().blob()).size, t: Date.now() };
    saveMeta(cache); return hit;
  }
  // Se pide con CORS para poder saber su tamaño (el bucket público de Supabase lo permite)
  let res;
  try { res = await fetch(key, { mode: "cors", credentials: "omit" }); }
  catch (err) { return fetch(url.href).catch(() => Response.error()); }   // sin CORS o sin red: sin guardar
  if (res.ok && res.type !== "opaque") {
    const blob = await res.clone().blob();
    await cache.put(key, res.clone());
    meta[key] = { s: blob.size, t: Date.now() };
    await trim(cache);
    saveMeta(cache);
  }
  return res;
}
// Si se pasa del tope, fuera primero las que hace más tiempo que no se usan
async function trim(cache) {
  const entries = Object.entries(meta);
  let total = entries.reduce((a, [, m]) => a + (m.s || 0), 0), count = entries.length;
  if (total <= MAX_BYTES && count <= MAX_COUNT) return;
  for (const [k] of entries.sort((a, b) => a[1].t - b[1].t)) {
    if (total <= MAX_BYTES * .9 && count <= MAX_COUNT * .9) break;
    await cache.delete(k); total -= meta[k].s || 0; count--; delete meta[k];
  }
}

// La web avisa de qué fotos siguen en uso (bloques abiertos y planos): las demás se borran
self.addEventListener("message", e => {
  const d = e.data || {};
  if (d.type !== "fotos-en-uso" || !Array.isArray(d.urls)) return;
  e.waitUntil((async () => {
    const keep = new Set(d.urls.map(u => { try { const x = new URL(u); return x.origin + x.pathname; } catch (err) { return u; } }));
    const cache = await caches.open(PHOTOS);
    await loadMeta(cache);
    for (const req of await cache.keys()) {
      const k = new URL(req.url); const key = k.origin + k.pathname;
      if (k.pathname === META || keep.has(key)) continue;
      await cache.delete(req); delete meta[key];
    }
    saveMeta(cache);
    e.source?.postMessage?.({ type: "fotos-limpias", kept: keep.size });
  })());
});
