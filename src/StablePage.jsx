import { version } from "react";

export default function StablePage() {
  return (
    <div className="container">
      <h1>Stable Page</h1>
      <div className="card">
        <p>
          このページは変更されません（差分検知の基準ページ）
        </p>
        <p className="status">{__BUILD_ENV__}</p>
      </div>
      <div className="metrics">
        <div className="metric">
          <span className="metric-value">99.9%</span>
          <span className="metric-label">稼働率</span>
        </div>
        <div className="metric">
          <span className="metric-value">0</span>
          <span className="metric-label">差分数</span>
        </div>
        <div className="metric">
          <span className="metric-value">安定</span>
          <span className="metric-label">ステータス</span>
        </div>
      </div>
      <p className="footer">
        差分なし検証用ページ
      </p>
    </div>
  );
}
