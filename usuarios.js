// Usuarios (solo el máster): cuántos hay, qué hacen, y bloquear o borrar a alguien. Necesita supabase/015-usuarios.sql.
// Cada móvil es un usuario (cuenta anónima). La lista enseña los que tienen algo: apodo, votos, encadenados o betas.
// Además, en cualquier móvil: si la cuenta está bloqueada, un aviso arriba lo explica.

const US = { summary: null, list: null, q: "", loading: false, error: null, busy: null, missing: false, onlyTest: store.get("lb-us-test", false) };
const TEST_LINK = "https://xlp-trainning.github.io/Xlp.Boulder/?prueba";
const shortId = id => String(id || "").slice(0, 6);
const usName = u => u.nick || (u.is_setter && typeof setterById === "function" && setterById(u.user_id)?.name) || `Sin apodo · ${shortId(u.user_id)}`;
const usAgo = d => !d ? "sin actividad" : (typeof ago === "function" ? ago(d) : new Date(d).toLocaleDateString("es-ES"));

async function loadUsuarios() {
  US.loading = true; US.error = null; renderUsuarios();
  const [s, l] = await Promise.all([sb.rpc("admin_user_summary"), sb.rpc("admin_users", { p_q: US.q, p_limit: 300 })]);
  US.loading = false;
  const err = s.error || l.error;
  if (err) {
    US.missing = /admin_user|PGRST202|does not exist|Could not find/i.test(`${err.code} ${err.message}`);
    US.error = US.missing ? null : (isNetErr(err) ? "Sin conexión. Prueba otra vez cuando tengas cobertura." : "No se pudo cargar la lista de usuarios.");
  } else { US.summary = s.data || {}; US.list = l.data || []; US.missing = false; }
  if (S.page === "usuarios") renderUsuarios();
}

async function usAction(u, kind) {
  const name = usName(u);
  if (kind === "block") {
    const reason = prompt(`¿Por qué bloqueas a ${name}? (opcional; solo lo ves tú)`, "");
    if (reason === null) return;
    US.busy = u.user_id; renderUsuarios();
    const { error } = await sb.rpc("admin_block_user", { p_user: u.user_id, p_reason: reason });
    US.busy = null;
    if (error) return toast(/equipador/.test(error.message) ? "Es equipador: quítale antes el acceso en Equipadores" : "No se pudo bloquear"), renderUsuarios();
    toast(`${name} bloqueado`);
  } else if (kind === "unblock") {
    US.busy = u.user_id; renderUsuarios();
    const { error } = await sb.rpc("admin_unblock_user", { p_user: u.user_id });
    US.busy = null;
    if (error) return toast("No se pudo desbloquear"), renderUsuarios();
    toast(`${name} desbloqueado`);
  } else if (kind === "delete") {
    if (!confirm(`¿Borrar a ${name} y todo lo suyo (encadenados, votos, betas, apodo)? No se puede deshacer. Si había creado grupos, pasan al miembro más antiguo.`)) return;
    US.busy = u.user_id; renderUsuarios();
    const { error } = await sb.rpc("admin_delete_user", { p_user: u.user_id });
    US.busy = null;
    if (error) return toast(/equipador/.test(error.message) ? "Es equipador: quítale antes el acceso en Equipadores" : "No se pudo borrar"), renderUsuarios();
    toast(`${name} borrado`);
    S.stats && sb.rpc("block_stats").then(r => { if (!r.error) S.stats = toStats(r.data); });
    invalidateRanking(); invalidateGroups();
  }
  loadUsuarios();
}

