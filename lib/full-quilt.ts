// ---------------------------------------------------------------------------
// Shareable quilt.json: mcquilter.quilt-full.v1
//
// The parametric format (mcquilter.quilt.v1: block id + palette + overrides)
// is small and editable, but it only renders inside McQuilter — you need
// this repo's block library to know what "ohio-star" looks like.
//
// The full format is the opposite trade: it is self-contained and
// publishable. It describes the *entire* quilt explicitly:
//   - every block, every piece, as absolute SVG coordinates + an SVG path
//   - a standalone `svg` string that renders with no McQuilter code at all
//   - `patterns[]`: links to the pattern tiles used, SVG preferred, PNG
//     accepted, plus the repo path of each built-in tile
//   - `source`: the original parametric document, so a full file can be
//     round-tripped back into the simulator for editing
//
// Rule: never hand-write a full file. Generate it from a parametric
// document (the simulator does this), so geometry cannot drift from the
// block library. The validator checks the shape, not the artistry.
// ---------------------------------------------------------------------------
import { BLOCK_MAP, QuiltDoc, rotatePieces } from "./quilts";

// Site base path at build time (NEXT_PUBLIC_BASE_PATH), e.g.
// "/mcquilter.com" on GitHub project Pages, "" at a domain root.
// Pattern hrefs must carry it, or they 404 exactly like /_next/... did.
const SITE_BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";
export type FullPattern = {
  id: string;
  name: string;
  format: "svg" | "png";
  /** Site-relative link, e.g. "/patterns/dots.svg" at a root, or
   *  "/mcquilter.com/patterns/dots.svg" under a Pages subpath. */
  href: string;
  /** Path inside the mcquilter.com repo, e.g. "public/patterns/dots.svg". */
  repoPath?: string;
  /** True when this came from a user-supplied patternUrl, not a built-in. */
  custom?: boolean;
  /** Base colour this motif is overlaid on, for this quilt. */
  baseColor?: string;
};

export type FullPiece = {
  index: number;
  slot: number;
  /** Absolute coordinates in the quilt's viewBox. */
  points: [number, number][];
  /** SVG path for the same polygon, e.g. "M10,10 L110,10 L110,110 Z". */
  path: string;
  /** Fill used in the standalone svg: a colour, or url(#pattern-id). */
  fill: string;
  baseColor: string;
  patternId: string | null;
};

export type FullBlock = {
  row: number;
  col: number;
  rotation: number;
  plain: boolean;
  pieces: FullPiece[];
};

export type FullQuiltDoc = {
  schema: "mcquilter.quilt-full.v1";
  id: string;
  name: string;
  author?: string;
  license?: string;
  created?: string;
  block: string;
  rows: number;
  cols: number;
  layout: QuiltDoc["layout"];
  /** Finished size at 12" blocks, the usual quilting shorthand. */
  finishedSizeInches: { width: number; height: number };
  cell: number;
  viewBox: string;
  width: number;
  height: number;
  blockCount: number;
  pieceCount: number;
  palette: QuiltDoc["palette"];
  patterns: FullPattern[];
  blocks: FullBlock[];
  /** Standalone SVG: paste it into any HTML file or open it directly. */
  svg: string;
  /** The parametric document this was generated from (editable source). */
  source: QuiltDoc;
};

