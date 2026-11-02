"use client";
import { BLOCK_MAP, QuiltDoc, rotatePieces } from "@/lib/quilts";

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
function patternDef(id: string, slot: { color: string; pattern: string; patternUrl?: string }): React.ReactNode {
  const color = slot.color, pattern = slot.pattern;
  const w = "rgba(255,255,255,0.35)", b = "rgba(0,0,0,0.18)";
  if (pattern === "solid" && !slot.patternUrl) return null;
  return (
    <pattern key={id} id={id} width="20" height="20" patternUnits="userSpaceOnUse">
      <rect width="20" height="20" fill={color} />
      {slot.patternUrl && <image href={slot.patternUrl} width="20" height="20" preserveAspectRatio="none" />}
      {pattern === "dots" && (<><circle cx="5" cy="5" r="3" fill={w} /><circle cx="15" cy="15" r="3" fill={w} /></>)}
      {pattern === "stripes" && (<><line x1="0" y1="20" x2="20" y2="0" stroke={w} strokeWidth="4" /><line x1="-5" y1="5" x2="5" y2="-5" stroke={w} strokeWidth="4" /><line x1="15" y1="25" x2="25" y2="15" stroke={w} strokeWidth="4" /></>)}
      {pattern === "gingham" && (<><rect width="10" height="20" fill={w} /><rect width="20" height="10" fill={w} /><rect width="10" height="10" fill={b} /></>)}
      {pattern === "checker" && (<><rect width="10" height="10" fill={w} /><rect x="10" y="10" width="10" height="10" fill={w} /></>)}
      {pattern === "stars" && (<><polygon points="5,1 6,4 9,5 6,6 5,9 4,6 1,5 4,4" fill={w} /><polygon points="15,11 16,14 19,15 16,16 15,19 14,16 11,15 14,14" fill={w} /></>)}
      {pattern === "crosshatch" && (<><line x1="0" y1="20" x2="20" y2="0" stroke={w} strokeWidth="2" /><line x1="0" y1="0" x2="20" y2="20" stroke={w} strokeWidth="2" /></>)}
    </pattern>
  );
}
export function fillFor(q: QuiltDoc, slot: number): string {
  const s = q.palette[slot % q.palette.length];
  if (!s) return "#cccccc";
  return s.pattern === "solid" && !s.patternUrl ? s.color : `url(#fab-${slot}-${s.pattern})`;
}
export default function QuiltSvg({ quilt, cell = 72, onPieceClick, showGrid = true }: {
  quilt: QuiltDoc; cell?: number;
  onPieceClick?: (row: number, col: number, piece: number) => void;
  showGrid?: boolean;
}) {
  const block = BLOCK_MAP.get(quilt.block);
  const sash = quilt.layout === "sashing" ? Math.max(6, cell * 0.12) : 0;
  const border = 10;
  const step = cell + sash;
  const W = quilt.cols * step + sash + border * 2;
  const H = quilt.rows * step + sash + border * 2;
  if (!block) return <p>Unknown block: {quilt.block}</p>;
  const defs = quilt.palette.map((s, i) => patternDef(`fab-${i}-${s.pattern}`, s));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${block.name} quilt, ${quilt.cols} by ${quilt.rows} blocks`}
      style={{ display: "block", background: quilt.borderColor || "#111", borderRadius: 8 }}>
      <defs>{defs}</defs>
      <rect x="0" y="0" width={W} height={H} fill={quilt.borderColor || "#111"} />
      <rect x={border} y={border} width={W - border * 2} height={H - border * 2} fill={quilt.layout === "sashing" ? (quilt.sashingColor || "#fff") : fillFor(quilt, 1)} />
      {Array.from({ length: quilt.rows }).map((_, r) => Array.from({ length: quilt.cols }).map((_, c) => {
        const plain = quilt.layout === "alternating" && (r + c) % 2 === 1;
        const brickOffset = quilt.layout === "brick" && r % 2 === 1 ? -cell / 2 : 0;
        const x0 = border + sash + c * step + brickOffset;
        const y0 = border + sash + r * step;
        if (plain) {
          return <rect key={`${r}-${c}`} x={x0} y={y0} width={cell} height={cell} fill={fillFor(quilt, 1)} stroke={showGrid ? "rgba(0,0,0,0.15)" : "none"} />;
        }
        const pieces = rotatePieces(block.pieces, rotationFor(quilt, r, c));
        return (
          <g key={`${r}-${c}`}>
            {pieces.map((p, i) => {
              const slot = quilt.overrides?.[`${r},${c},${i}`] ?? p.slot;
              const pts = p.points.map(([x, y]) => `${x0 + x * cell},${y0 + y * cell}`).join(" ");
              return <polygon key={i} points={pts} fill={fillFor(quilt, slot)} stroke={showGrid ? "rgba(0,0,0,0.18)" : "none"} strokeWidth="1"
                style={onPieceClick ? { cursor: "pointer" } : undefined}
                onClick={onPieceClick ? () => onPieceClick(r, c, i) : undefined}>
                <title>{`${block.name} — block ${r + 1},${c + 1} piece ${i + 1}`}</title>
              </polygon>;
            })}
          </g>
        );
      }))}
    </svg>
  );
}
export function BlockPreview({ blockId, palette, size = 120 }: { blockId: string; palette: QuiltDoc["palette"]; size?: number }) {
  const q: QuiltDoc = { schema: "mcquilter.quilt.v1", id: "preview", name: "preview", block: blockId, rows: 1, cols: 1, layout: "straight", rotationMode: "none", palette };
  return <QuiltSvg quilt={q} cell={size} showGrid={false} />;
}
