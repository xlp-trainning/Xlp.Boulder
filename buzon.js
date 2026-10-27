// Buzón de sugerencias, sin respuesta ni confirmación de lectura: la gente escribe y ya está.
// Solo el equipador lee los mensajes, en su pestaña «Buzón»; puede archivarlos o borrarlos y nadie se entera.
// Usa el estado y las utilidades de app.js.

const BZ = { list: [], filter: "inbox", fresh: new Set() };
const BZ_KINDS = { idea: "Idea", bloques: "Bloques", fallo: "Algo falla", otro: "Otro" };
const BZ_ICONS = { idea: "bulb", bloques: "mountain", fallo: "bug", otro: "message" };
const fmtWhen = d => new Date(d).toLocaleDateString("es-ES", { day: "numeric", month: "short" });

async function loadSuggestions() {
  BZ.list = [];
  if (!S.isSetter) return;
  const { data, error } = await sb.from("suggestions").select("*").order("created_at", { ascending: false });
  if (!error) BZ.list = data || [];
}

// Número de mensajes nuevos en la pestaña del equipador
function markBuzon() {
  const tab = document.querySelector('[data-page="buzon"]');
  if (!tab) return;
  tab.hidden = !S.isSetter;
  const n = S.isSetter ? BZ.list.filter(m => m.status === "nuevo").length : 0;
  tab.textContent = n ? `Buzón · ${n}` : "Buzón";
  tab.classList.toggle("has-new", n > 0);
}

function openBuzon() {
  let kind = "idea";
  const errBox = el("div", { class: "err", hidden: true });
  const body = el("textarea", { id: "bz-body", maxlength: "2000", rows: "5", placeholder: "Una idea para la web, un bloque que te gustaría ver, algo que no funciona…" });
  const contact = el("input", { id: "bz-contact", maxlength: "100", placeholder: "Opcional", value: store.get("lb-bz-contact", "") });
  const kinds = el("div", { class: "row", role: "group", "aria-label": "Tipo de mensaje" });
  const drawKinds = () => kinds.replaceChildren(...Object.entries(BZ_KINDS).map(([k, t]) =>
    el("button", { type: "button", class: "chip", "aria-pressed": kind === k ? "true" : "false", onclick: () => { kind = k; drawKinds(); } }, ico(BZ_ICONS[k], "sm"), t)));
  drawKinds();
  const send = el("button", { class: "btn primary", type: "submit" }, "Enviar");
  const form = el("form", { class: "f", onsubmit: async e => {
    e.preventDefault();
    const text = body.value.trim();
    if (text.length < 3) { errBox.textContent = "Escribe un poco más."; errBox.hidden = false; return; }
    send.disabled = true; send.textContent = "Enviando…";
    if (!(await ensureVoter())) { send.disabled = false; send.textContent = "Enviar"; return; }
    store.set("lb-bz-contact", contact.value.trim());
    const { error } = await sb.from("suggestions").insert({ user_id: S.session.user.id, gym_id: S.gym, kind, body: text, contact: contact.value.trim() });
    if (error) {
      send.disabled = false; send.textContent = "Enviar";
      errBox.textContent = error.code === "P0001" ? "Has enviado muchos mensajes seguidos. Prueba dentro de un rato." : "No se pudo enviar. Inténtalo de nuevo.";
      errBox.hidden = false; return;
    }
    closeSheet(); toast("¡Gracias! Mensaje enviado");
  } },
    el("div", { class: "field" }, el("span", { class: "label", text: "Sobre qué" }), kinds),
    el("label", { class: "field" }, el("span", { class: "label", text: "Tu mensaje" }), body),
    el("label", { class: "field" }, el("span", { class: "label", text: "Tu nombre o apodo (opcional)" }), contact),
    errBox,
    el("div", { class: "actions" }, send),
    el("p", { class: "note", text: "El buzón no tiene respuesta. Es anónimo salvo que pongas tu nombre." }));
  openId = null;
  sheet(head("Buzón de sugerencias", true),
    el("p", { class: "intro-txt", text: "¿Qué echas de menos en la sala o en la web? Escribe lo que quieras: ideas, peticiones de bloques, fallos…" }),
    form);
  body.focus();
}

/* ---------- pestaña del equipador ---------- */
async function bzUpdate(m, patch, msg) {
  const { error } = await sb.from("suggestions").update(patch).eq("id", m.id);
  if (error) return toast("No se pudo guardar");
  Object.assign(m, patch); if (msg) toast(msg); render();
}
async function bzDelete(m) {
  if (!confirm("¿Borrar este mensaje?")) return;
  const { error } = await sb.from("suggestions").delete().eq("id", m.id);
  if (error) return toast("No se pudo borrar");
  BZ.list = BZ.list.filter(x => x !== m); toast("Mensaje borrado"); render();
}

function renderBuzon() {
  const root = $("page-buzon");
  const gymName = id => S.gyms.find(g => g.id === id)?.name.replace(/^Natural /, "") || "";
  const archived = m => m.status === "hecho";
  const list = BZ.list.filter(m => BZ.filter === "archive" ? archived(m) : !archived(m));
  const item = m => el("article", { class: "bz-item" + (m.status === "nuevo" || BZ.fresh.has(m.id) ? " new" : "") },
    el("div", { class: "bz-meta" },
      el("span", { text: [BZ_KINDS[m.kind], gymName(m.gym_id), fmtWhen(m.created_at)].filter(Boolean).join(" · ") }),
      m.status === "nuevo" || BZ.fresh.has(m.id) ? el("span", { class: "bz-status nuevo", text: "Nuevo" }) : null),
    el("p", { class: "bz-body", text: m.body }),
    m.contact ? el("p", { class: "note" }, "De: ", el("strong", { text: m.contact })) : null,
    el("div", { class: "actions" },
      el("button", { class: "btn small", onclick: () => bzUpdate(m, { status: archived(m) ? "leido" : "hecho" }, archived(m) ? "Devuelto a la bandeja" : "Archivado") },
        archived(m) ? "Sacar del archivo" : "Archivar"),
      el("button", { class: "btn small danger", onclick: () => bzDelete(m) }, "Borrar")));
  root.replaceChildren(
    el("div", { class: "tabs", role: "group", "aria-label": "Mensajes" },
      [["inbox", "Bandeja", BZ.list.filter(m => !archived(m)).length], ["archive", "Archivados", BZ.list.filter(archived).length]].map(([k, t, n]) =>
        el("button", { "aria-pressed": BZ.filter === k ? "true" : "false", onclick: () => { BZ.filter = k; renderBuzon(); } }, `${t} · ${n}`))),
    list.length ? el("div", { class: "bz-list" }, list.map(item))
      : el("p", { class: "note", text: BZ.list.length ? "Nada por aquí." : "Todavía no ha llegado ningún mensaje. La gente escribe desde «Buzón de sugerencias», al pie de la página." }),
    el("p", { class: "note", text: "Nadie sabe si has leído, archivado o borrado su mensaje: el buzón no tiene respuesta ni confirmación de lectura." }));
  // Lo que se ve deja de contar como nuevo (solo para ti; se sigue resaltando mientras estés en la pestaña)
  const unseen = BZ.list.filter(m => m.status === "nuevo");
  if (unseen.length) {
    unseen.forEach(m => { BZ.fresh.add(m.id); m.status = "leido"; });
    Promise.all(unseen.map(m => sb.from("suggestions").update({ status: "leido" }).eq("id", m.id))).then(() => markBuzon());
  }
}
