import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";
import ssrPlugin from "vite-ssr-components/plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare(), ssrPlugin()],
  build: {
    rollupOptions: {
      input: {
        client: "src/client.tsx",
        style: "src/style.css",
      },
    },
  },
});
