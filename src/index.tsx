import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { renderer } from "./renderer";

import homeApp from "./pages/home";
import authApp from "./pages/auth";
import dashboardApp from "./pages/dashboard";
import analyzerApp from "./pages/analyzer";
import recommendationApp from "./pages/recommendation";
import settingsApp from "./pages/settings";
import apiApp from "./pages/api";

type Bindings = {
  STEAM_API_KEY: string;
  HOST_URL: string;
  ASSETS: Fetcher;
  DB: D1Database;
};

type Variables = {
  steamId?: string;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

const serveAssets = async (c: any, next: any) => {
  if (c.env.ASSETS) {
    try {
      const res = await c.env.ASSETS.fetch(c.req.raw);
      if (res.status !== 404) return res;
    } catch (e) {
      console.error("ASSETS fetch error:", e);
    }
  }
  await next();
};

app.use("/favicon.ico", serveAssets);
app.use("/noise.svg", serveAssets);
app.use("/assets/*", serveAssets);
app.use("/static/*", serveAssets);
app.use("/src/*", serveAssets);

app.use("*", async (c, next) => {
  const steamId = getCookie(c, "steam_id");
  c.set("steamId", steamId);
  await next();
});

app.use(renderer);

app.route("/", homeApp);
app.route("/auth", authApp);
app.route("/dashboard", dashboardApp);
app.route("/analyzer", analyzerApp);
app.route("/recommendation", recommendationApp);
app.route("/settings", settingsApp);
app.route("/api", apiApp);

export default app;
