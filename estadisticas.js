// Estadísticas del equipador: de todos los bloques o solo de los suyos (sello Xlp),
// por rocódromo, por sala y por sector. Usa el estado y las utilidades de app.js.

const ST = { scope: store.get("lb-st-scope", "all"), group: store.get("lb-st-group", "sala"), all: null, loading: false };
const salaOf = sector => !sector ? "Sin sector" : sector.split(" · ")[0];

// Bloques de todos los rocódromos, para comparar entre ellos (se cargan al abrir Estadísticas)
async function loadAllBlocks() {
  ST.loading = true;
  const { data, error } = await sb.from("blocks").select("*");
  ST.loading = false;
  if (!error) { ST.all = data || []; if (S.page === "stats") renderStats(); }
}

// Fila de resumen de un grupo de bloques
function groupRow(name, list, onclick) {
  const st = id => statsFor(id);
  const open = list.filter(b => b.active);
  const rated = open.filter(b => st(b.id).n);
  const votes = rated.reduce((a, b) => a + st(b.id).n, 0);
  const avg = votes ? rated.reduce((a, b) => a + st(b.id).avg * st(b.id).n, 0) / votes : 0;
  const sends = open.reduce((a, b) => a + st(b.id).sends, 0);
  const counts = LEVELS.map(l => open.filter(b => b.level === l.k).length);
  return el("tr", {},
    el("td", {}, onclick ? el("button", { class: "linkbtn strong", onclick }, name) : el("strong", { text: name })),
    el("td", { class: "num", text: open.length }),
    el("td", {}, open.length ? el("span", { class: "lvmix", title: LEVELS.map((l, i) => counts[i] ? `${l.name} ${counts[i]}` : "").filter(Boolean).join(" · ") },
      LEVELS.map((l, i) => counts[i] ? el("span", { style: `flex:${counts[i]};background:${l.bg}` }) : null)) : "—"),
    el("td", { class: "num", text: avg ? avg.toFixed(1) + " ★" : "—" }),
    el("td", { class: "num", text: sends }),
    el("td", { class: "num", text: open.length ? (sends / open.length).toFixed(1) : "—" }),
    el("td", { class: "num", text: list.length - open.length }));
}

