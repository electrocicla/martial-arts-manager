#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { BRAND_IDS, BRAND_OUTPUTS, verifyBrandBuild } from './verify-build.mjs';

export function pinnedEnvironment(brand, environment = process.env) {
  if (!BRAND_IDS.includes(brand)) throw new Error('Unsupported web academy: ' + brand);
  return { ...environment, VITE_ORGANIZATION_ID: brand };
}

function execute(command, args, environment) {
  const onWindows = process.platform === 'win32';
  const result = spawnSync(onWindows ? command + '.cmd' : command, args, {
    stdio: 'inherit',
    env: environment,
    shell: onWindows,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(command + ' ' + args.join(' ') + ' failed (exit ' + result.status + ')');
}

export async function buildBrand(brand, sourceEnvironment = process.env) {
  const environment = pinnedEnvironment(brand, sourceEnvironment);
  const output = resolve(BRAND_OUTPUTS[brand]);
  execute('pnpm', ['exec', 'tsc', '-b'], environment);
  execute('pnpm', ['exec', 'vite', 'build', '--outDir', BRAND_OUTPUTS[brand], '--emptyOutDir'], environment);

  // WEB-A's source-owned brand renderer patches only generated output, never
  // shared index.html/PWA inputs. Fail closed on unknown metadata/SW markers.
  const { renderBrandArtifacts } = await import('../../src/branding/static/site-artifacts.mjs');
  const artifacts = renderBrandArtifacts(brand, {
    builtIndexHtml: await readFile(join(output, 'index.html'), 'utf8'),
    serviceWorkerSource: await readFile(join(output, 'sw.js'), 'utf8'),
  });
  await Promise.all([
    writeFile(join(output, 'index.html'), artifacts.indexHtml),
    writeFile(join(output, 'manifest.webmanifest'), artifacts.manifestWebmanifest),
    writeFile(join(output, 'sw.js'), artifacts.serviceWorker),
    writeFile(join(output, 'offline.html'), artifacts.offlineHtml),
  ]);
  // Remove only artifact paths explicitly declared by WEB-A's brand contract.
  for (const path of artifacts.removePaths) {
    await rm(join(output, path), { recursive: true, force: true });
  }
  await mkdir(output, { recursive: true });
  await writeFile(join(output, '_brand.json'), JSON.stringify({ academyId: brand }) + '\n', { flag: 'w' });
  const result = await verifyBrandBuild(brand, output, { production: true });
  console.log('Branded ' + result.academyId + ' output verified: ' + result.directory);
}

if (process.argv[1]?.endsWith('build-web.mjs')) {
  buildBrand(process.argv[2]).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
