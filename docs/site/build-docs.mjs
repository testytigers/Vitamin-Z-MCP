#!/usr/bin/env node
/**
 * build-docs.mjs — generates the Vitamin-Z Design System documentation site.
 *
 * Reads the canonical markdown in ../*.md, renders it to HTML at build time
 * (so the site can never drift from the docs the MCP server actually serves),
 * builds a full token/component nav, and themes it in Vitamin-Z's own identity.
 *
 * Outputs:
 *   - index.html     full standalone page (open locally / serve anywhere)
 *   - artifact.html  body-only fragment (for publishing as a shareable link)
 *
 * Run:  node build-docs.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS = join(__dirname, "..");

/* ── doc set: file → friendly section name ──────────────────────── */
const SECTIONS = [
  { key: "overview",   file: "README.md",              label: "Overview" },
  { key: "tokens",     file: "TOKENS.md",              label: "Tokens" },
  { key: "components", file: "COMPONENTS.md",          label: "Components" },
  { key: "patterns",   file: "DASHBOARD_PATTERNS.md",  label: "Patterns" },
  { key: "enforce",    file: "ENFORCEMENT.md",         label: "Enforcement" },
  { key: "template",   file: "TEMPLATE_STYLE.md",      label: "Template Law" },
  { key: "agent",      file: "AGENT_GUIDE.md",         label: "Agent Guide" },
];

/* ── Vitamin-Z brand ramp (authoritative, from globals.css) ─────────── */
const BRAND_RAMP = [
  ["50", "#ecf6f2"], ["100", "#cfe7df"], ["200", "#a6d2c4"], ["300", "#72b8a3"],
  ["400", "#3d9580"], ["500", "#156a52"], ["600", "#004030"], ["700", "#003526"],
  ["800", "#002a1e"], ["900", "#001d15"],
];

