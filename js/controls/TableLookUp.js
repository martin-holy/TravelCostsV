import TableGrid from './TableGrid.js';

export default {
  components: {
    TableGrid
  },

  props: {
    value: { type: [Number, Array]},
    schema: { type: Object },
    records: { type: Array },
    isMultiSelect: { type: Boolean, default: false },
    displayField: { type: String }
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
      return this.value
        ? this.isMultiSelect
          ? this.records.filter(x => this.value.includes(x.id))
          : this.records.filter(x => this.value === x.id)
        : [];
    }
  },

  methods: {
    $_recSelected(rec) {
      if (this.isMultiSelect) {
        const newValue = this.value
          ? this.value.filter(x => x !== rec.id)
          : [];

        if (!this.value || this.value.length === newValue.length)
          newValue.push(rec.id);

        this.$emit('input', newValue);
      }
      else {
        this.isOpen = false;
        this.$emit('input', rec.id);
      }
    }
  },

  template: `
    <div class="tableLookUp">
      <div @click="isOpen = !isOpen">
        <div class="selectedRecs">
          <span
            v-for="rec in selectedRecs"
            :key="rec.id"
            :style="{backgroundColor:rec.bgColor}">
            {{ rec[displayField] }}
          </span>
        </div>
        <div class="button">{{ btnIcon }}</div>
      </div>
      <table-grid
        v-if="isOpen"
        :schema="schema"
        :records="records"
        :showSelected="true"
        :selectedRecs="selectedRecs"
        @recSelected="$_recSelected">
      </table-grid>
    </div>`
}
