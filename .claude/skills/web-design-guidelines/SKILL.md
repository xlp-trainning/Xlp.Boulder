---
name: web-design-guidelines
description: Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".
metadata:
  author: vercel (adaptada para Xlp.Boulder)
  version: "1.0.0"
  argument-hint: <file-or-pattern>
---

# Web Interface Guidelines

Review files for compliance with Web Interface Guidelines.

Origen: `vercel-labs/agent-skills` (skills/web-design-guidelines, commit 1a2c79d). Las reglas son una copia fija de `vercel-labs/web-interface-guidelines/command.md` (commit 434b7f9, licencia MIT, ver `LICENSE`).

## How It Works

1. Read the rules from `guidelines.md` in this folder. Do not fetch them from the web: the copy is pinned on purpose so the rules only change when someone reviews them.
2. Read the specified files (or ask which files to review).
3. Check against all rules, with the project adaptations below.
4. Output findings in the terse `file:line` format described in `guidelines.md`.

## Adaptaciones para este proyecto (mandan sobre `guidelines.md`)

- Web estática sin compilar (HTML, CSS y JS a mano): ignora las reglas de React, Next.js e hidratación (`useState`, `nuqs`, `suppressHydrationWarning`, `priority`, `<Link>`), salvo su equivalente en DOM.
- La app está en español: títulos y botones en frase normal, nunca «Title Case». Las comillas son «» en español y “” en inglés.
- El sistema visual «la cinta de salida» de `CLAUDE.md` y las notas de la taste-skill mandan sobre el estilo.
- Guardar filtros y pestañas en la URL es un cambio de funcionamiento: propónlo, no lo apliques sin preguntar.
