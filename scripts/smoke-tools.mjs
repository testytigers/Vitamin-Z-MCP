#!/usr/bin/env node
/**
 * smoke-tools.mjs — exercises every MCP tool over real stdio.
 *
 * Catches the class of bug where a tool compiles fine but returns nothing
 * useful: a lookup category pointing at a renamed heading, a doc section
 * clipped out of its own response, a scaffold that emits invalid TSX.
 *
 * Exit 1 on any failure. Run: npm run smoke
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const project = fs.mkdtempSync(path.join(os.tmpdir(), "ds-smoke-"));
fs.mkdirSync(path.join(project, "src/app"), { recursive: true });

let failures = 0;
const check = (name, cond, detail = "") => {
  if (cond) console.log(`✓ ${name}`);
  else {
    failures++;
    console.error(`✗ ${name}${detail ? `\n  ${detail}` : ""}`);
  }
};

const transport = new StdioClientTransport({
  command: "node",
  args: ["dist/index.js"],
  env: { ...process.env, DS_PROJECT_DIR: project },
});
const client = new Client({ name: "smoke", version: "1.0.0" });
await client.connect(transport);

const call = async (name, args = {}) =>
  (await client.callTool({ name, arguments: args })).content[0].text;

// every tool is registered
const tools = (await client.listTools()).tools.map((t) => t.name);
const EXPECTED = [
  "build_page", "edit_page", "save_page", "list_pages", "validate_code",
  "get_component", "get_pattern", "get_tokens", "search_ds", "get_cheatsheet",
];
check(
  `all ${EXPECTED.length} tools registered`,
  EXPECTED.every((t) => tools.includes(t)),
  `missing: ${EXPECTED.filter((t) => !tools.includes(t)).join(", ")}`
);

// every get_tokens category returns a real section, not a "not found" message
for (const cat of ["colors", "chart", "typography", "spacing", "radius", "shadow", "z-index", "motion", "controls", "modes"]) {
  const out = await call("get_tokens", { category: cat });
  check(`get_tokens(${cat})`, out.startsWith("## ") && out.length > 120, out.slice(0, 100));
}

// the chart palette must survive clipping — this was a real bug
const chart = await call("get_tokens", { category: "chart" });
check("chart palette complete (cat-1..8 + seq-1..5)",
  chart.includes("chart-cat-1") && chart.includes("chart-cat-8") &&
  chart.includes("chart-seq-1") && chart.includes("chart-seq-5"));

// lookups resolve
check("get_component(Badge)", (await call("get_component", { name: "Badge" })).includes("variant"));
check("get_component(Toast)", (await call("get_component", { name: "Toast" })).toLowerCase().includes("toast"));
check("get_pattern(data table)", (await call("get_pattern", { name: "data table" })).includes("Table"));
check("search_ds(rounded corners → radius)",
  /radius/i.test(await call("search_ds", { query: "rounded corners", limit: 1 })));
check("get_cheatsheet mentions charts", (await call("get_cheatsheet")).includes("chart-cat-1"));

// validator: real tokens pass, invented tokens fail
check("validate_code accepts real tokens",
  (await call("validate_code", { code: '<div className="bg-elevated text-strong gap-stack-lg" />' })).startsWith("✓"));
// typo (1 edit) and invented-suffix (extends a real token) are different shapes
check("validate_code rejects a typo'd token",
  !(await call("validate_code", { code: '<div className="bg-elevatd" />' })).startsWith("✓"));
check("validate_code rejects an invented suffix",
  !(await call("validate_code", { code: '<div className="text-strongest" />' })).startsWith("✓"));
check("validate_code ignores core Tailwind utilities",
  (await call("validate_code", { code: '<div className="text-sm text-center flex p-4 border-t bg-cover" />' })).startsWith("✓"));
check("validate_code rejects raw tailwind",
  (await call("validate_code", { code: '<div className="bg-white" />' })).includes("bg-elevated"));
check("validate_code catches syntax errors",
  (await call("validate_code", { code: "export default function P(){ return <div>" })).includes("syntax"));

// build_page → save → edit round trip
const built = await call("build_page", { intent: "orders page with kpis and a table", save: true });
check("build_page saves", built.includes("SAVED"));
check("list_pages sees it", (await call("list_pages")).includes("orders"));
const edited = await call("edit_page", { page: "orders", instruction: "add a revenue chart" });
check("edit_page adds a section", edited.includes("added charts"));
const saved = fs.readFileSync(path.join(project, "src/app/(dashboard)/orders/page.tsx"), "utf8");
check("edited page uses chart tokens", /var\(--color-chart-cat-1\)/.test(saved));
check("edited page imports recharts", /from "recharts"/.test(saved));
check("edited page still validates",
  (await call("validate_code", { code: saved })).startsWith("✓"));

await client.close();
fs.rmSync(project, { recursive: true, force: true });

console.log("");
if (failures) {
  console.error(`${failures} smoke check(s) failed.`);
  process.exit(1);
}
console.log("All smoke checks passed.");
