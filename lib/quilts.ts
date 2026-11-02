// ---------------------------------------------------------------------------
// McQuilter block library.
//
// Design note: a "block" is a unit square (0..1, 0..1) described as a list of
// polygons, each filled with one colour *slot*. A palette maps slots to real
// colours + fabric patterns, so one block definition yields endless quilts.
// This is a *design* simulator: polygons show how a block looks sewn, they
// are not cutting diagrams (real cutting needs seam allowances, grain, and
// the piecing order for that block).
// ---------------------------------------------------------------------------

export type Pt = [number, number];
export type Poly = { points: Pt[]; slot: number };

export type BlockCategory =
  | "Traditional pieced"
  | "Stars"
  | "Log cabin family"
  | "Curves & circles"
  | "Motif & appliqué"
  | "Modern & special";

export type BlockDef = {
  id: string;
  name: string;
  category: BlockCategory;
  difficulty: "Beginner" | "Confident beginner" | "Intermediate" | "Advanced";
  origin: string;
  description: string;
  pieces: Poly[];
};

const R = (x0: number, y0: number, x1: number, y1: number, slot: number): Poly => ({
  points: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]],
  slot,
});
const T = (a: Pt, b: Pt, c: Pt, slot: number): Poly => ({ points: [a, b, c], slot });
const P = (points: Pt[], slot: number): Poly => ({ points, slot });

function arcPoints(cx: number, cy: number, r: number, a0: number, a1: number, n = 14): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return out;
}
// Quarter-circle piece inside a cell: the arc bulges toward one corner.
function quarterCircle(x: number, y: number, s: number, corner: "tl" | "tr" | "bl" | "br", slot: number): Poly {
  const cx = corner === "tl" || corner === "bl" ? x : x + s;
  const cy = corner === "tl" || corner === "tr" ? y : y + s;
  const a0 = corner === "tl" ? 0 : corner === "tr" ? Math.PI / 2 : corner === "br" ? Math.PI : -Math.PI / 2;
  const pts = arcPoints(cx, cy, s, a0, a0 + Math.PI / 2);
  return P([[cx, cy], ...pts], slot);
}
function starPoints(cx: number, cy: number, outer: number, inner: number, points = 8, rot = -Math.PI / 2): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = rot + (i * Math.PI) / points;
    out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return out;
}
function hexPoints(cx: number, cy: number, r: number, rot = 0): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < 6; i++) out.push([cx + r * Math.cos(rot + (i * Math.PI) / 3), cy + r * Math.sin(rot + (i * Math.PI) / 3)]);
  return out;
}
function diamond(cx: number, cy: number, rx: number, ry: number): Pt[] {
  return [[cx, cy - ry], [cx + rx, cy], [cx, cy + ry], [cx - rx, cy]];
}
// A square cell split diagonally; `coloured` is the half that gets `slot`.
function hst(x: number, y: number, s: number, coloured: "tl" | "tr" | "bl" | "br", slot: number, bg: number): Poly[] {
  const tl: Pt = [x, y], tr: Pt = [x + s, y], bl: Pt = [x, y + s], br: Pt = [x + s, y + s];
  // Diagonal TL-BR: halves are (tl,tr,br) vs (tl,br,bl). Diagonal TR-BL: (tl,tr,bl) vs (tr,br,bl).
  if (coloured === "br") return [T(tl, tr, br, bg), T(tl, br, bl, slot)];
  if (coloured === "tl") return [T(tl, tr, br, slot), T(tl, br, bl, bg)];
  if (coloured === "bl") return [T(tl, tr, bl, slot), T(tr, br, bl, bg)];
  return [T(tl, tr, bl, bg), T(tr, br, bl, slot)]; // tr
}
// Flying-geese unit in a w x h rectangle: point faces `dir`.
function goose(x: number, y: number, w: number, h: number, dir: "up" | "down" | "left" | "right", slot: number, bg: number): Poly[] {
  if (dir === "up") return [T([x, y + h], [x + w / 2, y], [x + w, y + h], slot), T([x, y], [x + w / 2, y], [x, y + h], bg), T([x + w / 2, y], [x + w, y], [x + w, y + h], bg)];
  if (dir === "down") return [T([x, y], [x + w / 2, y + h], [x + w, y], slot), T([x, y], [x + w / 2, y + h], [x, y + h], bg), T([x + w / 2, y + h], [x + w, y], [x + w, y + h], bg)];
  if (dir === "left") return [T([x + w, y], [x, y + h / 2], [x + w, y + h], slot), T([x, y], [x + w, y], [x, y + h / 2], bg), T([x, y], [x + w, y + h], [x, y + h / 2], bg)];
  return [T([x, y], [x + w, y + h / 2], [x, y + h], slot), T([x, y], [x + w, y], [x + w, y + h / 2], bg), T([x, y + h], [x + w, y + h], [x + w, y + h / 2], bg)];
}

