const { h } = Vue;

export default {
  name: 'TheMenu',
  
  props: {
    currentStore: { type: Object }
  },

  emits: ['itemSelected'],

  data () {
    return {
      isOpen: true,
      storeGroups: []
    }
  },

  async created() {
    this.storeGroups = await this.db.data(this.db.stores.ADM_AppStoreGroups, { sorted: true });
  },

  methods: {
    $_toggleMenu(e) {
      e.stopPropagation();
      this.isOpen = !this.isOpen;
    },

    $_itemSelected(mode, item) {
      this.isOpen = false;
      this.$emit('itemSelected', mode, item);
    }
  },

  render() {
    let ul = null;

    if (this.isOpen) {
      const stores = Object.values(this.db.stores),
      lis = [];

      if (this.currentStore) {
        // functions
        if (this.currentStore.functions) {
          lis.push(h('li', { class: 'liDivider' }, [
            h('span', { class: 'icon' }, 'L'),
            'Nástroje']));
          for (const func of this.currentStore.functions)
            lis.push(h('li', { onClick: () => this.$_itemSelected('func', func.name) }, [
              func.icon
                ? h('span', { class: 'icon' }, func.icon)
                : null,
              func.title]));
        }

        // reports
        if (this.currentStore.reports) {
          lis.push(h('li', { class: 'liDivider' }, [
            h('span', { class: 'icon' }, 'T'),
            'Reporty']));
          for (const report of this.currentStore.reports)
            lis.push(h('li', { onClick: () => this.$_itemSelected('report', report) }, [
              report.icon
                ? h('span', { class: 'icon' }, report.icon)
                : null,
              report.title]));
        }
      }

      // groups
      for (const group of this.storeGroups) {
        lis.push(h('li', { class: 'group' }, [
          h('span', { class: 'icon' }, group.icon),
          group.name]));

        // stores
        for (const storeId of group.stores) {
          const store = stores.find(x => x.schema.id === storeId);
          lis.push(h('li', { onClick: () => this.$_itemSelected('store', store) }, [
            store.schema.icon
              ? h('span', { class: 'icon' }, store.schema.icon)
              : null,
            store.schema.title]));
        }
      }

      ul = h('ul', lis);
    }

    return h('div', { class: 'theMenu'}, [
      h('div', { class: 'icon', onClick: (e) => this.$_toggleMenu(e) }, 'U'),
      ul
    ]);
  }
}