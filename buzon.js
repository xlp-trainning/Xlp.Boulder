// Buzón de sugerencias: la gente escribe al equipador (sin registrarse) y ve sus mensajes con la respuesta;
// el equipador los lee en su pestaña «Buzón», responde, los marca como hechos o los borra.
// Usa el estado y las utilidades de app.js.

const BZ = { list: [], filter: "pend", fresh: new Set() };
const BZ_KINDS = { idea: "💡 Idea", bloques: "🧗 Bloques", fallo: "🐞 Algo falla", otro: "💬 Otro" };
const BZ_STATUS = { nuevo: "Enviado", leido: "Leído", hecho: "Hecho ✓" };
const fmtWhen = d => new Date(d).toLocaleDateString("es-ES", { day: "numeric", month: "short" });

async function loadSuggestions() {
  BZ.list = [];
  if (!S.session) return;
  const { data, error } = await sb.from("suggestions").select("*").order("created_at", { ascending: false });
  if (!error) BZ.list = data || [];
}

// Avisos: mensajes nuevos para el equipador; respuestas sin leer para la gente
const bzSeen = () => store.get("lb-bz-seen", []);
const bzUnread = () => BZ.list.filter(m => m.user_id === S.session?.user.id && m.reply && !bzSeen().includes(m.id));
function markBuzon() {
  const tab = document.querySelector('[data-page="buzon"]');
  if (tab) {
    tab.hidden = !S.isSetter;
    const n = S.isSetter ? BZ.list.filter(m => m.status === "nuevo").length : 0;
    tab.textContent = n ? `Buzón · ${n}` : "Buzón";
    tab.classList.toggle("has-new", n > 0);
  }
  const unread = S.isSetter ? [] : bzUnread();
  $("buzonBtn")?.classList.toggle("has-new", unread.length > 0);
  const key = unread.map(m => m.id).join();
  if (unread.length && store.get("lb-bz-toast", "") !== key) {
    store.set("lb-bz-toast", key);
    setTimeout(() => toast("📬 El equipador te ha respondido en el buzón"), 900);
  }
}

