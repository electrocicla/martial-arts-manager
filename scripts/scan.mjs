#!/usr/bin/env node
/**
 * scan.mjs
 *
 * Aggregate quality gate runner. Executes typecheck and lint in sequence
 * and prints a summary of failures and warnings (hints).
 *
 * Usage:
 *   node scripts/scan.mjs              # treat warnings as info
 *   node scripts/scan.mjs --include-hints  # fail on any lint warning
 *
 * Exit codes:
 *   0 → no errors and (if --include-hints) no warnings
 *   1 → failures found
 */

import { spawn } from 'node:child_process';
import process from 'node:process';

const includeHints = process.argv.includes('--include-hints');

function runStep(name, command, args) {
  return new Promise((resolve) => {
    const start = Date.now();
    process.stdout.write(`\n▶ ${name}\n`);
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    child.on('close', (code) => {
      const ms = Date.now() - start;
      resolve({ name, code: code ?? 0, durationMs: ms });
    });
  });
}

async function main() {
  const steps = [];

  steps.push(await runStep('TypeScript typecheck', 'pnpm', ['exec', 'tsc', '--noEmit']));

  const lintArgs = ['exec', 'eslint', '.'];
  if (includeHints) {
    lintArgs.push('--max-warnings', '0');
  }
  steps.push(await runStep(`ESLint${includeHints ? ' (no warnings allowed)' : ''}`, 'pnpm', lintArgs));

  console.log('\n──────── Scan summary ────────');
  let hasFailure = false;
  for (const step of steps) {
    const status = step.code === 0 ? 'PASS' : 'FAIL';
    if (step.code !== 0) hasFailure = true;
    console.log(`${status.padEnd(4)}  ${step.name}  (${step.durationMs}ms)`);
  }
  console.log('──────────────────────────────');

  process.exit(hasFailure ? 1 : 0);
}

main().catch((error) => {
  console.error('scan.mjs crashed:', error);
  process.exit(1);
});
