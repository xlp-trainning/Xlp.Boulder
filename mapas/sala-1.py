# Plano de la sala (3 salas + terrazas) calcado del original, en sus coordenadas (1204x596)
import sys
P = lambda pts: " ".join(f"{x},{y}" for x, y in pts)

left   = [(95,102),(290,99),(455,368),(512,368),(512,435),(565,570),(107,570),(108,172)]
right  = [(510,100),(1140,100),(1140,370),(510,370)]
terr6  = [(95,102),(290,99),(272,110),(142,160),(108,172)]
terr7  = [(107,570),(265,488),(452,372),(458,368),(480,465),(405,520),(385,570)]
garden = [(458,368),(512,368),(512,435),(565,570),(385,570),(405,520),(480,465)]
parasols = [(122,120),(146,136),(222,110),(296,538),(342,516),(380,540),(378,498),(424,494),(458,478),(418,548),(505,500),(520,540)]

walls = {
  # Sala 2: la U que rodea la isla, unida a la banda de bloques que la separa de la sala 1
  "u": [(217,128),(272,110),(290,104),(300,112),(328,160),(365,218),(372,244),(357,282),(310,300),(250,322),(190,341),(176,318),(180,312),
        (190,302),(233,272),(277,242),(303,218),(312,188),(310,162),(280,132),(270,130),(217,140)],
  "isla": [(190,195),(220,175),(248,180),(255,193),(230,205),(223,215),(200,225),(192,218)],
  # Panel de la terraza de arriba
  "panel6": [(140,157),(272,107),(276,112),(144,163)],
  # Columna de bloques a lo largo del muro exterior derecho de las salas 1 y 2
  "borde": [(290,100),(306,100),(458,364),(441,368)],
  # Sala 1: zigzag del lado derecho y pared diagonal hacia la terraza
  "zig": [(310,281),(372,244),(392,272),(403,300),(372,305),(362,288),(357,282),(317,298)],
  "diag": [(263,476),(340,428),(352,396),(372,385),(427,390),(445,376),(452,370),(457,377),(400,416),(290,488),(263,488)],
  "izq1": [(108,172),(124,172),(127,262),(131,282),(125,328),(108,328)],
  "izq2": [(108,368),(120,368),(120,460),(108,460)],
  "murete": [(109,365),(150,347),(152,352),(111,370)],
  "bola": [(119,372),(130,369),(138,372),(142,380),(141,389),(135,393),(125,395),(120,398)],
  # Sala 3
  "w86": [(788,127),(1137,127),(1137,193),(1127,193),(1127,165),(1110,148),(1077,160),(1027,157),(987,160),(960,140),(930,143),(890,130),(860,137),(788,138)],
  "isla8": [(820,226),(840,223),(867,222),(897,225),(923,213),(950,223),(973,220),(1033,225),(1050,222),(1078,230),(1073,250),(1047,247),
            (1020,240),(993,252),(967,243),(940,257),(907,248),(880,255),(850,263),(838,262),(823,248)],
  "abajo": [(867,335),(950,333),(1000,330),(1025,322),(1040,332),(1040,341),(867,341)],
  "w83": [(593,352),(677,352),(712,355),(727,338),(790,338),(790,367),(593,367)],
}
mats = ["bola","murete","u","isla","zig","diag","izq1","izq2","w86","isla8","abajo","w83","panel6"]

def truss(x0, x1, y0, y1, posts, crosses):
    """Celosía vista desde arriba: marco, montantes y cruces de San Andrés"""
    s = f'<rect x="{x0}" y="{y0}" width="{x1-x0}" height="{y1-y0}" fill="#EEF1F0"/>'
    s += f'<path d="M{x0} {y0}H{x1}M{x0} {y1}H{x1}' + "".join(f"M{p} {y0}V{y1}" for p in posts) + "".join(f"M{a} {y0}L{b} {y1}M{b} {y0}L{a} {y1}" for a, b in crosses) + '" fill="none" stroke="#6E7A76" stroke-width="1.6"/>'
    return s

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="80 85 1075 500" width="2150" height="1000">
<defs>
  <pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <rect width="8" height="8" fill="#2B3532"/><line x1="0" y1="0" x2="0" y2="8" stroke="#4A5753" stroke-width="3"/>
  </pattern>
  <pattern id="rooms" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
    <rect width="10" height="10" fill="#E1E5E3"/><line x1="0" y1="0" x2="0" y2="10" stroke="#D3D8D6" stroke-width="2"/>
  </pattern>
  <pattern id="deck" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
    <rect width="12" height="12" fill="#EEE7DA"/><line x1="0" y1="0" x2="12" y2="0" stroke="#E0D6C4" stroke-width="2"/>
  </pattern>
  <clipPath id="inside"><polygon points="{P(left)}"/><polygon points="{P(right)}"/></clipPath>
