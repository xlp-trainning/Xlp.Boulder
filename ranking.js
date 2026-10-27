// Ranking mensual por ligas de color. Todos empiezan en Azul; para subir a la liga de un color
// hay que encadenar 10 bloques de ese color en el rocódromo. Dentro de cada liga, puntos del mes.
// El cálculo de verdad lo hace Supabase (ranking() en supabase/004-ranking.sql); aquí se repite
// para enseñar tu liga al momento, aunque no te hayas apuntado.

const PROMOTE = 10;
const PLURAL = { azul: "azules", verde: "verdes", naranja: "naranjas", amarillo: "amarillos", morado: "morados", rojo: "rojos", negro: "negros", compe: "bloques compe" };
const RK = { key: null, rows: [], me: undefined, loading: false, error: false, month: "cur", league: null, editing: false };

// Tu liga en este rocódromo, con tus encadenados (sin contar los marcados después de desmontar el bloque)
function myLeague() {
  const n = LEVELS.map(() => 0);
  S.blocks.forEach(b => {
    const m = S.mine[b.id];
    if (!m?.sent || !m.sent_at) return;
    if (b.removed_date && m.sent_at.slice(0, 10) > b.removed_date) return;
    n[gIdx(b.level)]++;
  });
  let ord = 0;
  n.forEach((c, i) => { if (c >= PROMOTE) ord = i; });
  const next = LEVELS[ord + 1];
  return { ord, l: LEVELS[ord], next, have: next ? n[ord + 1] : 0 };
}

const monthStart = (back = 0) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(1); d.setMonth(d.getMonth() - back); return d; };
const monthName = d => d.toLocaleDateString("es-ES", { month: "long" });
const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;

