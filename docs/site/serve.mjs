#!/usr/bin/env node
/**
 * serve.mjs — zero-dependency static server for the docs site.
 * Serves this folder so the docs open at a real http://localhost link.
 *
 * Run:  npm run docs:serve     (or: node docs/site/serve.mjs [port])
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, normalize, extname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.argv[2]) || 4321;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".svg": "image/svg+xml",
};

const server = createServer(async (req, res) => {
  let rel = decodeURIComponent((req.url || "/").split("?")[0]);
  // docs live at /doc — redirect bare root there
  if (rel === "/") {
    res.writeHead(302, { Location: "/doc" });
    res.end();
    return;
  }
  if (rel === "/doc" || rel === "/doc/") rel = "/index.html";
  // contain to this directory
  const path = normalize(join(__dirname, rel));
  if (!path.startsWith(__dirname)) {
    res.writeHead(403).end("Forbidden");
    return;
  }
  try {
    const body = await readFile(path);
    res.writeHead(200, { "Content-Type": TYPES[extname(path)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h1>404</h1><p>Not found. Did you run <code>npm run docs:build</code>?</p>");
  }
});

server.listen(PORT, () => {
  console.log(`Vitamin-Z DS docs → http://localhost:${PORT}/doc`);
});
