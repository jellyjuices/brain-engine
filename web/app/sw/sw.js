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

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/relay/")) return;

  if (url.pathname === "/share") {
    const params = new URLSearchParams();
    for (const key of ["title", "text", "url"])
      if (url.searchParams.get(key)) params.set(key, url.searchParams.get(key));
    event.respondWith(Response.redirect(`/add?${params}`, 303));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/")));
    return;
  }
  event.respondWith(caches.match(request).then((hit) => hit || fetch(request)));
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
