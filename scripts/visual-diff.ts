import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import { chromium } from "playwright";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const PAGES_URL = "https://yend724.github.io/claude-code-on-the-web-demo/";
const LOCAL_URL = "http://127.0.0.1:5173/claude-code-on-the-web-demo/";
const VIEWPORT = { width: 1280, height: 720 };

// Vite dev サーバーを起動
const vite: ChildProcess = spawn("npx", ["vite"], {
  cwd: process.cwd(),
  stdio: ["ignore", "pipe", "pipe"],
});

// サーバー起動完了を待つ
await new Promise<void>((resolve, reject) => {
  const timeout = setTimeout(
    () => reject(new Error("Vite startup timeout")),
    30000,
  );

  vite.stdout!.on("data", (chunk: Buffer) => {
    const text = chunk.toString();
    process.stdout.write(text);
    if (text.includes("Local:")) {
      clearTimeout(timeout);
      resolve();
    }
  });

  vite.stderr!.on("data", (chunk: Buffer) => {
    process.stderr.write(chunk);
  });

  vite.on("error", (err: Error) => {
    clearTimeout(timeout);
    reject(err);
  });

  vite.on("exit", (code: number | null) => {
    if (code !== null && code !== 0) {
      clearTimeout(timeout);
      reject(new Error(`Vite exited with code ${code}`));
    }
  });
});

console.log("\nVite server ready. Taking screenshots...\n");

try {
  // PLAYWRIGHT_CHROMIUM_PATH があればプリインストール済み Chromium を使用
  // （Claude Code on the Web 環境ではダウンロードがブロックされるため）
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined;
  if (executablePath) {
    console.log(`Using custom Chromium: ${executablePath}`);
  }
  const browser = await chromium.launch({ executablePath });
  const page = await browser.newPage({ viewport: VIEWPORT });

  // GitHub Pages 撮影
  await page.goto(PAGES_URL, { waitUntil: "networkidle" });
  await page.screenshot({ path: "screenshots/github-pages.png" });
  console.log("Saved: screenshots/github-pages.png");

  // ローカル dev サーバー撮影
  await page.goto(LOCAL_URL, { waitUntil: "networkidle" });
  await page.screenshot({ path: "screenshots/local.png" });
  console.log("Saved: screenshots/local.png");

  await browser.close();

  // 差分検知
  const imgPages = PNG.sync.read(
    fs.readFileSync("screenshots/github-pages.png"),
  );
  const imgLocal = PNG.sync.read(fs.readFileSync("screenshots/local.png"));
  const diff = new PNG({ width: imgPages.width, height: imgPages.height });

  const mismatchedPixels = pixelmatch(
    imgPages.data,
    imgLocal.data,
    diff.data,
    imgPages.width,
    imgPages.height,
    { threshold: 0.1 },
  );

  fs.writeFileSync("screenshots/diff.png", PNG.sync.write(diff));

  const totalPixels = imgPages.width * imgPages.height;
  const diffPercent = ((mismatchedPixels / totalPixels) * 100).toFixed(2);

  console.log(`\nSaved: screenshots/diff.png`);
  console.log(
    `Diff: ${mismatchedPixels.toLocaleString()} pixels (${diffPercent}%)`,
  );
} finally {
  vite.kill();
}
