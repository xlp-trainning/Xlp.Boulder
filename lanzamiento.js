// Para el grupo de prueba y el lanzamiento:
// · Marca del grupo de prueba: quien abre …/Xlp.Boulder/?prueba queda marcado en su cuenta (SQL 016) y se ve en Usuarios.
// · «Que no se te pierda»: tras el 3.er encadenado (y otra vez a los 15) se propone apodo con PIN o poner PIN.
// · Opinión a la semana: un aviso en Hoy que lleva al buzón.
// · Glosario: qué es encadenar, flash, proyecto, beta…, desde Ajustes y desde la ficha.
// Usa el estado y las utilidades de app.js, apodo.js (APODO, nickForm, openPinSheet) y buzon.js (openBuzon).

/* ---------- grupo de prueba ---------- */
(() => {
  const q = new URLSearchParams(location.search);
  if (!q.has("prueba")) return;
  store.set("lb-cohort", "prueba");
  q.delete("prueba");
  history.replaceState(null, "", location.pathname + (q.toString() ? "?" + q : "") + location.hash);
})();
async function tagCohort() {
  const c = store.get("lb-cohort", null), u = S.session?.user;
  if (!c || !sb || !u?.is_anonymous || u.user_metadata?.cohort === c || store.get("lb-cohort-sent", null) === u.id) return;
  const { error } = await sb.auth.updateUser({ data: { cohort: c } });
  if (!error) store.set("lb-cohort-sent", u.id);
}

/* ---------- que no se te pierda ---------- */
// Se llama al encadenar. Sale una vez a los 3 encadenados y otra a los 15, si sigue sin apodo con PIN.
function maybeProtect() {
  if (!S.session?.user.is_anonymous || S.isSetter) return;
  const sends = Object.values(S.mine).filter(m => m.sent).length;
  const step = sends >= 15 ? 2 : sends >= 3 ? 1 : 0;
  if (!step || store.get("lb-protect-step", 0) >= step) return;
  if (G.me && APODO.pin) return;
  store.set("lb-protect-step", step);
  setTimeout(openProtect, 2200);   // después de la celebración
}
function openProtect() {
  if ($("sheetRoot").firstChild) return;   // si hay algo abierto, no molestar
  const n = Object.values(S.mine).filter(m => m.sent).length;
  openId = null;
  sheet(head("Que no se te pierda", true),
    el("p", { class: "intro-txt", text: `Llevas ${n} ${n === 1 ? "bloque encadenado" : "bloques encadenados"}. Todo está guardado en este móvil: si cambias de móvil o se borran los datos del navegador, se perdería.` }),
    G.me
      ? el("div", { class: "section" }, el("p", { text: `Ponle un PIN a «${G.me.nick}» y podrás recuperarlo todo en cualquier móvil.` }),
          el("div", { class: "actions" }, el("button", { class: "btn primary", onclick: () => { closeSheet(); openPinSheet(); } }, ico("lock"), "Poner PIN")))
      : el("div", { class: "section" }, el("p", { text: "Ponte un apodo con PIN: con él recuperas tu progreso, tus grupos y tu ranking en otro móvil." }),
          nickForm({ submitText: "Guardar apodo", onDone: () => { closeSheet(); render(); toast("Guardado. Apunta tu PIN en algún sitio"); } })),
    el("button", { class: "linkbtn", onclick: closeSheet }, "Ahora no"));
}

/* ---------- opinión a la semana ---------- */
// Desde el primer día que se abre la app; el aviso sale de los 7 a los 30 días, hasta que se pulsa.
if (!store.get("lb-first-seen", null)) store.set("lb-first-seen", Date.now());
const feedbackDue = () => !S.isSetter && !store.get("lb-feedback-done", false) && Object.keys(S.mine).length > 0
  && (Date.now() - store.get("lb-first-seen", Date.now())) / 864e5 >= 7 && (Date.now() - store.get("lb-first-seen", Date.now())) / 864e5 < 30;
function openFeedback() { store.set("lb-feedback-done", true); openBuzon(); }

/* ---------- glosario ---------- */
const GLOSSARY = [
  ["Bloque", "Un problema de búlder: una línea de presas marcada con cinta del color de su nivel, sin cuerda y a poca altura."],
  ["Encadenar", "Subir el bloque de la salida al top sin caerte, en un solo intento."],
  ["Flash", "Encadenarlo al primer intento. Suma más puntos."],
  ["Intento o pegue", "Cada vez que te pones en la salida y lo pruebas."],
  ["Proyecto", "Un bloque que estás trabajando y aún no te sale. Márcalo y lo tendrás a mano."],
  ["Beta", "Cómo se hace un bloque: dónde van los pies, la secuencia, el truco del paso clave."],
  ["Salida y top", "Las presas donde se empieza (con las dos manos) y la última, que hay que coger con las dos manos para que cuente."],
  ["Nivel", "El color de la cinta, de más fácil a más difícil: azul, verde, naranja, amarillo, morado, rojo y negro. «Compe» son bloques de competición."],
  ["Liga", "En el ranking compites con quien escala parecido a ti: tu liga es el color más difícil del que hayas encadenado 10 bloques."],
  ["Racha", "Semanas seguidas encadenando al menos un bloque."],
  ["Nivel real", "Tu nivel según los bloques que encadenas, contando lo difícil que le parece a la gente cada uno."],
  ["Desmontado", "Un bloque que ya han quitado de la pared. Sigue en tus encadenados."],
];
function openGlossary(backTo) {
  openId = null;
  sheet(head("Qué significa cada cosa", true),
    el("dl", { class: "glossary" }, GLOSSARY.flatMap(([t, d]) => [el("dt", { text: t }), el("dd", { text: d })])),
    backTo ? el("button", { class: "btn", onclick: () => openDetail(backTo) }, "Volver al bloque") : null);
}
