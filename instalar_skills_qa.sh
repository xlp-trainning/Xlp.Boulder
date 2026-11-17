#!/usr/bin/env bash
# Instala las skills de QA exploratorio en el proyecto actual (.claude/skills/)
# y, opcionalmente, lanza varias pasadas de prueba como distintos usuarios.
#
# Uso:
#   cd /ruta/a/tu/proyecto
#   bash instalar_skills_qa.sh                       # solo instala
#   bash instalar_skills_qa.sh http://localhost:3000 # instala y prueba
set -e

echo "==> Instalando skills de QA..."

# 1. Dogfood (Vercel Labs) - QA exploratorio web con informe y evidencias
npx -y skills add vercel-labs/agent-browser --skill dogfood --agent claude-code

# 2. UI Test (Browserbase) - intenta romper la app, accesibilidad, responsive, UX
npx -y skills add browserbase/skills --skill ui-test --agent claude-code

# 3. Exploratory Test (turbo) - pruebas por niveles, de básico a adversarial
npx -y skills add tobihagemann/turbo --skill exploratory-test --agent claude-code

# 4. Agentic UI QA - personas, puntuación y bucle de mejoras
npx -y skillscat add homenshum/agentic-ui-qa

# 5. Herramienta de navegador que usa la skill dogfood
npm i -g agent-browser || echo "Aviso: no se pudo instalar agent-browser (prueba con sudo)"

# --- Si tu app es MÓVIL (iOS/Android), descomenta esta línea.
# Se llama igual que la de Vercel ("dogfood"), así que instala solo una de las dos.
# npx -y skills add callstackincubator/agent-skills --skill dogfood --agent claude-code

echo "==> Skills instaladas en .claude/skills/"
ls .claude/skills/ 2>/dev/null || true

# ---------------------------------------------------------------------------
# Pasadas de prueba (solo si se pasa una URL)
# ---------------------------------------------------------------------------
URL="$1"
[ -z "$URL" ] && { echo "Listo. Para probar: bash $0 http://localhost:3000"; exit 0; }

mkdir -p informes_qa

PERSONAS=(
  "usuario novato que nunca ha usado la app"
  "usuario con prisa que quiere terminar su tarea rápido"
  "usuario malicioso que intenta romperla con datos raros"
  "usuario en móvil con pantalla pequeña"
  "usuario con necesidades de accesibilidad (solo teclado / lector de pantalla)"
)

SKILLS=(dogfood ui-test exploratory-test agentic-ui-qa)

i=0
for persona in "${PERSONAS[@]}"; do
  skill="${SKILLS[$((i % ${#SKILLS[@]}))]}"
  i=$((i + 1))
  echo "==> Pasada $i: $persona (skill: $skill)"
  claude -p "Usa la skill $skill para probar la app en $URL actuando como: $persona.
No leas el código fuente: pruébala solo como usuario.
Guarda un informe en informes_qa/pasada_$i.md con: bugs encontrados (pasos para reproducir, gravedad),
problemas de UX y propuestas de mejora concretas." \
    --allowedTools "Bash,Read,Write,Edit" || echo "La pasada $i falló, sigo con la siguiente"
done

echo "==> Generando resumen final..."
claude -p "Lee todos los informes de informes_qa/ y crea informes_qa/RESUMEN.md con:
1) bugs únicos sin duplicados, ordenados por gravedad;
2) propuestas de mejora ordenadas por impacto/esfuerzo;
3) los 5 primeros pasos que recomiendas hacer." \
  --allowedTools "Read,Write"

echo "==> Hecho. Mira informes_qa/RESUMEN.md"