function renderStats() {
  const root = $("page-stats");
  if (!ST.all && !ST.loading) loadAllBlocks();
  const mineOnly = ST.scope === "mine";
  const inScope = b => !mineOnly || b.xlp;
  const pool = S.blocks.filter(inScope);
  const open = pool.filter(b => b.active);
  const st = id => statsFor(id);
  const sum = (arr, f) => arr.reduce((a, b) => a + f(b), 0);
  const commentsBy = {}; allComments.forEach(c => commentsBy[c.block_id] = (commentsBy[c.block_id] || 0) + 1);
  const kpi = (n, l, extra) => el("div", { class: "kpi" }, el("span", { class: "kpi-n", text: n }), el("span", { class: "note", text: l }), extra || null);
  const wavg = list => { const r = list.filter(b => st(b.id).n), v = sum(r, b => st(b.id).n); return v ? sum(r, b => st(b.id).avg * st(b.id).n) / v : 0; };
  const avgAll = wavg(open);

  const table = (cols, rows) => el("div", { class: "table-scroll" }, el("table", {},
    el("thead", {}, el("tr", {}, cols.map(c => el("th", { text: c })))),
    el("tbody", {}, rows)));
  const blockCell = b => el("td", {}, el("button", { class: "linkbtn strong", onclick: () => openDetail(b.id) }, levelDot(b.level), " ", title(b), b.xlp && !mineOnly ? xlpBadge(true) : null));

  // Por zona: rocódromos, salas o sectores
  const zoneCols = ["", "Abiertos", "Niveles", "Media", "Encad.", "Encad./bloque", "Desmont."];
  let zoneRows;
  if (ST.group === "gym") {
    const all = (ST.all || S.blocks).filter(inScope);
    zoneRows = [...S.gyms.map(g => groupRow(g.name, all.filter(b => b.gym_id === g.id), g.id === S.gym ? null : () => setGym(g.id))),
      S.gyms.length > 1 ? groupRow("Total", all) : null];
  } else {
    const key = ST.group === "sala" ? b => salaOf(b.sector) : b => b.sector || "Sin sector";
    const names = [...new Set(pool.map(key))].sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
    zoneRows = names.map(n => groupRow(n, pool.filter(b => key(b) === n),
      ST.group === "sector" && n !== "Sin sector" ? () => goSector(n) : null));
  }

  const byLevel = LEVELS.map(l => {
    const bl = open.filter(b => b.level === l.k);
    const avg = wavg(bl);
    return el("tr", {}, el("td", {}, el("span", { class: "hold" }, levelDot(l.k), l.name)),
      el("td", { class: "num", text: bl.length }),
      el("td", { class: "num", text: avg ? avg.toFixed(1) + " ★" : "—" }),
      el("td", { class: "num", text: bl.length ? (sum(bl, b => st(b.id).sends) / bl.length).toFixed(1) : "—" }),
      el("td", { class: "num", text: (a => a.length ? (sum(a, b => st(b.id).attempts) / a.length).toFixed(1) : "—")(bl.filter(b => st(b.id).attempts)) }));
  });
  // Graduación según la gente: bloques con 3 votos o más donde la mitad o más dice blando o duro
  const feelN = b => st(b.id).soft + st(b.id).fair + st(b.id).hard;
  const offGrade = open.filter(b => feelN(b) >= 3 && (st(b.id).hard * 2 >= feelN(b) || st(b.id).soft * 2 >= feelN(b)))
    .map(b => ({ b, hard: st(b.id).hard / feelN(b), soft: st(b.id).soft / feelN(b) }))
    .sort((x, y) => Math.max(y.hard, y.soft) - Math.max(x.hard, x.soft));
  const styleCounts = STYLES.map(s => [s, open.filter(b => (b.styles || []).includes(s)).length]).filter(([, n]) => n).sort((a, b) => b[1] - a[1]);
  const maxStyle = Math.max(1, ...styleCounts.map(([, n]) => n));

  const ranking = (label, list, value, empty) => el("section", { class: "section" }, el("span", { class: "label", text: label }),
    list.length ? table(["Bloque", ""], list.map(b => el("tr", {}, blockCell(b), el("td", { class: "num", text: value(b) })))) : el("p", { class: "note", text: empty }));
  const rated = open.filter(b => st(b.id).n);
  const best = rated.slice().sort((a, b) => st(b.id).avg - st(a.id).avg || st(b.id).n - st(a.id).n).slice(0, 5);
  const worst = rated.filter(b => st(b.id).n >= 2).sort((a, b) => st(a.id).avg - st(b.id).avg).slice(0, 5);
  const fewSends = open.filter(b => daysSince(b.set_date) >= 14).sort((a, b) => st(a.id).sends - st(b.id).sends).slice(0, 5);
  const projected = open.filter(b => st(b.id).projects).sort((a, b) => st(b.id).projects - st(a.id).projects).slice(0, 5);
  const talked = open.filter(b => commentsBy[b.id]).sort((a, b) => commentsBy[b.id] - commentsBy[a.id]).slice(0, 5);

  // Solo los míos: cuánto pesan en la sala y cómo gustan frente al resto
  const allOpen = S.blocks.filter(b => b.active), others = allOpen.filter(b => !b.xlp), avgOthers = wavg(others);
  const mineBox = mineOnly ? el("div", { class: "banner st-mine" },
    el("span", {}, xlpBadge(), ` ${open.length} de ${allOpen.length} bloques abiertos son tuyos (${allOpen.length ? Math.round(open.length / allOpen.length * 100) : 0} %).`),
    el("span", { text: avgAll && avgOthers ? `Tus bloques: ${avgAll.toFixed(1)} ★ · los demás: ${avgOthers.toFixed(1)} ★` : "" })) : null;

  const tabs = (label, cur, opts, set) => el("div", { class: "tabs", role: "group", "aria-label": label },
    opts.map(([k, t]) => el("button", { "aria-pressed": cur === k ? "true" : "false", onclick: () => set(k) }, t)));

  root.replaceChildren(...[
    el("div", { class: "st-controls" },
      tabs("Qué bloques", ST.scope, [["all", "Todos los bloques"], ["mine", "Solo los míos"]], k => { ST.scope = k; store.set("lb-st-scope", k); renderStats(); })),
    mineBox,
    mineOnly && !pool.length ? el("p", { class: "note", text: "Aún no hay bloques con el sello Xlp en este rocódromo. Márcalo al crear o editar un bloque («Equipado por mí»)." }) : null,
    el("div", { class: "kpis" },
      kpi(open.length, "bloques abiertos"),
      kpi(pool.filter(isNew).length, `montados en ${NEW_DAYS} días`),
      kpi(avgAll ? avgAll.toFixed(1) + " ★" : "—", "puntuación media"),
      kpi(sum(open, b => st(b.id).sends), "encadenados"),
      kpi(pool.length - open.length, "desmontados (histórico)"),
      kpi(allComments.filter(c => pool.some(b => b.id === c.block_id)).length, "comentarios")),
    el("section", { class: "section" },
      el("div", { class: "rk-top" }, el("span", { class: "label", text: "Por zona" }),
        tabs("Agrupar por", ST.group, [["gym", "Rocódromo"], ["sala", "Salas"], ["sector", "Sectores"]], k => { ST.group = k; store.set("lb-st-group", k); renderStats(); })),
      zoneRows.filter(Boolean).length ? table(zoneCols, zoneRows) : el("p", { class: "note", text: "No hay bloques todavía." }),
      el("p", { class: "note", text: ST.group === "gym" ? "Comparación entre rocódromos. Toca el otro para cambiar a él."
        : `${currentGym()?.name || ""}. La sala es la parte del nombre del sector antes del «·» (p. ej. «Sala 2» en «Sala 2 · La U»).` + (ST.group === "sector" ? " Toca un sector para ver sus bloques." : "") })),
    el("section", { class: "section" }, el("span", { class: "label", text: "Por nivel (abiertos)" }),
      table(["Nivel", "Bloques", "Media", "Encad.", "Intentos"], byLevel)),
    el("section", { class: "section" }, el("span", { class: "label", text: "Graduación según la gente" }),
      offGrade.length ? table(["Bloque", "Le parece", "Votos"], offGrade.map(({ b, hard, soft }) => el("tr", {}, blockCell(b),
        el("td", { class: hard >= soft ? "feel-hard" : "feel-soft", text: hard >= soft ? `Duro ${Math.round(hard * 100)} %` : `Blando ${Math.round(soft * 100)} %` }),
        el("td", { class: "num", text: feelN(b) }))))
        : el("p", { class: "note", text: "Ningún bloque parece mal graduado (con 3 votos o más, la mitad dice blando o duro)." })),
    el("section", { class: "section" }, el("span", { class: "label", text: "Estilos (abiertos)" }),
      styleCounts.length ? el("div", { class: "hbars" }, styleCounts.map(([s, n]) => el("div", { class: "hbar" },
        el("span", { text: s }), el("span", { class: "hbar-track" }, el("span", { class: "hbar-fill", style: `width:${n / maxStyle * 100}%` })), el("span", { class: "mono", text: n }))))
        : el("p", { class: "note", text: "Aún no hay bloques con estilo." })),
    ranking("Los que más gustan", best, b => `${st(b.id).avg.toFixed(1)} ★ · ${st(b.id).n}`, "Todavía nadie ha puntuado."),
    ranking("Los que menos gustan (2 votos o más)", worst, b => `${st(b.id).avg.toFixed(1)} ★ · ${st(b.id).n}`, "Hace falta algún voto más."),
    ranking("Poco encadenados (montados hace 14 días o más)", fewSends, b => `${st(b.id).sends} encad.`, "Ningún bloque lleva 14 días montado."),
    ranking("Más proyectados", projected, b => `${st(b.id).projects} probando`, "Nadie lo ha marcado como proyecto todavía."),
    ranking("Con más comentarios", talked, b => `${commentsBy[b.id]} coment.`, "Sin comentarios todavía."),
  ].filter(Boolean));
}
