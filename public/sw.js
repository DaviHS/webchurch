const VERSION = "v5";
const STATIC_CACHE = `static-${VERSION}`;
const RUNTIME_CACHE = `runtime-${VERSION}`;
const PAGES_CACHE = `pages-${VERSION}`;
const OFFLINE_URL = "/offline";
// Texto da Bíblia (capítulos e lista de versões): fica guardado para ler sem internet.
// Tem nome fixo, sem VERSION, para uma nova versão do service worker não apagar o que foi baixado.
const BIBLE_CACHE = "bible-text";
const BIBLE_API_PREFIXES = ["/api/trpc/bible.getChapter", "/api/trpc/bible.versions"];

const PRECACHE_URLS = [
  OFFLINE_URL,
  "/presentation/projector",
  "/presentation/stage",
  "/logo.png",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/favicon.ico",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener("activate", (event) => {
  const current = new Set([STATIC_CACHE, RUNTIME_CACHE, PAGES_CACHE, BIBLE_CACHE]);
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !current.has(k)).map((k) => caches.delete(k)));
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Igreja Central", {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: data.url || "/app" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || "/app", self.location.origin).href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const open = windows.find((client) => client.url.startsWith(self.location.origin));
      if (open) {
        await open.focus();
        if ("navigate" in open) await open.navigate(target);
        return;
      }
      await self.clients.openWindow(target);
    })()
  );
});

const isStaticAsset =(url) => url.pathname.startsWith("/_next/static/");
const isMedia = (request, url) =>
  ["image", "font"].includes(request.destination) ||
  url.pathname.startsWith("/icons/") ||
  /\.(png|jpe?g|svg|webp|gif|ico|woff2?)$/i.test(url.pathname);

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (BIBLE_API_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
    event.respondWith(staleWhileRevalidate(event, BIBLE_CACHE));
    return;
  }
  if (url.pathname.startsWith("/api/")) return;
  if (url.pathname === "/sw.js") return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(event));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (isMedia(request, url)) {
    event.respondWith(staleWhileRevalidate(event, RUNTIME_CACHE));
  }
});

async function networkFirstPage(event) {
  const cache = await caches.open(PAGES_CACHE);
  try {
    const preload = await event.preloadResponse;
    const response = preload || (await fetch(event.request));
    if (response.ok && response.type === "basic") {
      cache.put(event.request, response.clone());
    }
    return response;
  } catch {
    const cached =
      (await cache.match(event.request)) ||
      // A Bíblia abre com qualquer capítulo: sem internet, usa a última tela da Bíblia guardada.
      (new URL(event.request.url).pathname.startsWith("/app/bible")
        ? await cache.match(event.request, { ignoreSearch: true })
        : undefined);
    if (cached) return cached;
    const offline = await caches.match(OFFLINE_URL);
    return offline || new Response("Sem conexão", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(event, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(event.request);
  const network = fetch(event.request)
    .then((response) => {
      if (response.ok) cache.put(event.request, response.clone());
      return response;
    })
    .catch(() => cached);
  if (cached) {
    event.waitUntil(network);
    return cached;
  }
  return network;
}
