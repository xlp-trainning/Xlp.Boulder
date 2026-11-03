// Equipadores: cada bloque va firmado por quien lo ha equipado. Página pública «Equipadores» con cada uno,
// sus bloques y sus estadísticas, y gestión de equipadores para el máster (dar acceso por email, renombrar, quitar).
// SQL: supabase/014-equipadores.sql. Usa el estado y las utilidades de app.js.

const EQ = { list: [], sel: null, admin: null, adminLoading: false };

// Lista pública (id, nombre, si es el máster). Sin el 014 ejecutado, vacía: la web sigue con el sello Xlp de antes
async function loadSetters() {
  const r = await sb.rpc("setters_public");
  EQ.list = r.error ? [] : r.data || [];
}
const setterById = id => EQ.list.find(s => s.user_id === id) || null;
const setterOf = b => b.setter_id ? setterById(b.setter_id) : (b.xlp && !EQ.list.length ? { user_id: null, name: "Xlp", is_master: true } : null);
const masterSetter = () => EQ.list.find(s => s.is_master) || null;
const setterBlocks = id => S.blocks.filter(b => b.setter_id === id);

// Sello del equipador: el del máster lleva la X del logo; el de los demás, su inicial
function setterBadge(s, iconOnly, long) {
  if (!s) return null;
  if (s.is_master) return xlpBadge(iconOnly, long ? `Equipado por ${s.name}` : s.name, s.name);
  const b = el("span", { class: "xlp-badge" + (iconOnly ? " icon" : ""), title: `Equipado por ${s.name}`, "aria-label": iconOnly ? `Equipado por ${s.name}` : null },
    el("span", { class: "setter-ini", "aria-hidden": "true", text: (s.name.trim()[0] || "·").toUpperCase() }));
  if (!iconOnly) b.append(long ? `Equipado por ${s.name}` : s.name);
  return b;
}

/* ---------- estadísticas de un equipador (en el rocódromo elegido) ---------- */
function setterStats(blocks) {
  const st = id => statsFor(id), open = blocks.filter(b => b.active);
  const sum = (a, f) => a.reduce((x, b) => x + f(b), 0);
  const rated = blocks.filter(b => st(b.id).n), votes = sum(rated, b => st(b.id).n);
  const sends = sum(blocks, b => st(b.id).sends), flashes = sum(blocks, b => st(b.id).flashes);
  const soft = sum(blocks, b => st(b.id).soft), fair = sum(blocks, b => st(b.id).fair), hard = sum(blocks, b => st(b.id).hard);
  const best = rated.slice().sort((a, b) => st(b.id).avg - st(a.id).avg || st(b.id).n - st(a.id).n)[0];
  const most = blocks.filter(b => st(b.id).sends).sort((a, b) => st(b.id).sends - st(a.id).sends)[0];
  return { open, total: blocks.length, avg: votes ? sum(rated, b => st(b.id).avg * st(b.id).n) / votes : 0, votes, sends, flashes, soft, fair, hard,
    counts: LEVELS.map(l => open.filter(b => b.level === l.k).length), best, most,
    projects: sum(open, b => st(b.id).projects), attempts: (a => a.length ? sum(a, b => st(b.id).attempts) / a.length : 0)(blocks.filter(b => st(b.id).attempts)),
    styles: Object.entries(blocks.flatMap(b => b.styles || []).reduce((o, s) => (o[s] = (o[s] || 0) + 1, o), {})).sort((a, b) => b[1] - a[1]).slice(0, 4) };
}
const lvMix = counts => counts.some(Boolean) ? el("span", { class: "lvmix", "aria-hidden": "true" },
  LEVELS.map((l, i) => counts[i] ? el("span", { style: `flex:${counts[i]};background:${l.solid ? "#8A8F8C" : l.bg}` }) : null)) : null;

/* ---------- página ---------- */
function renderEquipadores() {
  const root = $("page-equipadores");
  if (!EQ.list.length) return root.replaceChildren(emptyBox("Sin equipadores todavía", "Aquí saldrá cada equipador con sus bloques y lo que opina la gente de ellos."));
  const s = EQ.sel && setterById(EQ.sel);
  root.replaceChildren(...(s ? setterPage(s) : setterList()), ...(S.isMaster ? [setterAdmin()] : []));
}

