# DS Color Enforcement — 3-Layer System

> **For agents:** Every color class you write is checked by an automated linter. If you use any pattern listed below as ❌, the build will fail. There is no exception. When in doubt, look up the correct token in `TOKENS.md`.

---

## The 3 Layers

```
Layer 1 — Lint script        npm run lint:colors (also runs inside npm run lint)
Layer 2 — Project AI context CLAUDE.md loaded automatically by Claude Code
Layer 3 — Pre-commit hook    Blocks git commit if any violation is found
```

All three catch the same set of patterns. The lint script is the authoritative source of truth.

---

## Layer 1 — Lint Script

### Installation (one-time per project)

```
scripts/lint-colors.mjs     ← the script (see full source below)
package.json scripts:
  "lint:colors": "node scripts/lint-colors.mjs"
  "lint": "next lint && node scripts/lint-colors.mjs"
```

### What it checks

The script walks every `.tsx` / `.ts` file under `src/` and fails on any of these patterns:

| ❌ Forbidden | ✅ Correct replacement |
|---|---|
| **Hardcoded hex / rgba** | |
| `bg-[#004030]` | `bg-action-primary` |
| `bg-[#003526]` | `bg-action-primary-hover` |
| `text-[#004030]` | `text-icon-interactive` |
| `border-[#004030]` | `border-border-focus` |
| `ring-[#004030]` | `ring-border-focus` |
| `bg-[rgba(0,64,48,0.04)]` | `bg-action-primary-tint` |
| `bg-[rgba(0,64,48,0.08)]` | `bg-action-primary-subtle` |
| `bg-[rgba(0,64,48,0.1)]` | `bg-action-primary-subtle` |
| `bg-[rgba(0,64,48,0.12)]` | `bg-action-primary-subtle` |
| `border-[rgba(0,64,48,...)]` | `border-action-primary-subtle` |
| Any other `bg-[#...]`, `text-[#...]`, `border-[#...]` | Use a DS token |
| **Text primitives** | |
| `text-slate-900` | `text-text-primary` |
| `text-slate-800` | `text-text-primary` |
| `text-slate-700` | `text-text-strong` |
| `text-slate-600` | `text-text-secondary` |
| `text-slate-500` | `text-text-subtle` |
| `text-slate-400` | `text-text-muted` |
| `text-slate-300` | `text-text-disabled` |
| **Background primitives** | |
| `bg-white` | `bg-surface-elevated` |
| `bg-slate-50` | `bg-surface-sunken` |
| `bg-slate-100` | `bg-bg-secondary` |
| `bg-slate-200` | `bg-bg-tertiary` |
| `hover:bg-slate-100` | `hover:bg-action-ghost-hover` |
| `hover:bg-slate-200` | `hover:bg-action-ghost-active` |
| `hover:bg-slate-50` | `hover:bg-surface-sunken` |
| **Border primitives** | |
| `border-slate-100` | `border-border-subtle` |
| `border-slate-200` | `border-border-default` |
| `border-slate-300` | `border-border-hover` |
| **Status color primitives** | |
| `text-red-*` / `bg-red-*` / `border-red-*` | `{text\|bg\|border}-status-error-{fg\|bg\|border}` |
| `text-green-*` / `bg-green-*` / `border-green-*` | `{text\|bg\|border}-status-success-{fg\|bg\|border}` |
| `text-yellow-*` / `bg-yellow-*` / `border-yellow-*` | `{text\|bg\|border}-status-warning-{fg\|bg\|border}` |
| `text-blue-*` / `bg-blue-*` / `border-blue-*` | `{text\|bg\|border}-status-info-{fg\|bg\|border}` |
| `text-orange-*` / `bg-orange-*` | `text-status-attention-fg` |

### Full lint script source

