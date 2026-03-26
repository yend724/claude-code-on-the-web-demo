import fs from "node:fs";
import path from "node:path";

const BASE_DIR = "src/benchmark";

// ホモグリフペア定義（Wikipedia「ホモグリフ」準拠）
const PAIRS: { name: string; a: string; b: string }[] = [
  { name: "0 vs O", a: "0", b: "O" },
  { name: "1 vs l", a: "1", b: "l" },
  { name: "1 vs I", a: "1", b: "I" },
  { name: "カ vs 力", a: "カ", b: "力" },
  { name: "オ vs 才", a: "オ", b: "才" },
  { name: "ロ vs 口", a: "ロ", b: "口" },
  { name: "ハ vs 八", a: "ハ", b: "八" },
  { name: "ト vs 卜", a: "ト", b: "卜" },
  { name: "エ vs 工", a: "エ", b: "工" },
  { name: "ニ vs 二", a: "ニ", b: "二" },
  { name: "rn vs m", a: "rn", b: "m" },
  { name: "cl vs d", a: "cl", b: "d" },
  { name: "vv vs w", a: "vv", b: "w" },
  { name: "fi vs \uFB01", a: "fi", b: "\uFB01" },
  { name: "cj vs g", a: "cj", b: "g" },
  { name: "ci vs a", a: "ci", b: "a" },
];


function pageHtml(
  text: string,
  font: string,
  size: number,
  title: string,
  label: string,
): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><title>${title}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,sans-serif;background:#f5f5f5;min-height:100vh;display:flex;align-items:center;justify-content:center}
.wrap{background:#fff;border:1px solid #e0e0e0;border-radius:12px;padding:2.5rem 3rem;min-width:320px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.06)}
.title{font-size:.85rem;color:#888;margin-bottom:.5rem;letter-spacing:.05em}
.label{font-size:.75rem;color:#aaa;margin-bottom:1.5rem}
.char{font-family:${font};font-size:${size}px;color:#111;padding:1.5rem 2rem;background:#fafafa;border:1px solid #eee;border-radius:8px;display:inline-block;line-height:1.2}
</style></head>
<body>
<div class="wrap">
<div class="title">${title}</div>
<div class="label">${label}</div>
<div class="char">${text}</div>
</div>
</body>
</html>`;
}


function pad4(n: number): string {
  return String(n).padStart(4, "0");
}

// ディレクトリ初期化（古いファイルを削除してから作成）
for (const sub of [
  "accuracy/stg",
  "accuracy/prd",
  "performance/stg",
  "performance/prd",
]) {
  const dir = path.join(BASE_DIR, sub);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

let idx = 0;

// === 精度テスト: 差分ありケース（16ページ） ===
const font = "monospace";
const size = 48;

for (const pair of PAIRS) {
  idx++;
  const file = `${pad4(idx)}.html`;
  const title = pair.name;
  const label = `${font} ${size}px`;
  fs.writeFileSync(
    path.join(BASE_DIR, "accuracy/stg", file),
    pageHtml(pair.a, font, size, title, label),
  );
  fs.writeFileSync(
    path.join(BASE_DIR, "accuracy/prd", file),
    pageHtml(pair.b, font, size, title, label),
  );

}

const diffCount = idx;

// === 精度テスト: 差分なしケース（1ページ） ===
{
  idx++;
  const file = `${pad4(idx)}.html`;
  const title = "pass (no diff)";
  const label = `${font} ${size}px`;
  const html = pageHtml("ABC123", font, size, title, label);

  fs.writeFileSync(path.join(BASE_DIR, "accuracy/stg", file), html);
  fs.writeFileSync(path.join(BASE_DIR, "accuracy/prd", file), html);
}

const passCount = idx - diffCount;

// === パフォーマンステスト: 100ページ ===
const MAX_PERF_PAGES = 100;
for (let i = 1; i <= MAX_PERF_PAGES; i++) {
  const file = `${pad4(i)}.html`;
  const title = `Perf #${i}`;
  const label = `${font} ${size}px`;
  const stgText = "あいうえお";
  const prdText = i % 10 === 0 ? "かきくけこ" : "あいうえお";

  fs.writeFileSync(
    path.join(BASE_DIR, "performance/stg", file),
    pageHtml(stgText, font, size, title, label),
  );
  fs.writeFileSync(
    path.join(BASE_DIR, "performance/prd", file),
    pageHtml(prdText, font, size, title, label),
  );

}

console.log(
  `Generated ${diffCount + passCount} accuracy pages (${diffCount} diff + ${passCount} pass)`,
);
console.log(
  `Generated ${MAX_PERF_PAGES} performance pages`,
);
