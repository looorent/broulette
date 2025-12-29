import path from "path";

import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import devtoolsJson from "vite-plugin-devtools-json";

export const baseConfigurationAlias = {
  "@persistence": path.resolve(__dirname, "./app/features/generated/prisma.server"),
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
    devtoolsJson()
  ],
  resolve: {
    alias: baseConfigurationAlias,
    dedupe: ["react", "react-dom", "@prisma/client"]
  }
});
