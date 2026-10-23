# Plano de Natural Benimaclet: la U principal, calcada de la vista cenital (coordenadas de la imagen ampliada x6, 834x528)
import sys
P = lambda pts: " ".join(f"{x},{y}" for x, y in pts)
hall = [(12,88),(776,88),(776,466),(12,466)]
# Colchoneta en U (gris en la vista cenital)
mat = [(26,150),(120,108),(410,108),(480,125),(560,155),(650,100),(772,100),(772,185),(545,266),(400,207),(120,207),
       (120,285),(410,252),(515,312),(772,358),(772,452),(610,412),(560,432),(420,420),(390,395),(300,398),(230,412),(120,372),(60,396),(26,342)]
up = [(830,130),(1022,130),(1022,330),(830,330)]
up_mat = [(842,152),(1004,152),(1004,312),(842,312)]
walls = {
  # Muro de arriba con su desplome (la mancha verde)
  "arriba": [(14,90),(774,90),(774,100),(650,100),(560,156),(480,126),(410,110),(120,110),(28,152),(14,152)],
  # Fondo (lado izquierdo)
  # Zona alta
  "alta-izq": [(830,130),(1022,130),(1022,142),(830,142)],
  "alta-fondo": [(1010,130),(1022,130),(1022,330),(1010,330)],
  "alta-esquina": [(972,330),(1022,280),(1022,330)],
  "alta-desplome": [(850,330),(1022,330),(1022,302),(985,296),(930,276),(880,300),(858,318)],
  "fondo": [(14,150),(28,150),(28,342),(14,342)],
  # Muro de abajo con sus desplomes
  "abajo": [(14,340),(28,342),(60,396),(120,372),(230,412),(300,398),(390,395),(420,420),(560,432),(546,464),(14,464)],
}
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 76 1040 402" width="2600" height="1005">
<defs>
  <pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <rect width="8" height="8" fill="#2B3532"/><line x1="0" y1="0" x2="0" y2="8" stroke="#4A5753" stroke-width="3"/>
  </pattern>
</defs>
<polygon points="{P(hall)}" fill="#F7F9F8" stroke="#2B3532" stroke-width="5" stroke-linejoin="round"/>
<polygon points="{P(mat)}" fill="#CFE6DE"/>
<polygon points="{P(up)}" fill="#F7F9F8" stroke="#2B3532" stroke-width="5" stroke-dasharray="14 8" stroke-linejoin="round"/>
<polygon points="{P(up_mat)}" fill="#CFE6DE"/>
<text x="926" y="118" font-family="Helvetica, Arial, sans-serif" font-size="15" font-weight="800" fill="#8A9692" letter-spacing="3" text-anchor="middle">ZONA ALTA</text>
<!-- Escalera de acceso a la zona alta, en la cuña sin colchoneta -->
<rect x="664" y="438" width="100" height="22" fill="#FFFFFF" stroke="#6E7A76" stroke-width="2"/>
<path d="{"".join(f"M{x} 438V460" for x in range(674, 764, 10))}" stroke="#9AA5A1" stroke-width="1.6"/>
<path d="M676 449H748M740 443L750 449L740 455" fill="none" stroke="#2B3532" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
<text x="926" y="356" font-family="Helvetica, Arial, sans-serif" font-size="12" font-weight="700" fill="#6B7773" text-anchor="middle" letter-spacing="1">SE SUBE POR LA ESCALERA</text>
<text x="926" y="373" font-family="Helvetica, Arial, sans-serif" font-size="12" font-weight="700" fill="#6B7773" text-anchor="middle" letter-spacing="1">(ABAJO A LA DERECHA)</text>
<g fill="url(#hatch)" stroke="#1C2421" stroke-width="2" stroke-linejoin="round">
  {"".join(f'<polygon points="{P(v)}"/>' for v in walls.values())}
</g>
<polygon points="{P(hall)}" fill="none" stroke="#2B3532" stroke-width="5" stroke-linejoin="round"/>
</svg>'''
open(sys.argv[1], "w").write(svg)
