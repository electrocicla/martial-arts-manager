import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import { readFile } from 'node:fs/promises';
import { renderBrandArtifacts } from './site-artifacts.mjs';

const index = await readFile(resolve('index.html'), 'utf8');
const worker = await readFile(resolve('public/sw.js'), 'utf8');

test('renders both brands without changing Vite links', () => {
  const builtIndexHtml = index.replace('</head>', '<script type="module" src="/assets/chunk-123.js"></script></head>');
  for (const id of ['hamarr', 'manzur']) {
    const result = renderBrandArtifacts(id, { builtIndexHtml, serviceWorkerSource: worker });
    expect(result.indexHtml).toContain('/assets/chunk-123.js');
    expect(result.indexHtml.toLowerCase()).toContain(id);
    expect(result.serviceWorker.toLowerCase()).toContain(id + '-pwa-');
    expect(JSON.parse(result.manifestWebmanifest).start_url).toBe('/');
    expect(result.offlineHtml.toLowerCase()).toContain(id);
  }
});

test('Manzur static metadata excludes Hamarr references and downloads', () => {
  const result = renderBrandArtifacts('manzur', { builtIndexHtml: index, serviceWorkerSource: worker });
  for (const text of [result.indexHtml, result.manifestWebmanifest, result.serviceWorker, result.offlineHtml]) {
    expect(text).not.toMatch(/hamarr|hammar|hamarr-app-latest\.apk|hamarr\.cl/i);
  }
  expect(result.indexHtml).toContain('manzurbros.pages.dev');
  expect(result.removePaths).toEqual(['hammar_logo.jpeg', 'downloads', '.well-known/assetlinks.json']);
  const manifest = JSON.parse(result.manifestWebmanifest);
  expect(manifest.icons[0].src).toBe('/manzur-mark.svg');
  expect(manifest.icons[0].type).toBe('image/svg+xml');
});

test('renderer fails closed on changed required markers or invalid organization', () => {
  expect(() => renderBrandArtifacts('other', { builtIndexHtml: index, serviceWorkerSource: worker })).toThrow(/Invalid build-pinned/);
  expect(() => renderBrandArtifacts('manzur', { builtIndexHtml: '<html></html>', serviceWorkerSource: worker })).toThrow(/exactly one/);
  expect(() => renderBrandArtifacts('manzur', { builtIndexHtml: index, serviceWorkerSource: '// altered' })).toThrow(/markers have changed/);
});