function setterList() {
  const total = S.blocks.filter(b => b.active).length;
  return [
    el("p", { class: "intro-txt", text: `Quién equipa los bloques de ${currentGym()?.name || "la sala"} y cómo los valora la gente. Toca un equipador para ver todos sus bloques.` }),
    el("div", { class: "rk-list" }, EQ.list.map(s => {
      const x = setterStats(setterBlocks(s.user_id));
      return el("button", { class: "rk-row setter-row", onclick: () => { EQ.sel = s.user_id; renderEquipadores(); window.scrollTo({ top: 0 }); } },
        el("span", { class: "rk-pos" }, setterBadge(s, true)),
        el("span", { class: "rk-who" }, el("strong", { text: s.name + (s.user_id === S.session?.user.id ? " (tú)" : "") }),
          el("span", { class: "note" }, `${x.open.length} ${x.open.length === 1 ? "abierto" : "abiertos"} · ${x.total} en total`, x.avg ? ` · ${x.avg.toFixed(1)} ★` : "")),
        el("span", { class: "setter-mix" }, lvMix(x.counts)),
        el("span", { class: "rk-pts" }, el("strong", { text: total ? Math.round(x.open.length / total * 100) + "%" : "—" }), el("span", { class: "note", text: "de la sala" })));
    })),
    (n => n ? el("p", { class: "note", text: n === 1 ? "1 bloque abierto no tiene equipador apuntado." : `${n} bloques abiertos no tienen equipador apuntado.` }) : null)(S.blocks.filter(b => b.active && !b.setter_id).length),
  ].filter(Boolean);
}

function setterPage(s) {
  const mine = setterBlocks(s.user_id), x = setterStats(mine);
  const feelN = x.soft + x.fair + x.hard, pct = n => Math.round(n / feelN * 100);
  const kpi = (n, l, extra) => el("div", { class: "kpi" }, el("span", { class: "kpi-n" }, n), el("span", { class: "kpi-l", text: l }), extra || null);
  return [
    el("div", {}, el("button", { class: "linkbtn strong", onclick: () => { EQ.sel = null; renderEquipadores(); } }, ico("chevron", "sm flip"), "Todos los equipadores")),
    el("section", { class: "g-head" }, el("div", {},
      el("span", { class: "label", text: s.is_master ? "Equipador · máster" : "Equipador" }),
      el("h2", { class: "g-name" }, setterBadge(s, true), " ", s.name),
      el("span", { class: "note", text: `${x.open.length} ${x.open.length === 1 ? "bloque abierto" : "bloques abiertos"} en ${currentGym()?.name || ""} · ${x.total} ${x.total === 1 ? "equipado" : "equipados"} en total` }))),
    el("div", { class: "kpis" },
      kpi(x.open.length, "abiertos", lvMix(x.counts)),
      kpi(x.avg ? x.avg.toFixed(1) : "—", "puntuación media", el("span", { class: "note", text: `${x.votes} ${x.votes === 1 ? "voto" : "votos"}` })),
      kpi(x.sends, "encadenados", el("span", { class: "note", text: x.sends ? `${Math.round(x.flashes / x.sends * 100)} % al flash` : "" })),
      kpi(feelN ? `${pct(x.hard)}%` : "—", "dice «duro»", el("span", { class: "note", text: feelN ? `${pct(x.soft)} % blando · ${pct(x.fair)} % justo` : "Sin votos de sensación" }))),
    x.best || x.most || x.styles.length ? el("section", { class: "section" }, el("span", { class: "label", text: "Lo destacado" }),
      x.best ? el("p", { class: "first-line" }, el("span", { class: "first-sticker" }, ico("star", "sm"), "El mejor valorado"), blockLinkTo(x.best), el("span", { class: "note", text: ` · ${statsFor(x.best.id).avg.toFixed(1)} ★` })) : null,
      x.most ? el("p", { class: "first-line" }, el("span", { class: "first-sticker" }, ico("mountain", "sm"), "El más encadenado"), blockLinkTo(x.most), el("span", { class: "note", text: ` · ${statsFor(x.most.id).sends} encadenados` })) : null,
      x.styles.length ? el("p", { class: "note", text: "Estilos que más equipa: " + x.styles.map(([t, n]) => `${t} (${n})`).join(", ") }) : null) : null,
    // Datos internos: solo los ven los equipadores
    S.isSetter ? el("section", { class: "section" }, el("span", { class: "label", text: "Para equipadores" }),
      el("p", { class: "note", text: [`${x.projects} personas lo tienen como proyecto`, x.attempts ? `intentos medios ${x.attempts.toFixed(1)}` : null,
        `${allComments.filter(c => mine.some(b => b.id === c.block_id)).length} comentarios`].filter(Boolean).join(" · ") }),
      el("div", { class: "actions" }, el("button", { class: "btn small", onclick: () => { ST.scope = s.user_id; setPage("stats"); } }, "Estadísticas completas"))) : null,
    el("section", { class: "section" }, el("span", { class: "label", text: `Sus bloques abiertos · ${x.open.length}` }),
      x.open.length ? el("div", { class: "grid" }, x.open.slice().sort((a, b) => gIdx(a.level) - gIdx(b.level)).map(card))
        : el("p", { class: "note", text: "Ahora mismo no tiene bloques abiertos en este rocódromo." })),
  ].filter(Boolean);
}
// Nombre del bloque que abre su ficha
const blockLinkTo = b => el("button", { class: "linkbtn strong", onclick: () => openDetail(b.id) }, levelDot(b.level), " ", title(b));

