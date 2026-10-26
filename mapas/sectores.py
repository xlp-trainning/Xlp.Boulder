# Divide los planos en sectores tocables: cada punto del edificio va al muro (sector) más cercano,
# hasta una distancia máxima. Genera el SQL para Supabase y un JSON para las pruebas.
import json, re, sys
from shapely.geometry import Polygon, LineString, box, Point
from shapely.ops import unary_union

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

def to_rows(gym, regs, anchors, vb):
    vx, vy, vw, vh = vb
    f = lambda x, y: [round((x - vx) / vw, 4), round((y - vy) / vh, 4)]
    rows = []
    for name, r in regs.items():
        c = anchors[name].centroid
        lp = c if r.contains(c) else r.representative_point()
        rows.append({"gym_id": gym, "name": name, "x": f(lp.x, lp.y)[0], "y": f(lp.x, lp.y)[1],
                     "shape": [f(x, y) for x, y in list(r.exterior.coords)[:-1]]})
    return rows

# ---------- Natural Patraix ----------
ns, vb = load("natural-patraix.py"); W = ns["walls"]
building = unary_union([Polygon(ns["left"]), Polygon(ns["right"])])
P = lambda k: Polygon(W[k])
pat = {
  "Sala 2 · La U": LineString([(217,140),(270,130),(280,132),(310,162),(312,188),(303,218),(277,242),(233,272),(190,302)]),
  "Sala 2 · Isla": P("isla"),
  "Sala 2 · Pared izquierda": P("izq1"),
  "Terraza · Panel": P("panel6"),
  "Sala 1 · Banda": LineString([(190,341),(250,322),(310,300),(357,282)]),
  "Sala 1 · Zigzag": unary_union([P("zig"), LineString([(380,250),(452,366)])]),
  "Sala 1 · Diagonal": LineString([(280,427),(352,392),(372,383),(427,390),(445,376)]),
  "Sala 1 · Pared izquierda": unary_union([P("izq2"), P("bola"), P("murete")]),
  "Terraza · Diagonal": LineString([(263,488),(290,488),(400,416),(457,377)]),
  "Sala 3 · Pared del fondo": P("w86"),
  "Sala 3 · Isla": P("isla8"),
  "Sala 3 · Pared baja": P("w83"),
  "Sala 3 · Celosía": P("abajo"),
}
rows = to_rows("patraix", regions(building, pat, 55), pat, vb)

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
