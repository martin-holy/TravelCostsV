export default {
  props: {
    currentStore: { type: Object },
    storesInGroups: { type: Array }
  },

  emits: ['item-selected'],

  data () {
    return {
      isOpen: false
    }
  },

  computed: {
    storeSiblings() {
      return this.storesInGroups
        .find(g => g.group.stores.includes(this.currentStore.schema.id))
        .stores;
    }
  },

  methods: {
    $_toggleMenu(e) {
      e.stopPropagation();
      this.isOpen = !this.isOpen;
    },

    $_itemSelected(mode, item) {
      this.isOpen = false;
      this.$emit('item-selected', mode, item);
    }
  },

  template: `
    <div class="theMenu">

      <div @click="$_toggleMenu($event)">
        ☰
      </div>

      <template v-if="isOpen">
        <ul v-if="!currentStore">
          <li
            @click="$_itemSelected('app-map', null)">
            Domů
          </li>
        </ul>

        <ul v-else>
          <li
            @click="$_itemSelected('app-map', null)">
            Domů
          </li>

          <li
            class="liDivider">
            Úložiště
          </li>
          <li
            v-for="store in storeSiblings"
            @click="$_itemSelected('store', store)">
            {{ store.schema.title }}
          </li>

          <li
            class="liDivider"
            v-if="currentStore.schema.functions">
            Nástroje
          </li>
          <li
            v-if="currentStore.schema.functions"
            v-for="func in currentStore.schema.functions"
            @click="$_itemSelected('func', func.name)">
            {{ func.title }}
          </li>

          <li
            class="liDivider"
            v-if="currentStore.schema.reports">
            Reporty
          </li>
          <li
            v-if="currentStore.schema.reports"
            v-for="report in currentStore.schema.reports"
            @click="$_itemSelected('report', report)">
            {{ report.title }}
          </li>
        </ul>
      </template>
    </div>`
}