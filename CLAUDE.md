# Claude Code on the Web Demo

## プロジェクト概要
Vite + React + Playwright のデモプロジェクト。Claude Code on the Web の動作確認用。

## コマンド
- `npm run dev` - Vite dev サーバー起動
- `npm run build` - プロダクションビルド
- `npm run screenshot` - Playwright でスクリーンショット撮影

## セットアップ（Claude Code on the Web）

Setup script に以下を設定:
```bash
npm install
```
`postinstall` で Playwright の Chromium が自動インストールされる。

## ルール
- 日本語コメント可
- スクリーンショットは `screenshots/` に出力（PNG は gitignore）
