import random, sys
random.seed(int(sys.argv[2]) if len(sys.argv) > 2 else 3)
C = 160; NX, NY = 10, 6; W, H = C * NX, C * NY
BG = "#15171C"
PAL = ["#FF5A4E", "#2F6BFF", "#FFC933", "#3DD6A3", "#B794F6", "#F3EEE4"]   # coral, cobalto, girasol, menta, lila, tiza
o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">', f'<rect width="{W}" height="{H}" fill="{BG}"/>']
grid = {}
def pick(x, y, avoid=()):
    bad = {grid.get((x - 1, y)), grid.get((x, y - 1))} | set(avoid)
    return random.choice([c for c in PAL if c not in bad])
for y in range(NY):
    for x in range(NX):
        X, Y = x * C, y * C; c = pick(x, y); grid[(x, y)] = c
        k = random.choices(["vacia", "cuarto", "medio", "tri", "presa", "aro", "regletas", "lleno"], [14, 18, 12, 16, 16, 8, 9, 7])[0]
        c2 = pick(x, y, [c])
        if k == "vacia": grid[(x, y)] = None; continue
        if k == "lleno":
            o.append(f'<rect x="{X}" y="{Y}" width="{C}" height="{C}" fill="{c}"/>')
            o.append(f'<circle cx="{X + C/2}" cy="{Y + C/2}" r="{C*.12}" fill="{BG}"/>')
        elif k == "cuarto":
            cx, cy = random.choice([(X, Y), (X + C, Y), (X, Y + C), (X + C, Y + C)])
            o.append(f'<clipPath id="q{x}{y}"><rect x="{X}" y="{Y}" width="{C}" height="{C}"/></clipPath><circle cx="{cx}" cy="{cy}" r="{C}" fill="{c}" clip-path="url(#q{x}{y})"/>')
        elif k == "medio":
            side = random.choice(["t", "b", "l", "r"])
            if side in "tb":
                cy = Y if side == "t" else Y + C; o.append(f'<clipPath id="q{x}{y}"><rect x="{X}" y="{Y}" width="{C}" height="{C}"/></clipPath><circle cx="{X + C/2}" cy="{cy}" r="{C/2}" fill="{c}" clip-path="url(#q{x}{y})"/>')
            else:
                cx = X if side == "l" else X + C; o.append(f'<clipPath id="q{x}{y}"><rect x="{X}" y="{Y}" width="{C}" height="{C}"/></clipPath><circle cx="{cx}" cy="{Y + C/2}" r="{C/2}" fill="{c}" clip-path="url(#q{x}{y})"/>')
        elif k == "tri":
            pts = random.choice([f"{X},{Y} {X+C},{Y} {X},{Y+C}", f"{X+C},{Y} {X+C},{Y+C} {X},{Y+C}", f"{X},{Y} {X+C},{Y+C} {X},{Y+C}", f"{X},{Y} {X+C},{Y} {X+C},{Y+C}"])
            o.append(f'<polygon points="{pts}" fill="{c}"/>')
            if random.random() < .5:   # volumen: segunda cara en otro color
                o.append(f'<polygon points="{pts}" fill="{c2}" transform="rotate(180 {X+C/2} {Y+C/2})" opacity="1"/>')
        elif k == "presa":
            r = C * random.choice([.3, .36, .42])
            o.append(f'<circle cx="{X + C/2}" cy="{Y + C/2}" r="{r:.0f}" fill="{c}"/><circle cx="{X + C/2}" cy="{Y + C/2}" r="{C*.06:.0f}" fill="{BG}"/>')
        elif k == "aro":
            o.append(f'<circle cx="{X + C/2}" cy="{Y + C/2}" r="{C*.32:.0f}" fill="none" stroke="{c}" stroke-width="{C*.12:.0f}"/>')
        elif k == "regletas":
            hor = random.random() < .5
            for i in range(3):
                if hor: o.append(f'<rect x="{X + C*.16}" y="{Y + C*(.2 + i*.24):.0f}" width="{C*.68:.0f}" height="{C*.12:.0f}" rx="{C*.06:.0f}" fill="{c}"/>')
                else: o.append(f'<rect x="{X + C*(.2 + i*.24):.0f}" y="{Y + C*.16}" width="{C*.12:.0f}" height="{C*.68:.0f}" rx="{C*.06:.0f}" fill="{c}"/>')
o.append('</svg>'); open(sys.argv[1], "w").write("\n".join(o))
