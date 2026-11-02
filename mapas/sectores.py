# Divide los planos en sectores tocables: cada punto del edificio va al muro (sector) más cercano,
# hasta una distancia máxima. Genera el SQL para Supabase y un JSON para las pruebas.
import json, re, sys
from shapely.geometry import Polygon, LineString, box, Point
from shapely.ops import unary_union, polylabel

def load(path):
    src = open(path).read()
    ns = {}
    exec(src[:src.index("svg = f'''")], ns)
    vb = list(map(float, re.search(r'viewBox="([^"]+)"', src).group(1).split()))
    return ns, vb

def regions(building, anchors, maxd, cell=3):
    x0, y0, x1, y1 = building.bounds
    cells = {k: [] for k in anchors}
    y = y0
    while y < y1:
        x = x0
        while x < x1:
            p = Point(x + cell / 2, y + cell / 2)
            if building.contains(p):
                best, bd = None, maxd
                for k, g in anchors.items():
                    d = g.distance(p)
                    if d < bd: best, bd = k, d
                if best: cells[best].append(box(x, y, x + cell, y + cell))
            x += cell
        y += cell
    out = {}
    for k, cs in cells.items():
        r = unary_union(cs).buffer(1.5).buffer(-1.5).simplify(2.2)
        if r.geom_type == "MultiPolygon": r = max(r.geoms, key=lambda g: g.area)
        out[k] = r
    return out

def to_rows(gym, regs, anchors, vb, label_in_zone=False):
    vx, vy, vw, vh = vb
    f = lambda x, y: [round((x - vx) / vw, 4), round((y - vy) / vh, 4)]
    rows = []
    for name, r in regs.items():
        c = anchors[name].centroid
        # La etiqueta va en el centro de su zona (el punto más alejado del borde), y si no cabe, sobre su tramo de pared
        lp = polylabel(r, tolerance=1) if label_in_zone else c if r.contains(c) else r.representative_point()
        rows.append({"gym_id": gym, "name": name, "x": f(lp.x, lp.y)[0], "y": f(lp.x, lp.y)[1],
                     "shape": [f(x, y) for x, y in list(r.exterior.coords)[:-1]]})
    return rows

# ---------- Natural Patraix ----------
ns, vb = load("natural-patraix.py"); W = ns["walls"]
building = unary_union([Polygon(ns["left"]), Polygon(ns["right"])])
P = lambda k: Polygon(W[k])
# Sectores numerados (02/11/2026), según el equipador. Del 1 en la sala 1 al 38 en la sala 3, y 39-40 en la terraza.
# Mientras no se marquen los límites de verdad, cada pared se reparte en tramos iguales a lo largo.
from shapely.ops import substring
from shapely.geometry.polygon import orient
def split_line(line, n):
    L = line.length
    return [substring(line, L * k / n, L * (k + 1) / n) for k in range(n)]
def split_poly(poly, n):
    x0, y0, x1, y1 = poly.bounds
    return [poly.intersection(box(x0 + (x1 - x0) * k / n, y0 - 1, x0 + (x1 - x0) * (k + 1) / n, y1 + 1)) for k in range(n)]
def around(poly, n, start):
    """Contorno de una isla en n tramos, en sentido contrario a las agujas del reloj (visto en el plano), empezando
    en la dirección «start» desde su centro (en el plano: (0, 1) es hacia abajo, (-1, 0) hacia la izquierda)"""
    ring = list(orient(poly, sign=-1.0).exterior.coords)[:-1]     # en el plano (y hacia abajo) queda al revés del reloj
    c = poly.centroid
    k0 = max(range(len(ring)), key=lambda k: (ring[k][0] - c.x) * start[0] + (ring[k][1] - c.y) * start[1])
    ring = ring[k0:] + ring[:k0]
    return split_line(LineString(ring + [ring[0]]), n)
# Al entrar en la sala 2 (desde la sala 1) se ve la cara de abajo de la isla: el primer tramo va centrado ahí
abajo_centrado = (-.87, .5)
tramos = [
  ("Sala 1", split_line(LineString([(190,341),(250,322),(310,300),(357,282)]), 3)            # banda
           + split_line(LineString([(380,250),(452,366)]), 3)                                # zigzag
           + split_line(LineString([(280,427),(352,392),(372,383),(427,390),(445,376)]), 3)),  # diagonal
  ("Sala 2", split_line(LineString([(116,326),(116,174)]), 2)                                # placa (izquierda al entrar), de abajo arriba
           + around(P("isla"), 3, abajo_centrado)                                            # isla, al revés del reloj
           + split_line(LineString([(217,140),(270,130),(280,132),(310,162),(312,188),(303,218),(277,242),(233,272),(190,302)]), 6)),  # la U, de arriba hasta la sala 1
  ("Sala 3", split_poly(P("abajo"), 2)                                                       # placa de la derecha = celosía (la de abajo)
           + around(P("isla8"), 9, (-1, 0))                                                  # isla grande, al revés del reloj desde la punta de la entrada
           + split_line(LineString([(790,132),(860,134),(890,128),(930,141),(960,138),(987,158),(1027,155),(1077,158),(1120,150)]), 6)  # pared de la izquierda (la de arriba)
           + [LineString([(1132,130),(1132,191)])]),                                         # fondo, desde la esquina: un sector
  ("Terraza", split_line(LineString([(146,158),(272,110)]), 2)),                             # panel
]
pat, n = {}, 0
for sala, geoms in tramos:
    for g in geoms:
        n += 1; pat[f"{sala} · {n}"] = g
rows = to_rows("patraix", regions(building, pat, 55), pat, vb, label_in_zone=True)

# ---------- Natural Benimaclet ----------
ns, vb = load("natural-benimaclet.py"); W = ns["walls"]
building = unary_union([Polygon(ns["hall"]), Polygon(ns["up"])])
P = lambda k: Polygon(W[k])
ben = {
  "U · Brazo de arriba": LineString([(28,152),(120,110),(410,110),(480,126),(560,156),(650,100),(774,100)]),
  "U · Brazo de arriba (fuera)": LineString([(120,80),(774,80)]),
  "U · Fondo": P("fondo"),
  "U · Brazo de abajo": P("abajo"),
  "Zona alta · Desplome": P("alta-fondo"),
  "Zona alta · Pared izquierda": unary_union([P("alta-izquierda"), P("alta-esquina")]),
  "Zona alta · Kilter": box(-254, 86, -234, 138),
}
rows += to_rows("benimaclet", regions(building, ben, 75), ben, vb)

json.dump(rows, open(sys.argv[1], "w"), ensure_ascii=False)
sql = ["-- Sectores de los planos, con su zona para tocar en el mapa.",
       "-- Ejecútalo una vez en Supabase → SQL Editor. Los nombres se pueden cambiar luego desde la app.",
       "alter table public.sectors add column if not exists shape jsonb;",
       "insert into public.sectors (gym_id, name, x, y, shape) values"]
vals = [f"  ('{r['gym_id']}', '{r['name']}', {r['x']}, {r['y']}, '{json.dumps(r['shape'])}'::jsonb)" for r in rows]
sql.append(",\n".join(vals))
sql.append("on conflict (gym_id, name) do update set x = excluded.x, y = excluded.y, shape = excluded.shape;")
open(sys.argv[2], "w").write("\n".join(sql) + "\n")
print(len(rows), "sectores:", [(r["gym_id"], r["name"], len(r["shape"])) for r in rows])
