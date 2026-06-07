const CACHE_NAME = "quran-pwa-cache-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon.png"
];

// Install Event
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch((err) => {
        console.warn("ServiceWorker: some assets failed to cache on install:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Network first, fallback to cached assets or ignore API
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Bypass API requests or development HMR requests
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/@vite") || url.pathname.includes("hot-update")) {
    return;
  }

  // Handle requests
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // Cache valid responses for static assets
        if (res.status === 200 && e.request.method === "GET" && !url.origin.includes("chrome-extension")) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, resClone);
          });
        }
        return res;
      })
      .catch(() => {
        return caches.match(e.request).then((cachedRes) => {
          if (cachedRes) {
            return cachedRes;
          }
          // offline fallback could be served if needed
        });
      })
  );
});