/* ---------- gestión (máster) ---------- */
async function loadSetterAdmin() {
  EQ.adminLoading = true;
  const r = await sb.rpc("setter_admin_list");
  EQ.adminLoading = false; EQ.admin = r.error ? [] : r.data || [];
  if (S.page === "equipadores") renderEquipadores();
}
function setterAdmin() {
  if (!EQ.admin && !EQ.adminLoading) loadSetterAdmin();
  const email = el("input", { type: "email", placeholder: "Email de su cuenta", "aria-label": "Email del equipador", autocomplete: "off" });
  const name = el("input", { placeholder: "Nombre que se verá", "aria-label": "Nombre del equipador", maxlength: "30" });
  const err = el("div", { class: "err", hidden: true });
  return el("section", { class: "section editor" }, el("span", { class: "label", text: "Máster · equipadores" }),
    el("p", { class: "note", text: "Para dar acceso: el equipador crea su cuenta en «Acceso equipador» → «Crear cuenta de equipador». Luego escribe aquí su email y el nombre con el que firmará sus bloques. Los equipadores pueden crear, editar y borrar cualquier bloque y ver las estadísticas; el plano, los sectores y los equipadores solo los cambias tú." }),
    el("form", { class: "g-form", onsubmit: async e => {
      e.preventDefault(); err.hidden = true;
      const { data, error } = await sb.rpc("grant_setter", { p_email: email.value.trim(), p_name: name.value.trim() });
      if (error) { err.textContent = error.code === "P0003" ? "No hay ninguna cuenta con ese email. Pídele que la cree primero en «Acceso equipador» (y que la confirme si le llega un email)." : error.code === "22023" ? "El nombre tiene que tener entre 2 y 30 letras." : "No se pudo dar acceso. ¿Has ejecutado supabase/014-equipadores.sql?"; err.hidden = false; return; }
      toast(`${data} ya es equipador`); EQ.admin = null; await loadSetters(); render();
    } }, email, name, el("button", { class: "btn primary", type: "submit" }, ico("plus", "sm"), "Dar acceso")),
    err,
    !EQ.admin ? el("p", { class: "note", text: "Cargando…" }) : el("ul", { class: "rk-list" }, EQ.admin.map(a => el("li", { class: "rk-row g-person" },
      el("span", { class: "rk-pos" }, setterBadge({ ...a, name: a.name || "?" }, true)),
      el("span", { class: "rk-who" }, el("strong", { text: (a.name || "Sin nombre") + (a.is_master ? " · máster" : "") }), el("span", { class: "note", text: a.email || "" })),
      el("span", { class: "row" },
        el("button", { class: "linkbtn", onclick: async () => {
          const nn = prompt("Nombre con el que firma sus bloques", a.name || ""); if (nn == null) return;
          const { error } = await sb.rpc("rename_setter", { p_user: a.user_id, p_name: nn.trim() });
          if (error) return toast(error.code === "22023" ? "El nombre tiene que tener entre 2 y 30 letras" : "No se pudo cambiar el nombre");
          EQ.admin = null; await loadSetters(); render();
        } }, "Renombrar"),
        a.is_master ? null : el("button", { class: "linkbtn rk-kick", onclick: async () => {
          if (!confirm(`¿Quitar el acceso de equipador a ${a.name || a.email}? Sus bloques se quedan, sin su firma.`)) return;
          const { error } = await sb.rpc("revoke_setter", { p_user: a.user_id });
          if (error) return toast("No se pudo quitar el acceso");
          toast("Acceso quitado"); EQ.admin = null; await loadSetters(); refresh();
        } }, "Quitar acceso"))))));
}
