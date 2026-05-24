import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import React from "react";
import { SteamAPI } from "../../lib/steam";
import { FuzzyOwnGamesScorer } from "../../lib/fuzzy-own-games-scorer";
import { FuzzyNonOwnGamesScorer as Scorer2 } from "../../lib/fuzzy-non-own-games-scorer";
import { GameCard } from "../../components/GameCard";
import { getIdrRate } from "../../lib/currency";
import { InfiniteGrid } from "../../components/InfiniteGrid";
import { buildUserProfile, calculateWeightedSimilarity } from "../../lib/simple-recommendation";

const app = new Hono<{ Bindings: any; Variables: any }>();

app.get("/", async (c) => {
  const steamId = getCookie(c, "steam_id");
  if (!steamId) return c.redirect("/");

  const idrRate = await getIdrRate(c);
  const budgetQuery = c.req.query("budget");
  const budgetIDR = budgetQuery ? parseInt(budgetQuery) : 0;

  const steamAPI = new SteamAPI(c.env.STEAM_API_KEY, c.env.KV);
  const userGames = await steamAPI.getOwnedGames(steamId);

  const { publisherScores, tagWeights } = await buildUserProfile(steamAPI, userGames, steamId);

  const topProfileTags = Object.entries(tagWeights)
    .sort(([, left], [, right]) => (right as number) - (left as number))
    .slice(0, 8);

  const latexName = (value: string) => value.replace(/\\/g, "\\textbackslash{}").replace(/_/g, "\\_").replace(/&/g, "\\&");
  const topProfileTagLatexRows = topProfileTags
    .map(([tag, weight], index) => `W_{\\mathrm{${latexName(tag)}}} &= ${Number(weight).toFixed(3)}\\quad\\text{rank ${index + 1}}`)
    .join("\\\\");

  // Kita tetap butuh discoveryItems untuk pre-render grid bawah
  let discoveryItems: any[] = [];
  try {
    const saleResults = await steamAPI.searchGames({ specials: true, cc: "id" });
    const nonOwnScorer = new Scorer2();

    discoveryItems = saleResults
      .slice(0, 24)
      .map((r) => {
        // Mock minimal data for discoveryItems pre-render if needed,
        // but InfiniteGrid will fetch actual details anyway.
        return { appid: r.id, name: r.name, hideTags: true };
      })
      .filter((i) => i.appid);
  } catch (e) {
    console.error("Discovery pre-render error:", e);
  }

  return c.render(
    <>
      <div data-hydrate="AnalyzerModal"></div>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 space-y-16 md:space-y-24">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-12">
          <div className="space-y-6 max-w-2xl">
            <div className="flex flex-col gap-4">
              <div className="inline-flex items-center gap-3 px-3 py-1 bg-white/5 border border-white/10 rounded-full w-fit">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Pure Steam Value Engine Active</span>
              </div>
            </div>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9]">
              Recom
              <br />
              <span className="text-white/20 outline-text">mendation</span>
            </h2>
            <p className="text-zinc-400 text-base md:text-lg leading-relaxed">
              Sistem kami memindai katalog resmi Steam Indonesia untuk menemukan penawaran yang paling sesuai dengan profil bermain Anda.
            </p>

            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">Kurs Konversi Wise</p>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase leading-[0.9]">1 USD = Rp{idrRate.toLocaleString("id-ID")}</h1>
            </div>

            {/* React Optimization Engine */}
            <div data-hydrate="OptimizationApp" data-props={JSON.stringify({ defaultBudget: budgetIDR })}>
              <div className="w-full">
                <form className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-8">
                  <div className="relative flex-1 max-w-sm">
                    <input
                      type="number"
                      name="budget"
                      placeholder="Target Budget (IDR)..."
                      defaultValue={budgetIDR > 0 ? budgetIDR.toString() : ""}
                      className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                      required
                      min="1000"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest text-zinc-500 pointer-events-none">IDR</div>
                  </div>
                  <button
                    type="submit"
                    className="px-8 py-4 bg-orange-500 text-black text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-orange-400 active:scale-95 transition-all shadow-xl shadow-orange-500/10 whitespace-nowrap"
                  >
                    Mulai Optimasi
                  </button>
                </form>
              </div>
            </div>

            <div className="space-y-6 pt-10 border-t border-white/5">
              <div className="flex flex-col md:flex-row gap-10 items-start">
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-600">Source Data Engine</p>
                    <p className="text-sm leading-relaxed text-zinc-500">
                      Rekomendasi dibentuk dari top tags library yang sudah diberi bobot fuzzy, review Steam, volume review, dan affinity publisher. Nilai similarity kandidat
                      dihitung dari jumlah bobot tag kandidat yang cocok.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {topProfileTags.map(([tag, weight]) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-300 transition-colors hover:border-orange-500/30"
                      >
                        {tag} <span className="ml-1 font-mono text-orange-400">{(weight as number).toFixed(1)}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="w-full md:w-72 shrink-0 rounded-3xl border border-orange-500/10 bg-orange-500/[0.03] p-5 text-[10px] leading-relaxed text-zinc-500 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/5 blur-2xl rounded-full -mr-8 -mt-8" />
                  <div className="overflow-x-auto py-1 text-zinc-300 [&_.mjx-container]:my-0 [&_.mjx-container]:text-left">
                    {`\\[
  \\begin{aligned}
  W_t &= \\sum_{g\\in L,\\ t\\in T_g} score_g\\\\
  ${topProfileTagLatexRows || "W_t &= 0"}\\\\
  s &= \\frac{\\sum_{t\\in C\\cap P}W_t}{\\sum_{i=1}^{|C|}W_{(i)}}
  \\end{aligned}
  \\]`}
                  </div>
                  <p className="mt-3 text-[9px] font-medium opacity-50 group-hover:opacity-100 transition-opacity">
                    *Matematika pembobotan tag profil vs kandidat (C) untuk menentukan skor relevansi.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="optimization-results-portal"></div>

        <div className="space-y-10">
          <div className="flex items-center gap-6">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10" />
            <h3 className="text-xs font-black uppercase tracking-[0.5em] text-zinc-500 whitespace-nowrap">Market Discovery</h3>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10" />
          </div>
          <div data-hydrate="InfiniteGrid" data-props={JSON.stringify({ initialItems: [], endpoint: "/api/recommendation-deals", type: "deal" })}>
            <div className="space-y-10">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-6 md:gap-10">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-white/5 rounded-[2rem] animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <script
          dangerouslySetInnerHTML={{
            __html: `
          if (typeof document !== 'undefined') {
            document.addEventListener('click', function(e) {
              var trigger = e.target.closest('.recommendation-card-trigger');
              if (trigger) {
                var gameData = trigger.getAttribute('data-game');
                if (gameData) {
                  window.dispatchEvent(new CustomEvent('open-analyzer-modal', { detail: JSON.parse(gameData) }));
                }
              }
            });
          }
        `,
          }}
        />
      </div>
    </>,
    { title: "Recommendation" } as any
  );
});

export default app;