function invalidateRanking() { RK.key = null; }
async function loadRanking() {
  const key = `${S.gym}|${RK.month}`;
  RK.key = key; RK.loading = true; RK.error = false;
  const [r, me] = await Promise.all([
    sb.rpc("ranking", { p_gym: S.gym, p_month: RK.month === "prev" ? ymd(monthStart(1)) : null }),
    S.session ? sb.from("climbers").select("nick, in_ranking").eq("user_id", S.session.user.id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  if (RK.key !== key) return;   // mientras tanto se cambió de mes o de rocódromo
  RK.loading = false;
  if (r.error) { console.error(r.error); RK.error = true; RK.rows = []; }
  else RK.rows = r.data || [];
  RK.nick = me.data?.nick || null;   // apodo (también lo usan los grupos)
  RK.me = me.data && me.data.in_ranking !== false ? me.data.nick : null;
  if (S.page === "ranking") renderRanking();
}

async function joinRanking(nick) {
  nick = nick.trim().replace(/\s+/g, " ");
  if (nick.length < 2 || nick.length > 20) return toast("El apodo tiene que tener entre 2 y 20 letras");
  if (!(await ensureVoter())) return;
  store.set("lb-nick", nick);
  const q = RK.nick || G.me ? sb.from("climbers").update({ nick, in_ranking: true }).eq("user_id", S.session.user.id) : sb.from("climbers").insert({ nick });
  const { error } = await q;
  if (error) return toast(error.code === "23505" ? "Ese apodo ya lo usa otra persona" : "No se pudo guardar");
  toast(RK.me ? "Apodo cambiado" : "¡Ya estás en el ranking!");
  G.me = { nick, in_ranking: true };
  RK.editing = false; invalidateRanking(); renderRanking();
}
async function leaveRanking() {
  if (!confirm("¿Salir del ranking? Tus encadenados no se borran; solo dejas de aparecer. Tus grupos de amigos siguen igual.")) return;
  const { error } = await sb.from("climbers").update({ in_ranking: false }).eq("user_id", S.session.user.id);
  if (error) return toast("No se pudo salir");
  toast("Has salido del ranking"); invalidateRanking(); renderRanking();
}
async function kickClimber(row) {
  if (!confirm(`¿Quitar a «${row.nick}» del ranking?`)) return;
  const { error } = await sb.from("climbers").delete().eq("user_id", row.user_id);
  if (error) return toast("No se pudo quitar");
  toast("Quitado del ranking"); invalidateRanking(); renderRanking();
}

function leagueBadge(l, big) {
  return el("span", { class: "lg-badge" + (big ? " big" : ""), style: `background:${l.bg};color:${l.fg}` },
    l.solid ? el("span", { class: "lg-badge-in", text: l.name }) : l.name);
}

// La primera vez que se entra al ranking, explicar cómo se asigna la liga
function rankingIntro() {
  store.set("lb-rank-intro", 1);
  const lg = myLeague();
  sheet(head("Así funciona el ranking", true),
    el("div", { class: "intro" },
      el("p", {}, "Tu liga es la del ", el("strong", { text: `primer color del que encadenes ${PROMOTE} bloques` }),
        " en este rocódromo. Si ya tienes 10 de varios colores, cuenta el más difícil."),
      el("p", { text: "No hace falta ir color a color: si tus primeros 10 de un color son negros, entras directo en la liga Negro. Y nunca se baja de liga." }),
      el("p", { text: `Mientras no tengas ${PROMOTE} de ningún color, estás en la liga Azul.` }),
      el("p", { text: "Dentro de tu liga compites por los puntos del mes (azul 1, verde 2… compe 8; el flash suma la mitad más). El día 1 todo vuelve a cero." }),
      el("div", { class: "intro-now" }, el("span", { text: "Ahora mismo estás en la liga" }), leagueBadge(lg.l, true))),
    el("div", { class: "actions" }, el("button", { class: "btn primary", onclick: closeSheet }, "¡Entendido!")));
}

function renderRanking() {
  const root = $("page-ranking");
  if (!store.get("lb-rank-intro", 0) && !$("sheetRoot").firstChild) setTimeout(rankingIntro);
  if (RK.key !== `${S.gym}|${RK.month}`) loadRanking();
  const lg = myLeague();
  const shown = RK.month === "prev" ? monthStart(1) : monthStart(0);
  const end = monthStart(-1), daysLeft = Math.ceil((end - Date.now()) / 864e5);
  const me = RK.rows.find(r => r.is_me);
  RK.league ??= lg.l.k;
  const view = LEVELS.find(l => l.k === RK.league) || lg.l;
  const rows = RK.rows.filter(r => r.league === view.k && (r.sends > 0 || RK.month === "cur"));
  const pos = i => i < 3 ? ["🥇", "🥈", "🥉"][i] : String(i + 1);

  // Tu liga y lo que te falta para subir
  const myCard = el("section", { class: "lg-card", style: `--lg:${lg.l.solid ? "#F4F4F2" : lg.l.bg}` },
    el("div", { class: "lg-head" }, el("span", { class: "label", text: "Tu liga" }), leagueBadge(lg.l, true)),
    lg.next ? [
      el("div", { class: "lg-next" },
        el("span", { text: `${lg.have} de ${PROMOTE} ${PLURAL[lg.next.k]} para subir a la liga ` }), leagueBadge(lg.next)),
      el("span", { class: "medal-bar lg-bar" }, el("span", { style: `width:${lg.have / PROMOTE * 100}%;background:${lg.next.solid ? "#8A8F8C" : lg.next.bg}` }))]
      : el("div", { class: "lg-next", text: "Estás en la liga más alta. ¡A por el primer puesto!" }),
    me ? el("div", { class: "note", text: `Este mes: ${me.points} puntos · puesto ${RK.rows.filter(r => r.league === me.league).indexOf(me) + 1} de ${RK.rows.filter(r => r.league === me.league).length}` }) : null);

  // Apuntarse con un apodo
  let joinBox = null;
  if (RK.me === null || RK.editing) {
    const input = el("input", { value: RK.me || store.get("lb-nick", ""), maxlength: "20", placeholder: "Tu apodo", autocomplete: "nickname", "aria-label": "Apodo para el ranking" });
    joinBox = el("form", { class: "join", onsubmit: e => { e.preventDefault(); joinRanking(input.value); } },
      el("span", { class: "label", text: RK.me ? "Cambiar apodo" : "Apúntate al ranking" }),
      el("div", { class: "row" }, input, el("button", { class: "btn primary", type: "submit" }, RK.me ? "Guardar" : "Apuntarme"),
        RK.editing ? el("button", { class: "btn", type: "button", onclick: () => { RK.editing = false; renderRanking(); } }, "Cancelar") : null),
      el("p", { class: "note", text: "Solo se verá tu apodo, tu liga y tus puntos del mes. Sin email ni contraseña." }));
  } else if (RK.me) {
    joinBox = el("div", { class: "note join-me" }, `Participas como `, el("strong", { text: RK.me }), " · ",
      el("button", { class: "linkbtn", onclick: () => { RK.editing = true; renderRanking(); } }, "Cambiar apodo"), " · ",
      el("button", { class: "linkbtn", onclick: leaveRanking }, "Salir del ranking"));
  }

  root.replaceChildren(...[
    myCard, joinBox,
    el("section", { class: "section" },
      el("div", { class: "rk-top" },
        el("div", { class: "tabs", role: "group", "aria-label": "Mes" },
          ["cur", "prev"].map(m => el("button", { "aria-pressed": RK.month === m ? "true" : "false", onclick: () => { RK.month = m; renderRanking(); } },
            (m => m[0].toUpperCase() + m.slice(1))(monthName(monthStart(m === "cur" ? 0 : 1)))))),
        RK.month === "cur" ? el("span", { class: "note", text: daysLeft <= 1 ? "Termina hoy" : `Quedan ${daysLeft} días` }) : null),
      el("div", { class: "lg-chips", role: "group", "aria-label": "Liga" }, LEVELS.map(l => {
        const n = RK.rows.filter(r => r.league === l.k).length;
        return el("button", { class: "chip", "aria-pressed": l.k === view.k ? "true" : "false", onclick: () => { RK.league = l.k; renderRanking(); } },
          levelDot(l.k), l.name, n ? el("span", { class: "mono", text: String(n) }) : null);
      })),
      el("span", { class: "label", text: `Liga ${view.name} · ${monthName(shown)}` }),
      RK.loading && !RK.rows.length ? el("p", { class: "note", text: "Cargando ranking…" })
        : RK.error ? el("p", { class: "note", text: "No se pudo cargar el ranking. Inténtalo de nuevo en un rato." })
        : rows.length ? el("ol", { class: "rk-list" }, rows.map((r, i) => el("li", { class: "rk-row" + (r.is_me ? " me" : "") },
            el("span", { class: "rk-pos", text: pos(i) }),
            el("span", { class: "rk-who" }, el("strong", { text: r.nick + (r.is_me ? " (tú)" : "") }),
              el("span", { class: "note", text: `${r.sends} ${r.sends === 1 ? "bloque" : "bloques"}` + (r.flashes ? ` · ⚡ ${r.flashes}` : "") })),
            el("span", { class: "rk-pts" }, el("strong", { text: String(r.points) }), el("span", { class: "note", text: "puntos" })),
            S.isSetter && !r.is_me ? el("button", { class: "linkbtn rk-kick", "aria-label": `Quitar a ${r.nick}`, onclick: () => kickClimber(r) }, "Quitar") : null)))
        : el("p", { class: "note", text: RK.month === "cur" ? `Nadie ha puntuado todavía en la liga ${view.name} este mes. ¡Estrénala!` : `Nadie puntuó en la liga ${view.name} ese mes.` })),
    el("p", { class: "note" }, `Tu liga es el color más difícil del que hayas encadenado ${PROMOTE} bloques en este rocódromo (sin ir color a color, y nunca se baja). Dentro de cada liga gana quien más puntos sume en el mes. `,
      el("button", { class: "linkbtn", onclick: rankingIntro }, "Más detalles")),
  ].filter(Boolean));
}