</defs>
<g stroke="#2B3532" stroke-width="4" stroke-linejoin="round">
  <polygon points="{P(left)}" fill="#F7F9F8"/>
  <polygon points="{P(right)}" fill="#F7F9F8"/>
</g>
<polygon points="{P(terr6)}" fill="url(#deck)"/>
<polygon points="{P(terr7)}" fill="url(#deck)"/>
<polygon points="{P(garden)}" fill="#D3E3D6"/>
<circle cx="472" cy="512" r="24" fill="#8DB59A"/><circle cx="488" cy="500" r="15" fill="#A3C6AE"/>
<g clip-path="url(#inside)" fill="#CFE6DE" stroke="#CFE6DE" stroke-width="34" stroke-linejoin="round">
  {"".join(f'<polygon points="{P(walls[k])}"/>' for k in mats)}
</g>
<g fill="#FFFFFF" stroke="#B9AE99" stroke-width="1.5">
  {"".join(f'<g transform="translate({x},{y}) rotate(20)"><rect x="-9" y="-9" width="18" height="18"/><path d="M-9-9L9 9M9-9L-9 9" fill="none"/></g>' for x, y in parasols)}
</g>
<g>
  <rect x="517" y="109" width="236" height="127" fill="url(#rooms)" stroke="#9AA5A1" stroke-width="2"/>
  <rect x="517" y="237" width="42" height="93" fill="url(#rooms)" stroke="#9AA5A1" stroke-width="2"/>
  <rect x="580" y="237" width="143" height="45" fill="#FFFFFF" stroke="#9AA5A1" stroke-width="2"/>
  <rect x="737" y="245" width="20" height="32" fill="url(#rooms)" stroke="#9AA5A1" stroke-width="1.5"/>
  <rect x="794" y="334" width="43" height="31" fill="url(#rooms)" stroke="#9AA5A1" stroke-width="2"/>
  <polygon points="1100,237 1137,237 1137,367 1040,367 1040,277 1100,277" fill="#E1E5E3"/>
  <text x="651" y="265" font-family="Helvetica, Arial, sans-serif" font-size="13" font-weight="700" fill="#6B7773" text-anchor="middle" letter-spacing="1">ASEOS</text>
</g>
{truss(788, 1137, 110, 127, [830,870,910,948,987,1028,1065,1102], [(788,830),(1065,1102)])}
{truss(867, 1040, 341, 367, [910,950,990], [(910,950),(990,1030)])}
<g fill="url(#hatch)" stroke="#1C2421" stroke-width="2" stroke-linejoin="round">
  {"".join(f'<polygon points="{P(v)}"/>' for v in walls.values())}
</g>
<path d="{"".join(f"M109 {y}H{x1}" for y0, y1, x1 in [(178,322,123),(374,456,119)] for y in range(y0, y1, 9))}" stroke="#55625E" stroke-width="1.2"/>
<g font-family="Helvetica, Arial, sans-serif" font-size="15" font-weight="800" fill="#8A9692" letter-spacing="3" text-anchor="middle">
  <text x="180" y="262">SALA 2</text>
  <text x="300" y="380">SALA 1</text>
  <text x="960" y="300">SALA 3</text>
  <text x="240" y="560" font-size="12" fill="#A89C86">TERRAZA</text>
</g>
<g stroke="#2B3532" stroke-width="4" fill="none" stroke-linejoin="round">
  <polygon points="{P(left)}"/><polygon points="{P(right)}"/>
</g>
</svg>'''
open(sys.argv[1], "w").write(svg)
