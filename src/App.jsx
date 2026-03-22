import { version } from "react";

export default function App() {
  return (
    <div className="container">
      <h1>Claude Code on the Web Demo</h1>
      <div className="card">
        <p>
          React <code>v{version}</code> で動作中
        </p>
        <p className="status">{__BUILD_ENV__}</p>
      </div>
      <div className="metrics">
        <div className="metric">
          <span className="metric-value">97.2%</span>
          <span className="metric-label">スコア</span>
        </div>
        <div className="metric">
          <span className="metric-value">1,024</span>
          <span className="metric-label">リクエスト数</span>
        </div>
        <div className="metric">
          <span className="metric-value">15ms</span>
          <span className="metric-label">レイテンシ</span>
        </div>
      </div>
      <p className="footer">
        Vite + React + Playwright 差分検知デモ
      </p>
    </div>
  );
}
