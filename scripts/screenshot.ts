import { spawn, type ChildProcess } from "node:child_process";
import { chromium } from "playwright";

const VITE_URL = "http://127.0.0.1:5173";
const OUTPUT = "screenshots/screenshot.png";

// Vite dev サーバーを起動
const vite: ChildProcess = spawn("npx", ["vite"], {
  cwd: process.cwd(),
  stdio: ["ignore", "pipe", "pipe"],
});

// サーバー起動完了を待つ
await new Promise<void>((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error("Vite startup timeout")), 30000);

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

  vite.on("error", (err) => {
    clearTimeout(timeout);
    reject(err);
  });

  vite.on("exit", (code) => {
    if (code !== null && code !== 0) {
      clearTimeout(timeout);
      reject(new Error(`Vite exited with code ${code}`));
    }
  });
});

console.log("\nVite server ready. Taking screenshot...\n");

try {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(VITE_URL, { waitUntil: "networkidle" });
  await page.screenshot({ path: OUTPUT, fullPage: true });
  console.log(`Screenshot saved: ${OUTPUT}`);
  await browser.close();
} finally {
  vite.kill();
}
