// Brand-specific cache name and icon are rendered from src/branding/site.json at build time.
// Static public defaults are replaced for dedicated brand distributions.
const CACHE_NAME = 'hamarr-pwa-v7';
const BRAND_ICON = '/hammar_logo.jpeg';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', BRAND_ICON, '/offline.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.includes('-pwa-') && key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // Same-origin app only; never cache third-party resources, API responses or personal data.
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => new Response(
        JSON.stringify({ success: false, error: 'Network error', message: 'Could not connect to the server' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      ))
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () =>
        (await caches.match('/index.html')) ?? (await caches.match('/offline.html'))
      )
    );
    return;
  }

  // Only cache app-owned immutable Vite chunks and the fixed public PWA shell.
  // Never return HTML offline fallback for failed scripts, styles or downloads.
  const allowedStatic = url.pathname.startsWith('/assets/') || SHELL.includes(url.pathname);
  if (!allowedStatic) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const isCodeAsset = /\.(?:m?js|css)$/i.test(url.pathname);
      const validMime = (response) => {
        if (!isCodeAsset) return true;
        const mime = response.headers.get('content-type') ?? '';
        return url.pathname.endsWith('.css') ? mime.includes('css') : mime.includes('javascript');
      };
      const cached = await cache.match(request);
      if (cached && validMime(cached)) return cached;
      if (cached) await cache.delete(request);
      const response = await fetch(request);
      if (response.ok && response.type === 'basic' && validMime(response)) {
        await cache.put(request, response.clone());
      }
      return response;
    })
  );
});
