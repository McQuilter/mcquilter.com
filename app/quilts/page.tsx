import Link from "next/link";
import { BLOCKS, PALETTES } from "@/lib/quilts";
import { BlockPreview } from "@/components/QuiltSvg";
const cats = [...new Set(BLOCKS.map((b) => b.category))];
export default function Quilts() {
  const pal = PALETTES[3].slots;
  return (<>
    <h1>Every quilt, catalogued</h1>
    <p className="lede">Below are {BLOCKS.length} common blocks, grouped by family. Click any block to see its story and open it in the simulator. A “quilt” in this catalogue is a block + a layout + a palette — and because you can repaint any piece, the catalogue is a starting point, not a limit.</p>
    <div className="callout"><strong>How many quilts is that, really?</strong> {BLOCKS.length} blocks × 4 layouts × 4 rotations × 10 starter palettes is already 6,400 combinations before you repaint a single piece or pick a custom colour. Add grid sizes, sashing, and piece painting, and “every quilt possible” stops being a list and becomes a space to explore. The simulator is that space.</div>
    {cats.map((cat) => (<section key={cat}>
      <h2>{cat}</h2>
      <div className="grid">{BLOCKS.filter((b) => b.category === cat).map((b) => (
        <div className="card" key={b.id}><BlockPreview blockId={b.id} palette={pal} size={130} />
          <h3><Link href={`/quilts/${b.id}`}>{b.name}</Link></h3>
          <p className="muted">{b.difficulty}</p><p>{b.description}</p>
          <p><Link href={`/simulator?block=${b.id}`}>Try it in the simulator →</Link></p></div>))}
      </div></section>))}
    <h2>Styles that are layouts, not blocks</h2>
    <p>Some famous “quilts” are not a block at all, but a way of arranging blocks. The simulator covers them as layouts:</p>
    <ul>
      <li><strong>Irish Chain</strong> — alternate a Nine Patch with a plain block (use the <em>Alternating</em> layout with Nine Patch).</li>
      <li><strong>Medallion</strong> — one large centre block surrounded by borders (make a 1×1 quilt, then add a border colour).</li>
      <li><strong>Sampler</strong> — a different block in every position (paint pieces, or save several quilts and sew them as one top — the simulator is per-block by design).</li>
      <li><strong>Wholecloth</strong> — no piecing; the quilting stitch is the pattern. Use a plain block (Four Patch in one colour) and imagine the stitching.</li>
      <li><strong>Bargello</strong> — a strip wave, included as its own block above.</li>
    </ul>
    <p className="muted">Missing a block you love? The block library is data in <code>lib/quilts.ts</code> — one polygon list per block. A pull request adding a block, with its history note, is welcome.</p>
  </>);
}
