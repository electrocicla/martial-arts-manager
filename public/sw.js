// v6 — handle rejected API fetches gracefully (ERR_FAILED / unhandled promise rejection fix)
const CACHE_NAME = 'hamarr-pwa-v6';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/hammar_logo.jpeg',
  '/offline.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // Never cache API requests — always go to network so mutations are reflected immediately.
  // Wrap in .catch() so a network-level failure (ERR_FAILED, offline, transient Cloudflare error)
  // returns a proper JSON 503 Response instead of letting the promise reject unhandled, which
  // the browser would turn into an opaque ERR_FAILED on the client and log
  // "FetchEvent resulted in a network error response: the promise was rejected."
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch((err) =>
        new Response(
          JSON.stringify({ success: false, error: 'Network error', message: err?.message ?? 'Failed to fetch' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
      )
    );
    return;
  }

  // Network-first for navigation requests, fallback to offline page.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone)).catch(() => null);
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match('/offline.html');
        })
    );
    return;
  }

  // Cache-first for static assets (JS, CSS, images, fonts, etc.).
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        // Defensive: a previous SW version may have cached the SPA fallback
        // (text/html status 200) for a hashed chunk URL after a deploy. If we
        // detect that mismatch on JS/CSS requests, evict and re-fetch from
        // network so the dynamic import either succeeds or fails cleanly.
        const isCodeAsset = /\.(?:m?js|css)$/i.test(url.pathname);
        if (isCodeAsset) {
          const cachedType = cached.headers.get('content-type') ?? '';
          const isWrongMime =
            (url.pathname.endsWith('.css') && !cachedType.includes('css')) ||
            (/\.m?js$/i.test(url.pathname) && !cachedType.includes('javascript'));
          if (isWrongMime) {
            caches.open(CACHE_NAME).then((cache) => cache.delete(request)).catch(() => null);
          } else {
            return cached;
          }
        } else {
          return cached;
        }
      }
      return fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Same MIME guard on write: never cache a text/html SPA fallback
          // under a /assets/*.js or *.css URL, otherwise the next visit is
          // permanently broken until a manual SW unregister.
          const isCodeAsset = /\.(?:m?js|css)$/i.test(url.pathname);
          if (isCodeAsset) {
            const ct = response.headers.get('content-type') ?? '';
            const ok =
              (url.pathname.endsWith('.css') && ct.includes('css')) ||
              (/\.m?js$/i.test(url.pathname) && ct.includes('javascript'));
            if (!ok) {
              return response;
            }
          }

          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone)).catch(() => null);
          return response;
        })
        .catch(() => caches.match('/offline.html'));
    })
  );
});
