const CACHE = 'classaid-v3.2.1';
const ASSETS = [
  '/', '/index.html', '/manifest.json',
  '/css/style.css',
  '/assets/icon-192.png','/assets/icon-256.png','/assets/icon-384.png','/assets/icon-512.png',
  '/js/app.js','/js/store.js','/js/ui.js','/js/gpa.js','/js/assignments.js','/js/flashcards.js','/js/essay.js','/js/importers.js','/js/customize.js','/js/settings.js',
  '/pages/assignments.html','/pages/gpa.html','/pages/flashcards.html','/pages/essay.html','/pages/import.html','/pages/customize.html'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Be forgiving: for navigations, fall back to index.html if network fails.
self.addEventListener('fetch', (e) => {
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/index.html'))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(c => c || fetch(e.request))
  );
});