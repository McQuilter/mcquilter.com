import Link from "next/link";
export default function Share() {
  return (<>
    <h1>Share your colours &amp; patterns</h1>
    <p className="lede">Sharing is a git pull request. No account on this site, no upload form, no moderation queue hidden behind a login — you fork the repo, add your file, and open a PR. Anyone can then validate your file and open it in the simulator.</p>
    <h2>Step by step</h2>
    <ol>
      <li>Design in the <Link href="/simulator">simulator</Link> and download your quilt or palette JSON (or save it via the CLI: <code>node tools/mcquilter.mjs export --id my-first-quilt &gt; my-first-quilt.json</code>).</li>
      <li>Fork <code>McQuilter/mcquilter.com</code> on GitHub.</li>
      <li>Put the file in the right folder, named by its <code>id</code>: quilts go in <code>community/quilts/&lt;id&gt;.json</code>, palettes in <code>community/palettes/&lt;id&gt;.json</code>. A shareable full quilt goes in the same folder as <code>community/quilts/&lt;id&gt;.full.json</code> — it contains every piece as SVG, a standalone SVG, and links to its pattern tiles (SVG preferred). Set <code>license</code> to <code>CC0-1.0</code> unless you have a reason not to — that is the default for community files, so others can freely reuse them.</li>
      <li>Run the validator before you push: <code>npm run validate-community</code> (or <code>node tools/validate-community.mjs</code>). It checks the schema, the block id, hex colours, and that the file name matches the id.</li>
      <li>Commit, push, and open a pull request. A good PR title is <code>community: add quilt my-first-quilt</code>. Maintainers merge files that validate; design taste is not a merge criterion.</li>
    </ol>
    <h2>From the command line</h2>
    <pre>{`# Copy one of your saved quilts into a checkout of the site repo and prep a commit:
node tools/mcquilter.mjs share --id my-first-quilt --repo ~/src/mcquilter.com
cd ~/src/mcquilter.com
git add community/quilts/my-first-quilt.json
git commit -m "community: add quilt my-first-quilt"
git push -u origin add-my-first-quilt
gh pr create --title "community: add quilt my-first-quilt" --body "Shared from my \\$XDG_CONFIG/mcquilter collection."
`}</pre>
    <p className="muted">The <code>share</code> command only copies and validates. It never pushes or opens a PR by itself — that step is yours, so nothing is published accidentally.</p>
    <h2>If the community outgrows this repo</h2>
    <p>If <code>community/</code> gets large, the intended next step is to split it into its own repo — say, <code>McQuilter/mcquilter-patterns</code> — with the same file layout and the same validator. Nothing in the file format changes; only the clone URL does. The site will link to whichever repo is current.</p>
    <h2>What you are sharing, exactly</h2>
    <p>A JSON file with a name, a block, colours, and patterns. No personal data is in the file unless you put it in <code>author</code> or <code>notes</code> yourself. Check the file before you commit — it is plain text, so a quick read is the whole privacy review.</p>
    <h2>Starter community files</h2>
    <p>The repo already ships three examples in <code>community/</code> — a Log Cabin in Autumn colours, an Ohio Star in Indigo, and a Gee&apos;s Bend-inspired palette — so the format is visible even before anyone else shares. Open any of them in the simulator by loading the file.</p>
  </>);
}
