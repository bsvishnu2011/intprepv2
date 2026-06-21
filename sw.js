const CACHE_NAME = "qa-interview-prep-v2";
const PRECACHE_URLS = ["interview_prep.html", "manifest.json", "icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first so edits to the prep content show up immediately when online;
// falls back to the cached copy so the app still opens offline.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  // Only handle our own same-origin app-shell files. Never intercept cross-origin
  // requests (Firebase Auth, Firestore, the Firebase SDK CDN imports, Prism, Google
  // Sign-In) — Firestore in particular uses long-lived streaming/polling connections
  // that a generic caching fetch handler can silently break or serve stale data for.
  if (new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
