// Service worker mínimo: permite instalar la web como app. No guarda nada en caché,
// así cada visita trae siempre la última versión de la web.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", e => {
  if (e.request.mode === "navigate") e.respondWith(fetch(e.request));
});
