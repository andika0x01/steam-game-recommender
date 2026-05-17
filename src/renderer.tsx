import { jsxRenderer } from 'hono/jsx-renderer'
import { Link, ViteClient } from 'vite-ssr-components/hono'
import { Nav } from './components/Nav'

export const renderer = jsxRenderer(({ children, title }, c) => {
  const steamId = c.var.steamId // We'll need to pass this via middleware
  
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title ? `${title} | Steam Recommender` : 'Steam Game Recommender'}</title>
        <ViteClient />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap" rel="stylesheet" />
        <Link href="/src/style.css" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: `
          document.addEventListener('error', function(e) {
            if (e.target.tagName !== 'IMG') return;
            const img = e.target;
            const src = img.src;
            
            if (src.includes('steamstatic.com/steam/apps/')) {
              if (src.includes('library_600x900.jpg')) {
                // Step 1: Fallback ke Header (Horizontal)
                img.src = src.replace('library_600x900.jpg', 'header.jpg');
                img.style.objectFit = 'contain';
                img.style.padding = '10px';
              } else if (src.includes('header.jpg')) {
                // Step 2: Fallback ke Logo Steam (Jika Header juga 404)
                img.src = 'https://community.cloudflare.steamstatic.com/public/shared/images/header/logo_steam.svg';
                img.style.objectFit = 'contain';
                img.style.background = '#1a1a1a';
                img.style.padding = '40px';
              }
            }
          }, true);
        ` }} />
      </head>
      <body className="min-h-[100dvh] bg-background text-foreground selection:bg-white/20 pt-20">
        <Nav steamId={steamId} />
        <div className="fixed inset-0 z-50 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
        <main>{children}</main>
      </body>
    </html>
  )
})
