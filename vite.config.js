import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const env = process.env.BUILD_ENV || "stg"; // "stg" | "prd"
const base = `/claude-code-on-the-web-demo/${env}/`;

export default defineConfig({
  base,
  define: {
    __BUILD_ENV__: JSON.stringify(env.toUpperCase()),
  },
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: `dist/${env}`,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        stable: resolve(__dirname, "stable/index.html"),
      },
    },
  },
});
