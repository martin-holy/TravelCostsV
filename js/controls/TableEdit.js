import xSelect from './xSelect.js';

export default {
  components: {
    xSelect
  },

  props: {
    store: { type: Object },
    rec: { type: Object }
  },

  emits: ['editCanceled', 'recSaved', 'recDeleted'],

  data () {
    return {
      isNew: false,
      editableProps: ['int', 'num', 'date', 'text', 'textarea', 'bool', 'select', 'multiSelect']
    }
  },

  computed: {
    storeProps() {
      return this.store.schema.properties
        .filter(x => !x.hidden && this.editableProps.includes(x.type));
    },

    recCopy() {
      const newRec = Vue.reactive({});

      this.isNew = !this.rec.id;

      if (this.isNew)
        for (const prop of this.storeProps)
          switch (prop.type) {
            case 'date':
              newRec[prop.name] = new Date().toYMD();
              break;
            case 'select':
            case 'multiSelect':
              if (prop.default)
                newRec[prop.name] = prop.default;
            default:
              newRec[prop.name] = null;
          }
      else
        for (const prop of this.storeProps)
          newRec[prop.name] = this.rec[prop.name];
      
      return newRec;
    }
  },

  methods: {
    async $_delete() {
      //Do you want to delete this record?
      if (confirm('Opravdu chcete smazat tento záznam?') && 
          await this.db.canDelete(this.store.schema.name, this.rec)) {

        await this.db.delete(this.store, [this.rec]);
        this.$emit('recDeleted');
      }
    },

    async $_save() {
      if (this.$refs.tableEdit.querySelectorAll(':invalid').length > 0)
        return;

      const recCopy = this.recCopy;

      for (const prop of Object.keys(recCopy))
        this.rec[prop] = recCopy[prop];

      for (const prop of this.store.schema.properties) {
        if (prop.type !== 'calc') continue;
        this.rec[prop.name] = await this.store[prop.funcName](this.db, this.rec);
      }

      await this.db.iudStoreData(this.store, this.isNew ? 'insert' : 'update', [this.rec]);

      if (this.store.schema.onSaveFunc)
        await this.store[this.store.schema.onSaveFunc](this.db);

      this.$emit('recSaved');
    },

    $_getXSelectData(prop) {
      return prop.source.store.records.map((x) => {
        return {
          value: x.id,
          name: x[prop.source.property],
          bgColor: x.bgColor }});
    },

    $_xSelectOnInput(value, prop) {
      this.recCopy[prop.name] = value;
    }
  },

  template: `
    <div
      class="tableEdit"
      ref="tableEdit">
      <form
        @submit="(event) => event.preventDefault()">
        <table>
          <tr
            v-for="(prop, index) in storeProps"
            :key="index">
            <td>
              {{ prop.title }}
            </td>
            <td>
              <textarea
                v-if="prop.type === 'textarea'"
                v-model="recCopy[prop.name]"
                :readonly="prop.readonly"
                :required="prop.required">
              </textarea>

              <x-select
                v-else-if="prop.type === 'select' || prop.type === 'multiSelect'"
                :value="recCopy[prop.name]"
                :data="$_getXSelectData(prop)"
                :isMulti="prop.type === 'multiSelect'"
                @input="$_xSelectOnInput($event, prop)">
              </x-select>

              <input
                v-else-if="prop.type === 'int'"
                v-model="recCopy[prop.name]"
                type="number"
                :readonly="prop.readonly"
                :required="prop.required">

              <input
                v-else-if="prop.type === 'num'"
                v-model="recCopy[prop.name]"
                type="number"
                :readonly="prop.readonly"
                :required="prop.required"
                step="0.001"
                min="0">

              <input
                v-else-if="prop.type === 'text'"
                v-model="recCopy[prop.name]"
                type="text"
                :readonly="prop.readonly"
                :required="prop.required"
                autocomplete="on">

              <input
                v-else-if="prop.type === 'bool'"
                v-model="recCopy[prop.name]"
                type="checkbox"
                :readonly="prop.readonly"
                :required="prop.required">

              <input
                v-else
                v-model="recCopy[prop.name]"
                :type="prop.type"
                :readonly="prop.readonly"
                :required="prop.required">
            </td>
          </tr>
        </table>

        <div>
          <button
            :disabled="isNew"
            @click="$_delete"
            type="button">
            Smazat
          </button>
          <button
            @click="$emit('editCanceled')"
            type="button">
            Zrušit
          </button>
          <button
            @click="$_save"
            type="submit">
            Uložit
          </button>
        </div>
      </form>
    </div>`
}