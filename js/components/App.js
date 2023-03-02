import TheMenu from './TheMenu.js';
import TableManager from './TableManager.js';

const { h, resolveComponent } = Vue;

export default {
  name: 'App',

  data () {
    return {
      activeRep: null,
      currentStore: null
    };
  },

  methods: {
    $_theMenuItemSelected(mode, item) {
      switch (mode) {
        case 'store':
          this.activeRep = null;
          this.db.loadStoreRecords(item)
            .then(() => this.currentStore = item);
          break;
        case 'func':
          this.currentStore[item](this.db, null);
          break;
        case 'report':
          this.activeRep = item;
          break;
      }
    }
  },

  render() {
    const menu = h(TheMenu, {
      currentStore: this.currentStore,
      onItemSelected: (mode, item) => this.$_theMenuItemSelected(mode, item) });

    const activeTab = this.activeRep
      ? h(resolveComponent(this.activeRep.name), { repData: this.activeRep })
      : h(TableManager, { store: this.currentStore });

    return [menu, activeTab];
  }
}