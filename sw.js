// A more robust service worker recommended for PWAs.

const CACHE_NAME = 'dumbles-door-v2'; // Increment version to clear old cache
const OFFLINE_URL = 'offline.html';
const APP_SHELL_URLS = [
    '/',
    '/index.html',
    '/manifest.json',
    OFFLINE_URL
];

// 1. Installation: Pre-cache the app shell.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Pre-caching app shell');
        // Add offline.html to the cache
        const offlineRequest = new Request(OFFLINE_URL, { cache: 'reload' });
        return cache.add(offlineRequest).then(() => {
          return cache.addAll(APP_SHELL_URLS);
        });
      })
  );
});

// 2. Activation: Clean up old caches.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch: Implement caching strategies.
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Strategy 1: Network-first for API calls (Supabase).
  if (url.hostname.includes('supabase.co') || url.hostname.includes('supabase.in')) {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match(request)) // Fallback to cache if network fails
    );
    return;
  }

  // Strategy 2: Network-first, falling back to offline page for navigations.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return caches.open(CACHE_NAME)
            .then(cache => cache.match(OFFLINE_URL));
        })
    );
    return;
  }

  // Strategy 3: Stale-while-revalidate for other assets (CSS, JS, images).
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(request).then(cachedResponse => {
        const fetchPromise = fetch(request).then(networkResponse => {
          // If the fetch is successful, update the cache.
          cache.put(request, networkResponse.clone());
          return networkResponse;
        });

        // Return the cached response immediately if available,
        // otherwise wait for the network response.
        return cachedResponse || fetchPromise;
      });
    })
  );
});
