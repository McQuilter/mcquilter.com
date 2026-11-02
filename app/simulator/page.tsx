"use client";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import QuiltSvg from "@/components/QuiltSvg";
import { BLOCKS, BLOCK_MAP, FABRIC_PATTERNS, PALETTES, QuiltDoc, defaultQuilt, slugify } from "@/lib/quilts";
import { buildFullQuilt } from "@/lib/full-quilt";

function decodeShare(q: string | null): QuiltDoc | null {
  if (!q) return null;
  try {
    const json = decodeURIComponent(escape(atob(q.replace(/-/g, "+").replace(/_/g, "/"))));
    const doc = JSON.parse(json);
    if (doc && doc.schema === "mcquilter.quilt.v1" && BLOCK_MAP.has(doc.block)) return doc;
  } catch { /* ignore bad share links */ }
  return null;
}
function encodeShare(q: QuiltDoc): string {
  const json = JSON.stringify(q);
  return btoa(unescape(encodeURIComponent(json))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function download(name: string, content: string, type = "application/json") {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name; a.click(); URL.revokeObjectURL(a.href);
}
function SimulatorInner() {
  const params = useSearchParams();
  const [quilt, setQuilt] = useState<QuiltDoc>(() => defaultQuilt());
  const [brush, setBrush] = useState<number | "cycle">("cycle");
  const [notice, setNotice] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const shared = decodeShare(params.get("q"));
    const block = params.get("block");
    if (shared) setQuilt(shared);
    else if (block && BLOCK_MAP.has(block)) setQuilt((q) => ({ ...q, block }));
    else {
      try { const saved = localStorage.getItem("mcquilter.autosave"); if (saved) setQuilt(JSON.parse(saved)); } catch { /* ignore */ }
    }
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { if (loaded) { try { localStorage.setItem("mcquilter.autosave", JSON.stringify(quilt)); } catch { /* ignore */ } } }, [quilt, loaded]);

  const block = BLOCK_MAP.get(quilt.block)!;
  const set = (patch: Partial<QuiltDoc>) => setQuilt((q) => ({ ...q, ...patch }));
  const pieceCount = useMemo(() => quilt.rows * quilt.cols * block.pieces.length, [quilt, block]);

  const onPieceClick = (r: number, c: number, i: number) => {
    const key = `${r},${c},${i}`;
    setQuilt((q) => {
      const cur = q.overrides?.[key] ?? block.pieces[i].slot;
      const next = brush === "cycle" ? (cur + 1) % q.palette.length : brush;
      const overrides = { ...(q.overrides || {}) };
      if (next === block.pieces[i].slot) delete overrides[key]; else overrides[key] = next;
      return { ...q, overrides };
    });
  };
  const setSlot = (i: number, patch: Partial<(typeof quilt.palette)[number]>) =>
    setQuilt((q) => ({ ...q, palette: q.palette.map((s, j) => (j === i ? { ...s, ...patch } : s)) }));

  const exportSvg = () => {
    const svg = wrapRef.current?.querySelector("svg");
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    download(`${quilt.id}.svg`, new XMLSerializer().serializeToString(clone), "image/svg+xml");
  };
  const exportPng = async () => {
    const svg = wrapRef.current?.querySelector("svg");
    if (!svg) return;
    const text = new XMLSerializer().serializeToString(svg);
    const url = URL.createObjectURL(new Blob([text], { type: "image/svg+xml" }));
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width * 2 || 1200; canvas.height = img.height * 2 || 1200;
      const ctx = canvas.getContext("2d")!; ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((b) => { if (b) { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `${quilt.id}.png`; a.click(); } });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };
  const saveToXdgFolder = async () => {
    // Browsers cannot write to $XDG_CONFIG by path. In Chromium, the File
    // System Access API lets the user *pick* that folder once, and then we
    // really do write into it. Everywhere else, download is the fallback.
    const picker = (window as unknown as { showDirectoryPicker?: () => Promise<{ getDirectoryHandle: (n: string, o?: object) => Promise<{ getFileHandle: (n: string, o?: object) => Promise<{ createWritable: () => Promise<{ write: (s: string) => Promise<void>; close: () => Promise<void> }> }> }> }> }).showDirectoryPicker;
    if (!picker) { download(`${quilt.id}.json`, JSON.stringify(quilt, null, 2)); setNotice("Your browser cannot pick a folder, so the quilt downloaded instead. Move it to $XDG_CONFIG/mcquilter/quilts/ (see Save page)."); return; }
    try {
      const root = await picker();
      const quilts = await root.getDirectoryHandle("quilts", { create: true });
      const fh = await quilts.getFileHandle(`${quilt.id}.json`, { create: true });
      const w = await fh.createWritable(); await w.write(JSON.stringify(quilt, null, 2)); await w.close();
      setNotice("Saved into the folder you picked. If that was $XDG_CONFIG/mcquilter, the quilt is now in quilts/ there.");
    } catch (e) { setNotice("Folder save was cancelled or blocked — use Download JSON instead."); }
  };
  const loadFile = async (f: File) => {
    try {
      const doc = JSON.parse(await f.text());
      if (doc.schema === "mcquilter.quilt.v1" && BLOCK_MAP.has(doc.block)) { setQuilt(doc); setNotice(`Loaded ${doc.name}.`); }
      else if (doc.schema === "mcquilter.quilt-full.v1" && doc.source && BLOCK_MAP.has(doc.source.block)) { setQuilt(doc.source); setNotice(`Loaded ${doc.name} from its shareable full file (editable source restored).`); }
      else if (doc.schema === "mcquilter.quilt-full.v1") { setNotice(`That full file (${doc.name}) has no editable source inside it, so it is render-only here — but its embedded SVG still renders anywhere. Download its SVG from the file's "svg" field, or re-create it parametrically.`); }
      else setNotice("That file is not a mcquilter quilt (mcquilter.quilt.v1 or mcquilter.quilt-full.v1).");
    }
    catch { setNotice("Could not read that file as JSON."); }
  };

  return (<>
    <h1>Quilt simulator</h1>
    <p className="lede">Pick a block, set the size, choose colours and fabric patterns — then click any piece in the quilt to repaint it. {block.name}: {block.description}</p>
    <div className="controls">
      <div><label>Block</label><select value={quilt.block} onChange={(e) => set({ block: e.target.value })}>{BLOCKS.map((b) => <option key={b.id} value={b.id}>{b.name} — {b.category}</option>)}</select></div>
      <div><label>Columns</label><input type="number" min={1} max={20} value={quilt.cols} onChange={(e) => set({ cols: Math.max(1, Math.min(20, Number(e.target.value) || 1)) })} /></div>
      <div><label>Rows</label><input type="number" min={1} max={20} value={quilt.rows} onChange={(e) => set({ rows: Math.max(1, Math.min(20, Number(e.target.value) || 1)) })} /></div>
      <div><label>Layout</label><select value={quilt.layout} onChange={(e) => set({ layout: e.target.value as QuiltDoc["layout"] })}><option value="straight">Straight set</option><option value="alternating">Alternating plain</option><option value="sashing">With sashing</option><option value="brick">Brick offset</option></select></div>
      <div><label>Block rotation</label><select value={quilt.rotationMode} onChange={(e) => set({ rotationMode: e.target.value as QuiltDoc["rotationMode"] })}><option value="none">None</option><option value="checker">Checkerboard 90°</option><option value="pinwheel">Pinwheel</option><option value="random">Pseudo-random (stable)</option></select></div>
      <div><label>Starter palette</label><select onChange={(e) => { const p = PALETTES.find((x) => x.id === e.target.value); if (p) set({ palette: p.slots }); }} defaultValue=""><option value="" disabled>Apply a palette…</option>{PALETTES.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
    </div>
    <div>
      <label>Quilt name</label>
      <input value={quilt.name} onChange={(e) => set({ name: e.target.value, id: slugify(e.target.value) })} style={{ width: "100%", maxWidth: 420 }} />
      <span className="muted"> File name: <code>{quilt.id}.json</code> · At 12″ blocks, about {quilt.cols * 12}″ × {quilt.rows * 12}″ · {quilt.rows * quilt.cols} blocks · {pieceCount} pieces</span>
    </div>
    <h2>Your colours &amp; fabric patterns</h2>
    <p className="muted">Each block uses colour slots 0–3. Change a slot here and every piece using it changes. Patterns are printed on the colour — dots, gingham, and so on.</p>
    <div className="grid">{quilt.palette.map((s, i) => (
      <div className="card" key={i}>
        <span className="swatch" style={{ background: s.color }} />
        <label>Slot {i} colour</label><input type="color" value={s.color} onChange={(e) => setSlot(i, { color: e.target.value })} />
        <input value={s.color} onChange={(e) => setSlot(i, { color: e.target.value })} aria-label={`Slot ${i} hex colour`} />
        <label>Fabric pattern</label><select value={s.pattern} onChange={(e) => setSlot(i, { pattern: e.target.value as typeof s.pattern })}>{FABRIC_PATTERNS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <label>Custom pattern tile URL (optional, SVG preferred)</label><input value={s.patternUrl || ""} placeholder="/patterns/dots.svg or https://…/tile.svg" onChange={(e) => setSlot(i, { patternUrl: e.target.value || undefined, patternFormat: e.target.value.toLowerCase().endsWith(".png") ? "png" : "svg" })} />
        <small className="muted">Overrides the built-in motif above. It is linked, not embedded, in the shareable quilt.json — except that the standalone SVG still embeds a reference to it.</small>
        <div><button className="secondary" onClick={() => setBrush(i)}>Use as paintbrush</button></div>
      </div>))}
    </div>
    <div>
      <button className="secondary" onClick={() => setBrush("cycle")}>Paintbrush: cycle colours {brush === "cycle" ? "(active)" : ""}</button>
      <button className="secondary" onClick={() => setQuilt((q) => ({ ...q, overrides: {} }))}>Clear piece painting</button>
      <button className="secondary" onClick={() => set({ rotationMode: quilt.rotationMode === "random" ? "none" : "random" })}>Shuffle rotations</button>
      <span className="muted"> Click a piece below to {brush === "cycle" ? "cycle its colour" : `paint it slot ${brush}`}. Clicking a piece back to its original colour removes the override.</span>
    </div>
    <div ref={wrapRef} style={{ maxWidth: 760, margin: "16px 0" }}><QuiltSvg quilt={quilt} cell={64} onPieceClick={onPieceClick} /></div>
    {notice && <div className="callout">{notice}</div>}
    <h2>Save, export, share</h2>
    <div>
      <button onClick={saveToXdgFolder}>Save to $XDG_CONFIG folder…</button>
      <button className="secondary" onClick={() => download(`${quilt.id}.json`, JSON.stringify(quilt, null, 2))}>Download quilt JSON (editable)</button>
      <button onClick={() => { try { download(`${quilt.id}.full.json`, JSON.stringify(buildFullQuilt(quilt), null, 2)); setNotice("Shareable full quilt downloaded: every piece as SVG geometry, a standalone SVG, and links to the pattern tiles (SVG preferred)."); } catch (e) { setNotice(`Could not build the full quilt: ${String(e)}`); } }}>Download shareable quilt.json (full SVG)</button>
      <button className="secondary" onClick={() => download(`${quilt.id}-palette.json`, JSON.stringify({ schema: "mcquilter.palette.v1", id: `${quilt.id}-palette`, name: `${quilt.name} palette`, slots: quilt.palette }, null, 2))}>Download palette JSON</button>
      <button className="secondary" onClick={exportSvg}>Download SVG</button>
      <button className="secondary" onClick={exportPng}>Download PNG</button>
      <button className="secondary" onClick={async () => { const url = `${window.location.origin}${window.location.pathname}?q=${encodeShare(quilt)}`; try { await navigator.clipboard.writeText(url); setNotice("Share link copied — anyone opening it gets this exact quilt."); } catch { setNotice(`Share link: ${url}`); } }}>Copy share link</button>
      <label>Load a quilt JSON file</label><input type="file" accept=".json,application/json" onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
    </div>
    <p className="muted">Your work also autosaves in this browser (localStorage) so a refresh does not lose it. That is <em>not</em> the $XDG_CONFIG save — use Save / Download for a file you can keep, back up, and share. See <Link href="/save">Save to $XDG_CONFIG</Link> for the folder layout and the command-line tool.</p>
    <h2>Size presets</h2>
    <p><button className="secondary" onClick={() => set({ rows: 4, cols: 5 })}>Crib 4×5</button><button className="secondary" onClick={() => set({ rows: 6, cols: 5 })}>Throw 5×6</button><button className="secondary" onClick={() => set({ rows: 8, cols: 6 })}>Twin 6×8</button><button className="secondary" onClick={() => set({ rows: 8, cols: 8 })}>Queen 8×8</button></p>
  </>);
}
export default function SimulatorPage() {
  return <Suspense fallback={<p>Loading simulator…</p>}><SimulatorInner /></Suspense>;
}