```js
// scripts/lint-colors.mjs
import fs from "fs";
import path from "path";

const ROOT = new URL("../src", import.meta.url).pathname;
const SCAN_DIRS = ["app/(dashboard)", "app/(auth)", "components"];

const RULES = [
  { pattern: /(?:bg|text|border|ring)-\[#[0-9a-fA-F]+\]/g,
    message: "Hardcoded hex — use a DS token" },
  { pattern: /(?:bg|border|text)-\[rgba\(\s*0\s*,\s*64\s*,\s*48/g,
    message: "Hardcoded brand rgba — use bg-action-primary-subtle or bg-action-primary-tint" },
  { pattern: /text-slate-\d+/g,
    message: "Raw text-slate-* — use text-text-{primary|strong|secondary|subtle|muted|disabled}" },
  { pattern: /\bbg-white\b/g,
    message: "Raw bg-white — use bg-surface-elevated" },
  { pattern: /\bbg-slate-\d+/g,
    message: "Raw bg-slate-* — use bg-surface-{sunken|elevated} or bg-bg-{secondary|tertiary}" },
  { pattern: /\bborder-slate-\d+/g,
    message: "Raw border-slate-* — use border-border-{subtle|default|hover|focus}" },
  { pattern: /(?:text|bg|border)-red-\d+/g,
    message: "Raw red-* — use {text|bg|border}-status-error-{fg|bg|border}" },
  { pattern: /(?:text|bg|border)-green-\d+/g,
    message: "Raw green-* — use {text|bg|border}-status-success-{fg|bg|border}" },
  { pattern: /(?:text|bg|border)-yellow-\d+/g,
    message: "Raw yellow-* — use {text|bg|border}-status-warning-{fg|bg|border}" },
  { pattern: /(?:text|bg|border)-blue-\d+/g,
    message: "Raw blue-* — use {text|bg|border}-status-info-{fg|bg|border}" },
  { pattern: /(?:text|bg)-orange-\d+/g,
    message: "Raw orange-* — use text-status-attention-fg" },
];

function* walkTsx(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walkTsx(full);
    else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) yield full;
  }
}

let total = 0;
for (const scanDir of SCAN_DIRS) {
  for (const file of walkTsx(path.join(ROOT, scanDir))) {
    const rel = path.relative(path.join(ROOT, ".."), file);
    const lines = fs.readFileSync(file, "utf8").split("\n");
    for (const rule of RULES) {
      lines.forEach((line, i) => {
        rule.pattern.lastIndex = 0;
        const matches = line.match(new RegExp(rule.pattern.source, "g"));
        if (!matches) return;
        matches.forEach((match) => {
          console.error(`✗ ${rel}:${i + 1}  ${match}\n  → ${rule.message}\n`);
          total++;
        });
      });
    }
  }
}

if (total > 0) { console.error(`${total} violation(s).`); process.exit(1); }
else console.log("✓ No DS color violations.");
```

---

## Layer 2 — CLAUDE.md (project AI context)

Place this file at the project root. Claude Code loads it automatically at session start.

The file must contain:
- The full token reference table (copy from `TOKENS.md`)
- The forbidden patterns list (copy from the table above)
- A note that `npm run lint:colors` validates compliance
- Links to `src/app/globals.css`, `tailwind.config.ts`, and `scripts/lint-colors.mjs`

This ensures that even before any linting happens, the AI generating code has the DS rules in its context window and will not produce violations in the first place.

**Template structure:**

```md
# ProjectName — Claude Code Rules

## Design System compliance (MANDATORY)
Every color must come from a DS token. Never use raw Tailwind color primitives.
Run `npm run lint:colors` to verify.

### Token reference
[full tables from TOKENS.md]

### Forbidden patterns
[forbidden table from this document]

### Token source files
- CSS variables: src/app/globals.css
- Tailwind mapping: tailwind.config.ts
- Lint script: scripts/lint-colors.mjs
```

---

## Layer 3 — Pre-commit Hook

Blocks `git commit` if any DS color violation exists. Zero tolerance.

### Setup with husky

```bash
npm install --save-dev husky
npx husky init
echo "npm run lint:colors" > .husky/pre-commit
chmod +x .husky/pre-commit
```

### What happens on violation

```
$ git commit -m "add new card"
✗ src/app/(dashboard)/colis/page.tsx:42  text-slate-900
  → Raw text-slate-* — use text-text-{primary|strong|secondary|subtle|muted|disabled}

1 violation(s).
husky - pre-commit hook exited with code 1
```

The commit is blocked. The developer must fix the violation before committing.

---

## Adding a New Project

To apply all 3 layers to a new project using this DS:

1. Copy `scripts/lint-colors.mjs` (source above) into the project's `scripts/` folder
2. Add to `package.json` scripts:
   ```json
   "lint:colors": "node scripts/lint-colors.mjs",
   "lint": "next lint && node scripts/lint-colors.mjs"
   ```
3. Create `CLAUDE.md` at project root using the template above
4. Optionally add husky pre-commit hook (Layer 3)

That's it. The codebase is now enforced at write time (CLAUDE.md), at lint time (lint script), and at commit time (pre-commit hook).

---

## Why This Exists

Without enforcement, AI agents and developers gradually drift back to Tailwind primitives:
- `text-slate-600` is shorter to type than `text-text-secondary`
- GitHub Copilot and similar tools suggest primitives by default
- Copying code from Stack Overflow, shadcn docs, or AI outputs brings primitives in

The 3-layer system catches drift **before it reaches the codebase**. The CLAUDE.md stops it at generation time. The lint script catches it before merge. The pre-commit hook catches it at commit time.

All three are needed because each layer has gaps: an agent might not read CLAUDE.md carefully, a developer might skip lint, but a pre-commit hook cannot be bypassed without explicitly using `--no-verify`.
