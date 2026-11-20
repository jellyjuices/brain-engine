const VERSION = "__VERSION__";
const CACHE = `brain-shell-${VERSION}`;
const PRECACHE = __PRECACHE__;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("brain-shell-") && k !== CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isAppRequest(request, url) {
  const passThrough = url.pathname.startsWith("/api/") || url.pathname.startsWith("/relay/");
  return request.method === "GET" && url.origin === self.location.origin && !passThrough;
}

function shareRedirect(url) {
  const params = new URLSearchParams();
  for (const key of ["title", "text", "url"]) {
    const value = url.searchParams.get(key);
    if (value) params.set(key, value);
  }
  return Response.redirect(`/add?${params}`, 303);
}

function cachedOrFetched(request) {
  return caches.match(request).then((hit) => hit || fetch(request));
}

function respond(request, url) {
  if (url.pathname === "/share") return shareRedirect(url);
  if (request.mode === "navigate") return fetch(request).catch(() => caches.match("/"));
  return cachedOrFetched(request);
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (isAppRequest(event.request, url)) event.respondWith(respond(event.request, url));
});

self.addEventListener("sync", (event) => {
  if (event.tag !== "outbox") return;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      if (clients.length === 0) return Promise.reject(new Error("No window open, retry later"));
      for (const client of clients) client.postMessage({ type: "flush-outbox" });
    }),
  );
});
