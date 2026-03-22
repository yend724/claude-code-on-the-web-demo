/**
 * Claude Code on the Web デモ用スクリプト
 * このスクリプトをクラウド環境で実行・修正することを目標とします
 */

function greet(name) {
  return `Hello, ${name}! Welcome to Claude Code on the Web.`;
}

function add(a, b) {
  return a + b;
}

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// メイン実行
console.log(greet("World"));
console.log(`1 + 2 = ${add(1, 2)}`);
console.log(`fibonacci(10) = ${fibonacci(10)}`);
console.log(`Node.js version: ${process.version}`);
console.log(`Platform: ${process.platform}`);
console.log(`Current time: ${new Date().toISOString()}`);
