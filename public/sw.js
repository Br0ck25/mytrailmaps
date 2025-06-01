// public/sw.js

self.addEventListener('fetch', event => {
  if (event.request.url.includes('/tiles/')) {
    event.respondWith(
      caches.open('map-tiles-v1').then(cache =>
        cache.match(event.request).then(response =>
          response || fetch(event.request).then(networkResponse => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          })
        )
      )
    );
  }
});
