
const CACHE_NAME = 'dumbles-door-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx',
  '/icon-192.png',
  '/icon-512.png',
  'https://esm.sh/react@^19.1.1',
  'https://esm.sh/react-dom@^19.1.1/client',
  'https://esm.sh/@google/genai@^1.15.0',
  'https://esm.sh/marked@^16.2.0'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching core assets');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  // Let the browser handle requests for scripts from its own cache
  // and for non-GET requests.
  if (event.request.url.startsWith('chrome-extension://') || event.request.method !== 'GET') {
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    
    // Stale-while-revalidate strategy
    const cachedResponse = await cache.match(event.request);
    const fetchPromise = fetch(event.request).then(networkResponse => {
      // Check if we received a valid response
      if (networkResponse && networkResponse.status === 200) {
        cache.put(event.request, networkResponse.clone());
      }
      return networkResponse;
    }).catch(err => {
      console.warn('Fetch failed; returning offline page instead.', err);
      // If fetch fails (e.g., offline) and we have a cached response, serve it.
      // Otherwise, this will naturally result in a browser error.
    });

    return cachedResponse || fetchPromise;
  })());
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
    })
  );
});
