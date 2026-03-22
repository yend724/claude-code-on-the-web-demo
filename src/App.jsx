import { version } from "react";

export default function App() {
  const now = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });

  return (
    <div className="container">
      <h1>Claude Code on the Web Demo</h1>
      <div className="card">
        <p>
          React <code>v{version}</code> で動作中
        </p>
        <p className="timestamp">撮影時刻: {now}</p>
      </div>
      <p className="footer">
        Vite + React + Playwright でスクリーンショットを自動撮影するデモ
      </p>
    </div>
  );
}
