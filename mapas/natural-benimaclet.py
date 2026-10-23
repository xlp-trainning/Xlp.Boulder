# Plano de Natural Benimaclet: la U principal (vista cenital) y la zona alta (esquema a mano).
# Coordenadas de la vista cenital ampliada x6 (834x528). La zona alta va en un recuadro a la izquierda,
# al fondo de la U y de cara a ella, como en el esquema.
import sys
P = lambda pts: " ".join(f"{x},{y}" for x, y in pts)

# Nave: se amplía por arriba para el pasillo de la cara exterior del brazo de arriba y la escalera
hall = [(12,36),(776,36),(776,466),(12,466)]
mat = [(26,150),(120,108),(410,108),(480,125),(560,155),(650,100),(772,100),(772,185),(545,266),(400,207),(120,207),
       (120,285),(410,252),(515,312),(772,358),(772,452),(610,412),(560,432),(420,420),(390,395),(300,398),(230,412),(120,372),(60,396),(26,342)]
# Colchoneta delante de la cara exterior del brazo de arriba
mat_ext = [(120,40),(772,40),(772,80),(120,80)]
walls = {
  # Brazo de arriba: se escala por dentro (con su desplome) y por fuera
  "arriba": [(14,80),(774,80),(774,100),(650,100),(560,156),(480,126),(410,110),(120,110),(28,152),(14,152)],
  "fondo": [(14,150),(28,150),(28,342),(14,342)],
  "abajo": [(14,340),(28,342),(60,396),(120,372),(230,412),(300,398),(390,395),(420,420),(560,432),(546,464),(14,464)],
  # Zona alta: pared larga, tramo corto en esquina
  "alta-larga": [(-252,140),(-238,140),(-226,168),(-206,206),(-184,250),(-176,268),(-196,300),(-214,336),(-230,380),(-238,410),(-238,450),(-252,450)],
  "alta-corta": [(-252,450),(-140,450),(-140,464),(-252,464)],
  "alta-esquina": [(-238,450),(-238,420),(-206,450)],
}
up = [(-262,80),(-40,80),(-40,464),(-262,464)]
up_mat = [(-238,84),(-58,84),(-58,450),(-238,450)]

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="-275 0 1065 478" width="2663" height="1195">
<defs>
  <pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <rect width="8" height="8" fill="#2B3532"/><line x1="0" y1="0" x2="0" y2="8" stroke="#4A5753" stroke-width="3"/>
  </pattern>
</defs>
<polygon points="{P(hall)}" fill="#F7F9F8" stroke="#2B3532" stroke-width="5" stroke-linejoin="round"/>
<polygon points="{P(mat)}" fill="#CFE6DE"/>
<polygon points="{P(mat_ext)}" fill="#CFE6DE"/>

<!-- Zona alta -->
<polygon points="{P(up)}" fill="#F7F9F8" stroke="#2B3532" stroke-width="5" stroke-dasharray="14 8" stroke-linejoin="round"/>
<polygon points="{P(up_mat)}" fill="#CFE6DE"/>
<g>
  <rect x="-254" y="86" width="20" height="52" fill="#FFFFFF" stroke="#2B3532" stroke-width="2.5"/>
  <g fill="#2B3532">{"".join(f'<circle cx="{x}" cy="{y}" r="1.6"/>' for x in (-249,-244,-239) for y in range(92, 136, 6))}</g>
  <text x="-226" y="116" font-family="Helvetica, Arial, sans-serif" font-size="12" font-weight="800" fill="#2B3532" letter-spacing="1.5">KILTER</text>
</g>
<text x="-151" y="52" font-family="Helvetica, Arial, sans-serif" font-size="15" font-weight="800" fill="#8A9692" letter-spacing="3" text-anchor="middle">ZONA ALTA</text>
<text x="-151" y="69" font-family="Helvetica, Arial, sans-serif" font-size="11" font-weight="700" fill="#6B7773" text-anchor="middle" letter-spacing="1">PLANTA DE ARRIBA</text>

<!-- Escalera: en la esquina de arriba, junto a la cara exterior del brazo de arriba -->
<rect x="22" y="44" width="86" height="30" fill="#FFFFFF" stroke="#6E7A76" stroke-width="2"/>
<path d="{"".join(f"M{x} 44V74" for x in range(32, 108, 10))}" stroke="#9AA5A1" stroke-width="1.6"/>
<path d="M98 59H32M40 53L30 59L40 65" fill="none" stroke="#2B3532" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>

<g fill="url(#hatch)" stroke="#1C2421" stroke-width="2" stroke-linejoin="round">
  {"".join(f'<polygon points="{P(v)}"/>' for v in walls.values())}
</g>
<polygon points="{P(hall)}" fill="none" stroke="#2B3532" stroke-width="5" stroke-linejoin="round"/>
</svg>'''
open(sys.argv[1], "w").write(svg)
