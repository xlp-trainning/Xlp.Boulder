// Instalar la web como app (pantalla de inicio) y pasar el progreso de un navegador a otro.
// En iPhone la app instalada no comparte datos con Safari (ni Safari con el navegador de Instagram),
// por eso hay un código para llevarse el progreso. Usa el estado y las utilidades de app.js.

const INST = { evt: null };
const UA = navigator.userAgent;
const isStandalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const devicePlatform = () => /iPhone|iPad|iPod/.test(UA) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) ? "ios" : /Android/.test(UA) ? "android" : "otro";
const inAppBrowser = () => /Instagram|FBAN|FBAV|FB_IAB|TikTok|musical_ly|Line\//i.test(UA);

addEventListener("beforeinstallprompt", e => { e.preventDefault(); INST.evt = e; markInstall(); });
addEventListener("appinstalled", () => { store.set("lb-install-done", 1); INST.evt = null; markInstall(); toast("¡Instalada! Ya tienes Xlp.Boulder en tu pantalla de inicio"); });
if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});

// Banner de invitación: a partir de la 2.ª visita o tras el primer encadenado; «Ahora no» lo esconde 14 días
store.set("lb-visits", store.get("lb-visits", 0) + 1);
function installWanted() {
  if (isStandalone() || store.get("lb-install-done", 0)) return false;
  if (Date.now() < store.get("lb-install-snooze", 0)) return false;
  return store.get("lb-visits", 0) >= 2 || Object.values(S.mine).some(m => m.sent);
}
function markInstall() {
  const b = $("installBanner");
  if (b) b.hidden = !S.loaded || !installWanted();
  const f = $("installLink");
  if (f) f.hidden = isStandalone();
}

const shareIcon = () => { const s = el("span", { class: "ios-share", "aria-label": "icono Compartir" }); s.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 11H6a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'; return s; };
const step = (...kids) => el("li", {}, ...kids);
const strong = t => el("strong", { text: t });

function installSteps(os) {
  if (os === "ios") return el("ol", { class: "steps" },
    step("Abre la web en ", strong("Safari"), ". Si estás dentro de Instagram, toca ", strong("···"), " arriba a la derecha y elige ", strong("«Abrir en el navegador externo»"), "."),
    step("Toca el botón ", strong("Compartir"), " ", shareIcon(), ", abajo en el centro de la pantalla (en iPad, arriba a la derecha)."),
    step("Desliza hacia abajo y toca ", strong("«Añadir a pantalla de inicio»"), ". Si no aparece, toca ", strong("«Editar acciones»"), " al final de la lista y añádela."),
    step("Toca ", strong("«Añadir»"), " arriba a la derecha."),
    step("Abre Xlp.Boulder desde el icono nuevo de tu pantalla de inicio y pega tu código de progreso (abajo) para no perder lo que ya tienes."));
  return el("ol", { class: "steps" },
    step("Abre la web en ", strong("Chrome"), ". Si estás dentro de Instagram, toca ", strong("⋮"), " arriba a la derecha y elige ", strong("«Abrir en Chrome»"), "."),
    step("Toca el menú ", strong("⋮"), " arriba a la derecha."),
    step("Toca ", strong("«Instalar aplicación»"), " o ", strong("«Añadir a pantalla de inicio»"), "."),
    step("Confirma con ", strong("«Instalar»"), ". En un momento aparece el icono en tu pantalla de inicio."),
    step("Si venías de Instagram, pega tu código de progreso (abajo) en la app para no perder lo que ya tienes."));
}

function openInstall() {
  let os = devicePlatform() === "ios" ? "ios" : "android";
  const box = el("div");
  const draw = () => box.replaceChildren(
    el("div", { class: "tabs", role: "group", "aria-label": "Tipo de móvil" },
      [["ios", "iPhone / iPad"], ["android", "Android"]].map(([k, t]) => el("button", { "aria-pressed": os === k ? "true" : "false", onclick: () => { os = k; draw(); } }, t))),
    installSteps(os),
    os === "android" ? el("p", { class: "note", text: "Con Samsung Internet: menú ≡ abajo a la derecha → «Añadir página a» → «Pantalla de inicio»." })
      : el("p", { class: "note", text: "En Chrome para iPhone también se puede: botón Compartir de la barra de direcciones → «Añadir a pantalla de inicio»." }));
  draw();
  openId = null;
  sheet(head("Instala la app", true),
    el("p", { class: "intro-txt", text: "Xlp.Boulder se instala desde el navegador, sin tienda de apps: tendrás el icono en tu pantalla de inicio y se abre a pantalla completa, como una app más." }),
    INST.evt ? el("button", { class: "btn primary big", onclick: async () => { INST.evt.prompt(); const r = await INST.evt.userChoice; if (r.outcome === "accepted") closeSheet(); } }, "📲 Instalar ahora") : null,
    inAppBrowser() ? el("div", { class: "banner", text: "Estás dentro de Instagram (u otra app): desde aquí no se puede instalar. Primero ábrela en el navegador, como dice el paso 1." }) : null,
    box,
    transferSection(),
    el("div", { class: "actions" }, el("button", { class: "btn", onclick: () => { store.set("lb-install-snooze", Date.now() + 14 * 864e5); closeSheet(); markInstall(); } }, "Ahora no")));
}

// Código de progreso: lleva tus votos, encadenados, puntos y apodo a otro navegador o a la app instalada
function transferSection() {
  const out = el("div", { class: "transfer" });
  const input = el("input", { placeholder: "Pega aquí tu código", "aria-label": "Código de progreso", autocomplete: "off", autocapitalize: "off", spellcheck: "false" });
  const anon = S.session?.user.is_anonymous;
  const has = Object.keys(S.mine).length;
  out.append(
    el("span", { class: "label", text: "Pasar tu progreso" }),
    el("p", { class: "note", text: "Lo que guardas (votos, encadenados, puntos, apodo del ranking) vive en este navegador. Para llevarlo a la app instalada o a otro móvil: copia tu código aquí y pégalo allí." }),
    anon && has ? el("button", { class: "btn", onclick: async () => {
      const code = "XLP-" + S.session.refresh_token;
      try { await navigator.clipboard.writeText(code); toast("Código copiado. Pégalo en la app la primera vez que la abras"); }
      catch (e) { prompt("Copia este código:", code); }
    } }, "📋 Copiar mi código") : el("p", { class: "note", text: anon ? "Aquí aún no tienes nada guardado." : "" }),
    el("form", { class: "row", onsubmit: async e => {
      e.preventDefault();
      const code = input.value.trim().replace(/^XLP-/i, "");
      if (!code) return;
      if (Object.keys(S.mine).length && !confirm("Lo que tienes guardado aquí se sustituirá por el progreso del código. ¿Seguir?")) return;
      const { data, error } = await sb.auth.refreshSession({ refresh_token: code });
      if (error || !data?.session) return toast("Ese código no vale o ya se usó. Copia uno nuevo.");
      S.session = data.session; closeSheet(); await refresh(); toast("¡Progreso recuperado!");
    } }, input, el("button", { class: "btn primary", type: "submit" }, "Recuperar")),
    el("p", { class: "note", text: "Cada código sirve una vez y caduca en una hora más o menos. No lo compartas: da acceso a tu progreso." }));
  return out;
}