/* ── helpers ─────────────────────────────────────────────────────── */
const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const slugify = (s) =>
  s.toLowerCase().trim()
    .replace(/`/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const COLOR_RE = /#[0-9a-fA-F]{6}\b|rgba?\([^)]*\)/g;

function swatchify(htmlText) {
  // htmlText is already HTML-escaped; color tokens have no special chars.
  return htmlText.replace(COLOR_RE, (m) => `<span class="sw" style="--c:${m}"></span>${m}`);
}

function renderInline(s) {
  let out = esc(s);
  // inline code first (protect contents from further formatting)
  out = out.replace(/`([^`]+)`/g, (_, code) => {
    const isColor = /^#[0-9a-fA-F]{6}$|^rgba?\(/.test(code);
    const chip = isColor ? `<span class="sw" style="--c:${code}"></span>` : "";
    return `<code>${chip}${code}</code>`;
  });
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return out;
}

/* ── live component demos (static HTML replicas on a fixed DS surface) ── */
const demo = (inner, extra = "") =>
  `<div class="demo"><div class="demo-bar"><span class="demo-dot"></span>Preview</div><div class="demo-canvas ${extra}">${inner}</div></div>`;

const DEMOS = {
  "Button": demo(`
    <button class="dx-btn dx-btn-primary">Créer le colis</button>
    <button class="dx-btn dx-btn-secondary">Importer</button>
    <button class="dx-btn dx-btn-ghost">Annuler</button>
    <button class="dx-btn dx-btn-outline">Supprimer</button>
    <button class="dx-btn dx-btn-primary" disabled>Désactivé</button>`, "dx-row"),

  "Card": demo(`
    <div class="dx-card">
      <div class="dx-card-title">Récapitulatif</div>
      <div class="dx-card-body">
        <div class="dx-row-sb"><span class="dx-muted">Total colis</span><strong>1 248</strong></div>
        <div class="dx-row-sb"><span class="dx-muted">Livrés</span><strong>1 102</strong></div>
        <div class="dx-row-sb"><span class="dx-muted">En attente</span><strong>146</strong></div>
      </div>
      <button class="dx-btn dx-btn-primary" style="margin-top:16px;width:100%;justify-content:center">Voir le détail</button>
    </div>`),

  "Badge": demo(`
    <span class="dx-badge dx-badge-success">Livré</span>
    <span class="dx-badge dx-badge-warning">En attente</span>
    <span class="dx-badge dx-badge-error">Retourné</span>
    <span class="dx-badge dx-badge-info">Pris en charge</span>
    <span class="dx-badge dx-badge-outline">Brouillon</span>`, "dx-row"),

  "Input": demo(`
    <div class="dx-field"><label class="dx-label">Nom du client</label><input class="dx-input" value="Amira Benali" readonly></div>
    <div class="dx-field"><label class="dx-label">Email (focus)</label><input class="dx-input dx-input-focus" placeholder="nom@exemple.dz"></div>
    <div class="dx-field"><label class="dx-label">Téléphone</label><input class="dx-input dx-input-error" value="0550" readonly><span class="dx-err">Numéro invalide</span></div>`, "dx-row"),

  "Select": demo(`
    <div class="dx-select">
      <div class="dx-select-trigger">Alger <span class="dx-chev">▾</span></div>
      <div class="dx-menu">
        <div class="dx-menu-item dx-menu-item-active"><span>Alger</span><span>✓</span></div>
        <div class="dx-menu-item"><span>Oran</span></div>
        <div class="dx-menu-item"><span>Constantine</span></div>
      </div>
    </div>`),

  "Tabs": demo(`
    <div class="dx-tabs-full">
      <div class="dx-tabs">
        <div class="dx-tab dx-tab-active">Liste de colis</div>
        <div class="dx-tab">Demandes de modification <span class="dx-tab-badge">5</span></div>
      </div>
      <div class="dx-tab-panel">Contenu de l'onglet actif…</div>
    </div>`, "dx-col"),

  "Table": demo(`
    <table class="dx-table">
      <thead><tr><th>Réf.</th><th>Client</th><th>Statut</th></tr></thead>
      <tbody>
        <tr><td>CLX-10042</td><td>Amira Benali</td><td><span class="dx-badge dx-badge-success">Livré</span></td></tr>
        <tr><td>CLX-10041</td><td>Yacine Taleb</td><td><span class="dx-badge dx-badge-warning">En attente</span></td></tr>
        <tr><td>CLX-10039</td><td>Omar Meziane</td><td><span class="dx-badge dx-badge-error">Retourné</span></td></tr>
      </tbody>
    </table>`, "dx-col"),

  "Dialog": demo(`
    <div class="dx-dialog-stage">
      <div class="dx-dialog">
        <div class="dx-dialog-title">Confirmer le scan</div>
        <div class="dx-dialog-desc">Confirmez votre identité pour activer le mode scan sur ce bon de livraison.</div>
        <div class="dx-dialog-foot">
          <button class="dx-btn dx-btn-ghost">Annuler</button>
          <button class="dx-btn dx-btn-primary">Lancer le scan</button>
        </div>
      </div>
    </div>`, "dx-col"),

  "Dropdown Menu": demo(`
    <div class="dx-menu" style="width:210px">
      <div class="dx-menu-item"><span>Voir détails</span></div>
      <div class="dx-menu-item"><span>Modifier</span></div>
      <div class="dx-menu-item"><span>Imprimer BL</span></div>
      <div class="dx-menu-sep"></div>
      <div class="dx-menu-item dx-menu-item-danger"><span>Annuler</span></div>
    </div>`),

  "Avatar": demo(`
    <div class="dx-avatar">SA</div>
    <div class="dx-avatar dx-avatar-green">KD</div>
    <div class="dx-avatar-group">
      <div class="dx-avatar">AB</div>
      <div class="dx-avatar dx-avatar-green">MR</div>
      <div class="dx-avatar">+3</div>
    </div>`, "dx-row"),

  "Alert": demo(`
    <div class="dx-alert dx-alert-info"><strong>Info</strong> — Une nouvelle mise à jour est disponible.</div>
    <div class="dx-alert dx-alert-success"><strong>Succès</strong> — Le colis a été enregistré.</div>
    <div class="dx-alert dx-alert-warning"><strong>Attention</strong> — L'adresse du client est incomplète.</div>
    <div class="dx-alert dx-alert-error"><strong>Erreur</strong> — Échec de l'enregistrement, réessayez.</div>`, "dx-col"),

  "Skeleton": demo(`
    <div class="dx-skel" style="width:55%"></div>
    <div class="dx-skel" style="width:92%"></div>
    <div class="dx-skel" style="width:78%"></div>
    <div class="dx-skel" style="width:40%"></div>`, "dx-col"),

  "Separator": demo(`
    <div style="width:100%">
      <div class="dx-muted">Informations générales</div>
      <div class="dx-sep-h"></div>
      <div class="dx-muted">Historique du colis</div>
    </div>
    <div style="display:flex;align-items:center;gap:12px;margin-top:8px">
      <span>Profil</span><div class="dx-sep-v"></div><span>Paramètres</span><div class="dx-sep-v"></div><span>Déconnexion</span>
    </div>`, "dx-col"),

  "Tooltip": demo(`
    <div class="dx-tip-wrap">
      <button class="dx-btn dx-btn-ghost">Survoler</button>
      <div class="dx-tip">Astuce d'aide<span class="dx-tip-arrow"></span></div>
    </div>`),

  "Breadcrumb": demo(`
    <nav class="dx-bc">
      <a href="#">Accueil</a><span class="dx-bc-sep">/</span>
      <a href="#">Colis</a><span class="dx-bc-sep">/</span>
      <span class="dx-bc-cur">CLX-10042</span>
    </nav>`),

  "Checkbox": demo(`
    <label class="dx-check"><span class="dx-box dx-box-on">✓</span> Colis de stock</label>
    <label class="dx-check"><span class="dx-box"></span> Éligible à relance</label>`, "dx-col"),

  "Switch": demo(`
    <label class="dx-sw-row"><span class="dx-switch dx-switch-on"><span class="dx-knob"></span></span> Notifications activées</label>
    <label class="dx-sw-row"><span class="dx-switch"><span class="dx-knob"></span></span> Mode sombre</label>`, "dx-col"),

  "Progress": demo(`
    <div style="width:100%">
      <div class="dx-row-sb dx-muted" style="margin-bottom:7px"><span>Traitement de l'arrivage</span><span>62%</span></div>
      <div class="dx-prog"><div class="dx-prog-fill" style="width:62%"></div></div>
    </div>`, "dx-col"),

  "Accordion": demo(`
    <div class="dx-acc" style="width:100%">
      <div class="dx-acc-item">
        <div class="dx-acc-head dx-acc-open">Comment créer un colis ? <span>−</span></div>
        <div class="dx-acc-body">Cliquez sur « Ajouter un colis », remplissez les informations de l'expéditeur et du client, puis validez.</div>
      </div>
      <div class="dx-acc-item"><div class="dx-acc-head">Comment scanner un arrivage ? <span>+</span></div></div>
      <div class="dx-acc-item"><div class="dx-acc-head">Comment générer un bon de livraison ? <span>+</span></div></div>
    </div>`, "dx-col"),

  "Form (react-hook-form integration)": demo(`
    <form class="dx-form" onsubmit="return false">
      <div class="dx-field"><label class="dx-label">Boutique</label><input class="dx-input" value="Boutique Safa" readonly></div>
      <div class="dx-field"><label class="dx-label">Ville de destination</label><input class="dx-input" placeholder="Sélectionner une ville…"></div>
      <button class="dx-btn dx-btn-primary" style="justify-content:center">Créer le colis</button>
    </form>`),
};

/* ── block-level markdown → HTML ─────────────────────────────────── */
function renderMarkdown(md, opts = {}) {
  const demos = opts.demos || null;
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const headings = [];
  let html = "";
  let i = 0;

  const isTableSep = (l) => /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/.test(l) && l.includes("-");
  const splitRow = (l) => {
    let t = l.trim();
    if (t.startsWith("|")) t = t.slice(1);
    if (t.endsWith("|")) t = t.slice(0, -1);
    return t.split("|").map((c) => c.trim());
  };

  while (i < lines.length) {
    const line = lines[i];

    // blank
    if (/^\s*$/.test(line)) { i++; continue; }

    // fenced code
    const fence = line.match(/^```(\w*)/);
    if (fence) {
      const lang = fence[1] || "";
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) { buf.push(lines[i]); i++; }
      i++; // closing fence
      html += `<pre class="code"${lang ? ` data-lang="${lang}"` : ""}><code>${esc(buf.join("\n"))}</code></pre>`;
      continue;
    }

    // heading
    const h = line.match(/^(#{1,6})\s+(.*?)\s*#*$/);
    if (h) {
      const level = h[1].length;
      const text = h[2];
      const slug = slugify(text);
      if (level <= 3) headings.push({ level, text, slug });
      html += `<h${level} id="${slug}" class="hd hd-${level}">${renderInline(text)}<a class="anchor" href="#${slug}" aria-label="Link to section">#</a></h${level}>`;
      if (demos && demos[text]) html += demos[text];
      i++;
      continue;
    }

    // horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { html += '<hr />'; i++; continue; }

    // table
    if (line.includes("|") && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const header = splitRow(line);
      i += 2; // skip header + separator
      const rows = [];
      while (i < lines.length && lines[i].includes("|") && !/^\s*$/.test(lines[i])) {
        rows.push(splitRow(lines[i])); i++;
      }
      let t = '<div class="table-wrap"><table><thead><tr>';
      t += header.map((c) => `<th>${renderInline(c)}</th>`).join("");
      t += "</tr></thead><tbody>";
      for (const r of rows) {
        t += "<tr>" + header.map((_, idx) => `<td>${swatchify(renderInline(r[idx] ?? ""))}</td>`).join("") + "</tr>";
      }
      t += "</tbody></table></div>";
      html += t;
      continue;
    }

    // blockquote
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, "")); i++; }
      html += `<blockquote>${renderInline(buf.join(" "))}</blockquote>`;
      continue;
    }

    // list (ordered or unordered, with simple nesting by indent)
    if (/^(\s*)([-*+]|\d+\.)\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^(\s*)([-*+]|\d+\.)\s+/.test(lines[i])) {
        const m = lines[i].match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
        items.push({ indent: m[1].length, ordered: /\d+\./.test(m[2]), text: m[3] });
        i++;
      }
      html += buildList(items);
      continue;
    }

    // paragraph
    const buf = [];
    while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^(#{1,6})\s/.test(lines[i]) &&
           !/^```/.test(lines[i]) && !/^>\s?/.test(lines[i]) &&
           !/^(\s*)([-*+]|\d+\.)\s+/.test(lines[i]) &&
           !(lines[i].includes("|") && i + 1 < lines.length && isTableSep(lines[i + 1]))) {
      buf.push(lines[i]); i++;
    }
    html += `<p>${renderInline(buf.join(" "))}</p>`;
  }

  return { html, headings };
}

function buildList(items) {
  // nesting by indent steps; render recursively
  function render(start, indent) {
    const ordered = items[start].ordered;
    let out = ordered ? "<ol>" : "<ul>";
    let i = start;
    while (i < items.length && items[i].indent >= indent) {
      if (items[i].indent > indent) { i = i; break; } // handled below
      let li = `<li>${renderInline(items[i].text)}`;
      // children
      if (i + 1 < items.length && items[i + 1].indent > indent) {
        const [childHtml, next] = (function child() {
          const childStart = i + 1;
          const childIndent = items[childStart].indent;
          let j = childStart;
          while (j < items.length && items[j].indent >= childIndent) j++;
          return [render(childStart, childIndent), j];
        })();
        li += childHtml;
        i = next - 1;
      }
      li += "</li>";
      out += li;
      i++;
    }
    out += ordered ? "</ol>" : "</ul>";
    return out;
  }
  return render(0, items[0].indent);
}

/* ── build sections ──────────────────────────────────────────────── */
const built = SECTIONS.map((s) => {
  const md = readFileSync(join(DOCS, s.file), "utf8");
  const { html, headings } = renderMarkdown(md, { demos: s.key === "components" ? DEMOS : null });
  // sub-nav: level-2 headings (token categories / component names)
  const sub = headings
    .filter((h) => h.level === 2)
    .map((h) => ({ text: h.text.replace(/^\d+\.\s*/, ""), slug: h.slug }));
  return { ...s, html, sub, h2count: sub.length };
});

const totals = {
  components: built.find((b) => b.key === "components")?.h2count ?? 0,
  tokenCats: 9,
  patterns: built.find((b) => b.key === "patterns")?.h2count ?? 0,
};

/* ── nav markup ──────────────────────────────────────────────────── */
const nav = built.map((b) => {
  const subItems = b.sub.map(
    (x) => `<a class="nav-sub" data-doc="${b.key}" href="#${x.slug}">${esc(x.text)}</a>`
  ).join("");
  return `<div class="nav-group" data-group="${b.key}">
    <button class="nav-head" data-doc="${b.key}" aria-expanded="false">
      <span>${b.label}</span>
      ${b.sub.length ? '<span class="nav-caret" aria-hidden="true">›</span>' : ""}
    </button>
    ${b.sub.length ? `<div class="nav-children">${subItems}</div>` : ""}
  </div>`;
}).join("\n");

/* ── doc sections markup ─────────────────────────────────────────── */
const docs = built.map(
  (b) => `<section class="doc" id="doc-${b.key}" data-doc="${b.key}"${b.key === "overview" ? "" : ' hidden'}>${b.html}</section>`
).join("\n");

const ramp = BRAND_RAMP.map(
  ([stop, hex]) => `<div class="ramp-cell"><span class="ramp-chip" style="background:${hex}"></span><span class="ramp-stop">${stop}</span><span class="ramp-hex">${hex}</span></div>`
).join("");

const hero = `<header class="hero" id="hero">
  <p class="eyebrow">Design System · v1.2</p>
  <h1 class="hero-title">Vitamin-Z</h1>
  <p class="hero-sub">The single source of truth for every color, component, and layout in the Vitamin-Z delivery platform. Built on semantic tokens, rendered straight from the docs the MCP server serves, enforced in CI.</p>
  <div class="ramp" aria-label="Brand green ramp, 50 to 900">${ramp}</div>
  <div class="stats">
    <div class="stat"><span class="stat-num">${totals.components}</span><span class="stat-label">Components</span></div>
    <div class="stat"><span class="stat-num">${totals.tokenCats}</span><span class="stat-label">Token categories</span></div>
    <div class="stat"><span class="stat-num">${totals.patterns}</span><span class="stat-label">Layout patterns</span></div>
    <div class="stat"><span class="stat-num">0</span><span class="stat-label">Raw colors allowed</span></div>
  </div>
</header>`;

/* ── CSS (Vitamin-Z identity, light + dark) ─────────────────────────── */
const CSS = `
:root{
  --ground:#f8fafc; --panel:#ffffff; --panel-2:#f1f5f9; --sunken:#f8fafc;
  --text:#0f172a; --text-2:#475569; --text-3:#94a3b8;
  --border:#e2e8f0; --border-2:#eef2f6;
  --accent:#004030; --accent-2:#156a52; --accent-soft:rgba(0,64,48,.08); --accent-line:rgba(0,64,48,.16);
  --code-bg:#0f172a; --code-text:#e7edf3; --code-kw:#72b8a3;
  --shadow:0 1px 3px rgba(15,23,42,.08),0 1px 2px rgba(15,23,42,.04);
  --shadow-lg:0 10px 30px -12px rgba(15,23,42,.25);
  --font:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;
  --mono:"SF Mono","JetBrains Mono","Fira Code",ui-monospace,Menlo,Consolas,monospace;
}
[data-theme="dark"]{
  --ground:#020617; --panel:#0f172a; --panel-2:#1e293b; --sunken:#0b1220;
  --text:#e2e8f0; --text-2:#94a3b8; --text-3:#64748b;
  --border:#1e293b; --border-2:#172033;
  --accent:#5fb89f; --accent-2:#72b8a3; --accent-soft:rgba(95,184,159,.12); --accent-line:rgba(95,184,159,.22);
  --code-bg:#020617; --code-text:#e7edf3; --code-kw:#72b8a3;
  --shadow:0 1px 3px rgba(0,0,0,.5); --shadow-lg:0 14px 40px -12px rgba(0,0,0,.7);
}
*{box-sizing:border-box}
*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
body{margin:0;font-family:var(--font);font-size:14px;line-height:1.65;color:var(--text);background:var(--ground);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
a{color:var(--accent-2);text-decoration:none}
a:hover{text-decoration:underline}

/* topbar */
.topbar{position:sticky;top:0;z-index:50;display:flex;align-items:center;gap:16px;height:60px;padding:0 22px;background:color-mix(in srgb,var(--panel) 88%,transparent);backdrop-filter:saturate(140%) blur(10px);border-bottom:1px solid var(--border)}
.brand{display:flex;align-items:center;gap:10px;font-weight:700;letter-spacing:-.02em;color:var(--text)}
.brand-mark{width:30px;height:30px;border-radius:8px;background:var(--accent);color:#fff;display:grid;place-items:center;font-weight:800;font-family:var(--mono);font-size:15px;box-shadow:var(--shadow)}
.brand-name{font-size:15px}
.brand-ver{font-size:11px;font-weight:600;color:var(--accent-2);background:var(--accent-soft);border:1px solid var(--accent-line);padding:2px 7px;border-radius:999px}
.spacer{flex:1}
.search{position:relative}
.search input{width:230px;height:36px;padding:0 12px 0 34px;border-radius:8px;border:1px solid var(--border);background:var(--sunken);color:var(--text);font-family:var(--font);font-size:13px;outline:none;transition:border-color .15s,box-shadow .15s}
.search input:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.search svg{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--text-3)}
.icon-btn{width:36px;height:36px;display:grid;place-items:center;border-radius:8px;border:1px solid var(--border);background:var(--sunken);color:var(--text-2);cursor:pointer;transition:color .15s,border-color .15s}
.icon-btn:hover{color:var(--text);border-color:var(--text-3)}

/* shell */
.shell{display:grid;grid-template-columns:280px 1fr;align-items:start}
.sidebar{position:sticky;top:60px;height:calc(100vh - 60px);overflow-y:auto;padding:18px 12px 60px;border-right:1px solid var(--border);background:var(--panel)}
.sidebar::-webkit-scrollbar{width:8px}
.sidebar::-webkit-scrollbar-thumb{background:var(--border);border-radius:999px}
.nav-group{margin-bottom:2px}
.nav-head{width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 12px;border:0;background:transparent;color:var(--text);font-family:var(--font);font-size:13.5px;font-weight:600;letter-spacing:-.01em;border-radius:8px;cursor:pointer;text-align:left}
.nav-head:hover{background:var(--accent-soft)}
.nav-head.active{color:var(--accent-2)}
.nav-caret{color:var(--text-3);transition:transform .18s ease;font-size:15px;line-height:1}
.nav-group.open .nav-caret{transform:rotate(90deg)}
.nav-children{display:none;margin:2px 0 6px;padding-left:10px;border-left:1px solid var(--border);margin-left:14px}
.nav-group.open .nav-children{display:block}
.nav-sub{display:block;padding:5px 12px;color:var(--text-2);font-size:13px;border-radius:7px;line-height:1.4}
.nav-sub:hover{color:var(--text);background:var(--accent-soft);text-decoration:none}
.nav-sub.current{color:var(--accent-2);font-weight:600;background:var(--accent-soft)}

/* main */
.main{min-width:0;padding:0 0 120px}
.content{max-width:860px;margin:0 auto;padding:34px 40px}

/* hero */
.hero{max-width:860px;margin:0 auto;padding:64px 40px 30px}
.eyebrow{margin:0 0 14px;font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--accent-2)}
.hero-title{margin:0;font-size:76px;line-height:.95;font-weight:800;letter-spacing:-.045em;color:var(--text)}
.hero-sub{margin:18px 0 30px;max-width:620px;font-size:16.5px;line-height:1.6;color:var(--text-2)}
.ramp{display:grid;grid-template-columns:repeat(10,1fr);gap:6px;margin:0 0 34px;border:1px solid var(--border);border-radius:12px;padding:14px;background:var(--panel);box-shadow:var(--shadow)}
.ramp-cell{display:flex;flex-direction:column;gap:6px;align-items:flex-start}
.ramp-chip{width:100%;aspect-ratio:1;border-radius:7px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.06)}
.ramp-stop{font-size:11px;font-weight:700;color:var(--text)}
.ramp-hex{font-family:var(--mono);font-size:9.5px;color:var(--text-3)}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.stat{border:1px solid var(--border);border-radius:12px;padding:18px 16px;background:var(--panel);box-shadow:var(--shadow)}
.stat-num{display:block;font-size:34px;font-weight:800;letter-spacing:-.03em;color:var(--accent);line-height:1}
.stat-label{display:block;margin-top:6px;font-size:12px;color:var(--text-2)}

