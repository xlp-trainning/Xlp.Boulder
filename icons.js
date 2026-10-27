// Iconos de la interfaz: una sola familia de trazo (24×24, línea de 2 px, puntas redondas), dibujados a mano
// con el estilo de Lucide. Los mismos trazos sirven en la página (ico) y en las tarjetas para historias (drawIco).
// Las reacciones de los grupos (🔥 👏 💪) siguen siendo emoji a propósito.

const ICONS = {
  check: "M20 6 9 17l-5-5",
  x: "M18 6 6 18M6 6l12 12",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  zap: "M13 2 3 14h9l-1 8 10-12h-9l1-8z",
  play: "M7 4.5v15l12.5-7.5z",
  globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3.5 9h17M3.5 15h17M12 3c-2.4 2.4-3.5 5.4-3.5 9s1.1 6.6 3.5 9M12 3c2.4 2.4 3.5 5.4 3.5 9s-1.1 6.6-3.5 9",
  sliders: "M4 7h8M16 7h4M4 17h4M12 17h8M14 4.5v5M10 14.5v5",
  heart: "M19.5 13.6C21 12.1 22 10.6 22 8.6A5.1 5.1 0 0 0 16.9 3.5c-1.9 0-3.2.6-4.9 2.4-1.7-1.8-3-2.4-4.9-2.4A5.1 5.1 0 0 0 2 8.6c0 2 1 3.5 2.5 5L12 21z",
  camera: "M14.5 4h-5L7.5 6.5H4.5a2 2 0 0 0-2 2V18a2 2 0 0 0 2 2h15a2 2 0 0 0 2-2V8.5a2 2 0 0 0-2-2h-3zM12 9.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z",
  share: "M4 13v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6M12 3v12M7.5 7.5 12 3l4.5 4.5",
  map: "M9 4 3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5zM9 4v13.5M15 6.5V20",
  pin: "M12 21.5s7-6 7-11.5a7 7 0 0 0-14 0c0 5.5 7 11.5 7 11.5zM12 7.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z",
  gift: "M20 12v9H4v-9M2.5 7.5h19V12h-19zM12 21V7.5M12 7.5H8a2.3 2.3 0 0 1 0-4.6c2.8 0 4 4.6 4 4.6zM12 7.5h4a2.3 2.3 0 0 0 0-4.6c-2.8 0-4 4.6-4 4.6z",
  flame: "M12 22a7 7 0 0 0 7-7c0-2.4-1.1-4.4-2.6-6-.4 1.6-1.4 2.7-2.6 3.1C14.4 8.6 13.2 5 10 2.5 9.8 6 8.3 7.9 6.8 9.6 5.7 10.9 5 12.7 5 15a7 7 0 0 0 7 7z",
  swords: "M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M14.5 6.5 18 3h3v3l-3.5 3.5M5 14l4 4M7 17l-3 3M3 19l2 2",
  target: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zM12 11.5v1",
  trophy: "M7 4h10v5a5 5 0 0 1-10 0zM7 6H4.5a2.5 2.5 0 0 0 2.6 4.2M17 6h2.5a2.5 2.5 0 0 1-2.6 4.2M12 14v4M8 21h8M9.5 18h5",
  crown: "M3 8l4.5 4 4.5-7 4.5 7L21 8l-2 11H5zM5 19h14",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3.5a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6zM22 21v-2a4 4 0 0 0-3-3.9M16 3.6a3.8 3.8 0 0 1 0 7.4",
  calendar: "M5 4.5h14a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6.5a2 2 0 0 1 2-2zM8 2.5v4M16 2.5v4M3 10h18",
  ruler: "M3.5 15.5 15.5 3.5l5 5-12 12zM7 12l2 2M10 9l2 2M13 6l2 2",
  medal: "M12 9a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM8.5 9.8 6 2.5h4l2 5 2-5h4l-2.5 7.3M12 12.5v5",
  trendUp: "M21 7l-7.5 7.5-4-4L3 17M15 7h6v6",
  trendDown: "M21 17l-7.5-7.5-4 4L3 7M15 17h6v-6",
  arrowUp: "M12 20V5M5.5 11.5 12 5l6.5 6.5",
  arrowRight: "M5 12h14M13 6l6 6-6 6",
  chevron: "M9 5.5 15.5 12 9 18.5",
  cloud: "M7 18.5a4.5 4.5 0 0 1-.6-9 6 6 0 0 1 11.5 1.6 3.8 3.8 0 0 1-.4 7.4M12 12.5v8M9 15.5l3-3 3 3",
  offline: "M3 3l18 18M8.5 16.5a5 5 0 0 1 6.4-.6M2 8.8a15 15 0 0 1 4.3-2.8M10.5 5.1A15 15 0 0 1 22 8.8M5 12.5a10 10 0 0 1 4.8-2.6M16.9 11a10 10 0 0 1 2.1 1.5M12 20h.01",
  phone: "M7.5 2.5h9a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-15a2 2 0 0 1 2-2zM12 7v6.5M9 10.5l3 3 3-3M11 18h2",
  message: "M20.5 15a2 2 0 0 1-2 2H8l-4.5 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z",
  bulb: "M9 18h6M10 21.5h4M15 14.5c.2-1.1.8-1.9 1.5-2.6A6 6 0 1 0 6 8c0 1.4.5 2.6 1.5 3.6.7.8 1.3 1.6 1.5 2.9",
  bug: "M9 7V6a3 3 0 0 1 6 0v1M8 7h8a2 2 0 0 1 2 2v4a6 6 0 0 1-12 0V9a2 2 0 0 1 2-2zM12 12v8M3 13h3M18 13h3M4 7.5 6.5 9M20 7.5 17.5 9M4 19l2.5-1.8M20 19l-2.5-1.8",
  sun: "M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  moon: "M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11z",
  eye: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  pencil: "M16.5 3.5a2.6 2.6 0 0 1 3.7 3.7L7.5 20 2.5 21.5 4 16.5z",
  copy: "M9 9h11v11H9zM5 15H4V4h11v1",
  star: "M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9z",
  mountain: "M2 20.5 9 7l4 7.5 2.5-3.5 6.5 9.5zM7.5 10l1.5 2 1.5-1.5",
  sparkles: "M11 3.5l1.8 4.7L17.5 10l-4.7 1.8L11 16.5l-1.8-4.7L4.5 10l4.7-1.8zM18.5 14v5M16 16.5h5",
  palette: "M12 21.5a9.5 9.5 0 1 1 9.5-9.5c0 2.7-2 4-4 4h-2.3a1.9 1.9 0 0 0-1.4 3.2c.4.4.5.9.5 1.3 0 .6-.9 1-2.3 1zM7.5 11h.01M10 7h.01M14.5 7h.01M17 11h.01",
  hash: "M4 9h16M4 15h16M10 3 8 21M16 3l-2 18",
  dumbbell: "M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11",
  timer: "M12 5.5a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 9.5v4l2.5 1.5M9.5 2.5h5",
  lock: "M5.5 11h13v10h-13zM8.5 11V7.5a3.5 3.5 0 0 1 7 0V11",
  download: "M12 3.5v11.5M7 10l5 5 5-5M4 20.5h16",
  refresh: "M20 11a8 8 0 0 0-14.3-4.3L3.5 9M3.5 4v5h5M4 13a8 8 0 0 0 14.3 4.3l2.2-2.3M20.5 20v-5h-5",
  search: "M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM20.5 20.5l-5.4-5.4",
  key: "M7.5 14.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM10.5 9.5H21M18 9.5V13M15 9.5v2.5",
  layers: "M12 3 2.5 8 12 13l9.5-5zM2.5 12.5 12 17.5l9.5-5M2.5 16.5 12 21.5l9.5-5",
};

// <svg class="ico"> con el icono pedido. Decorativo por defecto: el texto del botón ya lo dice
function ico(name, cls = "") {
  const ns = "http://www.w3.org/2000/svg", s = document.createElementNS(ns, "svg");
  s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true"); s.setAttribute("focusable", "false");
  s.setAttribute("class", "ico" + (cls ? " " + cls : ""));
  const p = document.createElementNS(ns, "path"); p.setAttribute("d", ICONS[name] || ICONS.x); s.append(p);
  return s;
}
// El mismo icono en un lienzo (tarjetas para historias): centrado en (cx, cy), de lado «size»
function drawIco(x, name, cx, cy, size, color, width = 2.2) {
  x.save(); x.translate(cx - size / 2, cy - size / 2); x.scale(size / 24, size / 24);
  x.strokeStyle = color; x.lineWidth = width; x.lineCap = "round"; x.lineJoin = "round";
  x.stroke(new Path2D(ICONS[name] || ICONS.x)); x.restore();
}
// Iconos de la página que ya vienen en el HTML: <span data-ico="nombre"></span>
document.addEventListener("DOMContentLoaded", () => document.querySelectorAll("[data-ico]").forEach(n => n.replaceWith(ico(n.dataset.ico, n.className))));
