import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const PAGES_DIR = path.resolve("dist/benchmark");
const STG_DIR = path.join(PAGES_DIR, "performance/stg");
const PRD_DIR = path.join(PAGES_DIR, "performance/prd");
const REPORT_DIR = "report";
const VIEWPORT = { width: 1280, height: 720 };

// ディレクトリスキャン
if (!fs.existsSync(STG_DIR)) {
  console.error("dist/benchmark/performance/stg not found. Run `npm run generate-pages && npm run build` first.");
  process.exit(1);
}
const files = fs.readdirSync(STG_DIR).filter((f) => f.endsWith(".html")).sort();

// Playwright 起動
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined;
if (executablePath) console.log(`Using custom Chromium: ${executablePath}`);

const browser = await chromium.launch({ executablePath });
const page = await browser.newPage({ viewport: VIEWPORT });

console.log("\n=== Performance Screenshot ===\n");

const perfImgDir = path.join(REPORT_DIR, "performance");
fs.mkdirSync(perfImgDir, { recursive: true });

let totalScreenshotMs = 0;

for (let i = 0; i < files.length; i++) {
  const file = files[i];
  const stgPath = path.resolve(STG_DIR, file);
  const prdPath = path.resolve(PRD_DIR, file);
  const baseName = file.replace(".html", "");

  // スクリーンショット撮影
  const ssStart = performance.now();
  await page.goto(`file://${stgPath}`);
  const stgBuf = await page.screenshot();
  await page.goto(`file://${prdPath}`);
  const prdBuf = await page.screenshot();
  const elapsedMs = performance.now() - ssStart;
  totalScreenshotMs += elapsedMs;

  // 進捗表示
  const pct = Math.round(((i + 1) / files.length) * 100);
  process.stdout.write(`\r  [${i + 1}/${files.length}] ${baseName} (${(elapsedMs / 1000).toFixed(1)}s) ... ${pct}%`);
  if (i === files.length - 1) process.stdout.write("\n");

  // 画像保存
  fs.writeFileSync(path.join(perfImgDir, `${baseName}-stg.png`), stgBuf);
  fs.writeFileSync(path.join(perfImgDir, `${baseName}-prd.png`), prdBuf);

}

await browser.close();

console.log(`\n  ${files.length} pages | Screenshot: ${(totalScreenshotMs / 1000).toFixed(1)}s`);

// タイミング情報を JSON で書き出し（benchmark.ts が読む）
fs.writeFileSync(
  path.join(perfImgDir, "timing.json"),
  JSON.stringify({ totalScreenshotMs, pageCount: files.length }),
);

console.log(`\nSaved: ${perfImgDir}/ (${files.length * 2} images)`);
