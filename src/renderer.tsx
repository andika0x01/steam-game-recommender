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
        <Link href="/static/src/style.css" rel="stylesheet" />
      </head>
      <body className="min-h-[100dvh] bg-background text-foreground selection:bg-white/20 pt-20">
        <Nav steamId={steamId} />
        <div className="fixed inset-0 z-50 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
        <main>{children}</main>
      </body>
    </html>
  )
})
