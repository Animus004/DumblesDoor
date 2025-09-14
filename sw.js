// This service worker is powered by Workbox, a library from Google.
// It provides a robust offline-first experience for this PWA.

importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

if (workbox) {
  console.log(`Workbox is loaded 🎉`);

  const { precacheAndRoute } = workbox.precaching;
  const { registerRoute } = workbox.routing;
  const { NetworkFirst, StaleWhileRevalidate, CacheFirst } = workbox.strategies;
  const { CacheableResponsePlugin } = workbox.cacheableResponse;
  const { ExpirationPlugin } = workbox.expiration;
  
  const OFFLINE_FALLBACK_PAGE = '/offline.html';
  
  // Precache the app shell. This ensures core files are available offline from the start.
  precacheAndRoute([
    { url: '/index.html', revision: 'v1.0' },
    { url: OFFLINE_FALLBACK_PAGE, revision: 'v1.0' },
    { url: '/manifest.json', revision: 'v1.0' },
  ]);

  // Strategy for pages (navigation requests).
  // Network First: Try the network first. If it fails, serve from cache. 
  // If not in cache, serve the offline fallback page.
  registerRoute(
    ({ request }) => request.mode === 'navigate',
    new NetworkFirst({
      cacheName: 'pages-cache',
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        { // Custom plugin to handle fetch errors and serve the offline fallback.
          handlerDidError: async () => {
            return await caches.match(OFFLINE_FALLBACK_PAGE);
          },
        },
      ],
    })
  );

  // Strategy for assets (CSS, JS).
  // Stale While Revalidate: Serve from cache for speed, update in the background.
  registerRoute(
    ({ request }) =>
      request.destination === 'style' ||
      request.destination === 'script' ||
      request.destination === 'worker',
    new StaleWhileRevalidate({
      cacheName: 'asset-cache',
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
      ],
    })
  );

  // Strategy for images.
  // Cache First with expiration: Serve from cache if available.
  registerRoute(
    ({ request }) => request.destination === 'image',
    new CacheFirst({
      cacheName: 'image-cache',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        }),
        new CacheableResponsePlugin({ statuses: [0, 200] }),
      ],
    })
  );

  // Strategy for fonts.
  // Cache First: Fonts rarely change.
  registerRoute(
    ({ request }) => request.destination === 'font',
    new CacheFirst({
      cacheName: 'font-cache',
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({
          maxEntries: 30,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 Year
        }),
      ],
    })
  );

  // Take control of the page immediately.
  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });

} else {
  console.log(`Workbox failed to load.`);
}
