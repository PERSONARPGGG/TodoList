const CACHE_NAME = 'chronos-v0.4.1';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './manifest.json',
    './icon.svg',
    './js/main.js',
    './js/store.js',
    './js/ui.js'
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    // Network-first for development smoothness, fallback to cache
    event.respondWith(
        fetch(event.request)
        .then(response => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
            return response;
        })
        .catch(() => caches.match(event.request))
    );
});
