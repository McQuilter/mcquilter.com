export default function Save() {
  return (<>
    <h1>Save your colours &amp; patterns under $XDG_CONFIG/mcquilter</h1>
    <p className="lede">A static website cannot write to your home directory by itself — a browser that could would be a security hole. So McQuilter uses plain files, in a plain folder, that you own. The website exports them; a tiny command-line tool manages them; git shares them.</p>
    <h2>The folder</h2>
    <p>Following the XDG Base Directory specification, McQuilter uses:</p>
    <pre>{`$XDG_CONFIG_HOME/mcquilter/          # if XDG_CONFIG_HOME is set, else:
~/.config/mcquilter/
├── config.json                     # your defaults (optional)
├── palettes/
│   └── my-palette.json             # mcquilter.palette.v1
├── patterns/
│   └── my-pattern.json             # a named block + palette combo (same quilt schema, rows/cols = 1 is fine)
└── quilts/
    └── my-first-quilt.json         # mcquilter.quilt.v1 — the simulator's export
`}</pre>
    <p>If <code>$XDG_CONFIG_HOME</code> is unset or empty, <code>~/.config</code> is the fallback — exactly as the XDG spec says. Never hard-code <code>~/.config</code> when the variable is set.</p>
    <h2>Three ways to save</h2>
    <ol>
      <li><strong>In the simulator, “Save to $XDG_CONFIG folder…”</strong> — in Chromium browsers this opens a folder picker. Pick <code>~/.config/mcquilter</code> (or your <code>$XDG_CONFIG_HOME/mcquilter</code>) and the site writes <code>quilts/&lt;name&gt;.json</code> there directly, using the File System Access API. You grant the folder once; the site cannot touch anything else.</li>
      <li><strong>Download JSON, then move it.</strong> Every other browser: download the file and run <code>mkdir -p ${"${XDG_CONFIG_HOME:-$HOME/.config}"}/mcquilter/quilts &amp;&amp; mv ~/Downloads/my-quilt.json ${"${XDG_CONFIG_HOME:-$HOME/.config}"}/mcquilter/quilts/</code> — or use the tool below, which does the same thing.</li>
      <li><strong>With the command-line tool</strong> (in this repo, <code>tools/mcquilter.mjs</code>, Node.js only, no dependencies):<pre>{`node tools/mcquilter.mjs init          # create the folders
node tools/mcquilter.mjs list         # list your palettes, patterns, quilts
node tools/mcquilter.mjs import ~/Downloads/my-quilt.json
node tools/mcquilter.mjs validate     # check everything in the folder
node tools/mcquilter.mjs export --id my-first-quilt   # print a quilt to stdout
`}</pre></li>
    </ol>
    <h2>What a file looks like</h2>
    <p>A quilt file is small, human-readable JSON. This is the whole format — no database, no binary blobs:</p>
    <pre>{`{
  "schema": "mcquilter.quilt.v1",
  "id": "my-first-quilt",
  "name": "My first quilt",
  "block": "ohio-star",
  "rows": 5, "cols": 5,
  "layout": "straight",
  "rotationMode": "none",
  "palette": [
    { "color": "#c1121f", "pattern": "solid" },
    { "color": "#111111", "pattern": "solid" },
    { "color": "#f4a261", "pattern": "solid" },
    { "color": "#2a9d8f", "pattern": "solid" }
  ],
  "overrides": { "0,0,3": 2 }
}`}</pre>
    <p><code>overrides</code> is the piece painting: <code>"row,col,pieceIndex": slot</code>. A palette file is the same idea without a block: <code>{"{"}"schema": "mcquilter.palette.v1", "id": "...", "name": "...", "slots": [...]{"}"}</code>. Full schema notes are in <code>docs/xdg-config.md</code> in the repo.</p>
    <h2>The shareable version of the same file</h2>
    <p>The simulator also exports a <strong>shareable quilt.json</strong> (<code>mcquilter.quilt-full.v1</code>, named <code>&lt;id&gt;.full.json</code>): every piece as SVG coordinates and path, a standalone SVG string, and links to the pattern tiles used (SVG preferred, PNG accepted). It lives in the same <code>quilts/</code> folder, alongside the editable version, and it is the file to publish or send to someone who does not run McQuilter. See <code>docs/quilt-json.md</code> for the full format.</p>
    <h2>Backups</h2>
    <p>Because these are plain files, any backup that covers <code>~/.config</code> covers your quilts. For extra safety, keep the folder itself in git (a private repo is fine) — which leads directly to sharing.</p>
  </>);
}
