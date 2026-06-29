/**
 * docIndex.ts — chunks the DS markdown docs by heading at startup and
 * serves compact, targeted slices so a small local LLM never has to
 * ingest a full 900-line file.
 *
 * The markdown files in MCP/ remain the single source of truth:
 * edit them and restart the server — no re-compile needed.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Docs live in the repo's docs/ dir (vitamin-z/dist → vitamin-z/docs). Overridable. */
export const DOCS_DIR =
  process.env.DS_DOCS_DIR ?? path.resolve(__dirname, "..", "docs");

const DOC_FILES = [
  "TEMPLATE_STYLE.md",
  "TOKENS.md",
  "COMPONENTS.md",
  "DASHBOARD_PATTERNS.md",
  "AGENT_GUIDE.md",
  "ENFORCEMENT.md",
  "README.md",
];

export interface Chunk {
  file: string;
  heading: string;
  content: string; // includes the heading line
}

let chunks: Chunk[] = [];

export function loadIndex(): { files: number; chunks: number } {
  chunks = [];
  let files = 0;
  for (const name of DOC_FILES) {
    const full = path.join(DOCS_DIR, name);
    if (!fs.existsSync(full)) continue;
    files++;
    const text = fs.readFileSync(full, "utf8");
    const lines = text.split("\n");
    let current: { heading: string; body: string[] } | null = null;
    const flush = () => {
      if (current && current.body.join("").trim()) {
        chunks.push({
          file: name,
          heading: current.heading,
          content: current.body.join("\n").trim(),
        });
      }
    };
    for (const line of lines) {
      const m = /^##\s+(.+)/.exec(line); // split on H2; H3 stays inside chunk
      if (m) {
        flush();
        current = { heading: m[1].trim(), body: [line] };
      } else if (current) {
        current.body.push(line);
      } else {
        // preamble before first H2
        current = { heading: "Introduction", body: [line] };
      }
    }
    flush();
  }
  return { files, chunks: chunks.length };
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, " ");
}

function tokens(s: string): string[] {
  return norm(s).split(/[\s-]+/).filter((t) => t.length > 1);
}

const MAX_CHUNK_CHARS = 3500;

export function clip(text: string, max = MAX_CHUNK_CHARS): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + "\n…(truncated — ask for a narrower section)";
}

/** Spoken-language synonyms → DS vocabulary, weighted at half score. */
const SYNONYMS: Record<string, string[]> = {
  color: ["token"], colour: ["color", "token"], grid: ["table"], sortable: ["table"],
  popup: ["dialog", "popover"], modal: ["dialog"], dropdown: ["select", "menu"],
  nav: ["sidebar", "navigation"], navbar: ["topbar", "header"], notification: ["alert", "bell"],
  spinner: ["skeleton", "loading"], loading: ["skeleton"], dark: ["appearance", "mode"],
  font: ["typography"], heading: ["typography"], spacing: ["stack", "inline", "gap"],
  rounded: ["radius"], corner: ["radius"], pill: ["radius", "badge"],
  hover: ["action", "ghost"], cta: ["button", "primary"], topbar: ["header"],
  kpi: ["stat", "metric"], metric: ["stat"], breadcrumb: ["navigation"],
};

/** Score-based search across all chunks. Heading hits weigh 5x body hits. */
export function search(query: string, limit = 4): Array<Chunk & { score: number }> {
  const base = tokens(query);
  if (base.length === 0) return [];
  const qTokens: Array<{ t: string; w: number }> = base.map((t) => ({ t, w: 1 }));
  for (const t of base) {
    for (const syn of SYNONYMS[t] ?? []) {
      if (!base.includes(syn)) qTokens.push({ t: syn, w: 0.5 });
    }
  }
  const scored = chunks.map((c) => {
    const h = norm(c.heading);
    const b = norm(c.content);
    let score = 0;
    for (const { t, w } of qTokens) {
      if (h.includes(t)) score += 5 * w;
      // term frequency in body, capped so giant chunks don't dominate
      const tf = Math.min((b.match(new RegExp(`\\b${t}`, "g")) ?? []).length, 6);
      score += tf * w;
    }
    // exact heading phrase bonus
    if (h.includes(norm(query).trim())) score += 10;
    return { ...c, score };
  });
  return scored
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Fuzzy-find a single chunk by heading within a specific file. */
export function findByHeading(file: string, name: string): Chunk | undefined {
  const n = norm(name).trim();
  const inFile = chunks.filter((c) => c.file === file);
  return (
    inFile.find((c) => norm(c.heading).trim() === n) ??
    inFile.find((c) => norm(c.heading).includes(n)) ??
    inFile.find((c) => n.includes(norm(c.heading).trim()))
  );
}

export function headings(file: string): string[] {
  return chunks.filter((c) => c.file === file).map((c) => c.heading);
}
