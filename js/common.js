export function attachCommon(db, app) {
  db.events.onAfterSave.push(async (e) => {
    const { db, store, rec } = e.detail;

    switch (store.schema.name) {
      case 'ADM_AppStores':
        await db.addStore(rec);
        break;
      case 'ADM_AppSettings':
        switch (rec.key) {
          case 'appBgColorBase':
            document.body.style.setProperty('--bg-color-base', rec.value);
            break;
          case 'appAccentColorBase':
            document.body.style.setProperty('--accent-color-base', rec.value);
            break;
        }
          
        break;
    }
  });

  db.events.onDelete.push(async (e) => {
    const { db, store, rec } = e.detail;

    switch (store.schema.name) {
      case 'ADM_AppStores':
        await db.deleteStore(rec);
        break;
    }
  });

  db.stores.SYS_Empty = { records: [], schema: { name: 'SYS_Empty', properties: [] } };

  db.stores.SYS_Align = {
    records: [
      { value: '' },
      { value: 'left' },
      { value: 'center' },
      { value: 'right' }],
    schema: {
      name: 'SYS_Align',
      properties: [
        { name: 'value', title: 'Value', type: 'text' }]}
  };

  db.stores.SYS_Types = {
    records: [
      { name: 'array', schema: {} },
      { name: 'date' },
      { name: 'checkbox' },
      { name: 'color' },
      { name: 'number', step: 1, min: 0 },
      { name: 'select', source: '', value: '', title: '' },
      { name: 'selectMulti', source: '', value: '', title: '' },
      { name: 'text', autocomplete: true },
      { name: 'textarea' },
      { name: 'type' },
      { name: 'variable', typeProp: '' }
    ],
    schema: {
      name:'SYS_Types',
      properties: [
        { name: 'name', title: 'Type', type: 'text' }]}
  };

  db.stores.ADM_AppStores.importDb = (db, rec) => importDb(db);
  db.stores.ADM_AppStores.exportDb = (db, rec) => exportDb(db);
  db.stores.ADM_AppStores.reset = (db, rec) => reset(db);
  db.stores.ADM_AppStores.functions = [
    { icon: 'a', name: 'importDb', title: 'Import data' },
    { icon: 'b', name: 'exportDb', title: 'Export data' },
    { icon: 'd', name: 'reset', title: 'Reset application' }
  ];
}

async function reset(db) {
  if (!confirm('Do you really want to delete all application data?'))
    return;

  localStorage.removeItem(`${db.dbName}_dbVersion`);
  localStorage.removeItem(`${db.dbName}_version`);
  await caches.delete(db.dbName);
  await db.deleteDb();
  window.location.reload(true);
}

// TODO ještě to poštelovat. promise by mel bejt asi v reader.onload
function importDb(db) {
  if (confirm('Do you want to backup data before Import?\nAfter backup click on Import again.')) {
    exportDb(db);
    return null;
  }

  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.addEventListener('change', e => {
      const reader = new FileReader();
      
      reader.onload = e => {
        const dbSource = JSON.parse(e.target.result),
              storeNames = [];

        for (const store of dbSource.stores)
          storeNames.push(store.name);

        const tx = db.db.transaction(storeNames, 'readwrite');

        tx.oncomplete = () => {
          db.log('Database import done!', true);
          resolve();
        };

        tx.onerror = e => {
          db.log(`Database import error: ${e.target.errorCode}`, true);
          reject();
        };

        for (const store of dbSource.stores) {
          const dbStore = tx.objectStore(store.name),
                delRequest = dbStore.clear();

          delRequest.onsuccess = () => {
            for (const item of store.values)
              dbStore.add(item);
          };
        }
      };

      reader.readAsText(e.srcElement.files[0]);
    });

    input.dispatchEvent(new MouseEvent('click'));
  }).then(() => location.reload(false));
}

async function exportDb(db) {
  const data = { stores: [] };

  for (const store of Object.values(db.stores)) {
    const name = store.schema.name;
    if (name.startsWith('ADM_') || name.startsWith('SYS_')) continue;

    data.stores.push({
      name: name,
      values: await db.data(store)
    });
  }

  // TODO get file name from somewhere
  downloadDataAsJson(data, `travelCostsExport_${new Date().toYMD()}.json`);
}

function downloadDataAsJson(data, fileName) {
  const file = new Blob([JSON.stringify(data)], { type: 'text/plain' }),
        url = URL.createObjectURL(file),
        a = document.createElement('a');

  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 0);
}

export function log(msg, withAlert = false) {
  console.log(msg);
  if (withAlert)
    alert(msg);
}

export async function fetchJson(url) {
  const res = await fetch(url);

  if (res.ok && res.status === 200 && res.type === 'basic')
    return res.json();

  log(`Network response was not ok while fetching '${res.url}'.`, true);
  return null;
}

export async function getManifest() {
  return fetchJson('./manifest.json');
}

// delete files from updates.json from cache
// so that new version is fetched
export async function updateAppCache(appName) {
  const json = await fetchJson('./updates.json');
  
  if (!json) return false;

  try {
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

    const filesArray = Array.from(files),
          cache = await caches.open(appName),
          toDelete = (await cache.keys()).filter(k => filesArray.some(f => k.url.endsWith(f)));

    for (const key of toDelete)
      await cache.delete(key);

    localStorage.setItem(`${appName}_version`, ver);

    return true;
  } catch (error) {
    log(`App Update error: ${error}`, true);
    return false;
  }
}

export default {
  attachCommon,
  log,
  fetchJson,
  getManifest,
  updateAppCache
}