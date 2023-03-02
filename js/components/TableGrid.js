const { h } = Vue;

export default {
  name: 'TableGrid',

  props: {
    schema: { type: Object },
    records: { type: Array },
    isMultiSelect: { type: Boolean, default: false },
    selectedRecs: { type: Array, default: [] }
  },

  emits: ['recSelected'],

  data () {
    return {
      loadCount: 0
    }
  },

  computed: {
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
    this.$_setFixedThead();
  },

  updated() {
    this.$_appendRows();
    this.$_setFixedThead();
  },

  methods: {
    $_orderBy(name) {
      if (this.schema.orderBy === name)
        this.schema.orderAsc = !this.schema.orderAsc;
      else {
        this.schema.orderBy = name;
        this.schema.orderAsc = true;
      }

      this.records.orderBy(this.schema.orderBy, this.schema.orderAsc);
    },

    $_getRecVal(rec, prop) {
      if (!rec.hasOwnProperty(prop.name) || !rec[prop.name])
        return '';

      const type = prop.type.name === 'variable'
              ? rec[prop.type.typeProp]
              : prop.type;

      let val = '',
          store = null;

      switch (type.name) {
        case 'array':
          val = rec[prop.name].map(x => x.title).join(', ');
          break;
        case 'selectMulti':
          store = this.db.stores[type.source];
          if (!store) return '';

          val = rec[prop.name]
            .map(value => {
              const lookUp = store.records.find(x => x[type.value] === value);

              if (!lookUp) return '';

              const title = lookUp[type.title];
              
              return lookUp.bgColor
                ? `<span style="background-color: ${lookUp.bgColor}">${title}</span>`
                : title;
            })
            .join(', ');
          break;
        case 'select':
          store = this.db.stores[type.source];
          if (!store) return '';

          const srcItem = store.records.find(x => x[type.value] === rec[prop.name]);

          if (srcItem)
            val = srcItem[type.title];
          break;
        case 'checkbox':
          val = rec[prop.name] ? '✔' : '✖';
          break;
        case 'type':
          val = rec[prop.name].source
            ? `${rec[prop.name].name} from ${rec[prop.name].source}`
            : rec[prop.name].name;
          break;
        default:
          val = rec[prop.name];
      }

      if (!val) val = '';

      return val;
    },

    $_getRecStyle(rec, prop) {
      const style = {},
            type = prop.type.name === 'variable'
              ? rec[prop.type.typeProp]
              : prop.type;

      if (prop.align)
        style.textAlign = prop.align;

      if (type)
        switch (type.name) {
          case 'select':
            const store = this.db.stores[type.source];
            if (store) {
              const srcItem = store.records.find(x => x[type.value] === rec[prop.name]);
              if (srcItem && srcItem.bgColor)
                style.backgroundColor = srcItem.bgColor;
            }
            break;
          case 'color':
            style.backgroundColor = rec[prop.name];
            break;
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
      this.$refs.gridFixed.style.left = `${e.target.scrollLeft}px`;
      this.$_appendRows();
    },

    $_appendRows() {
      const g = this.$refs.grid,
            t = this.$refs.table,
            buffer = (g.clientHeight / 2),
            spaceForMore = g.clientHeight > t.clientHeight - g.scrollTop - buffer;

      if (spaceForMore && this.loadCount < this.records.length)
        this.loadCount += 10;
    },

    $_isRecSelected(rec) {
      return this.selectedRecs.includes(rec) ? '✔' : '';
    }
  },

  render() {
    const fixed = [],
          thead = [],
          tbody = [],
          storeProps = this.schema.properties.filter(x => !x.hidden);
    var colKey = 0,
        rowKey = 0;

    fixed.push(h('div', { key: colKey }));
    thead.push(h('th', { key: colKey }));

    for (const prop of storeProps) {
      const thTitle = this.schema.orderBy === prop.name
        ? `${this.schema.orderAsc ? '↓' : '↑'} ${prop.title}`
        : prop.title;

      colKey++;
      fixed.push(h('div', { key: colKey, onClick: () => this.$_orderBy(prop.name) }, thTitle));
      thead.push(h('th', { key: colKey }, thTitle));
    }

    for (const rec of this.gridRecords) {
      const tds = [];
      colKey = 0;

      tds.push(h('td', this.selectedRecs.includes(rec)
        ? { class: 'selected', key: colKey }
        : { key: colKey } ));

      for (const prop of storeProps) {
        colKey++;
        tds.push(h('td', {
          key: colKey,
          class: prop.name === 'icon' ? 'icon' : null,
          style: this.$_getRecStyle(rec, prop),
          innerHTML: this.$_getRecVal(rec, prop) }));
      }

      tbody.push(h('tr', {
        key: rowKey,
        onClick: () => this.$emit('recSelected', rec) }, tds));

      rowKey++;
    }

    return h('div', {
        class: 'tableGrid flexCol flexOne',
        ref: 'grid',
        onScroll: (e) => this.$_onScroll(e) }, [
      h('div', { class: 'gridFixed', ref: 'gridFixed' }, fixed),
      h('table', { class: 'flexOne', ref: 'table' }, [
        h('thead', { class: 'gridSource', ref: 'gridSource' }, thead),
        h('tbody', tbody)])]);
  }
}