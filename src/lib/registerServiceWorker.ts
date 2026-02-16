/**
 * Registers the app service worker for PWA/TWA support.
 * Runs only in production and when the browser supports service workers.
 */
export function registerServiceWorker(): void {
  if (import.meta.env.DEV) return;
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    void navigator.serviceWorker
      .register('/sw.js')
      .catch((error: unknown) => {
        console.error('[PWA] Service worker registration failed:', error);
      });
  });
}
