import { defineConfig } from "vite";

export default defineConfig({
  base: "/static/",
  build: {
    manifest: true,
    rollupOptions: {
      input: "./assets/src/scripts/main.js",
    },
    outDir: "assets/dist",
    emptyOutDir: true,
  },
});
