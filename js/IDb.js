import common from './common.js';

const IDb = {
  init: async function(dbName) {
    this.et = new EventTarget();
    this.events = { onBeforeSave: [], onAfterSave: [], onDelete: [] };
    this.log = common.log;
    this.dbName = dbName;
    this.dbVersion = parseInt(localStorage.getItem(`${dbName}_dbVersion`));
    this.storesStoreName = 'ADM_AppStores';

    const schemaStore = { records: [], schema: { name: 'ADM_AppStores', properties: [] } };
    let initData = null;

    if (!this.dbVersion) {
      initData = await this.getInitData();
      this.dbVersion = 1;
      localStorage.setItem(`${this.dbName}_dbVersion`, this.dbVersion);
    }

    const upgrade = initData ? { toAdd: initData.stores, toDelete: [] } : null;
    this.db = await this.getDb(this.dbName, this.dbVersion, upgrade);

    if (initData)
      await this.insert(schemaStore, initData.stores);

    this.stores = Vue.reactive(await this.loadStores(schemaStore));

    if (initData)
      for (const store of initData.data)
        await this.insert(this.stores[store.name], store.records);
  },

  async getInitData() {
    const adm = await common.fetchJson('./js/stores_adm.json'),
          custom = await common.fetchJson('./js/stores_custom.json');

    return {
      stores: adm.stores.concat(custom.stores),
      data: adm.data.concat(custom.data)
    };
  },

  getDb: async function(name, version, upgrade) {
    return new Promise(resolve => {
      let req = window.indexedDB.open(name, version);
  
      req.onsuccess = e => {
        let db = e.target.result;
        db.onerror = e => this.log(`Database Error: ${e.target.error.message}`, true);
        resolve(db);
      };
  
      req.onerror = e => {
        throw new Error(`Open Database Error: ${e.target.error.message}`);
      };
  
      req.onupgradeneeded = async e => {
        let db = e.target.result;
        db.onerror = e => this.log(`Database Error: ${e.target.error.message}`, true);
        
        if (!upgrade) return;

        for (const store of upgrade.toAdd)
          db.createObjectStore(store.name, { keyPath: 'id', autoIncrement: true });

        for (const store of upgrade.toDelete)
          db.deleteObjectStore(store.name);
      };
    });
  },

  async addStore(store) {   
    if (this.db) {
      if (this.db.objectStoreNames.contains(store.name))
        return;

      this.db.close();
    }

    const upgrade = { toAdd: [store], toDelete: [] };
    this.dbVersion++;
    localStorage.setItem(`${this.dbName}_dbVersion`, this.dbVersion);
    this.db = await this.getDb(this.dbName, this.dbVersion, upgrade);
    this.stores[store.name] = { records: [], schema: store };
  },

  async deleteStore(store) {
    if (this.db) {
      if (!this.db.objectStoreNames.contains(store.name))
        return;

      this.db.close();
    }

    const upgrade = { toAdd: [], toDelete: [store] };
    this.dbVersion++;
    localStorage.setItem(`${this.dbName}_dbVersion`, this.dbVersion);
    this.db = await this.getDb(this.dbName, this.dbVersion, upgrade);
    delete this.stores[store.name];
  },

  async loadStores(schemaStore) {
    const schemas = await this.data(schemaStore),
          stores = {};

    for (const schema of schemas)
      Object.defineProperty(stores, schema.name, {
        value: { records: [], schema: schema },
        writable: true,
        enumerable: true,
        configurable: true
      });

    stores[this.storesStoreName].records = schemas;

    return stores;
  },

  async loadStoreRecords(store) {
    await this.data(store, { sorted: true });

    let stores = store.schema.properties
      .filter(x => x.type.source)
      .map(x => x.type.source);

    if (store.schema.properties.find(prop =>
      prop.type.name === 'variable' || (
      prop.type.name === 'array' && 
      prop.type.schema.properties.find(x => x.type.name === 'variable')))) {

      const getSources = (obj) => {
        let out  = [];

        for (const prop of Object.values(obj))
          switch (typeOf(prop)) {
            case 'object':
              if (prop.source)
                out.push(prop.source);
              break;
            case 'array':
              for (const item of prop)
                out = out.concat(getSources(item));
              break;
          }

        return out;
      };

      for (const rec of store.records)
        stores = stores.concat(getSources(rec));
    }

    const set = new Set(stores);

    for (const name of set)
      await this.data(this.stores[name], { sorted: true });
  },

  async data(store, args = {}) {
    // Get Store Records
    if (store.records.length === 0)
      store.records = await this.getStoreData(store.schema.name);

    // Link Stores and Get Linked Stores Records
    for (const prop of store.schema.properties) {
      if (!prop.type.source) continue;
      await this.data(this.stores[prop.type.source], { sorted: true });
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

    if (args.orderBy)
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
        if (prop.type.source === storeName) {
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
  },

  deleteDb() {
    this.db.close();
    return new Promise((resolve, reject) => {
      const req = indexedDB.deleteDatabase(this.dbName);
      req.onsuccess = () => {
        this.log('Deleted database successfully');
        resolve();
      };

      req.onerror = (e) => {
        this.log(`Could not delete database. ${e.target.errorCode}`, true);
        reject();
      };

      req.onblocked = () => {
        this.log('Could not delete database due to the operation being blocked.', true);
        reject();
      };
    });
  }
};

export default IDb;