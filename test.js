/**
 * シンプルなテストスクリプト
 * Claude Code on the Web がテスト実行できることを確認するためのもの
 */

const assert = require("assert");

// index.js の関数をインポート可能にするためにここでも定義
function add(a, b) {
  return a + b;
}

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// テスト実行
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`✗ ${name}: ${e.message}`);
    failed++;
  }
}

test("add(1, 2) should return 3", () => {
  assert.strictEqual(add(1, 2), 3);
});

test("add(0, 0) should return 0", () => {
  assert.strictEqual(add(0, 0), 0);
});

test("add(-1, 1) should return 0", () => {
  assert.strictEqual(add(-1, 1), 0);
});

test("fibonacci(0) should return 0", () => {
  assert.strictEqual(fibonacci(0), 0);
});

test("fibonacci(1) should return 1", () => {
  assert.strictEqual(fibonacci(1), 1);
});

test("fibonacci(10) should return 55", () => {
  assert.strictEqual(fibonacci(10), 55);
});

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
