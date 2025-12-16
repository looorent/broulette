import { defineConfig } from "vite";
import { baseConfigurationAlias } from "./vite.config";

export default defineConfig({
  resolve: {
    alias: baseConfigurationAlias
  },
  build: {
    lib: {
      entry: "./app/console.ts",
      fileName: "console",
      formats: ["es"]
    },
    outDir: "build/console",
    ssr: true,
    emptyOutDir: true,
    rollupOptions: {
      external: [
        "repl"
      ],
      output: {
        entryFileNames: "[name].mjs",
      }
    },
  },
});
