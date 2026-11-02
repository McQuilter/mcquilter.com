import Link from "next/link";
import { BLOCKS, PALETTES } from "@/lib/quilts";
import QuiltSvg from "@/components/QuiltSvg";
export function generateStaticParams() { return BLOCKS.map((b) => ({ slug: b.id })); }
export default function BlockPage({ params }: { params: { slug: string } }) {
  const b = BLOCKS.find((x) => x.id === params.slug);
  if (!b) return <><h1>Block not found</h1><p><Link href="/quilts">Back to the catalogue</Link></p></>;
  const quilt = { schema: "mcquilter.quilt.v1" as const, id: b.id, name: b.name, block: b.id, rows: 4, cols: 4, layout: "straight" as const, rotationMode: "none" as const, palette: PALETTES[3].slots, borderColor: "#111111" };
  return (<>
    <p><Link href="/quilts">← All quilts</Link></p>
    <h1>{b.name}</h1>
    <p className="muted">{b.category} · {b.difficulty}</p>
    <p className="lede">{b.description}</p>
    <p>{b.origin}</p>
    <QuiltSvg quilt={quilt} cell={72} />
    <p><Link className="btn" href={`/simulator?block=${b.id}`}>Open {b.name} in the simulator →</Link></p>
    <h2>Try it in other palettes</h2>
    <div className="grid">{PALETTES.slice(0, 4).map((p) => (
      <div className="card" key={p.id}><QuiltSvg quilt={{ ...quilt, rows: 2, cols: 2, palette: p.slots }} cell={90} showGrid={false} /><h3>{p.name}</h3><p className="muted">{p.note}</p></div>))}
    </div>
  </>);
}
