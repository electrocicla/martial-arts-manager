import { readFile, writeFile, rm, copyFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { build } from 'vite';
import { renderBrandArtifacts } from '../../src/branding/static/site-artifacts.mjs';
import { verifyBrandBuild } from './verify-build.mjs';

const root = resolve('dist/manzur-visual-preview');
const output = join(root, 'site');
const originalEntry = '<script type="module" src="/src/main.tsx"></script>';
const previewEntry = '<script type="module" src="/src/branding/visual-preview-main.tsx"></script>';
process.env.VITE_ORGANIZATION_ID = 'manzur';
await build({
  mode: 'manzur-visual-preview',
  plugins: [{
    name: 'manzur-visual-preview-entry',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        if (html.split(originalEntry).length !== 2) throw new Error('Unexpected application entry');
        return html.replace(originalEntry, previewEntry);
      },
    },
  }],
  build: { outDir: output, emptyOutDir: true, sourcemap: false },
});
const artifacts = renderBrandArtifacts('manzur', {
  builtIndexHtml: await readFile(join(output, 'index.html'), 'utf8'),
  serviceWorkerSource: await readFile(join(output, 'sw.js'), 'utf8'),
});
const html = artifacts.indexHtml
  .replace(/<link\b[^>]*\brel=["']manifest["'][^>]*>/gi, '')
  .replace('maximum-scale=1.0, user-scalable=no', 'viewport-fit=cover')
  .replace('</head>', '<meta name="robots" content="noindex, nofollow" />\n</head>');
await Promise.all([
  writeFile(join(output, 'index.html'), html),
  writeFile(join(output, 'manifest.webmanifest'), artifacts.manifestWebmanifest),
  writeFile(join(output, 'sw.js'), artifacts.serviceWorker),
  writeFile(join(output, 'offline.html'), artifacts.offlineHtml),
  writeFile(join(output, '_brand.json'), JSON.stringify({ academyId: 'manzur', preview: 'visual-only' }) + '\n'),
  copyFile(resolve('scripts/web/preview-manzur-worker.mjs'), join(output, '_worker.js')),
]);
for (const path of artifacts.removePaths) await rm(join(output, path), { recursive: true, force: true });
await mkdir(root, { recursive: true });
// Preview-local config prevents discovery of Hamarr's production configuration.
await writeFile(join(root, 'wrangler.toml'), 'name = "manzurbros"\npages_build_output_dir = "./site"\ncompatibility_date = "2024-09-23"\n');
const result = await verifyBrandBuild('manzur', output);
console.log('Visual-only Manzur preview verified (' + result.filesChecked + ' files): ' + result.directory);