function hash2(r: number, c: number): number {
  let h = r * 374761393 + c * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) % 4;
}
function rotationFor(q: QuiltDoc, r: number, c: number): number {
  if (q.rotationMode === "checker") return ((r + c) % 2) * 90;
  if (q.rotationMode === "pinwheel") return (r % 2 === 0 ? (c % 2 === 0 ? 0 : 90) : (c % 2 === 0 ? 270 : 180));
  if (q.rotationMode === "random") return hash2(r, c) * 90;
  return 0;
}
function fmt(n: number): number { return Math.round(n * 100) / 100; }
function pathOf(points: [number, number][]): string {
  return "M" + points.map(([x, y]) => `${fmt(x)},${fmt(y)}`).join(" L") + " Z";
}
const PATTERN_NAMES: Record<string, string> = {
  dots: "Polka dots", stripes: "Diagonal stripes", gingham: "Gingham",
  checker: "Mini checker", stars: "Stars", crosshatch: "Crosshatch",
};
// SVG <pattern> defs, kept in sync with components/QuiltSvg.tsx.
// These are embedded in `svg` so the full file renders standalone even
// if a pattern link is dead; the links in `patterns[]` are the reusable tiles.
function patternDefSvg(id: string, color: string, pattern: string, patternUrl?: string): string {
  const w = "rgba(255,255,255,0.35)", b = "rgba(0,0,0,0.18)";
  let inner = `<rect width="20" height="20" fill="${color}"/>`;
  if (patternUrl) {
    inner += `<image href="${patternUrl}" width="20" height="20" preserveAspectRatio="none"/>`;
  } else if (pattern === "dots") inner += `<circle cx="5" cy="5" r="3" fill="${w}"/><circle cx="15" cy="15" r="3" fill="${w}"/>`;
  else if (pattern === "stripes") inner += `<line x1="0" y1="20" x2="20" y2="0" stroke="${w}" stroke-width="4"/><line x1="-5" y1="5" x2="5" y2="-5" stroke="${w}" stroke-width="4"/><line x1="15" y1="25" x2="25" y2="15" stroke="${w}" stroke-width="4"/>`;
  else if (pattern === "gingham") inner += `<rect width="10" height="20" fill="${w}"/><rect width="20" height="10" fill="${w}"/><rect width="10" height="10" fill="${b}"/>`;
  else if (pattern === "checker") inner += `<rect width="10" height="10" fill="${w}"/><rect x="10" y="10" width="10" height="10" fill="${w}"/>`;
  else if (pattern === "stars") inner += `<polygon points="5,1 6,4 9,5 6,6 5,9 4,6 1,5 4,4" fill="${w}"/><polygon points="15,11 16,14 19,15 16,16 15,19 14,16 11,15 14,14" fill="${w}"/>`;
  else if (pattern === "crosshatch") inner += `<line x1="0" y1="20" x2="20" y2="0" stroke="${w}" stroke-width="2"/><line x1="0" y1="0" x2="20" y2="20" stroke="${w}" stroke-width="2"/>`;
  return `<pattern id="${id}" width="20" height="20" patternUnits="userSpaceOnUse">${inner}</pattern>`;
}