/* rendered doc */
.doc{max-width:860px;margin:0 auto;padding:18px 40px 0}
.doc .hd{scroll-margin-top:80px;position:relative;color:var(--text);letter-spacing:-.02em}
.doc .hd-1{font-size:13px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--accent-2);margin:0 0 26px;padding-bottom:0;border:0}
.doc .hd-2{font-size:27px;font-weight:750;margin:52px 0 16px;padding-top:22px;border-top:1px solid var(--border)}
.doc .hd-3{font-size:18px;font-weight:700;margin:30px 0 10px;color:var(--text)}
.doc h4{font-size:15px;font-weight:700;margin:22px 0 8px}
.anchor{margin-left:10px;color:var(--text-3);opacity:0;font-weight:400;text-decoration:none;transition:opacity .15s}
.hd:hover .anchor{opacity:1}
.doc p{color:var(--text-2);margin:12px 0}
.doc strong{color:var(--text);font-weight:650}
.doc ul,.doc ol{color:var(--text-2);margin:12px 0;padding-left:22px}
.doc li{margin:5px 0}
.doc li::marker{color:var(--text-3)}
.doc a{border-bottom:1px solid var(--accent-line)}
.doc hr{border:0;border-top:1px solid var(--border);margin:34px 0}
.doc blockquote{margin:16px 0;padding:12px 18px;border-left:3px solid var(--accent);background:var(--accent-soft);border-radius:0 8px 8px 0;color:var(--text)}
.doc blockquote p{margin:0;color:var(--text)}

