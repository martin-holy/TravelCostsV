const ADM_AppStores = {
  records: [],
  schema: {
    id: 1,
    name: 'ADM_AppStores',
    title: 'Úložiště',
    properties: [
      { name: 'id', title: 'Id', type: 'int', required: true, hidden: true },
      { name: 'name', title: 'Jméno', type: 'text', required: true },
      { name: 'title', title: 'Název', type: 'text', required: true },
      { name: 'orderBy', title: 'Setřídit podle', type: 'text' },
      { name: 'orderAsc', title: 'Setřídit vzestupně', type: 'bool' },
      {
        name: 'properties', title: 'Vlastnosti', type: 'properties', properties: [
          { name: 'default', title: 'Výchozí', type: 'variable' }
        ]
      }
    ],
    functions: [
      { name: 'import', title: 'Import data' },
      { name: 'export', title: 'Export data' }
    ]
  },

  // TODO ještě to poštelovat. promise by mel bejt asi v reader.onload
  import(db) {
    if (confirm('Do you want to backup data before Import?\nAfter backup click on Import again.')) {
      this.export(db);
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
  },

  async export(db) {
    const data = { stores: [] };

    for (const store of Object.values(db.stores)) {
      if (store.schema.name.startsWith('ADM_')) continue;

      data.stores.push({
        name: store.schema.name,
        values: await db.data(store)
      });
    }

    this.downloadDataAsJson(data, `travelCostsExport_${new Date().toYMD()}.json`);
  },

  downloadDataAsJson(data, fileName) {
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
};

export default ADM_AppStores;