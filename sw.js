// This service worker is powered by Workbox, a library from Google.
// It provides a robust offline-first experience for this PWA.

// Make sure to import Workbox's scripts.
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

// Only execute Workbox if it's loaded.
if (workbox) {
  console.log(`Yay! Workbox is loaded 🎉`);

  const { precacheAndRoute } = workbox.precaching;
  const { registerRoute } = workbox.routing;
  const { StaleWhileRevalidate, CacheFirst, NetworkFirst } = workbox.strategies;
  const { CacheableResponsePlugin } = workbox.cacheableResponse;
  const { ExpirationPlugin } = workbox.expiration;
  const { warmStrategyCache } = workbox.recipes;

  // Precache the essential parts of the app "shell".
  // This makes the app load almost instantly on subsequent visits.
  precacheAndRoute([
    { url: '/index.html', revision: '1' }, // Add revision to ensure updates
    { url: '/', revision: '1' },
    { url: '/manifest.json', revision: '1' },
    { url: '/offline.html', revision: '1' },
  ]);

  const offlineFallback = '/offline.html';
  const pageCache = new CacheFirst({
    cacheName: 'pages-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 50 }),
    ],
  });

  // Ensure the offline fallback page is cached upon installation.
  warmStrategyCache({
    urls: [offlineFallback],
    strategy: pageCache,
  });

  // Use Network First for navigation requests. This ensures users get the
  // latest version of a page if they are online, but can still access
  // cached versions if they are offline. If a page isn't in the cache,
  // the offline fallback page is served.
  registerRoute(
    ({ request }) => request.mode === 'navigate',
    async ({ event }) => {
      try {
        // Try to fetch from the network first.
        return await new NetworkFirst({
          cacheName: 'pages-cache',
          plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
        }).handle({ event });
      } catch (error) {
        // If the network fails, serve the offline fallback page.
        return await pageCache.handle({ event: new Request(offlineFallback) });
      }
    }
  );

  // Use a Stale-While-Revalidate strategy for CSS, JavaScript, and Web Worker
  // requests. This serves assets from the cache first for speed, and updates
  // them in the background.
  registerRoute(
    ({ request }) =>
      request.destination === 'style' ||
      request.destination === 'script' ||
      request.destination === 'worker',
    new StaleWhileRevalidate({
      cacheName: 'asset-cache',
      plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
    })
  );

  // Use a Cache First strategy for images. Images are served from the cache
  // if available, reducing network requests.
  registerRoute(
    ({ request }) => request.destination === 'image',
    new CacheFirst({
      cacheName: 'image-cache',
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        }),
      ],
    })
  );
  
  // Use a Cache First strategy for fonts.
  registerRoute(
    ({ request }) => request.destination === 'font',
    new CacheFirst({
      cacheName: 'font-cache',
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new ExpirationPlugin({
          maxEntries: 30,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 Year
        }),
      ],
    })
  );

  // This allows the service worker to take control of the page immediately.
  self.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
      }
  });

} else {
  console.log(`Boo! Workbox didn't load 😬`);
}
