import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import React from "react";
import { SteamAPI } from "../../lib/steam";
import { GameCard } from "../../components/GameCard";

const app = new Hono<{ Bindings: any }>();

app.get("/", async (c) => {
  const steamId = getCookie(c, "steam_id");
  if (!steamId) return c.redirect("/");

  const steamAPI = new SteamAPI(c.env.STEAM_API_KEY, c.env.KV);
  const players = await steamAPI.getPlayerSummaries([steamId]);
  const player = players.length > 0 ? players[0] : null;
  const games = await steamAPI.getOwnedGames(steamId);

  if (!player) return c.redirect("/auth/logout");

  const sortedGames = games.sort((a, b) => b.playtime_forever - a.playtime_forever);
  const cleanTopGames = await steamAPI.getCleanDetailedGames(sortedGames, 12);

  const totalPlaytimeMinutes = games.reduce((acc, g) => acc + g.playtime_forever, 0);
  const totalPlaytimeHours = (totalPlaytimeMinutes / 60).toFixed(0);
  const avgPlaytime = games.length > 0 ? totalPlaytimeMinutes / games.length : 0;

  let archetype = "The Initiate";
  let badgeColor = "bg-zinc-500";

  if (games.length > 100 && avgPlaytime < 300) {
    archetype = "The Collector";
    badgeColor = "bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)]";
  } else if (avgPlaytime > 3000) {
    archetype = "The Completionist";
    badgeColor = "bg-orange-600 shadow-[0_0_15px_rgba(249,115,22,0.3)]";
  } else if (games.length < 20 && totalPlaytimeMinutes > 10000) {
    archetype = "The Specialist";
    badgeColor = "bg-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)]";
  } else if (games.length > 50) {
    archetype = "The Explorer";
    badgeColor = "bg-orange-700 shadow-[0_0_15px_rgba(249,115,22,0.3)]";
  }

  return c.render(
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 space-y-12 md:space-y-16">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 md:gap-12 border-b border-white/5 pb-12">
        <div className="flex items-center gap-6 md:gap-8">
          <div className="relative group shrink-0">
            <div className="absolute -inset-2 bg-gradient-to-tr from-orange-500/20 to-transparent rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
            <img src={player.avatarfull} alt={player.personaname} className="relative w-20 h-20 md:w-32 md:h-32 rounded-2xl transition-all duration-700 border border-white/10" />
          </div>
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tighter truncate">{player.personaname}</h2>
              <span className={`${badgeColor} text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full text-white`}>{archetype}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full shrink-0 ${player.personastate > 0 ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" : "bg-zinc-600"}`} />
              <p className="text-zinc-400 font-mono text-[10px] md:text-xs uppercase tracking-widest truncate">
                {player.personastate > 0 ? "Online" : "Offline"} • {steamId}
              </p>
            </div>
          </div>
        </div>
      </header>

      {games.length === 0 && (
        <div className="glass p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border-white/10 bg-white/[0.02] space-y-8 max-w-3xl mx-auto md:mx-0">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-white">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 shrink-0" stroke="currentColor" strokeWidth="2.5">
                <path
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <h3 className="text-lg md:text-xl font-black tracking-tight uppercase">Akses Library Diperlukan</h3>
            </div>
            <p className="text-zinc-400 text-sm">Steam mengembalikan koleksi kosong. Ikuti langkah-langkah ini untuk menyinkronkan library Anda:</p>
          </div>

          <div className="space-y-6">
            <ol className="space-y-4">
              {[
                { step: "01", text: "Buka Profil Steam Anda di browser atau aplikasi." },
                { step: "02", text: "Klik tombol 'Edit Profile'." },
                { step: "03", text: "Navigasi ke tab 'Privacy Settings' di sidebar." },
                { step: "04", text: "Atur 'Game Details' menjadi 'Public'." },
              ].map((item) => (
                <li key={item.step} className="flex gap-4 md:gap-6 group">
                  <span className="font-mono text-zinc-500 text-xs pt-1 group-hover:text-white transition-colors">{item.step}</span>
                  <p className="text-zinc-300 text-sm group-hover:text-zinc-100 transition-colors">{item.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-4 glass p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] flex flex-col justify-between group border-white/5 hover:border-orange-500/20 transition-colors">
          <div className="space-y-2">
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Total Library</p>
            <p className="text-6xl md:text-8xl font-black tracking-tighter group-hover:scale-110 transition-transform origin-left text-white group-hover:text-orange-500">
              {games.length}
            </p>
          </div>
          <div className="space-y-4">
            <div className="pt-4 border-t border-white/5">
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Investasi Waktu</p>
              <p className="text-3xl font-black tracking-tighter text-white">{totalPlaytimeHours}j</p>
            </div>
          </div>
        </div>

        <div className="md:col-span-8 glass p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] space-y-8 border-white/5">
          <div className="flex items-center justify-between">
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Mastery Spectrum</p>
            <span className="text-[10px] font-mono text-zinc-400 uppercase">Paling sering dimainkan</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {cleanTopGames.map(({ game }) => (
              <GameCard key={game.appid} appId={game.appid} name={game.name || "Unknown"} actionLabel="Mainkan" />
            ))}
          </div>
        </div>
      </div>
    </div>,
    { title: "Dashboard" } as any
  );
});

export default app;
