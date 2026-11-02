#!/usr/bin/env node
// mcquilter — manage $XDG_CONFIG/mcquilter and share designs via git.
// Node.js only, no dependencies. This tool never pushes or opens a PR;
// `share` only copies a validated file into a repo checkout and prints
// the git commands for you to run.
// Usage:
//   node tools/mcquilter.mjs init | list | validate
//   node tools/mcquilter.mjs import <file.json>
//   node tools/mcquilter.mjs export --id <id>
//   node tools/mcquilter.mjs share --id <id> --repo <path-to-checkout>
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { join, basename } from "node:path";
import { homedir } from "node:os";
import { validateDoc, subdirFor, fileNameFor } from "./mcquilter-lib.mjs";

export function configDir() {
  const xdg = process.env.XDG_CONFIG_HOME;
  return xdg ? join(xdg, "mcquilter") : join(homedir(), ".config", "mcquilter");
}
const DIR = configDir();
const SUBS = ["palettes", "patterns", "quilts"];
function ensure() { for (const s of SUBS) mkdirSync(join(DIR, s), { recursive: true }); }
function readAll() {
  const out = [];
  for (const sub of SUBS) {
    const d = join(DIR, sub);
    if (!existsSync(d)) continue;
    for (const f of readdirSync(d).filter((x) => x.endsWith(".json")).sort()) {
      try { out.push({ sub, file: f, path: join(d, f), doc: JSON.parse(readFileSync(join(d, f), "utf8")) }); }
      catch { out.push({ sub, file: f, path: join(d, f), doc: null }); }
    }
  }
  return out;
}
function findById(id) { return readAll().find((x) => x.doc?.id === id); }
function usage() {
  console.log(`mcquilter — your quilts live in ${DIR}\n\n  init                     create $XDG_CONFIG/mcquilter/{palettes,patterns,quilts}\n  list                     list saved palettes, patterns, quilts\n  validate                 validate everything in the folder\n  import <file.json>       validate + copy a downloaded design into the folder\n  export --id <id>          print a saved design to stdout\n  share --id <id> --repo <path>   copy a validated design into community/ of a repo checkout\n`);
}
const [cmd, ...rest] = process.argv.slice(2);
const opt = (name) => { const i = rest.indexOf(name); return i >= 0 ? rest[i + 1] : undefined; };

if (cmd === "init") {
  ensure();
  const cfg = join(DIR, "config.json");
  if (!existsSync(cfg)) writeFileSync(cfg, JSON.stringify({ schema: "mcquilter.config.v1", defaultPalette: null, notes: "Defaults for the McQuilter simulator; the site reads this only if you import it." }, null, 2) + "\n");
  console.log(`Created ${DIR}`);
} else if (cmd === "list") {
  ensure();
  for (const x of readAll()) console.log(`${x.sub.padEnd(9)} ${x.doc?.id ?? "?"}  ${x.doc?.name ?? "(unreadable)"}`);
  if (!readAll().length) console.log("(empty — design in the simulator, then import a download)");
} else if (cmd === "validate") {
  ensure(); let bad = 0;
  for (const x of readAll()) {
    if (!x.doc) { console.log(`FAIL ${x.sub}/${x.file}: not valid JSON`); bad++; continue; }
    const errs = validateDoc(x.doc, x.file);
    if (errs.length) { console.log(`FAIL ${x.sub}/${x.file}: ${errs.join("; ")}`); bad++; } else console.log(`ok   ${x.sub}/${x.file}`);
  }
  if (bad) process.exit(1);
} else if (cmd === "import") {
  const file = rest[0]; if (!file) { console.error("usage: mcquilter import <file.json>"); process.exit(2); }
  const doc = JSON.parse(readFileSync(file, "utf8"));
  const errs = validateDoc(doc, basename(file));
  if (errs.length) { console.error(`Refusing to import: ${errs.join("; ")}`); process.exit(1); }
  ensure(); const dest = join(DIR, subdirFor(doc), fileNameFor(doc));
  copyFileSync(file, dest); console.log(`Imported -> ${dest}`);
} else if (cmd === "export") {
  const id = opt("--id"); if (!id) { console.error("usage: mcquilter export --id <id>"); process.exit(2); }
  const found = findById(id);
  if (!found) { console.error(`No saved design with id "${id}" in ${DIR}`); process.exit(1); }
  process.stdout.write(readFileSync(found.path, "utf8"));
} else if (cmd === "share") {
  const id = opt("--id"), repo = opt("--repo");
  if (!id || !repo) { console.error("usage: mcquilter share --id <id> --repo <path>"); process.exit(2); }
  const found = findById(id);
  if (!found) { console.error(`No saved design with id "${id}" in ${DIR}`); process.exit(1); }
  const errs = validateDoc(found.doc, fileNameFor(found.doc));
  if (errs.length) { console.error(`Refusing to share: ${errs.join("; ")}`); process.exit(1); }
  const destDir = join(repo, "community", subdirFor(found.doc));
  mkdirSync(destDir, { recursive: true });
  const dest = join(destDir, fileNameFor(found.doc));
  copyFileSync(found.path, dest);
  console.log(`Copied -> ${dest}\n\nNext, in ${repo}:\n  git add community/${subdirFor(found.doc)}/${fileNameFor(found.doc)}\n  git commit -m "community: add ${found.doc.schema.includes("palette") ? "palette" : "quilt"} ${id}"\n  git push -u origin <your-branch>\n  gh pr create --title "community: add ${found.doc.schema.includes("palette") ? "palette" : "quilt"} ${id}"\n\nNothing has been pushed. Run those commands yourself when you are ready.`);
} else usage();
