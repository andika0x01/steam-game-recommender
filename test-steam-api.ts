import { config } from "dotenv";
import { SteamAPI } from "./src/lib/steam";
import { buildUserProfile } from "./src/lib/simple-recommendation";

config({ path: ".dev.vars" });

async function runTest() {
  const apiKey = process.env.STEAM_API_KEY;
  const api = new SteamAPI(apiKey);

  const steamId = "76561198031388047";
  console.log(`Getting games for ${steamId}...`);
  const games = await api.getOwnedGames(steamId);
  console.log(`Found ${games.length} games.`);

  const topPlayed = games
    .filter((g) => g.playtime_forever > 0)
    .sort((a, b) => b.playtime_forever - a.playtime_forever)
    .slice(0, 15);

  console.log(
    "Top 15 App IDs:",
    topPlayed.map((g) => g.appid)
  );

  console.log("Calling getAppStoreDetailsBatch...");
  const details = await api.getAppStoreDetailsBatch(
    topPlayed.map((g) => g.appid),
    "english",
    "id"
  );

  console.log(`Received details array length: ${details.length}`);
  const validDetails = details.filter(Boolean);
  console.log(`Valid details length: ${validDetails.length}`);

  if (validDetails.length === 0) {
    console.log("Wait, why is validDetails 0? Let us try fetching one manually.");
    const singleUrl = `https://store.steampowered.com/api/appdetails?appids=${topPlayed[0].appid}&l=english&cc=id`;
    console.log(`Fetching: ${singleUrl}`);
    const res = await fetch(singleUrl);
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Response text preview: ${text.substring(0, 200)}`);
  }
}

runTest().catch(console.error);
