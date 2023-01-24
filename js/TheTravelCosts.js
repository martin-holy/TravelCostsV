import ADM_AppStores from './stores/ADM_AppStores.js';
import ADM_AppStoreGroups from './stores/ADM_AppStoreGroups.js';
import ADM_AppSettings from './stores/ADM_AppSettings.js';
import GLO_Countries from './stores/GLO_Countries.js';
import GLO_CountriesStay from './stores/GLO_CountriesStay.js';
import GLO_HelpPlaces from './stores/GLO_HelpPlaces.js';
import GLO_People from './stores/GLO_People.js';
import MON_Costs from './stores/MON_Costs.js';
import MON_Incomes from './stores/MON_Incomes.js';
import MON_Debts from './stores/MON_Debts.js';
import MON_CostsTypes from './stores/MON_CostsTypes.js';
import MON_Currencies from './stores/MON_Currencies.js';
import MON_Rates from './stores/MON_Rates.js';
import CAR_Drives from './stores/CAR_Drives.js';
import CAR_Refueling from './stores/CAR_Refueling.js';
import CAR_PricePerKm from './stores/CAR_PricePerKm.js';
import CAR_PricePerDay from './stores/CAR_PricePerDay.js';
import CAR_PresencePerDay from './stores/CAR_PresencePerDay.js';
import CAR_CostsTypes from './stores/CAR_CostsTypes.js';

import RepCarDrives from './reports/RepCarDrives.js';
import RepCarDrivesOld from './reports/RepCarDrivesOld.js';
import RepCarRefueling from './reports/RepCarRefueling.js';
import RepGloCountriesStay from './reports/RepGloCountriesStay.js';
import RepGloCountriesStaySum from './reports/RepGloCountriesStaySum.js';
import RepMonCosts from './reports/RepMonCosts.js';
import RepMonDebtsCalc from './reports/RepMonDebtsCalc.js';

import TheAppMap from './TheAppMap.js';
import TheMenu from './TheMenu.js';
import TableManager from './controls/TableManager.js';

export default {
  components: {
    TheAppMap,
    TheMenu,
    TableManager,
    RepCarDrives,
    RepCarDrivesOld,
    RepCarRefueling,
    RepGloCountriesStay,
    RepGloCountriesStaySum,
    RepMonCosts,
    RepMonDebtsCalc
  },

  data () {
    return {
      appName: 'Travel Costs V',
      appTitle: 'Travel Costs V',
      dbName: 'TravelCostsV',
      dbVersion: 1,
      dbDataVersion: 1,
      activeTabName: 'app-map',
      activeRepName: '',
      isTheMenuVisible: false,
      currentStore: null,
      storesInGroups: [],
      stores: {
        ADM_AppStores,
        ADM_AppStoreGroups,
        ADM_AppSettings,
        GLO_Countries,
        GLO_CountriesStay,
        GLO_HelpPlaces,
        GLO_People,
        MON_Costs,
        MON_Incomes,
        MON_Debts,
        MON_CostsTypes,
        MON_Currencies,
        MON_Rates,
        CAR_Drives,
        CAR_Refueling,
        CAR_PricePerKm,
        CAR_PricePerDay,
        CAR_PresencePerDay,
        CAR_CostsTypes
      }
    }
  },

  async created() {
    await this.db.init(this.dbName, this.dbVersion, this.stores, this.log);
    await this.$_updateDbData();
    await this.$_createStoresInGroups();
  },

  methods: {
    async $_updateDbData() {
      const dataVersion = await this.db.getRecordById(this.stores.ADM_AppSettings, 1);
      
      if (dataVersion === this.dbDataVersion) return;
  
      // init
      if (!dataVersion) {
        const stores = [];
        for (const store of Object.values(this.stores))
          stores.push(store.schema);
  
        await this.db.insert(this.stores.ADM_AppStores, stores);
        await this.db.insert(this.stores.ADM_AppStoreGroups, [
          { id: 1, name: 'Administrace', icon: 'adm', index: 4, stores: [1, 2] },
          { id: 2, name: 'Příjmy a Výdaje', icon: 'money', index: 1, stores: [20, 21, 22, 23, 24, 26] },
          { id: 3, name: 'Vozidlo', icon: 'car', index: 2, stores: [30, 31, 32, 33, 34, 35] },
          { id: 4, name: 'Globální', icon: 'global', index: 3, stores: [10, 11, 12, 13] }
        ]);
        await this.db.insert(this.stores.ADM_AppSettings, [{ id: 1, dataVersion: this.dbDataVersion }]);
      }
    },

    async $_createStoresInGroups() {
      const stores = Object.values(this.stores);
      const groups = await this.db.data(this.stores.ADM_AppStoreGroups, { sorted: true });

      for (const group of groups) {
        this.storesInGroups.push({
          group: group,
          stores: stores.filter(s => group.stores.includes(s.schema.id))});
      }
    },

    $_closeTheMenu() {
      this.$refs.theMenu.isOpen = false;
    },

    $_theMenuItemSelected(mode, item) {
      switch (mode) {
        case 'app-map':
          this.activeTabName = 'app-map';
          this.appTitle = this.appName;
          break;
        case 'store':
          this.db.data(item, { sorted: true })
            .then(() => {
              this.currentStore = item;
              this.activeTabName = 'store';
              this.appTitle = item.schema.title;
            });
          break;
        case 'func':
          this.currentStore[item](this.db);
          break;
        case 'report':
          this.activeRepName = item.name;
          this.activeTabName = 'report';
          this.appTitle = item.title;
          break;
      }
    },

    $_isTabActive(tabName) {
      return this.activeTabName === tabName;
    }
  },

  template: `
    <div
      class="theTravelCosts flexColContainer"
      @click="$_closeTheMenu">
      <header>
        <the-menu
          ref="theMenu"
          :currentStore="currentStore"
          :storesInGroups="storesInGroups"
          @item-selected="$_theMenuItemSelected">
        </the-menu>

        <span
          id="title"
          class="rborder">
          {{ appTitle }}
        </span>

        <div id="toolBar">
          <div
            class="toolBarIcon"
            v-if="$_isTabActive('store')"
            @click="() => $refs.theStore.$_editRecNew()">
            ✹
          </div>
        </div>

        <span id="version"></span>
      </header>

      <div class="mainContent">

        <the-app-map
          v-if="$_isTabActive('app-map')"
          :storesInGroups="storesInGroups"
          @storeSelected="$_theMenuItemSelected">
        </the-app-map>

        <table-manager
          ref="theStore"
          v-if="$_isTabActive('store')"
          :store="currentStore">
        </table-manager>

        <component
          v-if="$_isTabActive('report')"
          :is="activeRepName">
        </component>

      </div>
    </div>`
}