export function buildFullQuilt(q: QuiltDoc): FullQuiltDoc {
  const block = BLOCK_MAP.get(q.block);
  if (!block) throw new Error(`Unknown block: ${q.block}`);
  // Mirror components/QuiltSvg.tsx exactly: cell 100, same sash/border math.
  const cell = 100;
  const sash = q.layout === "sashing" ? Math.max(6, cell * 0.12) : 0;
  const border = 10;
  const step = cell + sash;
  const W = q.cols * step + sash + border * 2;
  const H = q.rows * step + sash + border * 2;
  const borderColor = q.borderColor || "#111111";
  const sashingColor = q.sashingColor || "#ffffff";

  const patternBySlot = new Map<number, FullPattern>();
  const blocks: FullBlock[] = [];
  for (let r = 0; r < q.rows; r++) {
    for (let c = 0; c < q.cols; c++) {
      const plain = q.layout === "alternating" && (r + c) % 2 === 1;
      const brickOffset = q.layout === "brick" && r % 2 === 1 ? -cell / 2 : 0;
      const x0 = border + sash + c * step + brickOffset;
      const y0 = border + sash + r * step;
      if (plain) {
        const slot = 1;
        const slotDef = q.palette[slot % q.palette.length];
        blocks.push({ row: r, col: c, rotation: 0, plain: true, pieces: [{
          index: 0, slot, points: [[fmt(x0), fmt(y0)], [fmt(x0 + cell), fmt(y0)], [fmt(x0 + cell), fmt(y0 + cell)], [fmt(x0), fmt(y0 + cell)]],
          path: pathOf([[x0, y0], [x0 + cell, y0], [x0 + cell, y0 + cell], [x0, y0 + cell]]),
          fill: slotDef.pattern === "solid" && !slotDef.patternUrl ? slotDef.color : `url(#fab-${slot}-${slotDef.pattern})`,
          baseColor: slotDef.color, patternId: slotDef.pattern === "solid" && !slotDef.patternUrl ? null : `fab-${slot}-${slotDef.pattern}`,
        }] });
        continue;
      }
      const rotation = rotationFor(q, r, c);
      const pieces = rotatePieces(block.pieces, rotation);
      const fullPieces: FullPiece[] = pieces.map((p, i) => {
        const slot = q.overrides?.[`${r},${c},${i}`] ?? p.slot;
        const slotDef = q.palette[slot % q.palette.length];
        const pts: [number, number][] = p.points.map(([x, y]) => [fmt(x0 + x * cell), fmt(y0 + y * cell)]);
        const isSolid = slotDef.pattern === "solid" && !slotDef.patternUrl;
        const patternId = isSolid ? null : `fab-${slot}-${slotDef.pattern}`;
        if (patternId && !patternBySlot.has(slot)) {
          const custom = !!slotDef.patternUrl;
          const format: "svg" | "png" = slotDef.patternFormat
            || (slotDef.patternUrl?.toLowerCase().endsWith(".png") ? "png" : "svg");
          patternBySlot.set(slot, {
            id: patternId,
            name: custom ? `Custom pattern (slot ${slot})` : (PATTERN_NAMES[slotDef.pattern] || slotDef.pattern),
            format,
            href: custom ? slotDef.patternUrl! : `${SITE_BASE}/patterns/${slotDef.pattern}.svg`,
            repoPath: custom ? undefined : `public/patterns/${slotDef.pattern}.svg`,
            custom: custom || undefined,
            baseColor: slotDef.color,
          });
        }
        return { index: i, slot, points: pts, path: pathOf(pts), fill: isSolid ? slotDef.color : `url(#${patternId})`, baseColor: slotDef.color, patternId };
      });
      blocks.push({ row: r, col: c, rotation, plain: false, pieces: fullPieces });
    }
  }
  // Plain blocks may also use a pattern; include those slots too.
  for (const b of blocks) for (const p of b.pieces) {
    if (p.patternId && !patternBySlot.has(p.slot)) {
      const slotDef = q.palette[p.slot % q.palette.length];
      patternBySlot.set(p.slot, {
        id: p.patternId, name: PATTERN_NAMES[slotDef.pattern] || slotDef.pattern,
        format: slotDef.patternFormat || (slotDef.patternUrl?.toLowerCase().endsWith(".png") ? "png" : "svg"),
        href: slotDef.patternUrl || `${SITE_BASE}/patterns/${slotDef.pattern}.svg`,
        repoPath: slotDef.patternUrl ? undefined : `public/patterns/${slotDef.pattern}.svg`,
        custom: !!slotDef.patternUrl || undefined, baseColor: slotDef.color,
      });
    }
  }
  const patterns = [...patternBySlot.values()].sort((a, b) => a.id.localeCompare(b.id));
  const defs = q.palette.map((s, i) => {
    if (s.pattern === "solid" && !s.patternUrl) return "";
    return patternDefSvg(`fab-${i}-${s.pattern}`, s.color, s.pattern, s.patternUrl);
  }).filter(Boolean).join("");
  const polys = blocks.flatMap((b) => b.pieces.map((p) =>
    `<polygon points="${p.points.map(([x, y]) => `${x},${y}`).join(" ")}" fill="${p.fill}" stroke="rgba(0,0,0,0.18)" stroke-width="1"/>`)).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${q.name}"><defs>${defs}</defs><rect x="0" y="0" width="${W}" height="${H}" fill="${borderColor}"/><rect x="${border}" y="${border}" width="${W - border * 2}" height="${H - border * 2}" fill="${q.layout === "sashing" ? sashingColor : q.palette[1 % q.palette.length]?.color || "#fff"}"/>${polys}</svg>`;
  return {
    schema: "mcquilter.quilt-full.v1",
    id: q.id, name: q.name, author: q.author, license: q.license, created: q.created,
    block: q.block, rows: q.rows, cols: q.cols, layout: q.layout,
    finishedSizeInches: { width: q.cols * 12, height: q.rows * 12 },
    cell, viewBox: `0 0 ${W} ${H}`, width: W, height: H,
    blockCount: q.rows * q.cols,
    pieceCount: blocks.reduce((n, b) => n + b.pieces.length, 0),
    palette: q.palette, patterns, blocks, svg, source: q,
  };
}