const BG = 1; // conventional background slot for most blocks
const bgSquare = (): Poly[] => [R(0, 0, 1, 1, BG)];

function grid3(fn: (x: number, y: number, s: number, cx: number, cy: number) => Poly[]): Poly[] {
  const out: Poly[] = [R(0, 0, 1, 1, BG)];
  for (let cy = 0; cy < 3; cy++) for (let cx = 0; cx < 3; cx++) out.push(...fn(cx / 3, cy / 3, 1 / 3, cx, cy));
  return out;
}

export const BLOCKS: BlockDef[] = [
  { id: "four-patch", name: "Four Patch", category: "Traditional pieced", difficulty: "Beginner", origin: "One of the oldest pieced blocks; a first block for generations of beginners.", description: "Four squares, two colours alternating. Simple, and the base of Irish Chain and many scrap quilts.", pieces: [R(0, 0, 0.5, 0.5, 0), R(0.5, 0, 1, 0.5, 1), R(0, 0.5, 0.5, 1, 1), R(0.5, 0.5, 1, 1, 0)] },
  { id: "nine-patch", name: "Nine Patch", category: "Traditional pieced", difficulty: "Beginner", origin: "18th–19th century American piecing; chain-pieced in strips.", description: "A 3×3 checkerboard. Alternate it with plain blocks for a classic Irish Chain effect.", pieces: grid3((x, y, s, cx, cy) => [R(x, y, x + s, y + s, (cx + cy) % 2 === 0 ? 0 : 1)]) },
  { id: "rail-fence", name: "Rail Fence", category: "Traditional pieced", difficulty: "Beginner", origin: "Strip-pieced favourite; rotating the block makes zigzags and baskets.", description: "Three strips. Rotate alternate blocks 90° in the simulator for a zigzag.", pieces: [R(0, 0, 1 / 3, 1, 0), R(1 / 3, 0, 2 / 3, 1, 1), R(2 / 3, 0, 1, 1, 2)] },
  { id: "pinwheel", name: "Pinwheel", category: "Traditional pieced", difficulty: "Beginner", origin: "Built from four half-square triangles; a staple since the 19th century.", description: "Four half-square triangles spinning around the centre. The oldest trick for movement in a quilt.", pieces: [R(0, 0, 1, 1, BG), ...hst(0, 0, 0.5, "br", 0, BG), ...hst(0.5, 0, 0.5, "bl", 0, BG), ...hst(0, 0.5, 0.5, "tr", 0, BG), ...hst(0.5, 0.5, 0.5, "tl", 0, BG)] },
  { id: "half-square", name: "Half-Square Triangle", category: "Traditional pieced", difficulty: "Beginner", origin: "The atom of patchwork. Two triangles make a square.", description: "One diagonal, two fabrics. Combine it in the simulator and you can build almost any star.", pieces: [T([0, 0], [1, 0], [1, 1], 0), T([0, 0], [1, 1], [0, 1], 1)] },
  { id: "quarter-square", name: "Quarter-Square Triangle", category: "Traditional pieced", difficulty: "Beginner", origin: "Four triangles meeting at a point; the core of hourglass and Ohio Star points.", description: "Four triangles from the centre. Rotate pieces to make hourglasses and pinwheels.", pieces: [T([0.5, 0.5], [0, 0], [1, 0], 0), T([0.5, 0.5], [1, 0], [1, 1], 1), T([0.5, 0.5], [1, 1], [0, 1], 0), T([0.5, 0.5], [0, 1], [0, 0], 1)] },
  { id: "friendship-star", name: "Friendship Star", category: "Stars", difficulty: "Beginner", origin: "19th-century signature-star cousin; often made for a friend leaving town.", description: "Half-square triangles in the corners point at a solid centre.", pieces: grid3((x, y, s, cx, cy) => {
    if (cx === 1 && cy === 1) return [R(x, y, x + s, y + s, 0)];
    if (cx === 0 && cy === 0) return hst(x, y, s, "br", 0, BG);
    if (cx === 2 && cy === 0) return hst(x, y, s, "bl", 0, BG);
    if (cx === 0 && cy === 2) return hst(x, y, s, "tr", 0, BG);
    if (cx === 2 && cy === 2) return hst(x, y, s, "tl", 0, BG);
    return [R(x, y, x + s, y + s, BG)];
  }) },
  { id: "ohio-star", name: "Ohio Star", category: "Stars", difficulty: "Confident beginner", origin: "Named for Ohio in the 19th century; quarter-square points around a centre square.", description: "Quarter-square triangles on each side make sharp points. A test of accurate points.", pieces: grid3((x, y, s, cx, cy) => {
    if (cx === 1 && cy === 1) return [R(x, y, x + s, y + s, 0)];
    if (cx === 0 && cy === 0) return [R(x, y, x + s, y + s, BG)];
    if (cx === 2 && cy === 0) return [R(x, y, x + s, y + s, BG)];
    if (cx === 0 && cy === 2) return [R(x, y, x + s, y + s, BG)];
    if (cx === 2 && cy === 2) return [R(x, y, x + s, y + s, BG)];
    if (cy === 0) return [T([x + s / 2, y + s], [x, y], [x + s, y], 0), T([x + s / 2, y + s], [x, y], [x, y + s], BG), T([x + s / 2, y + s], [x + s, y], [x + s, y + s], BG)];
    if (cy === 2) return [T([x + s / 2, y], [x, y + s], [x + s, y + s], 0), T([x + s / 2, y], [x, y], [x, y + s], BG), T([x + s / 2, y], [x + s, y], [x + s, y + s], BG)];
    if (cx === 0) return [T([x + s, y + s / 2], [x, y], [x, y + s], 0), T([x + s, y + s / 2], [x, y], [x + s, y], BG), T([x + s, y + s / 2], [x, y + s], [x + s, y + s], BG)];
    return [T([x, y + s / 2], [x + s, y], [x + s, y + s], 0), T([x, y + s / 2], [x, y], [x + s, y], BG), T([x, y + s / 2], [x, y + s], [x + s, y + s], BG)];
  }) },
  { id: "sawtooth-star", name: "Sawtooth Star", category: "Stars", difficulty: "Confident beginner", origin: "Also called Variable Star; flying geese make its points.", description: "Flying geese on four sides, plain corners, solid centre. The workhorse star block.", pieces: grid3((x, y, s, cx, cy) => {
    if (cx === 1 && cy === 1) return [R(x, y, x + s, y + s, 0)];
    if ((cx === 0 || cx === 2) && (cy === 0 || cy === 2)) return [R(x, y, x + s, y + s, BG)];
    if (cy === 0) return goose(x, y, s, s, "up", 0, BG);
    if (cy === 2) return goose(x, y, s, s, "down", 0, BG);
    if (cx === 0) return goose(x, y, s, s, "left", 0, BG);
    return goose(x, y, s, s, "right", 0, BG);
  }) },
  { id: "churn-dash", name: "Churn Dash", category: "Traditional pieced", difficulty: "Confident beginner", origin: "19th-century block, also called Monkey Wrench; named for a butter churn's dasher.", description: "Half-square corners and split rectangles spin around a centre square.", pieces: grid3((x, y, s, cx, cy) => {
    if (cx === 1 && cy === 1) return [R(x, y, x + s, y + s, 0)];
    if (cx === 0 && cy === 0) return hst(x, y, s, "br", 0, BG);
    if (cx === 2 && cy === 0) return hst(x, y, s, "bl", 0, BG);
    if (cx === 0 && cy === 2) return hst(x, y, s, "tr", 0, BG);
    if (cx === 2 && cy === 2) return hst(x, y, s, "tl", 0, BG);
    if (cy === 0) return [R(x, y, x + s / 2, y + s, 0), R(x + s / 2, y, x + s, y + s, BG)];
    if (cy === 2) return [R(x, y, x + s / 2, y + s, BG), R(x + s / 2, y, x + s, y + s, 0)];
    if (cx === 0) return [R(x, y, x + s, y + s / 2, 0), R(x, y + s / 2, x + s, y + s, BG)];
    return [R(x, y, x + s, y + s / 2, BG), R(x, y + s / 2, x + s, y + s, 0)];
  }) },
  { id: "flying-geese", name: "Flying Geese", category: "Traditional pieced", difficulty: "Confident beginner", origin: "A single unit that becomes borders, stars, and whole quilts when repeated.", description: "Two geese side by side. In a real quilt this unit is usually 2:1, not square.", pieces: [R(0, 0, 1, 1, BG), ...goose(0, 0, 0.5, 1, "up", 0, BG), ...goose(0.5, 0, 0.5, 1, "up", 0, BG)] },
  { id: "log-cabin", name: "Log Cabin", category: "Log cabin family", difficulty: "Beginner", origin: "Mid-19th century America; light side / dark side around a red hearth centre.", description: "Strips wind around a centre square. Light on one side, dark on the other is the classic rule — break it in the simulator.", pieces: (() => {
    const out: Poly[] = [R(0, 0, 1, 1, BG)];
    out.push(R(0.375, 0.375, 0.625, 0.625, 2));
    // Ring 1 (light)
    out.push(R(0.25, 0.25, 0.375, 0.625, 1), R(0.25, 0.625, 0.75, 0.75, 1));
    out.push(R(0.375, 0.25, 0.75, 0.375, 1), R(0.625, 0.375, 0.75, 0.625, 1));
    // Ring 2 (dark)
    out.push(R(0.125, 0.125, 0.25, 0.75, 0), R(0.125, 0.75, 0.875, 0.875, 0));
    out.push(R(0.25, 0.125, 0.875, 0.25, 0), R(0.75, 0.25, 0.875, 0.75, 0));
    // Ring 3 (light) outer
    out.push(R(0, 0, 0.125, 0.875, 1), R(0, 0.875, 1, 1, 1));
    out.push(R(0.125, 0, 1, 0.125, 1), R(0.875, 0.125, 1, 0.875, 1));
    return out;
  })() },
  { id: "courthouse-steps", name: "Courthouse Steps", category: "Log cabin family", difficulty: "Beginner", origin: "Log Cabin variation: strips are added in pairs on opposite sides.", description: "Symmetrical cousin of Log Cabin — it reads as concentric rectangles, not a spiral.", pieces: (() => {
    const out: Poly[] = [R(0, 0, 1, 1, BG), R(0.375, 0.375, 0.625, 0.625, 2)];
    out.push(R(0.25, 0.375, 0.75, 0.625, 1), R(0.375, 0.25, 0.625, 0.75, 1));
    out.push(R(0.125, 0.25, 0.875, 0.75, 0), R(0.25, 0.125, 0.75, 0.875, 0));
    out.push(R(0, 0.125, 1, 0.875, 1), R(0.125, 0, 0.875, 1, 1));
    return out;
  })() },
  { id: "snail-trail", name: "Snail's Trail", category: "Log cabin family", difficulty: "Intermediate", origin: "Log Cabin with triangles; the spiral is unmistakable from across a room.", description: "A spiral made of squares and triangles. Try it in two high-contrast colours first.", pieces: (() => {
    const out: Poly[] = [R(0, 0, 1, 1, BG), R(0.375, 0.375, 0.625, 0.625, 0)];
    out.push(...hst(0.25, 0.25, 0.25, "br", 1, 0), ...hst(0.5, 0.25, 0.25, "bl", 1, 0));
    out.push(...hst(0.25, 0.5, 0.25, "tr", 1, 0), ...hst(0.5, 0.5, 0.25, "tl", 1, 0));
    out.push(R(0.125, 0.125, 0.875, 0.25, 1), R(0.125, 0.75, 0.875, 0.875, 1), R(0.125, 0.25, 0.25, 0.75, 1), R(0.75, 0.25, 0.875, 0.75, 1));
    return out;
  })() },
  { id: "drunkards-path", name: "Drunkard's Path", category: "Curves & circles", difficulty: "Intermediate", origin: "19th-century curved block; the name is folk humour, not a drinking reference in the pattern books.", description: "Quarter-circles in a grid. Rotate blocks in the simulator for waves, circles, and windswept paths.", pieces: [R(0, 0, 1, 1, BG), quarterCircle(0, 0, 0.5, "br", 0), quarterCircle(0.5, 0, 0.5, "bl", 0), quarterCircle(0, 0.5, 0.5, "tr", 0), quarterCircle(0.5, 0.5, 0.5, "tl", 0)] },
  { id: "double-wedding-ring", name: "Double Wedding Ring", category: "Curves & circles", difficulty: "Advanced", origin: "1920s–30s American classic; interlocking rings, often made for weddings.", description: "Interlocking rings on a background. A curved-piecing milestone — the simulator shows the motif, not the arc templates.", pieces: (() => {
    const out: Poly[] = [R(0, 0, 1, 1, BG)];
    const ring = (cx: number, cy: number, r: number, slot: number) => {
      out.push(P(arcPoints(cx, cy, r, 0, Math.PI * 2, 28), slot));
      out.push(P(arcPoints(cx, cy, r * 0.62, 0, Math.PI * 2, 24), BG));
    };
    ring(0.32, 0.5, 0.3, 0); ring(0.68, 0.5, 0.3, 2);
    out.push(P(diamond(0.5, 0.5, 0.08, 0.08), 0));
    return out;
  })() },
  { id: "bow-tie", name: "Bow Tie", category: "Traditional pieced", difficulty: "Beginner", origin: "19th-century block; two triangles and a knot make the tie.", description: "Two coloured triangles meet at a centre knot. Scatter it on a plain background for a cheerful quilt.", pieces: [R(0, 0, 1, 1, BG), T([0.1, 0.1], [0.45, 0.45], [0.1, 0.45], 0), T([0.9, 0.9], [0.55, 0.55], [0.9, 0.55], 0), R(0.43, 0.43, 0.57, 0.57, 2)] },
  { id: "basket", name: "Basket", category: "Traditional pieced", difficulty: "Confident beginner", origin: "A family of blocks picturing a basket, popular in 19th-century sampler quilts.", description: "A triangle basket with a handle, simplified to its silhouette.", pieces: [R(0, 0, 1, 1, BG), T([0.15, 0.45], [0.85, 0.45], [0.5, 0.9], 0), R(0.15, 0.35, 0.85, 0.45, 2), T([0.3, 0.15], [0.7, 0.15], [0.5, 0.4], 1)] },
  { id: "tumbling-blocks", name: "Tumbling Blocks", category: "Modern & special", difficulty: "Intermediate", origin: "Optical-illusion block from 19th-century pattern books; three diamonds read as a cube.", description: "Three diamonds = one cube. Value matters more than hue here: light top, medium and dark sides.", pieces: [R(0, 0, 1, 1, BG), P([[0.5, 0.12], [0.86, 0.33], [0.5, 0.54], [0.14, 0.33]], 1), P([[0.14, 0.33], [0.5, 0.54], [0.5, 0.88], [0.14, 0.67]], 0), P([[0.5, 0.54], [0.86, 0.33], [0.86, 0.67], [0.5, 0.88]], 2)] },
  { id: "lone-star", name: "Lone Star", category: "Stars", difficulty: "Advanced", origin: "Texas star; an 8-point star built from diamonds, often a whole-quilt medallion.", description: "One large 8-point star. In real quilts the diamonds are strip-pieced; here it is one motif.", pieces: [R(0, 0, 1, 1, BG), P(starPoints(0.5, 0.5, 0.48, 0.2, 8), 0), P(hexPoints(0.5, 0.5, 0.2, Math.PI / 8), 2)] },
  { id: "dresden-plate", name: "Dresden Plate", category: "Motif & appliqué", difficulty: "Intermediate", origin: "1920s–30s appliqué favourite, named for Dresden porcelain plates.", description: "Petals radiate around a centre circle. Alternate petal colours in the simulator.", pieces: (() => {
    const out: Poly[] = [R(0, 0, 1, 1, BG)];
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6, a2 = ((i + 0.7) * Math.PI) / 6;
      out.push(P([[0.5 + 0.12 * Math.cos(a), 0.5 + 0.12 * Math.sin(a)], [0.5 + 0.48 * Math.cos(a - 0.12), 0.5 + 0.48 * Math.sin(a - 0.12)], [0.5 + 0.48 * Math.cos(a2 + 0.12), 0.5 + 0.48 * Math.sin(a2 + 0.12)], [0.5 + 0.12 * Math.cos(a2), 0.5 + 0.12 * Math.sin(a2)]], i % 2 === 0 ? 0 : 2));
    }
    out.push(P(arcPoints(0.5, 0.5, 0.13, 0, Math.PI * 2, 20), 1));
    return out;
  })() },
  { id: "grandmothers-flower", name: "Grandmother's Flower Garden", category: "Motif & appliqué", difficulty: "Intermediate", origin: "English paper piecing classic: hexagons joined by hand, 1920s–30s America.", description: "A hexagon flower. Real versions tile hexagons edge-to-edge; this block shows one flower.", pieces: (() => {
    const out: Poly[] = [R(0, 0, 1, 1, BG)];
    const r = 0.16;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      out.push(P(hexPoints(0.5 + 0.28 * Math.cos(a), 0.5 + 0.28 * Math.sin(a), r), i % 2 === 0 ? 0 : 2));
    }
    out.push(P(hexPoints(0.5, 0.5, r), 1));
    return out;
  })() },
  { id: "cathedral-window", name: "Cathedral Window", category: "Motif & appliqué", difficulty: "Advanced", origin: "Folded-fabric technique; the 'windows' are revealed by folding, no batting needed in the classic form.", description: "Four folded windows around a centre. The simulator simplifies the folds to their window shapes.", pieces: [R(0, 0, 1, 1, BG), P([[0.5, 0.08], [0.92, 0.5], [0.5, 0.92], [0.08, 0.5]], 1), P([[0.5, 0.2], [0.8, 0.5], [0.5, 0.8], [0.2, 0.5]], 0), R(0.42, 0.42, 0.58, 0.58, 2)] },
  { id: "storm-at-sea", name: "Storm at Sea", category: "Curves & circles", difficulty: "Advanced", origin: "19th-century block whose diamonds and squares suggest waves and a rolling sea.", description: "A diamond centre with square corners. The sea appears when blocks join and secondary patterns form.", pieces: [R(0, 0, 1, 1, BG), P(diamond(0.5, 0.5, 0.32, 0.32), 0), R(0.05, 0.05, 0.25, 0.25, 2), R(0.75, 0.05, 0.95, 0.25, 2), R(0.05, 0.75, 0.25, 0.95, 2), R(0.75, 0.75, 0.95, 0.95, 2), P(diamond(0.5, 0.08, 0.14, 0.08), 1), P(diamond(0.5, 0.92, 0.14, 0.08), 1), P(diamond(0.08, 0.5, 0.08, 0.14), 1), P(diamond(0.92, 0.5, 0.08, 0.14), 1)] },
  { id: "bargello", name: "Bargello", category: "Modern & special", difficulty: "Intermediate", origin: "From Bargello flame stitch in embroidery, adapted to strip-pieced quilts in the late 20th century.", description: "Vertical strips whose colours rise and fall in a wave. One block already looks like moving water.", pieces: (() => {
    const out: Poly[] = [];
    for (let cx = 0; cx < 6; cx++) for (let cy = 0; cy < 12; cy++) {
      const wave = Math.round(2 * Math.sin((cx / 6) * Math.PI * 2));
      const v = cy + wave;
      const slot = v < 3 ? 0 : v < 6 ? 2 : v < 9 ? 1 : 0;
      out.push(R(cx / 6, cy / 12, (cx + 1) / 6, (cy + 1) / 12, slot));
    }
    return out;
  })() },
  { id: "crazy-quilt", name: "Crazy Quilt", category: "Modern & special", difficulty: "Beginner", origin: "Victorian-era (1870s–90s) showpieces of silk, velvet, and embroidery; asymmetry was the point.", description: "Irregular pieces, no grid. This is a fixed crazy layout — real crazy quilts are improvised piece by piece.", pieces: [R(0, 0, 1, 1, BG), P([[0, 0], [0.4, 0], [0.3, 0.35], [0, 0.5]], 0), P([[0.4, 0], [1, 0], [0.8, 0.3], [0.3, 0.35]], 2), P([[0, 0.5], [0.3, 0.35], [0.5, 0.7], [0.2, 1], [0, 1]], 1), P([[0.3, 0.35], [0.8, 0.3], [1, 0.6], [0.5, 0.7]], 0), P([[0.5, 0.7], [1, 0.6], [1, 1], [0.2, 1]], 2), P([[0.8, 0.3], [1, 0], [1, 0.6]], 1)] },
];