function openBuzon() {
  let kind = "idea";
  const errBox = el("div", { class: "err", hidden: true });
  const body = el("textarea", { id: "bz-body", maxlength: "2000", rows: "5", placeholder: "Una idea para la web, un bloque que te gustaría ver, algo que no funciona…" });
  const contact = el("input", { id: "bz-contact", maxlength: "100", placeholder: "Opcional: tu apodo, Instagram o email", value: store.get("lb-bz-contact", "") });
  const kinds = el("div", { class: "row", role: "group", "aria-label": "Tipo de mensaje" });
  const drawKinds = () => kinds.replaceChildren(...Object.entries(BZ_KINDS).map(([k, t]) =>
    el("button", { type: "button", class: "chip", "aria-pressed": kind === k ? "true" : "false", onclick: () => { kind = k; drawKinds(); } }, t)));
  drawKinds();
  const send = el("button", { class: "btn primary", type: "submit" }, "Enviar");
  const form = el("form", { class: "f", onsubmit: async e => {
    e.preventDefault();
    const text = body.value.trim();
    if (text.length < 3) { errBox.textContent = "Escribe un poco más."; errBox.hidden = false; return; }
    send.disabled = true; send.textContent = "Enviando…";
    if (!(await ensureVoter())) { send.disabled = false; send.textContent = "Enviar"; return; }
    store.set("lb-bz-contact", contact.value.trim());
    const { data, error } = await sb.from("suggestions").insert({ user_id: S.session.user.id, gym_id: S.gym, kind, body: text, contact: contact.value.trim() }).select().single();
    if (error) {
      send.disabled = false; send.textContent = "Enviar";
      errBox.textContent = error.code === "P0001" ? "Has enviado muchos mensajes seguidos. Prueba dentro de un rato." : "No se pudo enviar. Inténtalo de nuevo.";
      errBox.hidden = false; return;
    }
    BZ.list.unshift(data);
    toast("¡Gracias! Mensaje enviado");
    openBuzon();
  } },
    el("div", { class: "field" }, el("span", { class: "label", text: "Sobre qué" }), kinds),
    el("label", { class: "field" }, el("span", { class: "label", text: "Tu mensaje" }), body),
    el("label", { class: "field" }, el("span", { class: "label", text: "Contacto (opcional)" }), contact),
    errBox,
    el("div", { class: "actions" }, send),
    el("p", { class: "note", text: "Lo lee directamente el equipador. Es anónimo salvo que dejes un contacto; la respuesta te aparecerá aquí, en este móvil." }));

  const mine = BZ.list.filter(m => m.user_id === S.session?.user.id);
  // Al abrir el buzón, las respuestas quedan vistas
  if (mine.some(m => m.reply)) { store.set("lb-bz-seen", [...new Set([...bzSeen(), ...mine.filter(m => m.reply).map(m => m.id)])].slice(-200)); markBuzon(); }
  openId = null;
  sheet(head("Buzón de sugerencias", true),
    el("p", { class: "intro-txt", text: "¿Qué echas de menos en la sala o en la web? Escríbeme lo que quieras: ideas, peticiones de bloques, fallos…" }),
    form,
    mine.length ? el("section", { class: "section" }, el("span", { class: "label", text: "Tus mensajes" }),
      el("div", { class: "bz-list" }, mine.map(m => el("article", { class: "bz-item" },
        el("div", { class: "bz-meta" }, el("span", { text: `${BZ_KINDS[m.kind] || ""} · ${fmtWhen(m.created_at)}` }), el("span", { class: "bz-status " + m.status, text: BZ_STATUS[m.status] })),
        el("p", { class: "bz-body", text: m.body }),
        m.reply ? el("div", { class: "bz-reply" }, el("span", { class: "label", text: "Respuesta del equipador" }), el("p", { text: m.reply })) : null)))) : null);
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
  const list = BZ.list.filter(m => BZ.filter === "all" || (BZ.filter === "done" ? m.status === "hecho" : m.status !== "hecho"));
  const counts = { pend: BZ.list.filter(m => m.status !== "hecho").length, done: BZ.list.filter(m => m.status === "hecho").length, all: BZ.list.length };
  const item = m => {
    const reply = el("textarea", { maxlength: "2000", rows: "2", placeholder: "Responder (lo verá quien lo envió)…", "aria-label": "Respuesta" });
    reply.value = m.reply || "";
    return el("article", { class: "bz-item" + (m.status === "nuevo" || BZ.fresh.has(m.id) ? " new" : "") },
      el("div", { class: "bz-meta" },
        el("span", { text: [BZ_KINDS[m.kind], gymName(m.gym_id), fmtWhen(m.created_at)].filter(Boolean).join(" · ") }),
        el("span", { class: "bz-status " + m.status, text: m.status === "nuevo" ? "Nuevo" : BZ_STATUS[m.status] })),
      el("p", { class: "bz-body", text: m.body }),
      m.contact ? el("p", { class: "note" }, "Contacto: ", el("strong", { text: m.contact })) : null,
      reply,
      el("div", { class: "actions" },
        el("button", { class: "btn small primary", onclick: () => {
          const r = reply.value.trim(); if (r === (m.reply || "")) return;
          bzUpdate(m, { reply: r, replied_at: r ? new Date().toISOString() : null, status: m.status === "nuevo" ? "leido" : m.status }, r ? "Respuesta enviada" : "Respuesta quitada");
        } }, m.reply ? "Guardar respuesta" : "Responder"),
        el("button", { class: "btn small", onclick: () => bzUpdate(m, { status: m.status === "hecho" ? "leido" : "hecho" }, m.status === "hecho" ? "Marcado como pendiente" : "Marcado como hecho") },
          m.status === "hecho" ? "Reabrir" : "✓ Hecho"),
        el("button", { class: "btn small danger", onclick: () => bzDelete(m) }, "Borrar")));
  };
  root.replaceChildren(
    el("div", { class: "tabs", role: "group", "aria-label": "Mensajes" },
      [["pend", "Pendientes"], ["done", "Hechos"], ["all", "Todos"]].map(([k, t]) =>
        el("button", { "aria-pressed": BZ.filter === k ? "true" : "false", onclick: () => { BZ.filter = k; renderBuzon(); } }, `${t} · ${counts[k]}`))),
    list.length ? el("div", { class: "bz-list" }, list.map(item))
      : el("p", { class: "note", text: BZ.list.length ? "Nada por aquí." : "Todavía no ha llegado ningún mensaje. La gente escribe desde «💬 Buzón de sugerencias», al pie de la página." }));
  // Lo que se ve queda leído (se sigue resaltando mientras estés en la pestaña)
  const unseen = BZ.list.filter(m => m.status === "nuevo");
  if (unseen.length) {
    unseen.forEach(m => { BZ.fresh.add(m.id); m.status = "leido"; });
    Promise.all(unseen.map(m => sb.from("suggestions").update({ status: "leido" }).eq("id", m.id))).then(() => markBuzon());
  }
}
