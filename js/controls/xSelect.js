export default {
  props: {
    value: { type: [Number, Array]},
    data: { type: Array },
    isMulti: { type: Boolean }
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

    selectedOptions() {
      return this.value
        ? this.isMulti
          ? this.data.filter(x => this.value.includes(x.value))
          : this.data.filter(x => this.value === x.value)
        : [];
    }
  },

  methods: {
    $_optionSelected(option) {
      if (this.isMulti) {
        const newValue = this.value
          ? this.value.filter(x => x !== option.value)
          : [];

        if (!this.value || this.value.length === newValue.length)
          newValue.push(option.value);

        this.$emit('input', newValue);
      }
      else {
        this.isOpen = false;
        this.$emit('input', option.value);
      }
    },

    $_isOptionSelected(option) {
      const selected = this.isMulti
        ? this.selectedOptions.includes(option)
        : option.value === this.value;

      return selected ? '✔' : '';
    }
  },

  template: `
    <div class="xSelect">
      <div @click="isOpen = !isOpen">
        <div class="selectedOptions">
          <span
            v-for="option in selectedOptions"
            :key="option.value"
            :style="{backgroundColor:option.bgColor}">
            {{ option.name }}
          </span>
        </div>
        <div class="button">{{ btnIcon }}</div>
      </div>
      <ul
        v-if="isOpen">
        <li
          v-for="option in data"
          :key="option.value"
          :value="option.value"
          :style="{backgroundColor:option.bgColor}"
          @click="$_optionSelected(option)">
          <div>{{ $_isOptionSelected(option) }}</div> {{ option.name }}
        </li>
      </ul>
    </div>`
}