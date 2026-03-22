import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import { chromium } from "playwright";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const BASE_GITHUB = "https://yend724.github.io/claude-code-on-the-web-demo/";
const BASE_LOCAL = "http://127.0.0.1:5173/claude-code-on-the-web-demo/";
const VIEWPORT = { width: 1280, height: 720 };

const PAGES = [
  { name: "main", path: "" },
  { name: "stable", path: "stable/" },
];

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

  const results: { name: string; mismatchedPixels: number; diffPercent: string }[] = [];

  for (const { name, path } of PAGES) {
    console.log(`--- ${name} ---`);

    // GitHub Pages 撮影
    await page.goto(`${BASE_GITHUB}${path}`, { waitUntil: "networkidle" });
    await page.screenshot({ path: `screenshots/${name}-github.png` });
    console.log(`Saved: screenshots/${name}-github.png`);

    // ローカル dev サーバー撮影
    await page.goto(`${BASE_LOCAL}${path}`, { waitUntil: "networkidle" });
    await page.screenshot({ path: `screenshots/${name}-local.png` });
    console.log(`Saved: screenshots/${name}-local.png`);

    // 差分検知
    const imgGithub = PNG.sync.read(
      fs.readFileSync(`screenshots/${name}-github.png`),
    );
    const imgLocal = PNG.sync.read(
      fs.readFileSync(`screenshots/${name}-local.png`),
    );
    const diff = new PNG({ width: imgGithub.width, height: imgGithub.height });

    const mismatchedPixels = pixelmatch(
      imgGithub.data,
      imgLocal.data,
      diff.data,
      imgGithub.width,
      imgGithub.height,
      { threshold: 0.1 },
    );

    fs.writeFileSync(`screenshots/${name}-diff.png`, PNG.sync.write(diff));

    const totalPixels = imgGithub.width * imgGithub.height;
    const diffPercent = ((mismatchedPixels / totalPixels) * 100).toFixed(2);

    console.log(`Saved: screenshots/${name}-diff.png`);
    console.log(
      `Diff: ${mismatchedPixels.toLocaleString()} pixels (${diffPercent}%)\n`,
    );

    results.push({ name, mismatchedPixels, diffPercent });
  }

  await browser.close();

  // レポート出力
  console.log("=== Visual Diff Report ===");
  for (const { name, mismatchedPixels, diffPercent } of results) {
    const status = mismatchedPixels === 0 ? "PASS (no diff)" : "DIFF DETECTED";
    console.log(`  ${name}: ${status} — ${mismatchedPixels.toLocaleString()} px (${diffPercent}%)`);
  }

  const hasAnyDiff = results.some((r) => r.mismatchedPixels > 0);
  console.log(`\nResult: ${hasAnyDiff ? "Differences found" : "All pages match"}`);
} finally {
  vite.kill();
}
