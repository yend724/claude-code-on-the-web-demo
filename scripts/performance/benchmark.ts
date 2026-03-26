import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const REPORT_DIR = "report";
const perfImgDir = path.join(REPORT_DIR, "performance");

interface PageResult {
  file: string;
  mismatchedPixels: number;
  totalPixels: number;
  diffPercent: string;
  detected: boolean;
  imgStg: string;
  imgPrd: string;
  imgDiff: string;
}

// スクリーンショットからファイル一覧を取得
if (!fs.existsSync(perfImgDir)) {
  console.error("report/performance not found. Run screenshot first.");
  process.exit(1);
}
const stgFiles = fs.readdirSync(perfImgDir)
  .filter((f) => f.endsWith("-stg.png"))
  .sort();

if (stgFiles.length === 0) {
  console.error("No screenshot files found in report/performance/.");
  process.exit(1);
}

// screenshot.ts が書き出したタイミング情報を読み込み
const timingPath = path.join(perfImgDir, "timing.json");
let totalScreenshotMs = 0;
if (fs.existsSync(timingPath)) {
  const timing = JSON.parse(fs.readFileSync(timingPath, "utf-8"));
  totalScreenshotMs = timing.totalScreenshotMs ?? 0;
}

console.log("\n=== Performance Benchmark ===\n");

const pageResults: PageResult[] = [];

let totalCompareMs = 0;

for (const stgFile of stgFiles) {
  const baseName = stgFile.replace("-stg.png", "");
  const prdFile = `${baseName}-prd.png`;

  const stgBuf = fs.readFileSync(path.join(perfImgDir, stgFile));
  const prdBuf = fs.readFileSync(path.join(perfImgDir, prdFile));

  // pixelmatch 比較
  const cmpStart = performance.now();
  const imgStg = PNG.sync.read(stgBuf);
  const imgPrd = PNG.sync.read(prdBuf);
  const diff = new PNG({ width: imgStg.width, height: imgStg.height });
  const mismatched = pixelmatch(
    imgStg.data,
    imgPrd.data,
    diff.data,
    imgStg.width,
    imgStg.height,
    { threshold: 0 },
  );
  totalCompareMs += performance.now() - cmpStart;

  // diff 画像保存
  const diffPngBuf = PNG.sync.write(diff);
  fs.writeFileSync(path.join(perfImgDir, `${baseName}-diff.png`), diffPngBuf);

  const totalPixels = imgStg.width * imgStg.height;
  const diffPercent = ((mismatched / totalPixels) * 100).toFixed(2);

  pageResults.push({
    file: `${baseName}.html`,
    mismatchedPixels: mismatched,
    totalPixels,
    diffPercent,
    detected: mismatched > 0,
    imgStg: `${baseName}-stg.png`,
    imgPrd: `${baseName}-prd.png`,
    imgDiff: `${baseName}-diff.png`,
  });
}

const diffFound = pageResults.filter((r) => r.detected).length;
console.log(
  `  ${pageResults.length} pages | SS: ${(totalScreenshotMs / 1000).toFixed(1)}s | Cmp: ${(totalCompareMs / 1000).toFixed(1)}s | ${Math.round((totalScreenshotMs + totalCompareMs) / pageResults.length)}ms/page | Diff: ${diffFound}`,
);

// HTML レポート生成
const totalCount = pageResults.length;
const diffCount = pageResults.filter((r) => r.detected).length;
const passCount = pageResults.filter((r) => !r.detected).length;

function fmtSec(ms: number): string {
  return (ms / 1000).toFixed(1) + "s";
}

const summaryLine = `${totalCount} pages | SS: ${fmtSec(totalScreenshotMs)} | Cmp: ${fmtSec(totalCompareMs)} | ${Math.round((totalScreenshotMs + totalCompareMs) / totalCount)}ms/page | Diff: ${diffCount}`;

const tableRows = pageResults
  .map(
    (r, i) => `
    <tr data-status="${r.detected ? "diff" : "pass"}">
      <td>${r.file.replace(".html", "")}</td>
      <td class="${r.detected ? "status-diff" : "status-pass"}">${r.detected ? "DIFF" : "PASS"}</td>
      <td>${r.mismatchedPixels}</td>
      <td>${r.diffPercent}%</td>
      <td><button class="btn-show" onclick="togglePreview(${i})">Show</button></td>
    </tr>
    <tr class="preview-row" id="preview-${i}" style="display:none">
      <td colspan="5">
        <div class="preview-images">
          <div><div class="preview-label">STG</div><img src="${r.imgStg}" /></div>
          <div><div class="preview-label">PRD</div><img src="${r.imgPrd}" /></div>
          <div><div class="preview-label">Diff</div><img src="${r.imgDiff}" /></div>
        </div>
      </td>
    </tr>`,
  )
  .join("\n");

