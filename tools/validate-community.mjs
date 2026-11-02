#!/usr/bin/env node
// Validate every file in community/ (and, with --dir, any folder of mcquilter JSON).
// Usage: node tools/validate-community.mjs [--dir path]
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { validateDoc } from "./mcquilter-lib.mjs";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const argDir = process.argv.indexOf("--dir");
const dir = argDir >= 0 ? process.argv[argDir + 1] : join(root, "community");
let bad = 0, ok = 0;
for (const sub of ["palettes", "patterns", "quilts"]) {
  const d = join(dir, sub);
  if (!existsSync(d)) continue;
  for (const f of readdirSync(d).filter((x) => x.endsWith(".json")).sort()) {
    const path = join(d, f);
    let doc; try { doc = JSON.parse(readFileSync(path, "utf8")); } catch (e) { console.log(`FAIL ${sub}/${f}: not valid JSON (${e.message})`); bad++; continue; }
    const errs = validateDoc(doc, f);
    if (errs.length) { console.log(`FAIL ${sub}/${f}:`); for (const e of errs) console.log(`  - ${e}`); bad++; }
    else { console.log(`ok   ${sub}/${f}`); ok++; }
  }
}
console.log(`${ok} ok, ${bad} failed`);
process.exit(bad ? 1 : 0);