function renderUsuarios() {
  const root = $("page-usuarios"); if (!root) return;
  if (!S.isMaster) return root.replaceChildren(emptyBox("Solo para el máster", "Esta sección es para quien gestiona la app."));
  if (US.missing) return root.replaceChildren(emptyBox("Falta un paso en Supabase", "Ejecuta supabase/015-usuarios.sql en el SQL Editor de Supabase y vuelve a abrir esta sección.",
    el("button", { class: "btn", onclick: loadUsuarios }, ico("refresh"), "Volver a probar")));
  if (US.error) return root.replaceChildren(emptyBox("No se pudo cargar", US.error, el("button", { class: "btn primary", onclick: loadUsuarios }, ico("refresh"), "Reintentar"), true));
  if (!US.list) { if (!US.loading) loadUsuarios(); return root.replaceChildren(skeleton(6)); }

  const s = US.summary || {};
  const list = US.onlyTest ? US.list.filter(u => u.cohort === "prueba") : US.list;
  const kpi = (n, l) => el("div", { class: "kpi" }, el("span", { class: "kpi-n", text: n ?? 0 }), el("span", { class: "note", text: l }));
  const search = el("input", { class: "search", id: "us-q", type: "search", value: US.q, placeholder: "Buscar por apodo…", "aria-label": "Buscar usuario por apodo", autocomplete: "off", spellcheck: "false" });
  let t; search.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => { US.q = search.value.trim(); loadUsuarios(); }, 350); });

  const row = u => el("li", { class: "us-row" + (u.blocked ? " is-blocked" : "") },
    el("div", { class: "us-main" },
      el("div", { class: "us-name" }, el("strong", { text: usName(u) }),
        u.cohort === "prueba" ? el("span", { class: "us-pill cohort", text: "Grupo de prueba" }) : null,
        u.is_setter ? el("span", { class: "us-pill", text: "Equipador" }) : null,
        u.in_ranking ? el("span", { class: "us-pill", text: "Ranking" }) : null,
        u.has_pin ? el("span", { class: "us-pill", text: "PIN" }) : null,
        u.blocked ? el("span", { class: "us-pill danger", text: "Bloqueado" }) : null),
      el("span", { class: "note", text: [
        `${u.sends} ${u.sends === 1 ? "encadenado" : "encadenados"}` + (u.sends_30 ? ` (${u.sends_30} este mes)` : ""),
        u.comments ? `${u.comments} ${u.comments === 1 ? "beta" : "betas"}` : null,
        u.groups ? `${u.groups} ${u.groups === 1 ? "grupo" : "grupos"}` : null,
        `última actividad ${usAgo(u.last_seen)}`].filter(Boolean).join(" · ") }),
      u.blocked && u.reason ? el("span", { class: "note", text: `Motivo: ${u.reason}` }) : null),
    u.is_setter ? null : el("div", { class: "us-actions" },
      u.blocked ? el("button", { class: "btn small", disabled: US.busy === u.user_id, onclick: () => usAction(u, "unblock") }, "Desbloquear")
                : el("button", { class: "btn small", disabled: US.busy === u.user_id, onclick: () => usAction(u, "block") }, ico("ban", "sm"), "Bloquear"),
      el("button", { class: "btn small danger", disabled: US.busy === u.user_id, onclick: () => usAction(u, "delete") }, ico("trash", "sm"), "Borrar")));

  root.replaceChildren(el("div", { class: "us" },
    el("section", { class: "section" },
      el("div", { class: "today-head" }, el("span", { class: "label", text: "Usuarios" }),
        el("button", { class: "linkbtn", onclick: loadUsuarios }, ico("refresh", "sm"), "Actualizar")),
      el("p", { class: "note", text: "Cada móvil cuenta como un usuario. Activo es quien ha entrado, apuntado o votado en ese plazo." }),
      el("div", { class: "kpis" },
        kpi(s.total, "móviles en total"), kpi(s.active_7, "activos esta semana"), kpi(s.active_30, "activos este mes"), kpi(s.new_7, "nuevos esta semana"),
        kpi(s.with_nick, "con apodo"), kpi(s.ranking, "en el ranking"), kpi(s.sending, "han encadenado algo"), kpi(s.blocked, "bloqueados")),
      s.cohort != null ? el("p", { class: "note", text: `Grupo de prueba: ${s.cohort} ${s.cohort === 1 ? "persona ha entrado" : "personas han entrado"} con el enlace ${TEST_LINK}` }) : null),
    el("section", { class: "section" },
      el("div", { class: "today-head" }, el("span", { class: "label", text: US.q ? `Resultados para «${US.q}»` : "Con actividad" }),
        el("span", { class: "note", text: `${list.length}${US.list.length >= 300 ? "+" : ""}` })),
      el("label", { class: "search-wrap" }, ico("search"), search),
      US.list.some(u => u.cohort) ? el("button", { class: "chip", "aria-pressed": US.onlyTest ? "true" : "false", onclick: () => { US.onlyTest = !US.onlyTest; store.set("lb-us-test", US.onlyTest); renderUsuarios(); } }, "Solo el grupo de prueba") : null,
      list.length ? el("ul", { class: "us-list" }, list.map(row))
        : el("p", { class: "note", text: US.q ? "Nadie con ese apodo." : "Todavía nadie ha apuntado nada." })),
    el("section", { class: "section" },
      el("div", { class: "today-head" }, el("span", { class: "label", text: "Qué hace cada cosa" })),
      el("ul", { class: "us-help" },
        el("li", {}, el("strong", { text: "Bloquear: " }), "no puede apuntar encadenados, votar, escribir betas ni al buzón, ni crear o unirse a grupos. Sale del ranking y sus betas dejan de verse. Se puede deshacer."),
        el("li", {}, el("strong", { text: "Borrar: " }), "elimina la cuenta y todo lo suyo. No se puede deshacer. Sus grupos pasan al miembro más antiguo."),
        el("li", {}, "A los equipadores se les gestiona desde Equipadores.")))));
}

// En cualquier móvil: si la cuenta está bloqueada, se avisa arriba (sin el 015, no hace nada)
async function checkBlocked() {
  if (!sb || !S.session) return;
  const { data, error } = await sb.rpc("is_blocked");
  S.blocked = !error && data === true;
  let b = $("blockedBanner");
  if (!S.blocked) { if (b) b.hidden = true; return; }
  if (!b) {
    b = el("div", { class: "banner blocked-banner", id: "blockedBanner", role: "status" }, ico("ban"),
      el("span", { text: "Tu cuenta está bloqueada: puedes ver los bloques, pero no apuntar, votar ni escribir. Si crees que es un error, habla con el personal de la sala." }));
    document.querySelector(".mainnav")?.before(b);
  }
  b.hidden = false;
}
