
const CACHE = 'classaid-v3.2';
const ASSETS = [
  './','./index.html','./manifest.json',
  './css/style.css',
  './assets/icon-192.png','./assets/icon-256.png','./assets/icon-384.png','./assets/icon-512.png',
  './js/app.js','./js/store.js','./js/ui.js','./js/gpa.js','./js/assignments.js','./js/flashcards.js','./js/essay.js','./js/importers.js','./js/customize.js','./js/settings.js',
  './pages/assignments.html','./pages/gpa.html','./pages/flashcards.html','./pages/essay.html','./pages/import.html','./pages/customize.html'
];
self.addEventListener('install', e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener('activate', e=> e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e=>{
  e.respondWith(caches.match(e.request).then(c => c || fetch(e.request).then(r=>{
    const cp = r.clone(); caches.open(CACHE).then(ca=> ca.put(e.request, cp)); return r;
  }).catch(()=> c)));
});
