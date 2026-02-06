// This is the service worker with the combined offline experience (Offline page + Offline copy of pages)

const CACHE_NAME = "pwabuilder-offline-cache";
const offlineFallbackPage = "/offline";

// Add whichever assets you want to pre-cache here:
const PRECACHE_ASSETS = [
    "/",
    "/chat-fix",
    "/resume-generator",
    "/voice-note",
    "/ai-tutor",
    "/long-summary",
    "/history",
    "/pricing",
    "/settings",
    "/profile",
    "/new-login",
    "/signup",
    offlineFallbackPage
];


self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(PRECACHE_ASSETS);
  })());
});


self.addEventListener('activate', (event) => {
  // Tell the active service worker to take control of the page immediately.
  event.waitUntil(self.clients.claim());
});


self.addEventListener('fetch', (event) => {
  // We only want to call event.respondWith() if this is a navigation request
  // for an HTML page.
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        // First, try to use the navigation preload response if it's supported.
        const preloadResponse = await event.preloadResponse;
        if (preloadResponse) {
          return preloadResponse;
        }

        // Always try the network first for navigation requests.
        const networkResponse = await fetch(event.request);
        return networkResponse;

      } catch (error) {
        // catch is only triggered if an exception is thrown, which is likely
        // due to a network error.
        // If fetch() returns a valid HTTP response with a 4xx or 5xx status,
        // the catch() will NOT be called.
        console.log('Fetch failed; returning offline page instead.', error);

        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(offlineFallbackPage);
        return cachedResponse;
      }
    })());
  } else {
     // For non-navigation requests, use a cache-first strategy.
     event.respondWith((async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // If not in cache, try the network.
        try {
            const networkResponse = await fetch(event.request);
            // Optional: You could cache new successful responses here
            // if you want to dynamically expand your cache.
            // if (networkResponse.ok) {
            //     const cache = await caches.open(CACHE_NAME);
            //     cache.put(event.request, networkResponse.clone());
            // }
            return networkResponse;
        } catch (error) {
            // If the network fails and it's not in cache, you could
            // return a generic fallback for specific asset types (e.g., placeholder image)
            // For now, we'll just let it fail.
            console.log('Fetch failed for non-navigation request.', error);
            // You could return a specific response here for specific resource types
            return new Response(null, { status: 404 });
        }
     })());
  }
});
