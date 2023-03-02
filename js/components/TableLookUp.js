import TableGrid from './TableGrid.js';
const { h } = Vue;

export default {
  name: 'TableLookUp',

  props: {
    value: { type: [Number, String, Array]},
    valueKey: { type: String },
    valueTitle: { type: String },
    schema: { type: Object },
    records: { type: Array },
    isMultiSelect: { type: Boolean, default: false }
  },

  emits: ['input'],

  data () {
    return {
      isOpen: false
    }
  },

  computed: {
    btnIcon() {
      return this.isOpen ? '✔' : '▼';
    },

    selectedRecs() {
      return this.isMultiSelect
        ? this.records.filter(x => this.value && this.value.includes(x[this.valueKey]))
        : this.records.filter(x => this.value === x[this.valueKey]);
    }
  },

  methods: {
    $_recSelected(rec) {
      if (this.isMultiSelect) {
        const newValue = this.value
          ? this.value.filter(x => x !== rec[this.valueKey])
          : [];

        if (!this.value || this.value.length === newValue.length)
          newValue.push(rec[this.valueKey]);

        this.$emit('input', { target: { value: newValue } });
      }
      else {
        this.isOpen = false;
        this.$emit('input', { target: { value: rec[this.valueKey] } });
      }
    }
  },

  render() {
    return h('div', { class: 'tableLookUp' }, [
      h('div', { onClick: () => this.isOpen = !this.isOpen }, [
        h('div', { class: 'selectedRecs'}, this.selectedRecs.map(rec => {
          return h('span', {
            key: rec[this.valueKey],
            style: { backgroundColor: rec.bgColor }},
            rec[this.valueTitle])})),
        h('div', { class: 'button'}, this.btnIcon)]),
      this.isOpen
        ? h(TableGrid, {
            schema: this.schema,
            records: this.records,
            selectedRecs: this.selectedRecs,
            onRecSelected: this.$_recSelected})
        : null]);
  }
}