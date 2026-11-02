// Shared validation for mcquilter JSON files. No dependencies.
// Keep BLOCK_IDS in sync with lib/quilts.ts BLOCKS (add a block in both places).
export const BLOCK_IDS = [
  "four-patch", "nine-patch", "rail-fence", "pinwheel", "half-square",
  "quarter-square", "friendship-star", "ohio-star", "sawtooth-star",
  "churn-dash", "flying-geese", "log-cabin", "courthouse-steps",
  "snail-trail", "drunkards-path", "double-wedding-ring", "bow-tie",
  "basket", "tumbling-blocks", "lone-star", "dresden-plate",
  "grandmothers-flower", "cathedral-window", "storm-at-sea", "bargello",
  "crazy-quilt",
];
export const PATTERNS = ["solid", "dots", "stripes", "gingham", "checker", "stars", "crosshatch"];
export const LAYOUTS = ["straight", "alternating", "sashing", "brick"];
export const ROTATIONS = ["none", "checker", "random", "pinwheel"];
const isSlug = (s) => typeof s === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);
const isHex = (s) => typeof s === "string" && /^#[0-9a-fA-F]{6}$/.test(s);

export function validateDoc(doc, filename = "") {
  const errs = [];
  if (!doc || typeof doc !== "object") return ["not a JSON object"];
  if (filename) {
    const base = filename.split("/").pop().replace(/\.full\.json$/, "").replace(/\.json$/, "");
    if (doc.id && doc.id !== base) errs.push(`id "${doc.id}" does not match file name "${base}.json" (or "${base}.full.json" for full files)`);
  }
  if (!isSlug(doc.id)) errs.push('id must be a slug (lowercase letters, digits, hyphens)');
  if (typeof doc.name !== "string" || !doc.name.trim()) errs.push("name must be a non-empty string");
  if (doc.license !== undefined && typeof doc.license !== "string") errs.push("license must be a string");
  const checkSlots = (slots) => {
    if (!Array.isArray(slots) || slots.length < 1 || slots.length > 8) { errs.push("palette slots must be an array of 1-8 entries"); return; }
    slots.forEach((s, i) => {
      if (!isHex(s?.color)) errs.push(`palette slot ${i}: color must be #rrggbb`);
      if (!PATTERNS.includes(s?.pattern)) errs.push(`palette slot ${i}: pattern must be one of ${PATTERNS.join(", ")}`);
    });
  };
  if (doc.schema === "mcquilter.palette.v1") {
    checkSlots(doc.slots);
  } else if (doc.schema === "mcquilter.quilt.v1") {
    if (!BLOCK_IDS.includes(doc.block)) errs.push(`block "${doc.block}" is not a known block`);
    if (!Number.isInteger(doc.rows) || doc.rows < 1 || doc.rows > 20) errs.push("rows must be an integer 1-20");
    if (!Number.isInteger(doc.cols) || doc.cols < 1 || doc.cols > 20) errs.push("cols must be an integer 1-20");
    if (!LAYOUTS.includes(doc.layout)) errs.push(`layout must be one of ${LAYOUTS.join(", ")}`);
    if (!ROTATIONS.includes(doc.rotationMode)) errs.push(`rotationMode must be one of ${ROTATIONS.join(", ")}`);
    checkSlots(doc.palette);
    if (doc.overrides !== undefined) {
      if (typeof doc.overrides !== "object" || Array.isArray(doc.overrides)) errs.push("overrides must be an object");
      else for (const [k, v] of Object.entries(doc.overrides)) {
        if (!/^\d+,\d+,\d+$/.test(k)) errs.push(`override key "${k}" must be "row,col,pieceIndex"`);
        if (!Number.isInteger(v) || v < 0 || v >= (doc.palette?.length || 0)) errs.push(`override "${k}" slot out of palette range`);
      }
    }
  } else if (doc.schema === "mcquilter.quilt-full.v1") {
    // Shareable, self-contained quilt: full SVG geometry + pattern links.
    if (!BLOCK_IDS.includes(doc.block)) errs.push(`block "${doc.block}" is not a known block`);
    if (!Number.isInteger(doc.rows) || doc.rows < 1 || doc.rows > 20) errs.push("rows must be an integer 1-20");
    if (!Number.isInteger(doc.cols) || doc.cols < 1 || doc.cols > 20) errs.push("cols must be an integer 1-20");
    if (!LAYOUTS.includes(doc.layout)) errs.push(`layout must be one of ${LAYOUTS.join(", ")}`);
    checkSlots(doc.palette);
    if (typeof doc.svg !== "string" || !doc.svg.trim().startsWith("<svg")) errs.push("svg must be a standalone SVG string starting with <svg");
    if (!Array.isArray(doc.patterns)) errs.push("patterns must be an array");
    else {
      const ids = new Set();
      for (const p of doc.patterns) {
        if (typeof p?.id !== "string" || !p.id) errs.push("each pattern needs an id");
        else ids.add(p.id);
        if (!["svg", "png"].includes(p?.format)) errs.push(`pattern ${p?.id}: format must be "svg" (preferred) or "png"`);
        if (typeof p?.href !== "string" || !p.href) errs.push(`pattern ${p?.id}: href must be a link to the pattern file`);
        else if (p.format === "svg" && !p.href.toLowerCase().endsWith(".svg") && !p.href.includes(".svg")) errs.push(`pattern ${p?.id}: svg format but href does not end in .svg`);
        else if (p.format === "png" && !p.href.toLowerCase().endsWith(".png")) errs.push(`pattern ${p?.id}: png format but href does not end in .png`);
      }
      doc._patternIds = ids;
    }
    if (!Array.isArray(doc.blocks) || !doc.blocks.length) errs.push("blocks must be a non-empty array");
    else {
      let counted = 0;
      for (const b of doc.blocks) {
        if (!Number.isInteger(b?.row) || !Number.isInteger(b?.col)) errs.push("each block needs integer row/col");
        if (!Array.isArray(b?.pieces) || !b.pieces.length) { errs.push(`block ${b?.row},${b?.col}: pieces must be a non-empty array`); continue; }
        counted += b.pieces.length;
        for (const pc of b.pieces) {
          if (!Array.isArray(pc?.points) || pc.points.length < 3) errs.push(`block ${b?.row},${b?.col} piece ${pc?.index}: points must be >=3 [x,y] pairs`);
          if (typeof pc?.path !== "string" || !pc.path.startsWith("M")) errs.push(`block ${b?.row},${b?.col} piece ${pc?.index}: path must be an SVG path starting with M`);
          if (typeof pc?.fill !== "string" || !pc.fill) errs.push(`block ${b?.row},${b?.col} piece ${pc?.index}: fill is required`);
          if (!Number.isInteger(pc?.slot) || pc.slot < 0 || pc.slot >= (doc.palette?.length || 0)) errs.push(`block ${b?.row},${b?.col} piece ${pc?.index}: slot out of palette range`);
          if (pc?.patternId && doc._patternIds && !doc._patternIds.has(pc.patternId)) errs.push(`block ${b?.row},${b?.col} piece ${pc?.index}: patternId "${pc.patternId}" is not in patterns[]`);
        }
      }
      if (Number.isInteger(doc.pieceCount) && doc.pieceCount !== counted) errs.push(`pieceCount ${doc.pieceCount} does not match blocks (${counted} pieces)`);
      if (Number.isInteger(doc.blockCount) && doc.blockCount !== doc.blocks.length) errs.push(`blockCount ${doc.blockCount} does not match blocks (${doc.blocks.length})`);
    }
    if (doc.source !== undefined) {
      const srcErrs = validateDoc(doc.source);
      for (const e of srcErrs) errs.push(`source: ${e}`);
    }
  } else {
    errs.push(`schema must be mcquilter.palette.v1, mcquilter.quilt.v1, or mcquilter.quilt-full.v1, got ${JSON.stringify(doc.schema)}`);
  }
  return errs;
}
export function subdirFor(doc) {
  return doc.schema === "mcquilter.palette.v1" ? "palettes" : "quilts";
}
export function fileNameFor(doc) {
  return doc.schema === "mcquilter.quilt-full.v1" ? `${doc.id}.full.json` : `${doc.id}.json`;
}