export const BLOCK_MAP = new Map(BLOCKS.map((b) => [b.id, b]));

export type FabricPattern = "solid" | "dots" | "stripes" | "gingham" | "checker" | "stars" | "crosshatch";
export const FABRIC_PATTERNS: { id: FabricPattern; name: string }[] = [
  { id: "solid", name: "Solid" },
  { id: "dots", name: "Polka dots" },
  { id: "stripes", name: "Diagonal stripes" },
  { id: "gingham", name: "Gingham" },
  { id: "checker", name: "Mini checker" },
  { id: "stars", name: "Stars" },
  { id: "crosshatch", name: "Crosshatch" },
];

export type PaletteSlot = {
  color: string;
  pattern: FabricPattern;
  /** Optional external pattern tile. SVG preferred, PNG accepted.
   *  When set, it overrides the built-in `pattern` motif in the full
   *  (shareable) export and in the simulator's SVG rendering. */
  patternUrl?: string;
  patternFormat?: "svg" | "png";
};
export type Palette = { id: string; name: string; note: string; slots: PaletteSlot[] };
export const PALETTES: Palette[] = [
  { id: "amish", name: "Amish Bold", note: "Solid brights on black, Lancaster County style.", slots: [{ color: "#c1121f", pattern: "solid" }, { color: "#111111", pattern: "solid" }, { color: "#f4a261", pattern: "solid" }, { color: "#2a9d8f", pattern: "solid" }] },
  { id: "civil-war", name: "Civil War Repro", note: "Muted madder, indigo, and shirting tones.", slots: [{ color: "#7a2e2e", pattern: "dots" }, { color: "#e8ddc8", pattern: "solid" }, { color: "#2c3e5a", pattern: "solid" }, { color: "#8a7a5a", pattern: "stripes" }] },
  { id: "pastel", name: "Pastel Spring", note: "1930s feed-sack pastels.", slots: [{ color: "#f2a7c3", pattern: "dots" }, { color: "#fdf6e3", pattern: "solid" }, { color: "#a8d8ea", pattern: "solid" }, { color: "#b5e48c", pattern: "stripes" }] },
  { id: "modern", name: "Modern Brights", note: "High contrast, white ground, modern quilting.", slots: [{ color: "#ff5964", pattern: "solid" }, { color: "#ffffff", pattern: "solid" }, { color: "#ffe74c", pattern: "solid" }, { color: "#35a7ff", pattern: "solid" }] },
  { id: "indigo", name: "Indigo & White", note: "Sashiko and blue-and-white traditions.", slots: [{ color: "#1d3557", pattern: "solid" }, { color: "#f1faee", pattern: "solid" }, { color: "#457b9d", pattern: "crosshatch" }, { color: "#a8dadc", pattern: "dots" }] },
  { id: "gees-bend", name: "Gee's Bend Bold", note: "After the Gee's Bend quilters: bold, improvised colour.", slots: [{ color: "#d90429", pattern: "solid" }, { color: "#edf2f4", pattern: "solid" }, { color: "#2b2d42", pattern: "solid" }, { color: "#ef8354", pattern: "stripes" }] },
  { id: "autumn", name: "Autumn Harvest", note: "Rust, gold, and deep green.", slots: [{ color: "#bc6c25", pattern: "solid" }, { color: "#fefae0", pattern: "solid" }, { color: "#606c38", pattern: "solid" }, { color: "#dda15e", pattern: "gingham" }] },
  { id: "christmas", name: "Christmas Classic", note: "Red, green, and cream.", slots: [{ color: "#9d0208", pattern: "solid" }, { color: "#f8edeb", pattern: "solid" }, { color: "#386641", pattern: "stars" }, { color: "#e9c46a", pattern: "dots" }] },
  { id: "ocean", name: "Ocean Blues", note: "Storm at Sea in blues.", slots: [{ color: "#03045e", pattern: "solid" }, { color: "#caf0f8", pattern: "solid" }, { color: "#0096c7", pattern: "stripes" }, { color: "#90e0ef", pattern: "dots" }] },
  { id: "redwork", name: "Black, White & Red", note: "Graphic two-colour-plus-accent quilts.", slots: [{ color: "#e63946", pattern: "solid" }, { color: "#ffffff", pattern: "solid" }, { color: "#111111", pattern: "solid" }, { color: "#adb5bd", pattern: "checker" }] },
];

