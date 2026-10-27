// Grupos de amigos: crear o unirse con código, ranking del grupo, actividad con reacciones, proyectos compartidos,
// duelos, retos del grupo, sesiones en grupo, «¿quién lo ha hecho?» en cada bloque y avisos al abrir la app.
// Los datos los sirven funciones de Supabase que comprueban que eres del grupo (supabase/008-grupos.sql).
// Usa el estado y las utilidades de app.js, progreso.js (pointsFor) e historias.js.

const G = { me: undefined, groups: [], sel: store.get("lb-group", null), tab: store.get("lb-group-tab", "ranking"), period: "month",
  data: {}, key: null, active: [], invite: null, form: null, news: 0 };
const REACTS = [["🔥", "fire"], ["👏", "clap"], ["💪", "strong"]];
const METRICS = { sends: ["encadenados", "encadenado"], points: ["puntos", "punto"], flashes: ["flashes", "flash"] };
const ago = d => { const m = Math.round((Date.now() - new Date(d)) / 6e4); return m < 60 ? `hace ${Math.max(1, m)} min` : m < 1440 ? `hace ${Math.round(m / 60)} h` : m < 2880 ? "ayer" : `hace ${Math.round(m / 1440)} días`; };
const daysLeft = d => Math.max(0, Math.ceil((new Date(d) - Date.now()) / 864e5));
const curGroup = () => G.groups.find(g => g.id === G.sel) || G.groups[0] || null;
const nickErr = e => e?.code === "P0002" ? "Primero ponte un apodo" : e?.code === "P0003" ? "Ese código no existe" : e?.code === "P0001" ? "No se puede: has llegado al límite" : "No se pudo. Inténtalo de nuevo";

