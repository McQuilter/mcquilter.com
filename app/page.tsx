import Link from "next/link";
import { BLOCKS, PALETTES } from "@/lib/quilts";
import { BlockPreview } from "@/components/QuiltSvg";
export default function Home() {
  const featured = ["ohio-star", "log-cabin", "dresden-plate", "lone-star", "drunkards-path", "bargello"];
  const pal = PALETTES[0].slots;
  return (<>
    <h1>A history of quilts — and a way to make your own.</h1>
    <p className="lede">Quilting is one of the oldest textile arts in the world: layers stitched together for warmth, then turned, over centuries, into picture, protest, memory, and pure geometry. This site tells that story, catalogues the common styles, and lets you design a quilt yourself — in any of those styles, in your own colours and patterns — without an account or a server.</p>
    <p><Link className="btn" href="/simulator">Open the simulator →</Link><Link className="btn secondary" href="/history">Read the history</Link><Link className="btn secondary" href="/quilts">Browse every quilt style</Link></p>
    <div className="callout"><strong>“Every quilt possible,” honestly:</strong> nobody can list infinity. What this site does is give you the finite ingredients — {BLOCKS.length} blocks, 4 layouts, rotations, piece-by-piece painting, and any palette — whose combinations already run into the millions. Change one colour and you have a quilt no one has made before. That is the point.</div>
    <h2>Try a block</h2>
    <div className="grid">{featured.map((id) => {
      const b = BLOCKS.find((x) => x.id === id)!;
      return (<div className="card" key={id}><BlockPreview blockId={id} palette={pal} size={150} /><h3><Link href={`/quilts/${id}`}>{b.name}</Link></h3><p className="muted">{b.category} · {b.difficulty}</p><p>{b.description}</p></div>);
    })}</div>
    <h2>How saving and sharing work</h2>
    <ol>
      <li><strong>Design</strong> in the <Link href="/simulator">simulator</Link> — pick a block, a layout, colours, fabric patterns, and paint individual pieces.</li>
      <li><strong>Save</strong> the design as a small JSON file into <code>$XDG_CONFIG/mcquilter/quilts/</code> (see <Link href="/save">Save</Link>). In Chrome you can pick that folder directly; otherwise download and move the file, or use the included <code>mcquilter</code> command-line tool.</li>
      <li><strong>Share</strong> by copying your file into the <code>community/</code> folder and opening a pull request (see <Link href="/share">Share</Link>). Anyone can then download, validate, and open your design in the simulator.</li>
    </ol>
    <h2>Start with history, or start with making</h2>
    <p>Quilts were bedding long before they were art, and art long before they were a hobby industry. The <Link href="/history">history page</Link> follows them from quilted clothing in ancient Egypt and China, through medieval Europe, to American patchwork, Amish quilts, Gee&apos;s Bend, and the AIDS Memorial Quilt — including one famous story that is probably folklore, labelled as such.</p>
  </>);
}
