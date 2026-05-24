import { config } from "dotenv";
import { SteamAPI } from "./src/lib/steam";
import { getSimpleRecommendations } from "./src/lib/simple-recommendation";

config({ path: ".dev.vars" });

async function test() {
  const steamId = "76561198083812702";
  const apiKey = process.env.STEAM_API_KEY;

  if (!apiKey) {
    console.error("STEAM_API_KEY not found in .dev.vars");
    return;
  }

  const api = new SteamAPI(apiKey);
  console.log("Fetching owned games...");
  const games = await api.getOwnedGames(steamId);
  console.log(`Found ${games.length} games.`);

  if (games.length === 0) {
    console.error("No games found for this ID. The engine requires games to build a profile. Trying ID 76561198031388047");
    const games2 = await api.getOwnedGames("76561198031388047");
    console.log(`Found ${games2.length} games for ID 2.`);

    console.log("Fetching recommendations...");
    const recommendations = await getSimpleRecommendations(api, games2, 12, 1, "76561198031388047");
    console.log(`Got ${recommendations.length} recommendations!`);
    return;
  }

  console.log("Fetching recommendations...");
  const recommendations = await getSimpleRecommendations(api, games, 12, 1, steamId);
  console.log(`Got ${recommendations.length} recommendations!`);
}

test().catch(console.error);
