#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile, mkdir, cp, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { BRAND_OUTPUTS, verifyBrandBuild } from './verify-build.mjs';

// Run after both production branding checks and the shared Worker runtime QA.
// Only explicit brand directories and the tested compiled Worker are copied.
const brand = process.argv[2];
const configPath = process.argv[3];
const project = { hamarr: 'martial-arts-manager', manzur: 'manzurbros' }[brand];
assert(project && configPath, 'Usage: stage-shared-security-release.mjs hamarr|manzur <downloaded-wrangler.toml>');
const config = await readFile(configPath, 'utf8');
assert(config.includes('name = "' + project + '"'), 'Wrong remote project');
const ids = [...config.matchAll(/^database_id\s*=\s*"([^"]+)"$/gm)].map(x => x[1]);
const buckets = [...config.matchAll(/^bucket_name\s*=\s*"([^"]+)"$/gm)].map(x => x[1]);
assert(ids.length && ids.every(x => x === '4ad2408a-54e1-45e3-a352-42be3e284299'), 'Wrong shared D1');
assert(buckets.length && buckets.every(x => x === 'martial-arts-manager-bucket'), 'Wrong shared R2');
assert(config.includes('[[env.production.d1_databases]]') && config.includes('[[env.production.r2_buckets]]'), 'Production bindings not confirmed');
assert(!/^\s*(JWT_SECRET|TURNSTILE_SECRET)\s*=/m.test(config), 'Refuse credential-bearing config');
assert(!/^\[env\.preview/m.test(config), 'Refuse preview binding changes');
const pinned = config.match(/^SITE_ORGANIZATION_ID\s*=\s*"([^"]+)"$/m)?.[1];
assert(brand === 'hamarr' ? (!pinned || pinned === brand) : pinned === brand, 'Wrong organization');
await verifyBrandBuild(brand, BRAND_OUTPUTS[brand], { production: true });
const worker = await readFile('dist/shared-security-functions-qa/index.js');
const source = worker.toString('utf8');
assert(source.includes('auth_rate_limits') && source.includes('native-avatar-read-v1') && source.includes('ASSETS'), 'Unrecognized Worker artifact');
assert(!source.includes('Manzur visual preview: backend disabled'), 'Preview Worker not permitted');
const root = resolve('dist', 'release-shared-security-' + brand);
await mkdir(root);
await cp(BRAND_OUTPUTS[brand], join(root, 'site'), { recursive: true, errorOnExist: true, force: false });
await writeFile(join(root, 'site', '_worker.js'), worker, { flag: 'wx' });
let next = config.replace(/^pages_build_output_dir\s*=\s*"[^"]+"$/m, 'pages_build_output_dir = "site"');
if (brand === 'hamarr' && !pinned) next += '\n[env.production.vars]\nSITE_ORGANIZATION_ID = "hamarr"\n';
if (brand === 'manzur') {
  // Worker build uses node compatibility; preserve the existing production date.
  if (!/^compatibility_flags\s*=/m.test(next)) next = next.replace(/^compatibility_date\s*=\s*"[^"]+"$/m, '$&\ncompatibility_flags = ["nodejs_compat"]');
  if (/\[env\.production\]\s*\ncompatibility_date\s*=\s*"[^"]+"/.test(next)) next = next.replace(/(\[env\.production\]\s*\ncompatibility_date\s*=\s*"[^"]+")/, '$1\ncompatibility_flags = ["nodejs_compat"]');
}
await writeFile(join(root, 'wrangler.toml'), next, { flag: 'wx' });
console.log(JSON.stringify({ project, brand, root, workerSha256: createHash('sha256').update(worker).digest('hex') }));
