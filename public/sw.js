// Minimal service worker — required for PWA installability on Android.
// Uses a network-first strategy so Inertia/Vite assets always stay fresh
// while still allowing the app to be added to the home screen as fullscreen.
const CACHE = 'callme-wheel-v1';
const PRECACHE = ['/manifest.webmanifest', '/favicon.svg', '/apple-touch-icon.png'];

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;

    event.respondWith(
        fetch(request)
            .then((response) => {
                const copy = response.clone();
                caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
                return response;
            })
            .catch(() => caches.match(request).then((r) => r ?? Response.error())),
    );
});
