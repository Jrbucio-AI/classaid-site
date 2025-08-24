self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({type:'window', includeUncontrolled:true});
      clients.forEach(c => c.navigate(c.url)); // reload
    } catch (err) {}
  })());
});
// no fetch handler → no interception