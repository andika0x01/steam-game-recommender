import { reactRenderer, useRequestContext } from "@hono/react-renderer";
import { Link, Script, ViteClient, ReactRefresh } from "vite-ssr-components/react";
import { Nav } from "./components/Nav";

declare module "hono" {
  interface ContextRenderer {
    (content: React.ReactNode, props?: { title?: string }): Response;
  }
}

export const renderer = reactRenderer(({ children, title, c }: { children?: React.ReactNode; title?: string; c?: any }) => {
  const steamId = c?.var?.steamId;

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title ? `${title} | Steam Recommender` : "Steam Game Recommender"}</title>
        <ReactRefresh />
        <ViteClient />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap" rel="stylesheet" />
        <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
        <Link href="/src/style.css" rel="stylesheet" />
        <Script src="/src/client.tsx" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
          document.addEventListener('error', function(e) {
            if (e.target.tagName !== 'IMG') return;
            const img = e.target;
            if (img.src.includes('steamstatic.com/steam/apps/') && img.src.includes('library_600x900.jpg')) {
              img.src = 'https://placehold.co/600x900/1a1a1a/666666.svg?text=NO+COVER';
            }
          }, true);
        `,
          }}
        />
      </head>
      <body className="min-h-[100dvh] bg-background text-foreground selection:bg-white/20 pt-20">
        <Nav steamId={steamId} />
        <div className="fixed inset-0 z-50 pointer-events-none opacity-[0.03] bg-[url('/noise.svg')]"></div>
        <main id="root">{children}</main>
      </body>
    </html>
  );
});
