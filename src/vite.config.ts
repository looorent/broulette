import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import devtoolsJson from "vite-plugin-devtools-json";
import { reactRouterDevTools } from "react-router-devtools";
import path from "path";

export const baseConfigurationAlias = {
  "@persistence": path.resolve(__dirname, "./app/features/generated/prisma.server"),
  "@features": path.resolve(__dirname, "./app/features"),
  "@routes": path.resolve(__dirname, "./app/routes"),
  "@components": path.resolve(__dirname, "./app/components/"),
  "@config": path.resolve(__dirname, "./app/config.ts"),
};

export default defineConfig({
  plugins: [reactRouterDevTools(), tailwindcss(), reactRouter(), tsconfigPaths(), devtoolsJson()],
  resolve: {
    alias: baseConfigurationAlias
  }
});
