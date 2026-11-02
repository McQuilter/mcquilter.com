# mcquilter.com

A history of quilts, a catalogue of every common quilt style, and a
simulator to design your own quilt — as a fully static Next.js site.
No server, no account, no database.

## Run it

```sh
npm install
npm run dev      # http://localhost:3000
npm run build    # static export into ./out — deploy that folder anywhere
```

Deploy `./out` to GitHub Pages (see `.github/workflows/pages.yml`),
Netlify, Cloudflare Pages, or any static host.

## What's here

- `app/history/` — quilt history, from ancient padded clothing through
  Gee's Bend and the AIDS Memorial Quilt. The Underground Railroad
  quilt-code story is presented as folklore, because no contemporary
  documentary evidence for it has been found.
- `app/quilts/` — 26 common blocks, grouped by family, each with its own
  page and a simulator preset.
- `app/simulator/` — design a quilt: block, grid, layout, rotations,
  colours, fabric patterns (built-in or a custom SVG/PNG tile URL),
  piece-by-piece painting. Exports SVG, PNG, editable JSON, a share
  link, and the shareable full quilt JSON.
- `app/save/` + `app/share/` — how saving to `$XDG_CONFIG/mcquilter`
  and sharing via git pull requests work.
- `lib/quilts.ts` — the block library (polygons per block).
- `lib/full-quilt.ts` — builds the shareable format (see below).
- `public/patterns/*.svg` — reusable SVG pattern tiles, served at
  `/patterns/*.svg`.
- `community/` — shared quilts and palettes (CC0 unless stated).
- `tools/mcquilter.mjs` — Node-only CLI for the XDG folder.
- `tools/validate-community.mjs` — validator for community files.

## Two quilt.json formats (see `docs/quilt-json.md`)

- **Editable** `mcquilter.quilt.v1` (`<id>.json`): block id + palette +
  overrides. Small, for designing and saving.
- **Shareable** `mcquilter.quilt-full.v1` (`<id>.full.json`): the entire
  quilt explicitly — every piece as SVG coordinates + path, a standalone
  `svg` string, links to pattern tiles (SVG preferred, PNG accepted),
  and the editable `source` for round-tripping. Generate it in the
  simulator; never hand-write it.

Validate community files with `npm run validate-community`.
Validate your XDG folder with `node tools/mcquilter.mjs validate`.