/* inline code */
.doc code{font-family:var(--mono);font-size:12.5px;background:var(--accent-soft);color:var(--accent-2);padding:2px 6px;border-radius:5px;border:1px solid var(--accent-line);white-space:nowrap}
[data-theme="dark"] .doc code{color:var(--accent-2)}

/* code blocks */
.code{position:relative;background:var(--code-bg);border:1px solid var(--border);border-radius:12px;padding:18px 20px;overflow-x:auto;margin:16px 0;box-shadow:var(--shadow)}
.code code{display:block;font-family:var(--mono);font-size:12.5px;line-height:1.7;color:var(--code-text);background:none;border:0;padding:0;white-space:pre}
.code[data-lang]::before{content:attr(data-lang);position:absolute;top:0;right:0;font-family:var(--mono);font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--code-kw);background:rgba(255,255,255,.05);padding:4px 10px;border-radius:0 11px 0 11px}

/* tables */
.table-wrap{overflow-x:auto;margin:16px 0;border:1px solid var(--border);border-radius:12px;box-shadow:var(--shadow)}
table{border-collapse:collapse;width:100%;font-size:13px}
thead th{text-align:left;background:var(--panel-2);color:var(--text);font-weight:700;font-size:11.5px;letter-spacing:.04em;text-transform:uppercase;padding:11px 16px;border-bottom:1px solid var(--border);white-space:nowrap}
tbody td{padding:10px 16px;border-bottom:1px solid var(--border-2);color:var(--text-2);vertical-align:top}
tbody tr:last-child td{border-bottom:0}
tbody tr:hover td{background:var(--accent-soft)}
td code{white-space:normal}
.sw{display:inline-block;width:12px;height:12px;border-radius:3px;background:var(--c);box-shadow:inset 0 0 0 1px rgba(0,0,0,.18);vertical-align:-1px;margin-right:6px}

