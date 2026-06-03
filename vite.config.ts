import { createHash } from "crypto";
import path from "path";

import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export const baseConfigurationAlias = {
  "@persistence": path.resolve(__dirname, "./src/features/db.server/index.ts"),
  "@features": path.resolve(__dirname, "./src/features"),
  "@routes": path.resolve(__dirname, "./src/routes"),
  "@components": path.resolve(__dirname, "./src/components/"),
  "@config/server": path.resolve(__dirname, "./src/config.server.ts"),
  "@config": path.resolve(__dirname, "./src/config.ts")
};

// Minimal inline replacement for vite-plugin-devtools-json (no Vite 8 release yet).
// Serves /.well-known/appspecific/com.chrome.devtools.json during `npm run dev` so
// Chrome DevTools can set up Automatic Workspace Folders.
function devtoolsJson(): Plugin {
  const endpoint = "/.well-known/appspecific/com.chrome.devtools.json";
  return {
    name: "devtools-json",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url || new URL(req.url, "http://localhost").pathname !== endpoint) {
          next();
          return;
        }
        const root = server.config.root;
        // Stable per-workspace UUID derived from the root (RFC 4122 v4 layout).
        const h = createHash("sha256").update(root).digest("hex");
        const uuid = `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-${((parseInt(h[16], 16) & 0x3) | 0x8).toString(16)}${h.slice(17, 20)}-${h.slice(20, 32)}`;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ workspace: { root, uuid } }));
      });
    },
  };
}

export default defineConfig({
  logLevel: "info",
  clearScreen: false,
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    reactRouter(),
    devtoolsJson(),
    VitePWA({
      outDir: "build/client",
      registerType: "autoUpdate",
      injectRegister: false, // registered manually in entry.client.tsx
      pwaAssets: {
        disabled: false,
        config: true
      },
      manifest: {
        id: "/",
        name: "BiteRoulette",
        short_name: "BiteRoulette",
        description: "The lazy way to decide where to eat.",
        theme_color: "#c25644",
        display: "standalone",
        screenshots: [
          {
            "src": "screenshot-mobile.png",
            "sizes": "585x1266",
            "type": "image/png",
            "form_factor": "narrow",
            "label": "Mobile Home Screen"
          },
          {
            "src": "screenshot-desktop.png",
            "sizes": "1920x1080",
            "type": "image/png",
            "form_factor": "wide",
            "label": "Desktop Home Screen"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        navigateFallback: null,
      },
      devOptions: {
        enabled: true,
        suppressWarnings: true,
        type: "module"
      },
    }),
  ],
  resolve: {
    alias: baseConfigurationAlias
  }
});
