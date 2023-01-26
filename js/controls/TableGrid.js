export default {
  props: {
    schema: { type: Object },
    records: { type: Array }
  },

  emits: ['itemSelected'],

  data () {
    return {
      loadCount: 0
    }
  },

  computed: {
    storeProps() {
      return this.schema.properties
        .filter(x => !x.hidden && x.type !== 'array');
    },

    gridRecords() {
      const count = Math.min(this.loadCount, this.records.length);
      return this.records.slice(0, count + 1);
    }
  },

  watch: {
    'records.length'() {
      this.loadCount = 0;
    }
  },

  mounted() {
    this.$_appendRows();
  },

  updated() {
    this.$_appendRows();
    this.$_setFixedThead();
  },

  methods: {
    $_getRecVal(rec, prop) {
      let val = '';

      switch (prop.type) {
        case 'multiSelect': {
          if (rec[prop.name])
            val = rec[prop.name]
              .map(id => prop.source.store.records.find(d => d.id === id)[prop.source.property])
              .join(', ');
          break;
        }
        case 'select': {
          const srcItem = prop.source.store.records.find(d => d.id === rec[prop.name]);
          if (srcItem)
            val = srcItem[prop.source.property];
          break;
        }
        case 'bool': {
          val = rec[prop.name] ? '✔' : '✖';
          break;
        }
        default:
          val = rec[prop.name];
      }

      if (!val) val = '';

      return val;
    },

    $_getRecStyle(rec, prop) {
      const style = {};

      if (prop.align)
        style.textAlign = prop.align;

      if (prop.type === 'select') {
        const srcItem = prop.source.store.records.find(d => d.id === rec[prop.name]);
        if (srcItem && srcItem.bgColor)
          style.backgroundColor = srcItem.bgColor;
      }

      if (prop.name === 'bgColor')
        style.backgroundColor = rec[prop.name];

      return style;
    },

    $_setFixedThead() {
      const widths = [];

      this.$refs.gridSource.querySelectorAll('th')
        .forEach(elm => widths.push(getComputedStyle(elm, null).width));
      this.$refs.gridFixed.querySelectorAll('div')
        .forEach((elm, i) => (elm.style.width = widths[i]));
      this.$refs.gridFixed.style.width = getComputedStyle(this.$refs.table, null).width;
    },

    $_onScroll(e) {
      this.$refs.gridFixed.style.left = `-${e.target.scrollLeft}px`;
      this.$_appendRows();
    },

    $_appendRows() {
      const g = this.$refs.grid,
            t = this.$refs.table,
            buffer = (g.clientHeight / 2),
            spaceForMore = g.clientHeight > t.clientHeight - g.scrollTop - buffer;

      if (spaceForMore && this.loadCount < this.records.length)
        this.loadCount += 10;
    }
  },

  template: `
    <div
      class="tableGrid flexColContainer"
      ref="grid"
      @scroll="$_onScroll($event)">

      <div
        class="gridFixed"
        ref="gridFixed">
        <div
          v-for="(prop, index) in storeProps"
          :key="index">
          {{ prop.title }}
        </div>
      </div>

      <table
        class="mainContent"
        ref="table">
        <thead
          class="gridSource"
          ref="gridSource">
          <tr>
            <th
              v-for="(prop, index) in storeProps"
              :key="index">
              {{ prop.title }}
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="rec in gridRecords"
            :key="rec.Id"
            @click="$emit('itemSelected', rec)">
            <td
              v-for="(prop, index) in storeProps"
              :key="index"
              :style="$_getRecStyle(rec, prop)">
              {{ $_getRecVal(rec, prop) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>`
}