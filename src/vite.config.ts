import path from "path";

import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import devtoolsJson from "vite-plugin-devtools-json";
import { VitePWA } from "vite-plugin-pwa";

export const baseConfigurationAlias = {
  "@persistence": path.resolve(__dirname, "./app/features/db.server/index.ts"),
  "@features": path.resolve(__dirname, "./app/features"),
  "@routes": path.resolve(__dirname, "./app/routes"),
  "@components": path.resolve(__dirname, "./app/components/"),
  "@config/server": path.resolve(__dirname, "./app/config.server.ts"),
  "@config": path.resolve(__dirname, "./app/config.ts")
};

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
      },
      devOptions: {
        enabled: true,
        suppressWarnings: true,
        navigateFallback: undefined,
        type: "module"
      },
    }),
  ],
  resolve: {
    alias: baseConfigurationAlias
  }
});
