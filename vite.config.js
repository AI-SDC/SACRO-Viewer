import { defineConfig } from "vite";

export default defineConfig({
  base: "/static/",
  build: {
    manifest: true,
    rollupOptions: {
      input: "./assets/src/scripts/main.js",
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`,
      },
    },
    outDir: "assets/dist",
    emptyOutDir: true,
  },
});