// Invitación por enlace: …/#g-CODIGO
{ const m = location.hash.match(/^#g-([A-Za-z0-9]{6})$/); if (m) { G.invite = m[1].toUpperCase(); store.set("lb-page", "grupos"); S.page = "grupos"; history.replaceState(null, "", location.pathname + location.search); } }

async function loadGroups() {
  G.groups = []; G.active = []; G.key = null;
  if (!S.session) { G.me = null; return; }
  const [me, gs, act] = await Promise.all([
    sb.from("climbers").select("nick, in_ranking").eq("user_id", S.session.user.id).maybeSingle(),
    sb.rpc("my_groups"), sb.rpc("group_active_sessions")]);
  G.me = me.data || null;
  G.groups = gs.data || [];
  G.active = act.data || [];
  if (G.groups.length && !G.groups.some(g => g.id === G.sel)) G.sel = G.groups[0].id;
  if (G.groups.length) groupNews();
}
function invalidateGroups() { G.key = null; }

async function loadGroupData() {
  const g = curGroup(); if (!g) return;
  const key = `${g.id}|${G.period}`;
  G.key = key; G.loading = true;
  const [rk, feed, pr, du, ch, pe] = await Promise.all([sb.rpc("group_ranking", { p_group: g.id, p_period: G.period }), sb.rpc("group_feed", { p_group: g.id, p_limit: 60 }),
    sb.rpc("group_projects", { p_group: g.id }), sb.rpc("group_duels", { p_group: g.id }), sb.rpc("group_challenge_progress", { p_group: g.id }), sb.rpc("group_people", { p_group: g.id })]);
  if (G.key !== key) return;
  G.loading = false;
  G.data = { ranking: rk.data || [], feed: feed.data || [], projects: pr.data || [], duels: du.data || [], challenges: ch.data || [], people: pe.data || [] };
  if (S.page === "grupos") renderGrupos();
}

/* ---------- avisos al abrir la app (y punto en la pestaña) ---------- */
async function groupNews() {
  const seen = store.get("lb-g-seen", new Date(Date.now() - 3 * 864e5).toISOString());
  const posKey = "lb-g-pos-" + S.session.user.id, pos = store.get(posKey, {});
  const msgs = []; let count = 0;
  for (const g of G.groups.slice(0, 4)) {
    const [feed, du, rk] = await Promise.all([sb.rpc("group_feed", { p_group: g.id, p_limit: 40 }), sb.rpc("group_duels", { p_group: g.id }), sb.rpc("group_ranking", { p_group: g.id, p_period: "month" })]);
    (du.data || []).filter(d => d.i_am_rival && d.status === "pending").forEach(d => { count++; msgs.push([1, `⚔️ ${d.challenger_nick} te ha retado a un duelo en «${g.name}»`]); });
    const fresh = (feed.data || []).filter(f => !f.is_me && f.sent_at > seen);
    count += fresh.length;
    const byBlock = {};
    fresh.forEach(f => { if (f.active && !S.mine[f.block_id]?.sent) (byBlock[f.block_id] ||= []).push(f); });
    const top = Object.values(byBlock).sort((a, b) => b.length - a.length)[0];
    if (top?.length >= 2) msgs.push([3, `🔥 ${top.length} amigos han hecho «${top[0].block_name || "un bloque " + top[0].level}»; ¿y tú?`]);
    else if (fresh[0]) msgs.push([4, `${fresh[0].nick} encadenó «${fresh[0].block_name || "un bloque " + fresh[0].level}» (${LV[fresh[0].level]?.name.toLowerCase() || ""})`]);
    const rows = rk.data || [], i = rows.findIndex(r => r.is_me);
    if (i >= 0) {
      const above = rows.slice(0, i).map(r => r.nick), before = pos[g.id];
      const passed = before ? above.filter(n => !before.above.includes(n)) : [];
      if (passed.length && before.pos < i + 1) msgs.push([2, `📉 ${passed[0]} te ha adelantado en «${g.name}»`]);
      pos[g.id] = { pos: i + 1, above };
    }
  }
  store.set(posKey, pos);
  G.active.filter(s => !s.am_in).forEach(s => msgs.push([2, `🧗 ${s.starter} ha empezado una sesión en grupo en «${s.group_name}»`]));
  G.news = count;
  markGroups();
  msgs.sort((a, b) => a[0] - b[0]);
  const key = msgs[0]?.[1];
  if (key && store.get("lb-g-toast", "") !== key) { store.set("lb-g-toast", key); setTimeout(() => toast(key), 2200); }
}
function markGroups() {
  const tab = document.querySelector('[data-page="grupos"]');
  if (!tab) return;
  const n = G.news + G.active.filter(s => !s.am_in).length;
  tab.textContent = n ? `Grupos · ${n}` : "Grupos";
  tab.classList.toggle("has-new", n > 0);
}

/* ---------- acciones ---------- */
async function ensureNick(nick) {
  if (G.me) return true;
  nick = (nick || "").trim().replace(/\s+/g, " ");
  if (nick.length < 2 || nick.length > 20) { toast("El apodo tiene que tener entre 2 y 20 letras"); return false; }
  if (!(await ensureVoter())) return false;
  const { error } = await sb.from("climbers").insert({ nick, in_ranking: false });
  if (error) { toast(error.code === "23505" ? "Ese apodo ya lo usa otra persona" : "No se pudo guardar el apodo"); return false; }
  store.set("lb-nick", nick); G.me = { nick, in_ranking: false }; return true;
}
async function createGroup(name) {
  name = name.trim();
  if (name.length < 2) return toast("Ponle un nombre al grupo");
  const { data, error } = await sb.rpc("create_group", { p_name: name });
  if (error) return toast(nickErr(error));
  const g = Array.isArray(data) ? data[0] : data;
  G.sel = g.id; store.set("lb-group", g.id); G.form = null;
  await loadGroups(); render(); toast(`Grupo creado. Invita con el código ${g.code}`);
}
async function joinGroup(code) {
  code = code.trim().toUpperCase().replace(/^.*#G-/, "");
  if (!/^[A-Z0-9]{6}$/.test(code)) return toast("El código tiene 6 letras y números");
  const { data, error } = await sb.rpc("join_group", { p_code: code });
  if (error) return toast(nickErr(error));
  const g = Array.isArray(data) ? data[0] : data;
  G.sel = g.id; store.set("lb-group", g.id); G.invite = null; G.form = null;
  await loadGroups(); render(); toast(`¡Bienvenido a «${g.name}»!`);
}
async function leaveGroup(g) {
  const del = g.is_owner;
  if (!confirm(del ? `¿Borrar el grupo «${g.name}» para todos?` : `¿Salir de «${g.name}»?`)) return;
  const { error } = del ? await sb.from("groups").delete().eq("id", g.id) : await sb.from("group_members").delete().eq("group_id", g.id).eq("user_id", S.session.user.id);
  if (error) return toast("No se pudo");
  G.sel = null; await loadGroups(); render(); toast(del ? "Grupo borrado" : "Has salido del grupo");
}
async function kickMember(g, p) {
  if (!confirm(`¿Sacar a ${p.nick} del grupo?`)) return;
  const { error } = await sb.from("group_members").delete().eq("group_id", g.id).eq("user_id", p.user_id);
  if (error) return toast("No se pudo");
  await loadGroups(); render();
}
async function shareInvite(g) {
  const url = `${location.origin}${location.pathname}#g-${g.code}`;
  const text = `Únete a mi grupo «${g.name}» en Xlp.Boulder: ${url} (código ${g.code})`;
  if (navigator.share) { try { await navigator.share({ title: "Xlp.Boulder", text }); return; } catch (e) { if (e?.name === "AbortError") return; } }
  try { await navigator.clipboard.writeText(text); toast("Invitación copiada: pégala en WhatsApp"); } catch (e) { prompt("Copia la invitación:", text); }
}
async function react(f, emoji) {
  if (f.is_me) return;
  const on = (f.mine || []).includes(emoji);
  const { error } = on
    ? await sb.from("reactions").delete().eq("sender", f.user_id).eq("block_id", f.block_id).eq("user_id", S.session.user.id).eq("emoji", emoji)
    : await sb.from("reactions").insert({ sender: f.user_id, block_id: f.block_id, user_id: S.session.user.id, emoji });
  if (error) return toast("No se pudo");
  const k = REACTS.find(r => r[0] === emoji)[1];
  f[k] += on ? -1 : 1; f.mine = on ? f.mine.filter(e => e !== emoji) : [...(f.mine || []), emoji];
  renderGrupos();
}
async function createDuel(g, rival, kind, block) {
  if (!rival) return toast("Elige a quién retas");
  if (kind === "block" && !block) return toast("Elige el bloque");
  const { error } = await sb.from("duels").insert({ group_id: g.id, challenger: S.session.user.id, rival, kind, block_id: kind === "block" ? block : null });
  if (error) return toast("No se pudo crear el duelo");
  G.form = null; toast("⚔️ Reto enviado"); loadGroupData();
}
async function respondDuel(d, accept) {
  const { error } = await sb.rpc("respond_duel", { p_duel: d.id, p_accept: accept });
  if (error) return toast("No se pudo");
  toast(accept ? "⚔️ ¡Duelo aceptado!" : "Duelo rechazado"); G.news = Math.max(0, G.news - 1); markGroups(); loadGroupData();
}
async function dropDuel(d) {
  const { error } = await sb.from("duels").delete().eq("id", d.id);
  if (!error) loadGroupData();
}
async function createChallenge(g, f) {
  const target = parseInt(f.target, 10);
  if (!(target > 0)) return toast("Pon un objetivo");
  const ends = new Date(Date.now() + Number(f.days) * 864e5).toISOString();
  const { error } = await sb.from("group_challenges").insert({ group_id: g.id, created_by: S.session.user.id, metric: f.metric, target, level: f.level || null, style: f.style || null, ends_at: ends });
  if (error) return toast("No se pudo crear el reto");
  G.form = null; toast("🎯 Reto creado"); loadGroupData();
}
async function dropChallenge(c) {
  if (!confirm("¿Borrar este reto?")) return;
  const { error } = await sb.from("group_challenges").delete().eq("id", c.id);
  if (!error) loadGroupData();
}

// Sesión en grupo: empieza (o se une a) la sesión del grupo y abre el modo sesión
async function startGroupSession(g) {
  const { data, error } = await sb.from("group_sessions").insert({ group_id: g.id, gym_id: S.gym, started_by: S.session.user.id }).select().single();
  if (error) return toast("No se pudo empezar la sesión");
  await sb.from("group_session_members").insert({ session_id: data.id, user_id: S.session.user.id });
  sesSet(null); startSession(); const s = sesGet(); sesSet({ ...s, group: { id: data.id, name: g.name, mine: true } });
  toast(`🧗 Sesión en grupo con «${g.name}»: avisa a tu gente`); G.active = (await sb.rpc("group_active_sessions")).data || []; render();
}
async function joinGroupSession(a) {
  const { error } = await sb.from("group_session_members").insert({ session_id: a.id, user_id: S.session.user.id });
  if (error) return toast("No se pudo unir a la sesión");
  if (a.gym_id && a.gym_id !== S.gym) { setGym(a.gym_id); await refresh(); }
  if (!sesActive()) startSession();
  const s = sesGet(); sesSet({ ...s, group: { id: a.id, name: a.group_name, mine: false } });
  G.active = (await sb.rpc("group_active_sessions")).data || []; SES.open = true; render();
}
// Al terminar la sesión: resumen del grupo (lo llama sesion.js)
async function groupSessionEnd(gs, box) {
  if (gs.mine) await sb.from("group_sessions").update({ ended_at: new Date().toISOString() }).eq("id", gs.id);
  const { data } = await sb.rpc("group_session_summary", { p_session: gs.id });
  const rows = data || [];
  if (!rows.length) return;
  const tot = rows.reduce((a, r) => ({ sends: a.sends + r.sends, flashes: a.flashes + r.flashes, points: a.points + r.points }), { sends: 0, flashes: 0, points: 0 });
  box.replaceChildren(el("span", { class: "label", text: `Sesión en grupo · ${gs.name}` }),
    el("p", { class: "ses-group-tot", text: `Entre ${rows.length}: ${tot.sends} ${tot.sends === 1 ? "bloque" : "bloques"} · ${tot.flashes} ⚡ · +${tot.points} puntos` }),
    el("ol", { class: "rk-list" }, rows.map((r, i) => el("li", { class: "rk-row" + (r.is_me ? " me" : "") },
      el("span", { class: "rk-pos", text: ["🥇", "🥈", "🥉"][i] || String(i + 1) }),
      el("span", { class: "rk-who" }, el("strong", { text: r.nick }), el("span", { class: "note", text: `${r.sends} ${r.sends === 1 ? "bloque" : "bloques"}${r.flashes ? ` · ⚡ ${r.flashes}` : ""}${r.best_level ? ` · máx. ${LV[r.best_level].name.toLowerCase()}` : ""}` })),
      el("span", { class: "rk-pts" }, el("strong", { text: String(r.points) }), el("span", { class: "note", text: "puntos" }))))),
    el("button", { class: "btn", onclick: () => storyGroupSession(gs.name, rows, tot) }, "📸 Compartir la sesión del grupo"));
  G.active = (await sb.rpc("group_active_sessions")).data || []; markGroups();
}
async function storyGroupSession(name, rows, tot) {
  SES.ended = null; closeSessionView(); render();
  const [c, x] = await storyCanvas();
  drawHeader(x, currentGym()?.name || ""); drawFooter(x);
  x.fillStyle = STORY.muted; x.font = `700 46px ${BODY}`; x.fillText("SESIÓN EN GRUPO", 80, 400);
  x.fillStyle = STORY.ink; fitText(x, name.toUpperCase(), 920, 130); x.fillText(name.toUpperCase(), 76, 530);
  x.fillStyle = STORY.accent; x.font = `900 220px ${DISPLAY}`; x.fillText(String(tot.sends), 70, 790);
  x.fillStyle = STORY.ink; x.font = `800 60px ${BODY}`; x.fillText(`${tot.sends === 1 ? "bloque" : "bloques"} entre ${rows.length} · +${tot.points}`, 80, 880);
  let y = 1000;
  rows.slice(0, 7).forEach((r, i) => {
    x.fillStyle = i < 3 ? "#F5CE1B" : STORY.muted; x.font = `900 64px ${DISPLAY}`; x.fillText(`${i + 1}`, 80, y + 50);
    x.fillStyle = STORY.ink; fitText(x, r.nick, 560, 60, 800, BODY); x.fillText(r.nick, 160, y + 48);
    x.fillStyle = STORY.muted; x.font = `700 46px ${BODY}`; x.textAlign = "right"; x.fillText(`${r.sends} · +${r.points}`, 1000, y + 48); x.textAlign = "left";
    y += 100;
  });
  showStory(c, `Sesión de ${name}`);
}

/* ---------- «¿Quién lo ha hecho?» en la ficha del bloque ---------- */
function friendsBox(b) {
  if (!G.groups.length) return null;
  const box = el("div", { class: "section friends" }, el("span", { class: "label", text: "Tus amigos" }), el("p", { class: "note", text: "Cargando…" }));
  sb.rpc("block_friends", { p_block: b.id }).then(({ data }) => {
    const rows = data || [];
    const sent = rows.filter(r => r.sent).sort((a, c) => (a.sent_at || "").localeCompare(c.sent_at || ""));
    const trying = rows.filter(r => !r.sent);
    const mine = S.mine[b.id] || {};
    box.replaceChildren(...[el("span", { class: "label", text: "Tus amigos" }),
      rows.length ? null : el("p", { class: "note", text: "Nadie de tus grupos lo ha probado todavía. ¡Estrénalo!" }),
      sent.length ? el("p", { class: "friends-line" }, "✓ Encadenado: ", ...sent.flatMap((r, i) => [i ? ", " : "", el("strong", { text: r.nick }),
        r.flash ? " ⚡" : r.attempts > 1 ? ` (al ${r.attempts}.º)` : ""])) : null,
      trying.length ? el("p", { class: "friends-line" }, "◎ Probando: ", ...trying.flatMap((r, i) => [i ? ", " : "", el("strong", { text: r.nick }), r.attempts ? ` (${r.attempts} int.)` : ""])) : null,
      trying.length && !mine.sent && (mine.project || mine.attempts) ? el("p", { class: "note", text: `Proyecto compartido: ${trying.map(r => r.nick).join(", ")} y tú. ¿Quién lo saca antes?` }) : null,
      sent.length && !mine.sent ? el("p", { class: "note", text: "Pídeles la beta 😉" }) : null].filter(Boolean));
  });
  return box;
}

/* ---------- página «Grupos» ---------- */
function renderGrupos() {
  const root = $("page-grupos");
  store.set("lb-g-seen", new Date().toISOString()); if (G.news) { G.news = 0; markGroups(); }
  if (!sb || !S.loaded) return;
  const g = curGroup();
  if (g && G.key !== `${g.id}|${G.period}`) loadGroupData();

  // Invitación pendiente (enlace #g-CODIGO)
  const inviteBox = G.invite && !G.groups.some(x => x.code === G.invite) ? el("div", { class: "banner g-invite" },
    el("span", {}, "Te han invitado a un grupo (código ", el("strong", { text: G.invite }), ")"),
    G.me ? el("button", { class: "btn primary small", onclick: () => joinGroup(G.invite) }, "Unirme") : el("span", { class: "note", text: "Ponte un apodo abajo para unirte." })) : null;

  // Sin apodo: lo primero es ponerse uno
  if (!G.me) {
    const input = el("input", { value: store.get("lb-nick", ""), maxlength: "20", placeholder: "Tu apodo", "aria-label": "Apodo" });
    return root.replaceChildren(...[inviteBox,
      el("section", { class: "join" },
        el("span", { class: "label", text: "Grupos de amigos" }),
        el("p", { class: "intro-txt", text: "Crea un grupo con tu gente (o únete con un código) y tendréis vuestro ranking, lo que va encadenando cada uno, duelos, retos y sesiones juntos." }),
        el("form", { class: "row", onsubmit: async e => { e.preventDefault(); if (await ensureNick(input.value)) { if (G.invite) await joinGroup(G.invite); else render(); } } },
          input, el("button", { class: "btn primary", type: "submit" }, G.invite ? "Guardar y unirme" : "Empezar")),
        el("p", { class: "note", text: "Solo tus amigos de grupo ven tu apodo y lo que encadenas. No sales en el ranking público salvo que te apuntes en «Ranking»." }))].filter(Boolean));
  }

  const forms = {
    create: () => { const i = el("input", { maxlength: "40", placeholder: "Nombre del grupo (p. ej. Los del martes)", "aria-label": "Nombre del grupo" });
      setTimeout(() => i.focus()); return el("form", { class: "row g-form", onsubmit: e => { e.preventDefault(); createGroup(i.value); } }, i, el("button", { class: "btn primary", type: "submit" }, "Crear")); },
    join: () => { const i = el("input", { maxlength: "60", placeholder: "Código de 6 letras", "aria-label": "Código del grupo", autocapitalize: "characters" });
      setTimeout(() => i.focus()); return el("form", { class: "row g-form", onsubmit: e => { e.preventDefault(); joinGroup(i.value); } }, i, el("button", { class: "btn primary", type: "submit" }, "Unirme")); },
  };
  const top = el("div", { class: "g-top" },
    el("div", { class: "lg-chips" }, G.groups.map(x => el("button", { class: "chip", "aria-pressed": g && x.id === g.id ? "true" : "false",
      onclick: () => { G.sel = x.id; store.set("lb-group", x.id); renderGrupos(); } }, x.name, el("span", { class: "mono", text: String(x.members) }))),
      el("button", { class: "chip", onclick: () => { G.form = G.form === "create" ? null : "create"; renderGrupos(); } }, "+ Crear grupo"),
      el("button", { class: "chip", onclick: () => { G.form = G.form === "join" ? null : "join"; renderGrupos(); } }, "Unirme con código")),
    G.form && forms[G.form] ? forms[G.form]() : null);

  if (!g) return root.replaceChildren(...[inviteBox, top, el("p", { class: "note", text: "Aún no estás en ningún grupo. Crea uno e invita a tus amigos por WhatsApp, o únete con el código que te pasen." })].filter(Boolean));

  const act = G.active.find(a => a.group_id === g.id);
  const D = G.data;
  const head_ = el("section", { class: "g-head" },
    el("div", {}, el("h2", { class: "g-name", text: g.name }), el("span", { class: "note", text: `${g.members} ${g.members === 1 ? "miembro" : "miembros"} · código ${g.code}` })),
    el("div", { class: "row" },
      el("button", { class: "btn small", onclick: () => shareInvite(g) }, "➕ Invitar"),
      act ? (act.am_in ? el("button", { class: "btn small primary", onclick: () => { SES.open = true; render(); } }, "🧗 Volver a la sesión")
            : el("button", { class: "btn small primary", onclick: () => joinGroupSession(act) }, "🧗 Unirme a la sesión"))
        : el("button", { class: "btn small primary", onclick: () => startGroupSession(g) }, "🧗 Sesión en grupo")));
  const actBox = act ? el("div", { class: "banner" }, `🧗 Sesión en grupo en marcha: ${act.members.join(", ")} (desde ${ago(act.started_at).replace("hace ", "hace ")}).`) : null;
  const tabs = el("div", { class: "tabs", role: "group", "aria-label": "Sección del grupo" },
    [["ranking", "Ranking"], ["actividad", "Actividad"], ["retos", "Retos"], ["gente", "Gente"]].map(([k, t]) =>
      el("button", { "aria-pressed": G.tab === k ? "true" : "false", onclick: () => { G.tab = k; store.set("lb-group-tab", k); renderGrupos(); } }, t)));
  let body;
  if (!D.ranking || G.key !== `${g.id}|${G.period}` && G.loading) body = el("p", { class: "note", text: "Cargando…" });
  else if (G.tab === "ranking") body = groupRankingView(g);
  else if (G.tab === "actividad") body = groupFeedView();
  else if (G.tab === "retos") body = groupChallengesView(g);
  else body = groupPeopleView(g);
  root.replaceChildren(...[inviteBox, top, head_, actBox, tabs, body].filter(Boolean));
}

function groupRankingView(g) {
  const rows = G.data.ranking;
  return el("section", { class: "section" },
    el("div", { class: "tabs", role: "group", "aria-label": "Periodo" }, [["week", "Semana"], ["month", "Mes"], ["all", "Siempre"]].map(([k, t]) =>
      el("button", { "aria-pressed": G.period === k ? "true" : "false", onclick: () => { G.period = k; renderGrupos(); } }, t))),
    el("ol", { class: "rk-list" }, rows.map((r, i) => el("li", { class: "rk-row" + (r.is_me ? " me" : "") },
      el("span", { class: "rk-pos", text: r.points ? (["🥇", "🥈", "🥉"][i] || String(i + 1)) : "–" }),
      el("span", { class: "rk-who" }, el("strong", { text: r.nick + (r.is_me ? " (tú)" : "") }), el("span", { class: "note", text: `${r.sends} ${r.sends === 1 ? "bloque" : "bloques"}${r.flashes ? ` · ⚡ ${r.flashes}` : ""}` })),
      el("span", { class: "rk-pts" }, el("strong", { text: String(r.points) }), el("span", { class: "note", text: "puntos" }))))),
    el("p", { class: "note", text: "Todos contra todos, sin ligas: cuentan los puntos de los dos rocódromos (azul 1 … compe 8; el flash suma la mitad más)." }));
}

function blockLink(f) {
  const name = f.block_name || `Bloque ${LV[f.level]?.name.toLowerCase() || ""}`;
  return el("button", { class: "linkbtn strong", onclick: async () => {
    if (f.gym_id && f.gym_id !== S.gym) { S.gym = f.gym_id; store.set("lb-gym", f.gym_id); await refresh(); }
    openDetail(f.block_id);
  } }, levelDot(f.level), " ", name);
}
function groupFeedView() {
  const { feed, projects } = G.data;
  return el("section", { class: "section" },
    projects.length ? el("div", { class: "section" }, el("span", { class: "label", text: "Proyectos compartidos" }),
      el("div", { class: "bz-list" }, projects.map(p => el("article", { class: "bz-item g-proj" }, blockLink(p),
        el("span", { class: "note", text: `◎ Probando: ${p.trying.join(", ")}` + (p.sent.length ? ` · ✓ Ya lo sacó: ${p.sent.join(", ")}` : " · ¿Quién lo saca primero?") }))))) : null,
    el("span", { class: "label", text: "Lo último" }),
    feed.length ? el("ul", { class: "g-feed" }, feed.map(f => el("li", { class: "g-item" },
      el("p", {}, el("strong", { text: f.is_me ? "Tú" : f.nick }), f.flash ? " hizo flash a " : " encadenó ", blockLink(f),
        !f.flash && f.attempts > 1 ? ` al ${f.attempts}.º intento` : "", el("span", { class: "note", text: ` · ${ago(f.sent_at)}` })),
      el("div", { class: "g-reacts" }, REACTS.map(([e, k]) => el("button", { class: "react" + ((f.mine || []).includes(e) ? " on" : ""), disabled: f.is_me,
        "aria-label": `${e} ${f[k]}`, onclick: () => react(f, e) }, e, f[k] ? el("span", { text: String(f[k]) }) : null))))))
      : el("p", { class: "note", text: "Todavía nadie del grupo ha encadenado nada en los últimos 60 días." }));
}

function duelText(d) {
  const c = d.challenger_nick, r = d.rival_nick;
  if (d.status === "pending") return `${c} reta a ${r}`;
  if (d.kind === "week") {
    const over = Date.now() > new Date(d.ends_at);
    const lead = d.c_points === d.r_points ? "empate" : d.c_points > d.r_points ? c : r;
    return `${c} ${d.c_points} – ${d.r_points} ${r} · ` + (over ? (lead === "empate" ? "terminó en empate" : `🏆 ganó ${lead}`) : `quedan ${daysLeft(d.ends_at)} días`);
  }
  const cs = d.c_sent && new Date(d.c_sent), rs = d.r_sent && new Date(d.r_sent);
  if (!cs && !rs) return `${c} vs ${r} · nadie lo ha encadenado aún`;
  return `🏆 ${(cs && (!rs || cs <= rs)) ? c : r} lo encadenó primero`;
}
function groupChallengesView(g) {
  const { challenges, duels, people } = G.data;
  const others = people.filter(p => !p.is_me);
  const open = S.blocks.filter(b => b.active && !S.mine[b.id]?.sent);
  let form = null;
  if (G.form === "duel") {
    const rival = el("select", { "aria-label": "Rival" }, el("option", { value: "", text: "¿A quién retas?" }), others.map(p => el("option", { value: p.user_id, text: p.nick })));
    const kind = el("select", { "aria-label": "Tipo de duelo" }, el("option", { value: "week", text: "Una semana: quien más puntos sume" }), el("option", { value: "block", text: "Un bloque: quien lo encadene antes" }));
    const block = el("select", { "aria-label": "Bloque", hidden: true }, el("option", { value: "", text: "Elige el bloque" }),
      open.sort((a, b) => gIdx(a.level) - gIdx(b.level)).map(b => el("option", { value: b.id, text: `${lvName(b)} · ${title(b)}${b.sector ? " · " + b.sector : ""}` })));
    kind.onchange = () => block.hidden = kind.value !== "block";
    form = el("form", { class: "g-form col", onsubmit: e => { e.preventDefault(); createDuel(g, rival.value, kind.value, block.value); } },
      rival, kind, block, el("div", { class: "row" }, el("button", { class: "btn primary", type: "submit" }, "⚔️ Retar"), el("button", { class: "btn", type: "button", onclick: () => { G.form = null; renderGrupos(); } }, "Cancelar")));
  } else if (G.form === "challenge") {
    const f = { metric: "sends", target: "10", days: "7", level: "", style: "" };
    const sel = (k, opts, label) => { const s = el("select", { "aria-label": label, onchange: e => f[k] = e.target.value }, opts.map(([v, t]) => el("option", { value: v, text: t }))); s.value = f[k]; return s; };
    const target = el("input", { type: "number", min: "1", max: "10000", value: f.target, "aria-label": "Objetivo", oninput: e => f.target = e.target.value });
    form = el("form", { class: "g-form col", onsubmit: e => { e.preventDefault(); createChallenge(g, f); } },
      el("div", { class: "row" }, el("span", { text: "Entre todos," }), target, sel("metric", Object.entries(METRICS).map(([k, v]) => [k, v[0]]), "Qué se cuenta")),
      el("div", { class: "row" }, sel("level", [["", "de cualquier color"], ...LEVELS.map(l => [l.k, `solo ${l.name.toLowerCase()}`])], "Color"),
        sel("style", [["", "de cualquier estilo"], ...STYLES.map(s => [s, `solo ${s.toLowerCase()}`])], "Estilo")),
      el("div", { class: "row" }, el("span", { text: "en" }), sel("days", [["7", "1 semana"], ["14", "2 semanas"], ["30", "1 mes"]], "Duración")),
      el("div", { class: "row" }, el("button", { class: "btn primary", type: "submit" }, "🎯 Crear reto"), el("button", { class: "btn", type: "button", onclick: () => { G.form = null; renderGrupos(); } }, "Cancelar")));
  }
  const chText = c => `${c.target} ${METRICS[c.metric][c.target === 1 ? 1 : 0]}` + (c.level ? ` de ${LV[c.level].name.toLowerCase()}` : "") + (c.style ? ` de ${c.style.toLowerCase()}` : "");
  return el("section", { class: "section" },
    el("div", { class: "row" },
      el("button", { class: "btn small", onclick: () => { G.form = "challenge"; renderGrupos(); } }, "🎯 Nuevo reto del grupo"),
      others.length ? el("button", { class: "btn small", onclick: () => { G.form = "duel"; renderGrupos(); } }, "⚔️ Retar a alguien") : null),
    form,
    el("span", { class: "label", text: "Retos del grupo" }),
    challenges.length ? el("div", { class: "bz-list" }, challenges.map(c => {
      const done = c.progress >= c.target, over = Date.now() > new Date(c.ends_at);
      return el("article", { class: "bz-item" },
        el("div", { class: "bz-meta" }, el("strong", { text: `🎯 ${chText(c)}` }),
          el("span", { text: done ? "¡Conseguido! 🎉" : over ? "Terminado" : `quedan ${daysLeft(c.ends_at)} días` })),
        el("span", { class: "medal-bar lg-bar" }, el("span", { style: `width:${Math.min(100, c.progress / c.target * 100)}%` })),
        el("span", { class: "note", text: `${c.progress} de ${c.target} entre todos · tú: ${c.mine} · propuesto por ${c.creator}` }),
        c.creator === G.me?.nick || g.is_owner ? el("button", { class: "linkbtn rk-kick", onclick: () => dropChallenge(c) }, "Borrar reto") : null);
    })) : el("p", { class: "note", text: "Sin retos. Proponed uno: «Entre todos, 50 bloques este mes»." }),
    el("span", { class: "label", text: "Duelos" }),
    duels.length ? el("div", { class: "bz-list" }, duels.map(d => el("article", { class: "bz-item" },
      el("div", { class: "bz-meta" }, el("strong", { text: d.kind === "week" ? "⚔️ Semana de puntos" : "⚔️ Duelo de bloque" }),
        el("span", { text: d.status === "pending" ? "pendiente" : d.accepted_at ? `desde ${fmtDate(d.accepted_at)}` : "" })),
      d.kind === "block" ? blockLink(d) : null,
      el("p", { class: "bz-body", text: duelText(d) }),
      d.status === "pending" && d.i_am_rival ? el("div", { class: "row" },
        el("button", { class: "btn small primary", onclick: () => respondDuel(d, true) }, "Aceptar"), el("button", { class: "btn small", onclick: () => respondDuel(d, false) }, "Rechazar")) : null,
      d.status === "pending" && d.i_challenge ? el("button", { class: "linkbtn rk-kick", onclick: () => dropDuel(d) }, "Retirar el reto") : null))) : el("p", { class: "note", text: "Sin duelos. Reta a alguien a un bloque o a una semana de puntos." }));
}

function groupPeopleView(g) {
  return el("section", { class: "section" },
    el("ul", { class: "rk-list" }, G.data.people.map(p => el("li", { class: "rk-row g-person" + (p.is_me ? " me" : "") },
      el("span", { class: "rk-pos", text: p.is_owner ? "👑" : "🧗" }),
      el("span", { class: "rk-who" }, el("strong", { text: p.nick + (p.is_me ? " (tú)" : "") }), el("span", { class: "note", text: p.is_owner ? "creó el grupo" : "" })),
      g.is_owner && !p.is_me ? el("button", { class: "linkbtn rk-kick", onclick: () => kickMember(g, p) }, "Sacar") : el("span")))),
    el("div", { class: "row" },
      el("button", { class: "btn small", onclick: () => shareInvite(g) }, "➕ Invitar"),
      el("button", { class: "btn small danger", onclick: () => leaveGroup(g) }, g.is_owner ? "Borrar el grupo" : "Salir del grupo")));
}

// Para «Tu mes»: premios del mes en tu grupo con más actividad
async function wrappedGroup(back) {
  if (!G.groups.length) return null;
  const month = back ? ymd(monthStart(back)) : null;
  const all = await Promise.all(G.groups.slice(0, 4).map(g => sb.rpc("group_month", { p_group: g.id, p_month: month }).then(r => ({ g, rows: r.data || [] }))));
  const best = all.filter(x => x.rows.length > 1).sort((a, b) => b.rows.reduce((s, r) => s + r.sends, 0) - a.rows.reduce((s, r) => s + r.sends, 0))[0];
  if (!best || !best.rows.some(r => r.sends)) return null;
  const top = (k) => [...best.rows].sort((a, b) => b[k] - a[k])[0];
  const me = best.rows.findIndex(r => r.is_me);
  return { name: best.g.name, size: best.rows.length, pos: me + 1,
    awards: [["🏆", "Más puntos", top("points"), "points", "puntos", "punto"], ["📅", "Más constante", top("weeks"), "weeks", "semanas", "semana"], ["⚡", "Más flashes", top("flashes"), "flashes", "flashes", "flash"], ["💪", "Más insistente", top("attempts"), "attempts", "intentos", "intento"]]
      .filter(([, , r, k]) => r && r[k] > 0).map(([i, t, r, k, u, u1]) => ({ icon: i, title: t, nick: r.nick, value: `${r[k]} ${r[k] === 1 ? u1 : u}`, me: r.is_me })) };
}