const now = new Date();
const timestamp = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>Performance Report</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;background:#0d1117;color:#c9d1d9;padding:2.5rem 3rem}
h1{font-size:1.6rem;font-weight:600;color:#e6edf3;margin-bottom:.35rem}
.timestamp{font-size:.8rem;color:#7d8590;margin-bottom:1rem}
.summary-line{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.85rem;color:#e6edf3;background:#161b22;border:1px solid #30363d;border-radius:6px;padding:.6rem 1rem;margin-bottom:1rem;display:inline-block}
.badges{display:flex;gap:.5rem;margin-bottom:.75rem;flex-wrap:wrap}
.badge{font-size:.75rem;padding:.25rem .7rem;border-radius:999px;border:1px solid #30363d;background:transparent}
.badge .num{font-weight:600}
.badge-total .num{color:#e6edf3}
.badge-diff .num{color:#e5534b}
.badge-pass .num{color:#57ab5a}
.filters{display:flex;gap:.4rem;margin-bottom:1.5rem}
.filters button{font-size:.8rem;padding:.3rem .85rem;border-radius:999px;border:1px solid #30363d;background:#0d1117;color:#c9d1d9;cursor:pointer;transition:background .15s,border-color .15s}
.filters button:hover{border-color:#8b949e}
.filters button.active{background:#21262d;border-color:#8b949e}
table{width:100%;border-collapse:collapse}
thead th{padding:.7rem .8rem;text-align:left;font-size:.75rem;font-weight:400;color:#7d8590;text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid #21262d}
tbody tr:not(.preview-row){border-bottom:1px solid #161b22}
tbody tr:not(.preview-row):hover{background:#161b22}
td{padding:.7rem .8rem;font-size:.85rem;color:#c9d1d9}
td.status-diff{color:#e5534b;font-weight:600}
td.status-pass{color:#57ab5a;font-weight:600}
.btn-show{font-size:.75rem;padding:.25rem .75rem;border-radius:999px;border:1px solid #30363d;background:#21262d;color:#c9d1d9;cursor:pointer;transition:background .15s,border-color .15s}
.btn-show:hover{background:#30363d;border-color:#8b949e}
.preview-row td{padding:.5rem .8rem 1rem}
.preview-images{display:flex;gap:1rem}
.preview-images>div{display:flex;flex-direction:column;gap:.3rem}
.preview-label{font-size:.7rem;color:#7d8590;text-transform:uppercase;letter-spacing:.04em}
.preview-images img{height:360px;border:1px solid #30363d;border-radius:6px}
</style>
</head>
<body>
<h1>Performance Report \u2014 STG vs PRD</h1>
<p class="timestamp">${timestamp}</p>
<div class="summary-line">${summaryLine}</div>
<div class="badges">
  <span class="badge badge-total">Total: <span class="num">${totalCount}</span></span>
  <span class="badge badge-diff">Diff: <span class="num">${diffCount}</span></span>
  <span class="badge badge-pass">Pass: <span class="num">${passCount}</span></span>
</div>
<div class="filters">
  <button class="active" onclick="filterRows('all')">All</button>
  <button onclick="filterRows('diff')">Diff only</button>
  <button onclick="filterRows('pass')">Pass only</button>
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
function togglePreview(i){
  const row=document.getElementById("preview-"+i);
  row.style.display=row.style.display==="none"?"table-row":"none";
}
function filterRows(mode){
  document.querySelectorAll(".filters button").forEach(b=>b.classList.remove("active"));
  event.target.classList.add("active");
  document.querySelectorAll("tbody tr[data-status]").forEach(tr=>{
    const s=tr.dataset.status;
    const previewId=tr.nextElementSibling;
    if(mode==="all"||s===mode){tr.style.display="";}else{tr.style.display="none";if(previewId)previewId.style.display="none";}
  });
}
</script>
</body>
</html>`;

fs.writeFileSync(path.join(perfImgDir, "report.html"), html);

console.log(`\nSaved: ${perfImgDir}/report.html`);
console.log(`Saved: ${perfImgDir}/ (${pageResults.length} diff images)`);
