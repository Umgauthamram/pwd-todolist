const CACHE_NAME = "beginning-pwa-v3";

const PRECACHE_STATIC_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];

// Install: Precache core application shell safely
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of PRECACHE_STATIC_ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn("[PWA SW] Precache skipped for:", asset, err);
        }
      }
    })
  );
  self.skipWaiting();
});

// Activate: Clean old caches and claim clients immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Immediate Activation Trigger from Client
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Fetch: Robust strategy for offline Next.js PWA
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests or browser-extension schemes
  if (request.method !== "GET" || !url.protocol.startsWith("http")) {
    return;
  }

  // 1. Navigation requests (HTML pages): Network-first with cached root fallback
  if (request.mode === "navigate" || request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          // Offline navigation fallback: try matching the exact request, then fallback to root "/"
          const cachedNav = await caches.match(request, { ignoreSearch: true });
          if (cachedNav) return cachedNav;
          const rootFallback = await caches.match("/", { ignoreSearch: true });
          if (rootFallback) return rootFallback;

          // Ultimate offline fallback response if cache is somehow empty
          return new Response(
            `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Beginning - Offline</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{background:#000;color:#fff;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;padding:20px;text-align:center}h1{font-size:20px;margin-bottom:8px}p{color:#888;font-size:14px;max-width:320px}button{margin-top:20px;padding:10px 20px;border-radius:12px;border:1px solid #333;background:#fff;color:#000;font-weight:600;cursor:pointer}</style></head><body><h1>Offline Mode</h1><p>Unable to connect to the network. Please check your internet connection and reload.</p><button onclick="location.reload()">Retry</button></body></html>`,
            { headers: { "Content-Type": "text/html; charset=utf-8" } }
          );
        })
    );
    return;
  }

  // 2. Next.js Static Assets (_next/static), Fonts, Images, CSS, JS: Cache-First
  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.match(/\.(js|css|woff2?|png|jpg|jpeg|svg|ico|webmanifest)$/i);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request, { ignoreSearch: true }).then((cachedResponse) => {
        if (cachedResponse) {
          // Serve from cache immediately
          return cachedResponse;
        }

        // Not in cache yet, fetch from network and cache it
        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
            }
            return networkResponse;
          })
          .catch(() => {
            // Silently fail if asset not in cache and offline
            return new Response("", { status: 408, statusText: "Offline Asset Unavailable" });
          });
      })
    );
    return;
  }

  // 3. API Requests (/api/): Network-First with cached fallback
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedApiResponse = await caches.match(request);
          if (cachedApiResponse) {
            return cachedApiResponse;
          }
          return new Response(
            JSON.stringify({ offline: true, error: "Network unavailable" }),
            {
              status: 503,
              headers: { "Content-Type": "application/json" },
            }
          );
        })
    );
    return;
  }

  // 4. Default: Stale-While-Revalidate with safe fallback
  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse || new Response("", { status: 503 }));

      return cachedResponse || fetchPromise;
    })
  );
});
