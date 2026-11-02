# $XDG_CONFIG/mcquilter

See also `docs/quilt-json.md` for the two file formats (editable `.json`
vs. shareable `.full.json` — both live in `quilts/`).

## Location

Per the XDG Base Directory specification:

- If `$XDG_CONFIG_HOME` is set and non-empty: `$XDG_CONFIG_HOME/mcquilter`
- Otherwise: `~/.config/mcquilter`

Never hard-code `~/.config` when the variable is set. The CLI
(`tools/mcquilter.mjs`) and the site's Save page both follow this rule.

## Layout

```
mcquilter/
├── config.json          # optional defaults (mcquilter.config.v1)
├── palettes/            # mcquilter.palette.v1, one file per palette
├── patterns/            # reserved for named pattern files (see quilt-json.md)
└── quilts/              # mcquilter.quilt.v1 (editable) and
                         # mcquilter.quilt-full.v1 (shareable, *.full.json)
```

## Why a browser cannot just write there

A website that could write to arbitrary home-directory paths would be a
security hole, so browsers do not allow it. McQuilter therefore offers:

1. **File System Access API** (Chromium): the simulator's "Save to
   $XDG_CONFIG folder…" lets you pick the folder once, then writes
   `quilts/<id>.json` into it for real.
2. **Download + move**: download the JSON and move it, or run
   `node tools/mcquilter.mjs import <downloaded-file>`, which validates
   first and refuses a bad file.
3. **The CLI** for everything else: `init`, `list`, `validate`,
   `export --id`, `share --id --repo` (copy + validate only; pushing
   and opening a PR are always your explicit next steps).
