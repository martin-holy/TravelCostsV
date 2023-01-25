function fetchData(url) {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then(res => {
        if (res.ok && res.status === 200 && res.type === 'basic')
          resolve(res);
        else
          throw new Error('Response was not ok');
      })
      .catch(err => {
        reject(err);
      });
  });
}

// delete files from updates.json from cache
// so that new version is fetched
async function updateAppCache(appName) {
  return fetchData('./updates.json')
    .then(async res => {
      const json = await res.json();
      let ver = localStorage.getItem(`${appName}_version`);

      // collect files for update
      const files = new Set();
      for (const u of json.updates)
        if (ver == null || u.version > ver) {
          ver = u.version;
          for (const f of u.files)
            files.add(f);
        }

      // nothing to update
      if (files.size === 0)
        return false;

      console.log('Update: Caching Files');
      const filesArray = Array.from(files),
            cache = await caches.open(appName),
            toDelete = (await cache.keys()).filter(k => filesArray.some(f => k.url.endsWith(f)));

      for (const key of toDelete)
        await cache.delete(key);

      localStorage.setItem(`${appName}_version`, ver);

      return true;
    })
    .catch(err => {
      console.log('App Update:', err);
      return false;
    });
}

export default updateAppCache;