import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';

const site = JSON.parse(await readFile(resolve('src/branding/site.json'), 'utf8'));

function safeAttr(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function replaceOneTag(html, pattern, replacement, name) {
  const matches = [...html.matchAll(pattern)];
  if (matches.length !== 1) {
    throw new Error('Expected exactly one ' + name + ' in built index.html; found ' + matches.length);
  }
  return html.replace(pattern, replacement);
}

/**
 * Runs after Vite emitted dist/index.html. Changes only known metadata tags,
 * preserving Vite-injected scripts, CSS, preloads and its CSP-related output.
 */
export function renderIndexMetadata(builtIndexHtml, brand) {
  const link = (rel, href, type) =>
    '<link rel="' + rel + '"' + (type ? ' type="' + safeAttr(type) + '"' : '') +
    ' href="' + safeAttr(href) + '" />';
  const meta = (kind, key, value) =>
    '<meta ' + kind + '="' + key + '" content="' + safeAttr(value) + '" />';

  const replacements = [
    [/<link\b[^>]*\brel=["']icon["'][^>]*>/gi, link('icon', brand.iconUrl, brand.iconType), 'favicon'],
    [/<link\b[^>]*\brel=["']apple-touch-icon["'][^>]*>/gi, link('apple-touch-icon', brand.iconUrl), 'apple touch icon'],
    [/<meta\b[^>]*\bname=["']description["'][^>]*>/gi, meta('name', 'description', brand.description), 'description'],
    [/<meta\b[^>]*\bname=["']keywords["'][^>]*>/gi, meta('name', 'keywords', brand.keywords), 'keywords'],
    [/<meta\b[^>]*\bname=["']theme-color["'][^>]*>/gi, meta('name', 'theme-color', brand.themeColor), 'theme-color'],
    [/<meta\b[^>]*\bname=["']apple-mobile-web-app-title["'][^>]*>/gi, meta('name', 'apple-mobile-web-app-title', brand.shortName), 'apple app title'],
    [/<meta\b[^>]*\bproperty=["']og:title["'][^>]*>/gi, meta('property', 'og:title', brand.socialTitle), 'OG title'],
    [/<meta\b[^>]*\bproperty=["']og:description["'][^>]*>/gi, meta('property', 'og:description', brand.description), 'OG description'],
    [/<meta\b[^>]*\bproperty=["']og:url["'][^>]*>/gi, meta('property', 'og:url', brand.siteUrl), 'OG URL'],
    [/<meta\b[^>]*\bproperty=["']og:image["'][^>]*>/gi, meta('property', 'og:image', brand.socialImageUrl), 'OG image'],
    [/<meta\b[^>]*\bname=["']twitter:title["'][^>]*>/gi, meta('name', 'twitter:title', brand.socialTitle), 'social title'],
    [/<meta\b[^>]*\bname=["']twitter:description["'][^>]*>/gi, meta('name', 'twitter:description', brand.socialDescription), 'social description'],
    [/<meta\b[^>]*\bname=["']twitter:card["'][^>]*>/gi, meta('name', 'twitter:card', brand.name === 'HAMARR' ? 'summary_large_image' : 'summary'), 'social card'],
    [/<title>[^<]*<\/title>/gi, '<title>' + safeAttr(brand.pageTitle) + '</title>', 'page title'],
  ];

  return replacements.reduce(
    (html, [pattern, replacement, name]) => replaceOneTag(html, pattern, replacement, name),
    builtIndexHtml
  );
}

function renderManifest(brand) {
  const icons = brand.iconType === 'image/svg+xml'
    ? [{ src: brand.iconUrl, sizes: 'any', type: brand.iconType, purpose: 'any' }]
    : [192, 512].map((size) => ({
      src: brand.iconUrl, sizes: size + 'x' + size, type: brand.iconType, purpose: 'any'
    }));
  return JSON.stringify({
    name: brand.fullName,
    short_name: brand.shortName,
    description: brand.description,
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: brand.backgroundColor,
    theme_color: brand.themeColor,
    lang: 'es-CL',
    categories: ['sports', 'education', 'productivity'],
    icons,
  }, null, 2) + '\n';
}

function renderOffline(brand) {
  return [
    '<!doctype html>',
    '<html lang="es"><head><meta charset="UTF-8" />',
    '<meta name="viewport" content="width=device-width,initial-scale=1" />',
    '<meta name="theme-color" content="' + safeAttr(brand.themeColor) + '" />',
    '<title>' + safeAttr(brand.shortName) + ' - Sin conexión</title>',
    '<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:' +
      brand.backgroundColor + ';color:#f9fafb;font:16px/1.6 system-ui,Arial,sans-serif}' +
      'main{margin:1rem;max-width:30rem;padding:2rem;border-radius:1rem;border:1px solid #68788060;' +
      'background:#ffffff0b;text-align:center}h1{font-size:1.5rem;margin:0 0 .7rem}' +
      'p{margin:0;color:#d1d5db}</style></head>',
    '<body><main><h1>' + safeAttr(brand.shortName) + ' · Sin conexión</h1>' +
      '<p>Revisa tu conexión a internet e inténtalo de nuevo. Algunas funciones necesitan conexión activa.</p>' +
      '</main></body></html>',
  ].join('\n') + '\n';
}

function renderWorker(source, brand) {
  const currentCache = "const CACHE_NAME = 'hamarr-pwa-v7';";
  const currentIcon = "const BRAND_ICON = '/hammar_logo.jpeg';";
  if (source.split(currentCache).length !== 2 || source.split(currentIcon).length !== 2) {
    throw new Error('Service-worker rendering markers have changed; abort rather than shipping the wrong brand.');
  }
  return source.replace(currentCache, "const CACHE_NAME = '" + brand.pwaCacheName + "';")
    .replace(currentIcon, "const BRAND_ICON = '" + brand.iconUrl + "';");
}

/**
 * WEB-B contract: call this after a successful brand-pinned Vite build; write the
 * four returned strings into dist. removePaths must be removed FROM DIST ONLY.
 * No source/public or native workspace files are ever mutated by this function.
 */
export function renderBrandArtifacts(organizationId, { builtIndexHtml, serviceWorkerSource }) {
  if (organizationId !== 'hamarr' && organizationId !== 'manzur') {
    throw new Error('Invalid build-pinned organization: ' + organizationId);
  }
  if (typeof builtIndexHtml !== 'string' || typeof serviceWorkerSource !== 'string') {
    throw new Error('Built index.html and service worker source are required.');
  }
  const brand = site[organizationId];
  return Object.freeze({
    indexHtml: renderIndexMetadata(builtIndexHtml, brand),
    manifestWebmanifest: renderManifest(brand),
    serviceWorker: renderWorker(serviceWorkerSource, brand),
    offlineHtml: renderOffline(brand),
    removePaths: organizationId === 'manzur'
      ? ['hammar_logo.jpeg', 'downloads', '.well-known/assetlinks.json']
      : [],
  });
}
