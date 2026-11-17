const CACHE_NAME = 'chronos-v0.5.2'; // keep in sync with js/config.js APP_VERSION (checked by tests)
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './manifest.json',
    './icon.svg',
    './js/config.js',
    './js/i18n.js',
    './js/main.js',
    './js/store.js',
    './js/ui.js',
    './js/utils.js',
    './js/core/alerts.js',
    './js/core/parser.js',
    './js/core/recurrence.js',
    './js/data/backup.js',
    './js/data/links.js',
    './js/data/profile.js',
    './js/data/storage.js',
    './js/data/tasks.js',
    './js/i18n/en.js',
    './js/i18n/ja.js',
    './js/i18n/ko.js',
    './js/ui/calendar.js',
    './js/ui/countdown.js',
    './js/ui/dom.js',
    './js/ui/effects.js',
    './js/ui/intel.js',
    './js/ui/links.js',
    './js/ui/modals.js',
    './js/ui/navigation.js',
    './js/ui/notifications.js',
    './js/ui/tasks.js',
    './js/ui/translate.js'
];
// Third-party runtime the page cannot render without (cached opportunistically).
const CDN_HOSTS = ['cdn.tailwindcss.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const req = event.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);
    const sameOrigin = url.origin === self.location.origin;
    if (!sameOrigin && !CDN_HOSTS.includes(url.hostname)) return;

    // Network-first so deploys show up immediately; cache is the offline fallback.
    event.respondWith(
        fetch(req)
            .then(response => {
                if (response.ok || response.type === 'opaque') {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
                }
                return response;
            })
            // ignoreSearch: assets are requested with ?v= cache-busting params.
            .catch(() => caches.match(req, { ignoreSearch: true })
                .then(hit => hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
    );
});

// Focus (or open) the app when a CHRONOS notification is tapped.
self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
            const existing = list.find(c => 'focus' in c);
            return existing ? existing.focus() : self.clients.openWindow('./');
        })
    );
});
