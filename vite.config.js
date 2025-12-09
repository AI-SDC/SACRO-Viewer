import { defineConfig } from "vite";

export default defineConfig({
  base: "/static/",
  build: {
    manifest: true,
    rollupOptions: {
      input: [
        "./assets/src/scripts/base.js",
        "./assets/src/scripts/index.js",
        "./assets/src/scripts/review.js",
        "./assets/src/scripts/researcher.js",
      ],
    },
    outDir: "assets/dist",
    emptyOutDir: true,
  },
});
