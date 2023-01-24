const IDb = {
  init: async function(dbName, dbVersion, stores, log) {
    this.log = log;
    this.stores = stores;
    this.db = await this.getDb(dbName, dbVersion, Object.keys(stores));
  },

  getDb: async function(name, version, storeNames) {
    return new Promise(resolve => {
      let req = window.indexedDB.open(name, version);
  
      req.onsuccess = e => {
        let db = e.target.result;
        
        db.onerror = e => {
          this.log(`Database Error: ${e.target.error.message}`, true);
        };
  
        resolve(db);
      };
  
      req.onerror = e => {
        throw new Error(`Open Database Error: ${e.target.error.message}`);
      };
  
      req.onupgradeneeded = e => {
        let db = e.target.result;
  
        db.onerror = e => {
          this.log(`Database Error: ${e.target.error.message}`, true);
        };
  
        for (const storeName of storeNames) {
          if (db.objectStoreNames.contains(storeName))
            continue;

          db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  },

  async data(store, args = {}) {
    // Get Store Records
    if (store.records.length === 0)
      store.records = await this.getStoreData(store.schema.name);

    // Link Stores and Get Linked Stores Records
    for (const prop of store.schema.properties) {
      if (!prop.source) continue;
      prop.source.store = this.stores[prop.source.name];
      await this.data(prop.source.store, { sorted: true });
    }

    this.sortStore(store, args);

    return store.records;
  },

  sortStore(store, args) {
    // args: sorted(bool) => sort by default
    //       orderBy(string) => sort by column name
    //       orderAsc(bool) => true is default

    if (args.sorted) { // sort by default
      args.orderBy = store.schema.orderBy;
      args.orderAsc = store.schema.orderAsc;
    }

    if (args.sorted || args.orderBy)
      store.records.orderBy(args.orderBy, args.orderAsc);
  },

  getStoreData(storeName) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readonly'),
            request = tx.objectStore(storeName).getAll();

      request.onsuccess = (e) => {
        resolve(e.target.result);
      };

      request.onerror = (e) => {
        this.log(`getStoreRecords: ${e.target.errorCode}`, true);
        reject(null);
      };
    });
  },

  // insert, update and delete data from store based on action
  iudStoreData(store, action, data) {
    return new Promise(async (resolve, reject) => {
      const tx = this.db.transaction([store.schema.name], 'readwrite'),
            dbStore = tx.objectStore(store.schema.name),
            inserts = [];

      tx.oncomplete = () => {
        // update cache
        switch (action) {
          case 'insert':
            for (const inst of inserts) {
              inst[0].id = inst[1].result;
              store.records.push(inst[0]);
            }

            this.sortStore(store, { sorted: true });

            break;
          case 'update':
            this.sortStore(store, { sorted: true });

            break;
          case 'delete':
            for (const rec of data)
              store.records.splice(store.records.indexOf(rec), 1);

            break;
        }

        this.log('All data updated in database!');
        resolve();
      };

      tx.onerror = (e) => {
        this.log(`There was an error: ${e.target.error.message}`, true);
        reject();
      };

      switch (action) {
        case 'insert':
          for (const rec of data)
            inserts.push([rec, dbStore.add(this.cleanClone(rec))]);
          break;
        case 'update':
          for (const rec of data)
            dbStore.put(this.cleanClone(rec));
          break;
        case 'delete':
          for (const rec of data)
            dbStore.delete(rec.id);
          break;
      }
    });
  },
  
  cleanClone(data) {
    return JSON.parse(JSON.stringify(data));
  },

  async insert(store, data) {
    await this.iudStoreData(store, 'insert', data);
  },

  async update(store, data) {
    await this.iudStoreData(store, 'update', data);
  },

  async delete(store, data) {
    await this.iudStoreData(store, 'delete', data);
  },

  async getRecordById(store, id) {
    return (await this.data(store))
      .find(rec => rec.id === id);
  },

  async canDelete(storeName, rec) {
    for (const store of Object.values(this.stores))
      for (const prop of store.schema.properties) {
        if (prop.source && prop.source.name === storeName) {
          const storeItems = await this.data(store);
          if (storeItems.find(x => {
              if (Array.isArray(x[prop.name]))
                return x[prop.name].includes(rec.id);
              else
                return x[prop.name] === rec.id;
            })) {
            alert(`This record can't be deleted because is used in ${store.schema.title} store!`);
            return false;
          }
        }
      }

    return true;
  }
};

export default IDb;