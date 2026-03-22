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

  // HTML レポート生成
  const timestamp = new Date().toLocaleString("ja-JP");
  const passCount = results.filter((r) => r.mismatchedPixels === 0).length;
  const diffCount = results.length - passCount;

  const tableRows = results
    .map(({ name, mismatchedPixels, diffPercent }) => {
      const isDiff = mismatchedPixels > 0;
      const statusClass = isDiff ? "diff" : "pass";
      const statusLabel = isDiff ? "DIFF" : "PASS";
      return `        <tr data-status="${statusClass}">
          <td>${name}</td>
          <td class="${statusClass}">${statusLabel}</td>
          <td>${mismatchedPixels.toLocaleString()}</td>
          <td>${diffPercent}%</td>
          <td><button class="toggle-btn" data-page="${name}">Show</button></td>
        </tr>
        <tr class="preview-row" data-preview="${name}" hidden>
          <td colspan="5">
            <div class="preview-images">
              <figure><figcaption>GitHub Pages</figcaption><img loading="lazy" src="${name}-github.png"></figure>
              <figure><figcaption>Local</figcaption><img loading="lazy" src="${name}-local.png"></figure>
              <figure><figcaption>Diff</figcaption><img loading="lazy" src="${name}-diff.png"></figure>
            </div>
          </td>
        </tr>`;
    })
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>Visual Diff Report</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: system-ui, sans-serif; background: #1a1a2e; color: #eee; padding: 2rem; }
  h1 { margin-bottom: .5rem; }
  .timestamp { color: #888; margin-bottom: 1rem; }
  .summary { display: flex; gap: 1rem; margin-bottom: 1rem; font-size: .9rem; }
  .summary span { padding: .3rem .8rem; border-radius: 4px; background: #16213e; }
  .summary .s-diff { color: #f44336; }
  .summary .s-pass { color: #4caf50; }
  .filters { display: flex; gap: .5rem; margin-bottom: 1.5rem; }
  .filters button { padding: .4rem 1rem; border: 1px solid #333; border-radius: 4px; background: #16213e; color: #eee; cursor: pointer; font-size: .85rem; }
  .filters button.active { border-color: #667eea; background: #1a2744; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: .75rem 1rem; text-align: left; border-bottom: 1px solid #2a2a4a; }
  th { color: #aaa; font-size: .85rem; font-weight: 600; }
  .pass { color: #4caf50; font-weight: bold; }
  .diff { color: #f44336; font-weight: bold; }
  .toggle-btn { padding: .25rem .75rem; border: 1px solid #333; border-radius: 4px; background: #16213e; color: #ccc; cursor: pointer; font-size: .8rem; }
  .preview-images { display: flex; gap: 1rem; padding: .5rem 0; }
  .preview-images figure { flex: 1; min-width: 0; }
  .preview-images figcaption { text-align: center; margin-bottom: .4rem; color: #aaa; font-size: .8rem; }
  .preview-images img { width: 100%; border: 1px solid #333; border-radius: 4px; }
</style>
</head>
<body>
  <h1>Visual Diff Report</h1>
  <p class="timestamp">${timestamp}</p>
  <div class="summary">
    <span>Total: ${results.length}</span>
    <span class="s-diff">Diff: ${diffCount}</span>
    <span class="s-pass">Pass: ${passCount}</span>
  </div>
  <div class="filters">
    <button class="active" data-filter="all">All</button>
    <button data-filter="diff">Diff only</button>
    <button data-filter="pass">Pass only</button>
  </div>
  <table>
    <thead>
      <tr><th>Page</th><th>Status</th><th>Pixels</th><th>Diff %</th><th>Preview</th></tr>
    </thead>
    <tbody>
${tableRows}
    </tbody>
  </table>
  <script>
    // Toggle preview
    document.querySelectorAll(".toggle-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const row = document.querySelector(\`[data-preview="\${btn.dataset.page}"]\`);
        const hidden = row.hidden;
        row.hidden = !hidden;
        btn.textContent = hidden ? "Hide" : "Show";
      });
    });
    // Filter
    document.querySelectorAll(".filters button").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".filters button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const f = btn.dataset.filter;
        document.querySelectorAll("tbody tr[data-status]").forEach(row => {
          const match = f === "all" || row.dataset.status === f;
          row.hidden = !match;
          const preview = document.querySelector(\`[data-preview="\${row.querySelector(".toggle-btn")?.dataset.page}"]\`);
          if (preview && !match) preview.hidden = true;
        });
      });
    });
  </script>
</body>
</html>`;

  fs.writeFileSync("screenshots/report.html", html);
  console.log("Saved: screenshots/report.html");
} finally {
  vite.kill();
}