/* search empty */
.no-results{display:none;padding:10px 14px;color:var(--text-3);font-size:13px}

/* ── live component demos (fixed light DS surface, theme-independent) ── */
.demo{margin:18px 0 8px;border:1px solid var(--border);border-radius:12px;overflow:hidden;box-shadow:var(--shadow)}
.demo-bar{display:flex;align-items:center;gap:7px;padding:8px 14px;background:var(--panel-2);border-bottom:1px solid var(--border);font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text-3)}
.demo-dot{width:8px;height:8px;border-radius:999px;background:var(--accent)}
.demo-canvas{
  --p:#156a52;--ph:#004030;--b50:#ecf6f2;--b600:#004030;
  --tp:#0f172a;--ts:#475569;--tsub:#64748b;--tm:#94a3b8;
  --bd:#e2e8f0;--bsub:#f1f5f9;--sunk:#f8fafc;--bg2:#f1f5f9;
  --suc-fg:#16a34a;--suc-bg:#f0fdf4;--suc-bd:#bbf7d0;
  --err-fg:#dc2626;--err-bg:#fef2f2;--err-bd:#fecaca;
  --warn-fg:#ca8a04;--warn-bg:#fefce8;--warn-bd:#fef08a;
  --info-fg:#2563eb;--info-bg:#eff6ff;--info-bd:#bfdbfe;
  background:#fff;color:#0f172a;padding:30px 26px;display:flex;flex-wrap:wrap;gap:16px;align-items:center;
  font-family:var(--font);font-size:14px;line-height:1.5;
}
.demo-canvas.dx-col{flex-direction:column;align-items:stretch}
.dx-row{flex-wrap:wrap}
.dx-muted{color:var(--ts)}
.dx-row-sb{display:flex;align-items:center;justify-content:space-between;gap:12px}
.dx-btn{font-family:var(--font);font-size:13px;font-weight:600;height:36px;padding:0 15px;border-radius:6px;border:1px solid transparent;cursor:pointer;display:inline-flex;align-items:center;gap:6px}
.dx-btn-primary{background:var(--p);color:#fff}
.dx-btn-primary:hover{background:var(--ph)}
.dx-btn-secondary{background:var(--b50);color:var(--b600);border-color:var(--b600)}
.dx-btn-ghost{background:transparent;color:var(--ts)}
.dx-btn-ghost:hover{background:rgba(0,64,48,.06)}
.dx-btn-outline{background:#fff;color:var(--err-fg);border-color:var(--err-bd)}
.dx-btn[disabled]{background:var(--bsub);color:var(--tm);border-color:transparent;cursor:not-allowed}
.dx-badge{font-size:12px;font-weight:600;padding:2px 10px;border-radius:999px;border:1px solid transparent;display:inline-flex;line-height:1.5}
.dx-badge-success{background:var(--suc-bg);color:var(--suc-fg);border-color:var(--suc-bd)}
.dx-badge-warning{background:var(--warn-bg);color:var(--warn-fg);border-color:var(--warn-bd)}
.dx-badge-error{background:var(--err-bg);color:var(--err-fg);border-color:var(--err-bd)}
.dx-badge-info{background:var(--info-bg);color:var(--info-fg);border-color:var(--info-bd)}
.dx-badge-outline{background:#fff;color:var(--ts);border-color:var(--bd)}
.dx-card{width:286px;background:#fff;border:1px solid var(--bd);border-radius:8px;padding:18px;box-shadow:0 1px 3px rgba(15,23,42,.08)}
.dx-card-title{font-size:15px;font-weight:700;color:var(--tp);margin-bottom:12px}
.dx-card-body{display:flex;flex-direction:column;gap:9px;font-size:13px;color:var(--ts)}
.dx-card-body strong{color:var(--tp)}
.dx-field{display:flex;flex-direction:column;gap:6px;min-width:220px}
.dx-label{font-size:13px;font-weight:500;color:var(--ts)}
.dx-input{height:36px;padding:0 12px;border-radius:6px;border:1px solid var(--bd);background:#fff;color:var(--tp);font-family:var(--font);font-size:13px;outline:none}
.dx-input::placeholder{color:var(--tm)}
.dx-input-focus{border-color:var(--b600);box-shadow:0 0 0 3px rgba(0,64,48,.1)}
.dx-input-error{border-color:var(--err-fg)}
.dx-err{font-size:12px;color:var(--err-fg)}
.dx-select{position:relative;width:230px}
.dx-select-trigger{height:36px;padding:0 12px;border-radius:6px;border:1px solid var(--bd);background:#fff;color:var(--tp);font-size:13px;display:flex;align-items:center;justify-content:space-between}
.dx-chev{color:var(--tm)}
.dx-menu{background:#fff;border:1px solid var(--bd);border-radius:8px;padding:5px;box-shadow:0 4px 6px -1px rgba(15,23,42,.12);display:flex;flex-direction:column;gap:2px}
.dx-select .dx-menu{margin-top:6px;width:100%}
.dx-menu-item{padding:7px 10px;border-radius:6px;font-size:13px;color:var(--tp);display:flex;justify-content:space-between;cursor:default}
.dx-menu-item:hover{background:rgba(0,64,48,.06)}
.dx-menu-item-active{color:var(--b600);font-weight:600}
.dx-menu-item-danger{color:var(--err-fg)}
.dx-menu-sep{height:1px;background:var(--bsub);margin:4px 2px}
.dx-tabs-full{width:100%}
.dx-tabs{display:flex;gap:4px;border-bottom:1px solid var(--bd)}
.dx-tab{padding:10px 14px;font-size:13px;font-weight:500;color:var(--tsub);position:relative;cursor:pointer;display:flex;align-items:center;gap:7px}
.dx-tab-active{color:var(--b600)}
.dx-tab-active::after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:2px;background:var(--p)}
.dx-tab-badge{background:var(--err-bg);color:var(--err-fg);font-size:11px;font-weight:700;padding:1px 7px;border-radius:999px}
.dx-tab-panel{padding:16px 4px;font-size:13px;color:var(--ts)}
.dx-table{width:100%;border-collapse:collapse;font-size:13px;background:#fff;border:1px solid var(--bd);border-radius:8px;overflow:hidden}
.dx-table th{text-align:left;background:var(--sunk);color:var(--tsub);font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:9px 14px;border-bottom:1px solid var(--bd)}
.dx-table td{padding:10px 14px;border-bottom:1px solid var(--bsub);color:var(--tp)}
.dx-table tr:last-child td{border-bottom:0}
.dx-table tr:hover td{background:var(--sunk)}
.dx-dialog-stage{width:100%;background:var(--sunk);border-radius:10px;padding:26px;display:flex;justify-content:center;border:1px dashed var(--bd)}
.dx-dialog{width:340px;background:#fff;border:1px solid var(--bd);border-radius:12px;box-shadow:0 10px 15px -3px rgba(15,23,42,.18);padding:20px}
.dx-dialog-title{font-size:15px;font-weight:700;color:var(--tp)}
.dx-dialog-desc{font-size:13px;color:var(--ts);margin:6px 0 18px}
.dx-dialog-foot{display:flex;justify-content:flex-end;gap:8px}
.dx-avatar{width:38px;height:38px;border-radius:999px;background:var(--bg2);color:var(--ts);display:grid;place-items:center;font-size:13px;font-weight:600;border:1px solid var(--bd)}
.dx-avatar-green{background:var(--p);color:#fff;border-color:transparent}
.dx-avatar-group{display:flex}
.dx-avatar-group .dx-avatar{margin-left:-10px;box-shadow:0 0 0 2px #fff}
.dx-avatar-group .dx-avatar:first-child{margin-left:0}
.dx-alert{width:100%;font-size:13px;padding:11px 14px;border-radius:8px;border:1px solid transparent}
.dx-alert strong{font-weight:700}
.dx-alert-info{background:var(--info-bg);color:var(--info-fg);border-color:var(--info-bd)}
.dx-alert-success{background:var(--suc-bg);color:var(--suc-fg);border-color:var(--suc-bd)}
.dx-alert-warning{background:var(--warn-bg);color:var(--warn-fg);border-color:var(--warn-bd)}
.dx-alert-error{background:var(--err-bg);color:var(--err-fg);border-color:var(--err-bd)}
.dx-skel{height:14px;border-radius:6px;background:linear-gradient(90deg,var(--bsub) 25%,var(--bg2) 37%,var(--bsub) 63%);background-size:400% 100%;animation:dx-shimmer 1.4s ease infinite}
@keyframes dx-shimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}
@media (prefers-reduced-motion:reduce){.dx-skel{animation:none}}
.dx-sep-v{width:1px;height:20px;background:var(--bd)}
.dx-sep-h{height:1px;background:var(--bd);margin:10px 0}
.dx-tip-wrap{position:relative;padding-top:44px}
.dx-tip{position:absolute;top:0;left:50%;transform:translateX(-50%);background:#0f172a;color:#fff;font-size:12px;padding:6px 10px;border-radius:6px;white-space:nowrap}
.dx-tip-arrow{position:absolute;top:100%;left:50%;transform:translateX(-50%);border:5px solid transparent;border-top-color:#0f172a}
.dx-bc{display:flex;align-items:center;gap:8px;font-size:13px}
.dx-bc a{color:var(--ts);border:0}
.dx-bc-sep{color:var(--tm)}
.dx-bc-cur{color:var(--tp);font-weight:600}
.dx-check{display:flex;align-items:center;gap:9px;font-size:13px;color:var(--tp)}
.dx-box{width:18px;height:18px;border-radius:5px;border:1px solid var(--bd);display:grid;place-items:center;color:#fff;font-size:12px;background:#fff;flex:none}
.dx-box-on{background:var(--p);border-color:var(--p)}
.dx-sw-row{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--tp)}
.dx-switch{width:38px;height:22px;border-radius:999px;background:var(--bd);position:relative;transition:background .15s;flex:none}
.dx-switch-on{background:var(--p)}
.dx-knob{position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:999px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.2);transition:left .15s}
.dx-switch-on .dx-knob{left:18px}
.dx-prog{width:100%;height:8px;border-radius:999px;background:var(--bg2);overflow:hidden}
.dx-prog-fill{height:100%;background:var(--p);border-radius:999px}
.dx-acc{border:1px solid var(--bd);border-radius:8px;overflow:hidden;background:#fff}
.dx-acc-item{border-bottom:1px solid var(--bsub)}
.dx-acc-item:last-child{border-bottom:0}
.dx-acc-head{padding:12px 14px;font-size:13px;font-weight:600;color:var(--tp);display:flex;justify-content:space-between;cursor:pointer}
.dx-acc-head span{color:var(--tm)}
.dx-acc-open{color:var(--b600)}
.dx-acc-body{padding:0 14px 14px;font-size:13px;color:var(--ts)}
.dx-form{display:flex;flex-direction:column;gap:14px;width:300px}

@media (max-width:880px){
  .shell{grid-template-columns:1fr}
  .sidebar{position:fixed;left:0;top:60px;width:280px;transform:translateX(-100%);transition:transform .22s ease;z-index:40;box-shadow:var(--shadow-lg)}
  .sidebar.open{transform:translateX(0)}
  .menu-btn{display:grid !important}
  .hero-title{font-size:54px}
  .ramp{grid-template-columns:repeat(5,1fr)}
  .stats{grid-template-columns:repeat(2,1fr)}
  .content,.doc,.hero{padding-left:22px;padding-right:22px}
}
.menu-btn{display:none}
`;

/* ── client JS (nav switching, theme, search, scrollspy) ─────────── */
const JS = `
(function(){
  var groups=[].slice.call(document.querySelectorAll('.nav-group'));
  var heads=[].slice.call(document.querySelectorAll('.nav-head'));
  var subs=[].slice.call(document.querySelectorAll('.nav-sub'));
  var docs=[].slice.call(document.querySelectorAll('.doc'));
  var hero=document.getElementById('hero');
  var main=document.querySelector('.main');

  function showDoc(key, scrollSlug){
    docs.forEach(function(d){ d.hidden = d.getAttribute('data-doc')!==key; });
    hero.style.display = key==='overview' ? '' : 'none';
    groups.forEach(function(g){
      var on=g.getAttribute('data-group')===key;
      g.classList.toggle('open',on);
      var head=g.querySelector('.nav-head');
      head.classList.toggle('active',on);
      head.setAttribute('aria-expanded',on?'true':'false');
    });
    if(scrollSlug){
      var el=document.getElementById(scrollSlug);
      if(el){ requestAnimationFrame(function(){ el.scrollIntoView({behavior:'smooth',block:'start'}); }); }
    } else {
      (key==='overview'?hero:document.getElementById('doc-'+key)).scrollIntoView({block:'start'});
      window.scrollTo({top:0});
    }
    if(window.innerWidth<=880){ document.querySelector('.sidebar').classList.remove('open'); }
  }

  heads.forEach(function(h){
    h.addEventListener('click',function(){ showDoc(h.getAttribute('data-doc')); });
  });
  subs.forEach(function(s){
    s.addEventListener('click',function(e){
      e.preventDefault();
      showDoc(s.getAttribute('data-doc'), s.getAttribute('href').slice(1));
    });
  });

  // scrollspy: highlight current sub-item
  var spy=new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting){
        var id=en.target.id;
        subs.forEach(function(s){ s.classList.toggle('current', s.getAttribute('href')==='#'+id); });
      }
    });
  },{rootMargin:'-70px 0px -75% 0px'});
  document.querySelectorAll('.doc .hd-2').forEach(function(h){ spy.observe(h); });

  // theme toggle
  var root=document.documentElement;
  var saved=null; try{ saved=localStorage.getItem('vitamin-z-docs-theme'); }catch(e){}
  if(saved) root.setAttribute('data-theme',saved);
  var tbtn=document.getElementById('theme-btn');
  function syncIcon(){ tbtn.textContent = root.getAttribute('data-theme')==='dark' ? '☀' : '☾'; }
  syncIcon();
  tbtn.addEventListener('click',function(){
    var next = root.getAttribute('data-theme')==='dark' ? 'light' : 'dark';
    root.setAttribute('data-theme',next);
    try{ localStorage.setItem('vitamin-z-docs-theme',next); }catch(e){}
    syncIcon();
  });

  // search filter over nav
  var box=document.getElementById('search-input');
  box.addEventListener('input',function(){
    var q=box.value.trim().toLowerCase();
    groups.forEach(function(g){
      var groupSubs=[].slice.call(g.querySelectorAll('.nav-sub'));
      var headText=g.querySelector('.nav-head span').textContent.toLowerCase();
      var anyMatch=false;
      groupSubs.forEach(function(s){
        var hit=!q || s.textContent.toLowerCase().indexOf(q)>-1 || headText.indexOf(q)>-1;
        s.style.display=hit?'':'none';
        if(hit) anyMatch=true;
      });
      var groupHit = !q || headText.indexOf(q)>-1 || anyMatch;
      g.style.display=groupHit?'':'none';
      if(q && anyMatch) g.classList.add('open');
    });
  });
  box.addEventListener('keydown',function(e){
    if(e.key==='Enter'){
      var first=null;
      for(var i=0;i<subs.length;i++){ if(subs[i].style.display!=='none' && subs[i].offsetParent){ first=subs[i]; break; } }
      if(first){ showDoc(first.getAttribute('data-doc'), first.getAttribute('href').slice(1)); }
    }
  });

  // mobile menu
  var menu=document.getElementById('menu-btn');
  if(menu) menu.addEventListener('click',function(){ document.querySelector('.sidebar').classList.toggle('open'); });
})();
`;

/* ── search icon (inline svg) ────────────────────────────────────── */
const SEARCH_SVG = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>';

const BODY = `
<title>Vitamin-Z Design System v1.2 — Documentation</title>
<style>${CSS}</style>

<div class="topbar">
  <button class="icon-btn menu-btn" id="menu-btn" aria-label="Toggle navigation">≡</button>
  <a class="brand" href="#" onclick="return false">
    <span class="brand-mark">C</span>
    <span class="brand-name">Vitamin-Z</span>
    <span class="brand-ver">DS v1.2</span>
  </a>
  <div class="spacer"></div>
  <div class="search">${SEARCH_SVG}<input id="search-input" type="search" placeholder="Search components, tokens…" aria-label="Search documentation" /></div>
  <button class="icon-btn" id="theme-btn" aria-label="Toggle light or dark theme">☾</button>
</div>

<div class="shell">
  <aside class="sidebar" aria-label="Documentation navigation">
    ${nav}
  </aside>
  <div class="main">
    ${hero}
    ${docs}
  </div>
</div>

<script>${JS}</script>
`;

const FULL = `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Vitamin-Z Design System v1.2 — Documentation</title>
</head>
<body>
${BODY}
</body>
</html>`;

writeFileSync(join(__dirname, "index.html"), FULL, "utf8");
writeFileSync(join(__dirname, "artifact.html"), BODY.trimStart(), "utf8");

console.log("✓ Built docs site");
console.log("  sections : " + built.map((b) => b.label + "(" + b.h2count + ")").join(", "));
console.log("  components: " + totals.components + " · patterns: " + totals.patterns);
console.log("  → index.html (standalone) + artifact.html (publishable)");