// Rotate a block's polygons around its centre by `deg` (0/90/180/270).
export function rotatePieces(pieces: Poly[], deg: number): Poly[] {
  if (deg % 360 === 0) return pieces;
  const rad = (deg * Math.PI) / 180, cos = Math.round(Math.cos(rad)), sin = Math.round(Math.sin(rad));
  return pieces.map((p) => ({ slot: p.slot, points: p.points.map(([x, y]) => {
    const dx = x - 0.5, dy = y - 0.5;
    return [0.5 + dx * cos - dy * sin, 0.5 + dx * sin + dy * cos] as Pt;
  }) }));
}

// --- Quilt document: the saveable format (see docs/xdg-config.md) --------
export type QuiltDoc = {
  schema: "mcquilter.quilt.v1";
  id: string;
  name: string;
  author?: string;
  license?: string;
  block: string;
  rows: number;
  cols: number;
  layout: "straight" | "alternating" | "sashing" | "brick";
  rotationMode: "none" | "checker" | "random" | "pinwheel";
  palette: PaletteSlot[];
  // Piece-level overrides: "row,col,pieceIndex" -> slot
  overrides?: Record<string, number>;
  sashingColor?: string;
  borderColor?: string;
  created?: string;
  notes?: string;
};
export type PaletteDoc = {
  schema: "mcquilter.palette.v1";
  id: string; name: string; author?: string; license?: string; slots: PaletteSlot[]; created?: string;
};
export function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "my-quilt";
}
export function defaultQuilt(blockId = "ohio-star", paletteId = "amish"): QuiltDoc {
  const pal = PALETTES.find((p) => p.id === paletteId) ?? PALETTES[0];
  return { schema: "mcquilter.quilt.v1", id: slugify("my-first-quilt"), name: "My first quilt", block: blockId, rows: 5, cols: 5, layout: "straight", rotationMode: "none", palette: pal.slots, sashingColor: "#ffffff", borderColor: "#111111" };
}
