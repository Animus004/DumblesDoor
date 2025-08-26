
const CACHE_NAME = 'dumbles-door-cache-v3'; // Incremented version to trigger update
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  // Main JS dependencies from CDN
  'https://esm.sh/react@^19.1.1',
  'https://esm.sh/react-dom@^19.1.1/client',
  'https://esm.sh/@google/genai@^1.15.0',
  'https://esm.sh/marked@^16.2.0',
  'https://esm.sh/@supabase/supabase-js@^2.45.2', // Critical dependency added
  // Fonts
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching core assets');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Failed to cache core assets:', error);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Ignore non-GET requests and chrome extensions.
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  // For HTML pages (navigation requests), use a network-first strategy.
  // This ensures the user always gets the latest version of the app shell if online.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If the network fails, serve the cached index.html as a fallback.
          return caches.match('/index.html');
        })
    );
    return;
  }

  // For other assets (CSS, JS, images), use a stale-while-revalidate strategy.
  // This provides a fast response from the cache while updating it in the background.
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          // Check for a valid response to cache
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(error => {
            console.warn(`Fetch failed for: ${event.request.url}`, error);
            // If fetch fails and we have a cached response, it has already been returned.
            // If not, the promise rejection will bubble up, causing a standard browser network error.
        });

        // Return cached version immediately if available, otherwise wait for the network response.
        return cachedResponse || fetchPromise;
      });
    })
  );
});
