
const CACHE='ca-v9';
const PRECACHE=['index.html','styles.css?v=9','app.js?v=9','app.html','dashboard.js?v=9','overlay.js?v=9','login.html','brand.html','assets/logo.svg','assets/icon-192.png','assets/icon-512.png','assets/og-cover.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(PRECACHE)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('message',e=>{try{const data=JSON.parse(e.data||'{}');if(data.cmd==='RESET_IF_OLD'){caches.keys().then(keys=>keys.filter(k=>k!==CACHE).forEach(k=>caches.delete(k)));}}catch(_){}});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.mode==='navigate' || (req.headers.get('accept')||'').includes('text/html')){
    e.respondWith(fetch(req).catch(()=>caches.match('index.html'))); return;
  }
  e.respondWith(caches.match(req).then(r=>r||fetch(req)));
});
