import { resolve, join, relative } from "node:path";
import { readdirSync, existsSync } from "node:fs";
import { defineConfig } from "vite";

function collectHtmlInputs(baseDir) {
  const inputs = {};
  if (!existsSync(baseDir)) return inputs;

  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith(".html")) {
        const key = relative(baseDir, fullPath).replace(/\.html$/, "");
        inputs[key] = resolve(fullPath);
      }
    }
  }
  walk(baseDir);
  return inputs;
}

const root = resolve(import.meta.dirname, "src/benchmark");

export default defineConfig({
  root,
  build: {
    outDir: resolve(import.meta.dirname, "dist/benchmark"),
    emptyOutDir: true,
    rollupOptions: {
      input: collectHtmlInputs(root),
    },
  },
});
