/** @type {import('next').NextConfig} */
// basePath is the subpath the site is served from, or "" at a domain root.
// GitHub *project* Pages serves this repo at /mcquilter.com/, not at /,
// so a build with no basePath emits root-absolute /_next/... and /history/
// links that 404 on Pages (the CSS/JS never load, so the site looks
// unstyled and the simulator never hydrates). The Pages workflow builds
// with MCQ_BASE_PATH=/mcquilter.com; a root custom domain, or local dev,
// builds with no basePath at all. NEXT_PUBLIC_BASE_PATH must match, so
// client-side pattern links in quilt.json files get the same prefix.
const basePath = process.env.MCQ_BASE_PATH || "";
const nextConfig = {
  // Fully static: `next build` writes ./out, deployable to GitHub Pages,
  // Netlify, Cloudflare Pages, or any static host. No server, no database.
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  ...(basePath ? { basePath } : {}),
};
export default nextConfig;
