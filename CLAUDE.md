# Claude Code on the Web Demo

## プロジェクト概要
Vite + React + Playwright のデモプロジェクト。Claude Code on the Web の動作確認用。

## コマンド
- `npm run dev` - Vite dev サーバー起動
- `npm run build` - プロダクションビルド
- `gh workflow run visual-diff.yml` - Visual Diff 実行（GitHub Actions 経由）

## セットアップ（Claude Code on the Web）

Setup script に以下を設定:
```bash
npm install && npx playwright install --with-deps chromium
```

## ルール
- 日本語コメント可
- スクリーンショットは `screenshots/` に出力（PNG は gitignore）
