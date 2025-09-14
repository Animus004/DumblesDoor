const CACHE_NAME = 'dumbles-door-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/icon-72.png',
  '/icon-144.png',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json'
  // The main JS/CSS are loaded from esm.sh via importmap,
  // which the service worker will cache dynamically on first fetch.
];

// Install a service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Cache and return requests
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // For API calls (Supabase), use a network-first strategy.
  if (requestUrl.hostname.includes('supabase.co') || requestUrl.hostname.includes('supabase.in')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If the request is successful, clone it and cache it.
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          return response;
        })
        .catch(() => {
          // If the network fails, try to serve from the cache.
          return caches.match(event.request);
        })
    );
    return;
  }

  // For all other requests (app shell, fonts, dynamic imports from esm.sh), use a cache-first strategy.
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Not in cache - fetch it, and cache it for next time.
        return fetch(event.request).then(
          response => {
            // Check if we received a valid response
            if (!response || response.status !== 200) {
              return response;
            }

            // We don't cache opaque responses (from no-cors requests to third-party CDNs)
            // as we can't validate them, but we still serve them.
            if(response.type === 'opaque') {
                return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

// Update a service worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
