import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const baseDir = process.env.BASE_DIR;
const base = baseDir
  ? `/claude-code-on-the-web-demo/${baseDir}/`
  : "/claude-code-on-the-web-demo/";

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        stable: resolve(__dirname, "stable/index.html"),
      },
    },
  },
});
