/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully static: `next build` writes ./out, deployable to GitHub Pages,
  // Netlify, Cloudflare Pages, or any static host. No server, no database.
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};
export default nextConfig;
