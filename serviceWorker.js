// include contains only files not used in index.html

const appName = 'TravelCostsV',
      exclude = ['/TravelCostsV/updates.json'],
      include = [
        '/TravelCostsV/img/flags/AL.png',
        '/TravelCostsV/img/flags/AT.png',
        '/TravelCostsV/img/flags/BG.png',
        '/TravelCostsV/img/flags/BO.png',
        '/TravelCostsV/img/flags/BR.png',
        '/TravelCostsV/img/flags/CA.png',
        '/TravelCostsV/img/flags/CZ.png',
        '/TravelCostsV/img/flags/DE.png',
        '/TravelCostsV/img/flags/EC.png',
        '/TravelCostsV/img/flags/ES.png',
        '/TravelCostsV/img/flags/FR.png',
        '/TravelCostsV/img/flags/GB.png',
        '/TravelCostsV/img/flags/GR.png',
        '/TravelCostsV/img/flags/GY.png',
        '/TravelCostsV/img/flags/HR.png',
        '/TravelCostsV/img/flags/HU.png',
        '/TravelCostsV/img/flags/CH.png',
        '/TravelCostsV/img/flags/IT.png',
        '/TravelCostsV/img/flags/ME.png',
        '/TravelCostsV/img/flags/PE.png',
        '/TravelCostsV/img/flags/PL.png',
        '/TravelCostsV/img/flags/PT.png',
        '/TravelCostsV/img/flags/RO.png',
        '/TravelCostsV/img/flags/SI.png',
        '/TravelCostsV/img/flags/SK.png',
        '/TravelCostsV/img/flags/TT.png',
        '/TravelCostsV/img/flags/US.png'];

self.addEventListener('install', e => {
  console.log('Service Worker: Installed');

  e.waitUntil(
    caches.open(appName).then(cache => {
      console.log('Service Worker: Caching Files');

      return cache.addAll(include);
    })
  );
});

self.addEventListener('activate', async () => {
  console.log('Service Worker: Activated');

  // cache is updated in updateAppCache() and not recreated with new name
  // so there is no need to delete old cache
  // update will just delete files from cache so that new versions of files can be fetched

  return self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Respond with Cache falling back to Network
  e.respondWith(async function() {
    try {
      const cache = await caches.open(appName),
            res = await cache.match(e.request);
      
      if (res)
        return res;

      const netRes = await fetch(e.request);

      if (netRes.ok && netRes.status === 200 && netRes.type === 'basic')
        if (!exclude.find(x => e.request.url.endsWith(x)))
          cache.put(e.request, netRes.clone());
      
      return netRes;
    } catch (err) {
      console.log('Error in fetch handler:', err);
      throw err;
    }
  }());
});