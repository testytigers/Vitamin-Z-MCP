/**
 * project.ts — safe access to the target Next.js app for save_page /
 * edit_page / list_pages. Writes are confined to <project>/src.
 */
import fs from "node:fs";
import path from "node:path";
import { DOCS_DIR } from "./docIndex.js";
export function projectDir() {
    if (process.env.DS_PROJECT_DIR && fs.existsSync(process.env.DS_PROJECT_DIR)) {
        return path.resolve(process.env.DS_PROJECT_DIR);
    }
    // fallback: a 'coliix' (or any Next.js app) sitting next to the MCP folder
    const sibling = path.resolve(DOCS_DIR, "..", "coliix");
    if (fs.existsSync(sibling))
        return sibling;
    return null;
}
export const NO_PROJECT_MSG = "No project configured. Set the DS_PROJECT_DIR environment variable in your MCP client config to your Next.js app root (e.g. /Users/macbook/Downloads/ds-shadcn-v1.2/coliix), then restart the server.";
/** Resolve a relative file path inside the project, blocking traversal. */
export function safeResolve(rel) {
    const root = projectDir();
    if (!root)
        return { error: NO_PROJECT_MSG };
    const cleaned = rel.replace(/^\/+/, "");
    const abs = path.resolve(root, cleaned);
    const srcRoot = path.resolve(root, "src");
    if (!abs.startsWith(srcRoot + path.sep)) {
        return { error: `Refused: writes are confined to src/ inside the project (got '${rel}').` };
    }
    return { abs };
}
export function saveFile(rel, content) {
    const r = safeResolve(rel);
    if ("error" in r)
        return r;
    fs.mkdirSync(path.dirname(r.abs), { recursive: true });
    fs.writeFileSync(r.abs, content, "utf8");
    return { saved: r.abs };
}
export function readFileRel(rel) {
    const r = safeResolve(rel);
    if ("error" in r)
        return r;
    if (!fs.existsSync(r.abs))
        return { error: `File not found: ${rel}` };
    return { content: fs.readFileSync(r.abs, "utf8"), abs: r.abs };
}
export function listPages() {
    const root = projectDir();
    if (!root)
        return { error: NO_PROJECT_MSG };
    const appDir = path.join(root, "src", "app");
    if (!fs.existsSync(appDir))
        return [];
    const pages = [];
    const walk = (dir) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory() && entry.name !== "node_modules")
                walk(full);
            else if (entry.name === "page.tsx" || entry.name === "page.jsx") {
                const rel = path.relative(root, full).split(path.sep).join("/");
                const route = path
                    .relative(appDir, path.dirname(full))
                    .split(path.sep)
                    .filter((seg) => !/^\(.*\)$/.test(seg)) // drop route groups
                    .join("/") || "/";
                pages.push({ route, relPath: rel });
            }
        }
    };
    walk(appDir);
    return pages;
}
/** Find a page by spoken name: "orders", "the orders page", a route, or a path. */
export function findPage(name) {
    const pages = listPages();
    if ("error" in pages)
        return pages;
    if (pages.length === 0)
        return { error: "No pages exist yet — use build_page with save:true first." };
    const n = name.toLowerCase().replace(/\b(the|page|edit|update|on|to)\b/g, "").trim().replace(/\s+/g, "-");
    const exact = pages.find((p) => p.route === n || p.relPath === name);
    if (exact)
        return exact;
    const partial = pages.find((p) => p.route.includes(n) || n.includes(p.route));
    if (partial)
        return partial;
    return {
        error: `Page '${name}' not found. Existing pages: ${pages.map((p) => p.route).join(", ")}`,
    };
}
