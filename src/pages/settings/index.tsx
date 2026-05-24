import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import React from "react";
import { SteamAPI } from "../../lib/steam";

const app = new Hono<{ Bindings: any }>();

app.get("/", async (c) => {
  const steamId = getCookie(c, "steam_id");

  if (!steamId) return c.redirect("/");

  const steamAPI = new SteamAPI(c.env.STEAM_API_KEY, c.env.KV);
  const players = await steamAPI.getPlayerSummaries([steamId]);
  const player = players.length > 0 ? players[0] : null;

  return c.render(
    <div className="max-w-4xl mx-auto px-6 py-20 space-y-12">
      <header className="space-y-4">
        <h2 className="text-4xl font-bold tracking-tighter">Settings</h2>
        <p className="text-zinc-400">Atur preferensi akun dan sistem rekomendasi Anda.</p>
      </header>

      <div className="grid grid-cols-1 gap-8">
        <section className="glass p-8 rounded-[2.5rem] border-white/10 bg-white/[0.02] space-y-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-bold">Akun Steam</h3>
                <p className="text-sm text-zinc-500">Akun yang saat ini terhubung via OpenID.</p>
              </div>
              <a href="/auth/login" className="px-4 py-2 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-200 transition-all">
                Ganti Akun
              </a>
            </div>

            <div className="flex items-center gap-4 p-5 rounded-3xl bg-white/[0.03] border border-white/5">
              <img src={player?.avatarfull} className="w-16 h-16 rounded-2xl border border-white/10" alt={player?.personaname} />
              <div>
                <p className="font-bold text-xl text-white">{player?.personaname || "Unknown"}</p>
                <p className="text-xs font-mono text-zinc-500">{steamId}</p>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-bold">Manual Steam ID Override</h3>
              <p className="text-sm text-zinc-500">Ganti Steam ID secara manual jika ingin melihat library akun lain (profil harus publik).</p>
            </div>

            <form action="/settings/manual" method="POST" className="flex gap-3">
              <input
                type="text"
                name="steam_id"
                placeholder="Contoh: 76561198000000000"
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-orange-500 transition-colors text-white"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-zinc-800 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-700 transition-all border border-white/10"
              >
                Update ID
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>,
    { title: "Settings" } as any
  );
});

app.post("/manual", async (c) => {
  const body = await c.req.parseBody();
  const steamId = body.steam_id as string;
  if (steamId && /^\d{17}$/.test(steamId)) {
    setCookie(c, "steam_id", steamId, { path: "/", maxAge: 60 * 60 * 24 * 7 });
  }
  return c.redirect("/settings");
});

export default app;
