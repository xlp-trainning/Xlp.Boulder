// Service worker: permite instalar la web como app y abrirla sin conexión.
// Primero intenta la red (así siempre llega la última versión) y, si no hay, usa la copia guardada.
// Los datos de Supabase no pasan por aquí: los guarda la propia web (offline.js).
const CACHE = "xlp-web-v1";
const SAME = self.location.origin;
const CDN = ["https://cdn.jsdelivr.net", "https://fonts.googleapis.com", "https://fonts.gstatic.com"];

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || !(url.origin === SAME || CDN.includes(url.origin))) return;
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
