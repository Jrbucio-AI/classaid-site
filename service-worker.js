self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({type:'window', includeUncontrolled:true});
      clients.forEach(c => {
        const u = new URL(c.url);
        u.searchParams.set('fresh', Date.now());
        c.navigate(u.toString());
      });
    } catch (e) {}
  })());
});
// NOTE: no fetch handler → cannot intercept navigation anymore.