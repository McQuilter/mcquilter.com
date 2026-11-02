import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = {
  title: "McQuilter — A History of Quilts, and a Simulator to Make Your Own",
  description: "Every common quilt style, the history of quilting, and a free simulator to design a quilt in your own colours and patterns — saveable and shareable.",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"><body>
      <header className="site">
        <Link className="brand" href="/">🧵 McQuilter</Link>
        <nav>
          <Link href="/history">History</Link>
          <Link href="/quilts">Every quilt</Link>
          <Link href="/simulator">Simulator</Link>
          <Link href="/save">Save to $XDG_CONFIG</Link>
          <Link href="/share">Share</Link>
        </nav>
      </header>
      <main>{children}</main>
      <footer>
        McQuilter is a static site — no account, no tracking, no server. Your designs live in your browser until you choose to export them.
        <br />Design polygons are a design aid, not cutting diagrams: real cutting needs seam allowances and a piecing order.
      </footer>
    </body></html>
  );
}
