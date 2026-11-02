# quilt.json: two formats, one quilt

McQuilter has two JSON formats. They describe the same quilt at different
levels. Keep them straight and sharing stays painless.

## 1. Editable: `mcquilter.quilt.v1` (small, for designing)

The simulator's native save. It names a block and a palette and records
only what you changed:

```json
{
  "schema": "mcquilter.quilt.v1",
  "id": "my-first-quilt",
  "name": "My first quilt",
  "block": "ohio-star",
  "rows": 5, "cols": 5,
  "layout": "straight",
  "rotationMode": "none",
  "palette": [
    { "color": "#c1121f", "pattern": "solid" },
    { "color": "#111111", "pattern": "solid" }
  ],
  "overrides": { "0,0,3": 2 }
}
```

It is tiny, but it only renders inside McQuilter, because only McQuilter
knows what `ohio-star` geometry is. Use it for editing, for
`$XDG_CONFIG/mcquilter/quilts/`, and for the simulator's share link.

A palette on its own is `mcquilter.palette.v1`:

```json
{ "schema": "mcquilter.palette.v1", "id": "gees-bend-bold",
  "name": "Gee's Bend Bold",
  "slots": [{ "color": "#d90429", "pattern": "solid" }] }
```

## 2. Shareable: `mcquilter.quilt-full.v1` (self-contained, for publishing)

This is the file to publish, post, archive, or hand to someone who does
not run McQuilter. It describes the **entire** quilt explicitly:

- `blocks[]` — every block (`row`, `col`, `rotation`, `plain`), and
  every piece inside it:
  - `points` — absolute `[x, y]` coordinates in the quilt's `viewBox`
  - `path` — the same polygon as an SVG path, e.g. `"M10,10 L110,10 L110,110 Z"`
  - `slot`, `fill` (a colour, or `url(#pattern-id)`), `baseColor`, `patternId`
- `svg` — a standalone SVG string of the whole quilt. Paste it into any
  HTML file, save it as `.svg`, or open it directly. It embeds the
  pattern definitions, so it renders even if a pattern link later breaks.
- `patterns[]` — links to the pattern tiles used. **SVG is preferred**;
  PNG is accepted for photographic / scanned fabric:
  ```json
  { "id": "fab-3-gingham", "name": "Gingham", "format": "svg",
    "href": "/patterns/gingham.svg", "repoPath": "public/patterns/gingham.svg",
    "baseColor": "#dda15e" }
  ```
  A pattern tile is a *motif* overlaid on `baseColor`, not a finished
  fabric swatch. The built-in tiles live in `public/patterns/*.svg` and
  are also served by the site at `/patterns/*.svg`, so opening one shows
  the motif on a sample grey ground, and the `<pattern>` definition
  inside it is reusable as-is.
- `source` — the original parametric `mcquilter.quilt.v1` document, so
  a full file round-trips back into the simulator for editing. A full
  file without `source` is render-only: the simulator will say so
  rather than pretend it can edit it.
- `finishedSizeInches`, `blockCount`, `pieceCount`, `viewBox` — the
  bookkeeping a recipient needs without recomputing anything.

File naming: a full file is named `<id>.full.json`
(e.g. `log-cabin-autumn.full.json`), so it never collides with the
editable `<id>.json` for the same quilt. The validator enforces that
`id` matches the file name in both cases.

## Custom pattern links (PNG / SVG)

A palette slot may also carry its own tile:

```json
{ "color": "#2a9d8f", "pattern": "solid",
  "patternUrl": "https://example.com/tiles/my-floral.svg", "patternFormat": "svg" }
```

In the full export that becomes a `patterns[]` entry with
`format: "svg"`, `href` set to your URL, and `custom: true`, and the
piece's `fill` becomes `url(#fab-<slot>-solid)`. PNG works the same way
(`patternFormat: "png"`, href ending in `.png`), but SVG is preferred:
it scales to any quilt size, stays tiny, and can be re-coloured by
overlaying it on `baseColor`, where a PNG cannot.

The simulator has a per-slot "Custom pattern tile URL" field for this.
If you paste a URL you do not control, check the licence before sharing
a quilt that links to it — the link is part of the published file.

## Generating a full file (do not hand-write one)

1. Design in the simulator.
2. Click **Download shareable quilt.json (full SVG)**.
   It writes `<id>.full.json` generated from the block library, so the
   geometry cannot drift from what the simulator shows.
3. Validate it: `node tools/validate-community.mjs` (for community
   files) or `node tools/mcquilter.mjs validate` (for your XDG folder).
4. Share it like any other file: put it in `community/quilts/` and open
   a PR, or send the file itself — the recipient needs nothing else
   to see the quilt, because `svg` is inside it.

## Which file do I share?

- Editing together, or saving for yourself → parametric `.json`.
- Publishing, archiving, embedding in a blog post, or sending to
  someone without McQuilter → shareable `.full.json`.

Both live happily side by side in `$XDG_CONFIG/mcquilter/quilts/`
and in `community/quilts/`.
