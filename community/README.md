# Community quilts & palettes

Shared designs from McQuilter users. Every file here is plain JSON in the
`mcquilter.*.v1` format, licensed CC0-1.0 unless the file says otherwise,
so anyone can open it in the simulator, remix it, and sew it.

## Layout

- `quilts/<id>.json` — a full quilt (`mcquilter.quilt.v1`)
- `palettes/<id>.json` — a colour + fabric-pattern palette (`mcquilter.palette.v1`)
- `patterns/` — reserved for named block+palette combos; currently quilts cover this

## Rules

1. File name must equal the `id` inside the file (`my-quilt.json` holds `"id": "my-quilt"`).
2. It must pass `npm run validate-community` (schema, known block, `#rrggbb` colours, known fabric patterns).
3. No personal data beyond what you choose to put in `author` / `notes`.

See the site's Share page for the fork → PR workflow, or run:

```sh
node tools/mcquilter.mjs share --id my-first-quilt --repo .
```
