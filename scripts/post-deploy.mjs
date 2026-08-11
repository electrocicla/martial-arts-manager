#!/usr/bin/env node
// Post-deploy script: runs after Cloudflare Pages deployment completes.

const deployedAt = new Date().toISOString();
const branch = process.env.CF_PAGES_BRANCH ?? 'main';

console.log(`\n✅ Post-deploy complete`);
console.log(`   Branch    : ${branch}`);
console.log(`   Deployed at: ${deployedAt}\n`);
