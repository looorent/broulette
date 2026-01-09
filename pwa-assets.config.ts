import { defineConfig, minimal2023Preset } from "@vite-pwa/assets-generator/config";

export default defineConfig({
  headLinkOptions: {
    preset: "2023"
  },
  preset: {
    ...minimal2023Preset,
    apple: {
      sizes: [180],
      padding: 0.3,
      resizeOptions: {
        background: "#d56634",
        fit: "contain",
      }
    },
    maskable: {
      sizes: [512],
      padding: 0.3,
      resizeOptions: {
        background: "#d56634"
      }
    }
  },
  images: ["public/favicon.svg"]
});
