// Apodo con PIN: el apodo (y con él los grupos y el ranking) va ligado a la identidad anónima de cada móvil.
// Si se pierde (otro móvil, otro navegador, datos borrados…), con el PIN se recupera todo en este móvil.
// El equipador puede poner un PIN a un apodo que no lo tenga. SQL: supabase/010-apodos.sql.
// Usa el estado y las utilidades de app.js y grupos.js (G).

const APODO = { pin: null };   // ¿tu apodo tiene PIN? (null = sin apodo o sin saber)
const validPin = p => /^[0-9]{4,8}$/.test(p);
const pinInput = (attrs = {}) => el("input", { type: "password", inputmode: "numeric", pattern: "[0-9]*", maxlength: "8", autocomplete: "off",
  placeholder: "PIN (4 a 8 cifras)", "aria-label": "PIN del apodo", ...attrs });
const cleanNick = s => (s || "").trim().replace(/\s+/g, " ");

async function loadPinState() {
  APODO.pin = null;
  if (!G.me) return;
  const { data, error } = await sb.rpc("has_pin");
  if (!error) APODO.pin = !!data;
}

// Formulario para ponerse apodo (con PIN) o, si el apodo ya existe, recuperarlo con su PIN
function nickForm({ inRanking = false, submitText = "Guardar", mode = "new", onDone }) {
  const box = el("div", { class: "nick-form" });
  const draw = (m, nickVal = store.get("lb-nick", ""), msg = "") => {
    mode = m;
    const nick = el("input", { value: nickVal, maxlength: "20", placeholder: "Tu apodo", autocomplete: "nickname", "aria-label": "Apodo" });
    const pin = pinInput();
    const btn = el("button", { class: "btn primary", type: "submit" }, m === "new" ? submitText : "Recuperar");
    const busy = on => { btn.disabled = on; };
    box.replaceChildren(...[
      m === "recover" ? el("p", { class: "note", text: msg || "Recupera tu apodo en este móvil: escribe el apodo y su PIN. Vuelven tus grupos, tu ranking y tu progreso." }) : null,
      el("form", { class: "nick-grid", onsubmit: async e => {
        e.preventDefault();
        const n = cleanNick(nick.value), p = pin.value.trim();
        if (n.length < 2 || n.length > 20) return toast("El apodo tiene que tener entre 2 y 20 letras");
        if (!validPin(p)) return toast("El PIN tiene que tener de 4 a 8 cifras");
        busy(true);
        try { m === "new" ? await createNick(n, p, inRanking, draw, onDone) : await recoverNick(n, p, onDone); }
        finally { busy(false); }
      } }, nick, pin, btn),
      m === "new" ? el("p", { class: "note", text: "Con el PIN podrás recuperar tu apodo, tus grupos y tu progreso si cambias de móvil o se borran los datos de la app. Apúntalo." }) : null,
      el("button", { class: "linkbtn", type: "button", onclick: () => draw(m === "new" ? "recover" : "new", cleanNick(nick.value)) },
        m === "new" ? "¿Ya tienes apodo? Recupéralo con tu PIN" : "Crear un apodo nuevo"),
    ].filter(Boolean));
  };
  draw(mode);
  return box;
}

async function createNick(nick, pin, inRanking, draw, onDone) {
  if (!(await ensureVoter())) return;
  const { error } = await sb.from("climbers").insert({ nick, in_ranking: inRanking });
  if (error) {
    if (error.code === "23505") return draw("recover", nick, `«${nick}» ya existe. Si es tuyo, escribe su PIN para recuperarlo en este móvil.`);
    return toast("No se pudo guardar el apodo");
  }
  const r = await sb.rpc("set_pin", { p_pin: pin });
  store.set("lb-nick", nick); G.me = { nick, in_ranking: inRanking }; APODO.pin = !r.error;
  await onDone?.(false);
}
async function recoverNick(nick, pin, onDone) {
  if (!(await ensureVoter())) return;
  const { data, error } = await sb.rpc("claim_nick", { p_nick: nick, p_pin: pin });
  if (error) return toast({ P0003: "No existe ningún apodo así", P0005: "Ese apodo no tiene PIN. Pide al equipador que le ponga uno.", P0006: "Demasiados intentos. Prueba dentro de una hora." }[error.code] || "No se pudo recuperar. Inténtalo de nuevo.");
  if (!data) return toast("PIN incorrecto");
  store.set("lb-nick", data);
  await refresh();
  toast(`Has recuperado «${data}»: tus grupos y tu progreso ya están en este móvil`);
  await onDone?.(true);
}

// Poner o cambiar el PIN del apodo propio
function openPinSheet() {
  const pin = pinInput({ id: "pin-new" });
  openId = null;
  sheet(head(APODO.pin ? "Cambiar el PIN" : "Proteger tu apodo", true),
    el("p", { class: "intro-txt", text: `Con el PIN podrás recuperar «${G.me?.nick || ""}», tus grupos y tu progreso en otro móvil, en otro navegador o si se borran los datos de la app.` }),
    el("form", { class: "nick-grid", onsubmit: async e => {
      e.preventDefault();
      if (!validPin(pin.value.trim())) return toast("El PIN tiene que tener de 4 a 8 cifras");
      const { error } = await sb.rpc("set_pin", { p_pin: pin.value.trim() });
      if (error) return toast("No se pudo guardar el PIN");
      APODO.pin = true; closeSheet(); render(); toast("PIN guardado. Apúntalo en algún sitio");
    } }, pin, el("button", { class: "btn primary", type: "submit" }, "Guardar PIN")),
    el("p", { class: "note", text: "Para recuperarlo: en Grupos, Ranking o Ajustes, «¿Ya tienes apodo? Recupéralo con tu PIN»." }));
  setTimeout(() => pin.focus(), 50);
}
function openRecoverSheet() {
  openId = null;
  sheet(head("Recuperar tu apodo", true), nickForm({ mode: "recover", onDone: () => closeSheet() }));
}

// Aviso para apodos sin PIN
function pinNudge() {
  if (!G.me || APODO.pin !== false) return null;
  return el("div", { class: "banner" }, el("span", { text: `Protege «${G.me.nick}» con un PIN para no perder tus grupos si cambias de móvil.` }),
    el("button", { class: "btn small primary", onclick: openPinSheet }, "Poner PIN"));
}

// Equipador: poner PIN a un apodo que no lo tiene (para quien lo perdió)
function adminPinSection() {
  const nick = el("input", { placeholder: "Apodo", "aria-label": "Apodo", maxlength: "20" });
  const pin = pinInput();
  return el("section", { class: "section" }, el("span", { class: "label", text: "Apodos" }),
    el("p", { class: "note", text: "Si alguien ha perdido su apodo (otro móvil, datos borrados…) y no tenía PIN, ponle uno aquí y díselo: lo recupera desde Grupos, Ranking o Ajustes con «¿Ya tienes apodo? Recupéralo con tu PIN»." }),
    el("form", { class: "nick-grid", onsubmit: async e => {
      e.preventDefault();
      if (!validPin(pin.value.trim())) return toast("El PIN tiene que tener de 4 a 8 cifras");
      const { data, error } = await sb.rpc("admin_set_pin", { p_nick: cleanNick(nick.value), p_pin: pin.value.trim() });
      if (error) return toast(error.code === "P0003" ? "No existe ningún apodo así" : "No se pudo poner el PIN");
      toast(`PIN puesto a «${data}»`); nick.value = ""; pin.value = "";
    } }, nick, pin, el("button", { class: "btn", type: "submit" }, "Poner PIN")));
}
