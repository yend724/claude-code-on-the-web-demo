import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const PAGES_DIR = path.resolve("dist/benchmark");
const STG_DIR = path.join(PAGES_DIR, "accuracy/stg");
const PRD_DIR = path.join(PAGES_DIR, "accuracy/prd");
const REPORT_DIR = "report";
const VIEWPORT = { width: 1280, height: 720 };

// ディレクトリスキャン
if (!fs.existsSync(STG_DIR)) {
  console.error("dist/benchmark/accuracy/stg not found. Run `npm run generate-pages && npm run build` first.");
  process.exit(1);
}
const files = fs.readdirSync(STG_DIR).filter((f) => f.endsWith(".html")).sort();

// Playwright 起動
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined;
if (executablePath) console.log(`Using custom Chromium: ${executablePath}`);

const browser = await chromium.launch({ executablePath });
const page = await browser.newPage({ viewport: VIEWPORT });

console.log("\n=== Accuracy Screenshot ===\n");

const accuracyImgDir = path.join(REPORT_DIR, "accuracy");
fs.mkdirSync(accuracyImgDir, { recursive: true });

for (const file of files) {
  const stgPath = path.resolve(STG_DIR, file);
  const prdPath = path.resolve(PRD_DIR, file);
  const baseName = file.replace(".html", "");

  // スクリーンショット撮影
  await page.goto(`file://${stgPath}`);
  const stgBuf = await page.screenshot();

  await page.goto(`file://${prdPath}`);
  const prdBuf = await page.screenshot();

  // 画像保存
  fs.writeFileSync(path.join(accuracyImgDir, `${baseName}-stg.png`), stgBuf);
  fs.writeFileSync(path.join(accuracyImgDir, `${baseName}-prd.png`), prdBuf);

  console.log(`  ${baseName}`);
}

await browser.close();

console.log(`\nSaved: ${accuracyImgDir}/ (${files.length * 2} images)`);
