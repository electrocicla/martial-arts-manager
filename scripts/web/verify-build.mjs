#!/usr/bin/env node
import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

export const BRAND_IDS = Object.freeze(['hamarr', 'manzur']);
export const BRAND_OUTPUTS = Object.freeze({ hamarr: 'dist/hamarr', manzur: 'dist/manzur' });

function fail(message) {
  throw new Error('[web brand verification] ' + message);
}

async function readRequired(directory, name) {
  try {
    return await readFile(join(directory, name), 'utf8');
  } catch {
    fail('Required output missing: ' + name);
  }
}

async function filesUnder(directory) {
  const result = [];
  async function visit(at) {
    for (const entry of await readdir(at, { withFileTypes: true })) {
      const absolute = join(at, entry.name);
      if (entry.isSymbolicLink()) fail('Symlink not allowed in output: ' + entry.name);
      if (entry.isDirectory()) await visit(absolute);
      else if (entry.isFile()) result.push(relative(directory, absolute).split(sep).join('/'));
    }
  }
  await visit(directory);
  return result;
}

/** Verify final publishable bytes, not just Vite environment variables. */
export async function verifyBrandBuild(brand, directory, { production = false } = {}) {
  if (!BRAND_IDS.includes(brand)) fail('Unsupported academy: ' + brand);
  const output = resolve(directory);
  const [html, sw, offline, manifestText, markerText] = await Promise.all([
    readRequired(output, 'index.html'),
    readRequired(output, 'sw.js'),
    readRequired(output, 'offline.html'),
    readRequired(output, 'manifest.webmanifest'),
    readRequired(output, '_brand.json'),
  ]);
  let manifest;
  let marker;
  try { manifest = JSON.parse(manifestText); } catch { fail('Invalid manifest JSON'); }
  try { marker = JSON.parse(markerText); } catch { fail('Invalid brand marker JSON'); }
  if (marker.academyId !== brand) fail('Build marker does not match requested academy');
  const files = await filesUnder(output);
  if (production) {
    if (Object.hasOwn(marker, 'preview')) fail('Preview marker forbidden in production');
    if (files.some((name) => /^_worker\.js(?:\/|$)/i.test(name))) {
      fail('Preview or custom worker forbidden in the integrated Pages Functions artifact');
    }
    if (!/<link\b[^>]*\brel=["']manifest["']/i.test(html)) fail('Production PWA manifest link missing');
    if (/<meta\b[^>]*\bname=["']robots["'][^>]*\bnoindex\b/i.test(html)) {
      fail('Preview noindex forbidden in production');
    }
    for (const filename of files.filter((name) => /\.(?:js|mjs|html|json)$/i.test(name))) {
      const body = await readFile(join(output, filename), 'utf8');
      if (/Vista previa visual|Sin cuentas, pagos ni datos reales|Acceso a cuentas no habilitado|Manzur visual preview: backend disabled/i.test(body)) {
        fail('Preview-only presentation in production: ' + filename);
      }
    }
  }
  for (const filename of files) {
    if (filename.toLowerCase().endsWith('.apk') && brand === 'manzur') {
      fail('APK must not be published in Manzur Pages: ' + filename);
    }
    if (brand === 'manzur' && /(^|\/)(?:assetlinks\.json|hammar_logo\.[^/]+)$/i.test(filename)) {
      fail('Hamarr-only mobile association or logo in Manzur: ' + filename);
    }
  }

  for (const [name, contents] of Object.entries({ 'index.html': html, 'manifest.webmanifest': manifestText, 'sw.js': sw, 'offline.html': offline })) {
    if (brand === 'manzur' && /hamarr|hammar/i.test(contents)) {
      fail('Hamarr branding leaked into Manzur ' + name);
    }
  }
  if (!html.toLowerCase().includes(brand) || !JSON.stringify(manifest).toLowerCase().includes(brand)) {
    fail('HTML title/metadata or manifest is not academy branded: ' + brand);
  }
  if (!sw.toLowerCase().includes(brand)) {
    fail('PWA service-worker cache must be academy-specific: ' + brand);
  }
  if (typeof manifest.name !== 'string' || !manifest.name.toLowerCase().includes(brand)) {
    fail('Manifest display name does not match academy');
  }
  if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) {
    fail('Manifest must declare at least one dedicated icon');
  }
  for (const icon of manifest.icons) {
    if (typeof icon?.src !== 'string' || !icon.src.startsWith('/') || icon.src.startsWith('//')) {
      fail('PWA icon must use a local absolute URL');
    }
    const pathname = icon.src.split(/[?#]/, 1)[0];
    if (!files.includes(pathname.slice(1))) fail('PWA icon missing: ' + pathname);
  }
  if (brand === 'manzur') {
    for (const filename of files.filter((name) => /\.(?:js|css|html|json|webmanifest|svg|xml|txt)$/i.test(name))) {
      const body = await readFile(join(output, filename), 'utf8');
      if (/hamarr-app-latest\.apk|hammar_logo\.|https?:\/\/hamarr\.cl(?:\/|["'?#])/i.test(body)) {
        fail('Hamarr app, logo or production URL embedded in Manzur: ' + filename);
      }
    }
  }
  const indexStat = await stat(join(output, 'index.html'));
  if (indexStat.size === 0) fail('Empty output HTML');
  return { academyId: brand, directory: output, filesChecked: files.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const brand = process.argv[2];
  const directory = process.argv[3] ?? BRAND_OUTPUTS[brand];
  if (!BRAND_IDS.includes(brand)) fail('Usage: node scripts/web/verify-build.mjs hamarr|manzur [output-directory]');
  verifyBrandBuild(brand, directory, { production: true })
    .then((result) => console.log('Verified ' + result.academyId + ' build: ' + result.filesChecked + ' files in ' + result.directory))
    .catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
}
