import { defineConfig } from "vite";

export default defineConfig({
  base: "/static/",
  build: {
    manifest: true,
    rollupOptions: {
      input: [
        "./assets/src/scripts/main.js",
        "./assets/src/styles/main.css",
        "./assets/src/styles/index.css",
      ],
    },
    outDir: "assets/dist",
    emptyOutDir: true,
  },
});
