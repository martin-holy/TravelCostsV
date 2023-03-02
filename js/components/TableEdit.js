import TableLookUp from './TableLookUp.js';
const { h } = Vue;

export default {
  name: 'TableEdit',

  props: {
    schema: { type: Object },
    rec: { type: Object }
  },

  emits: ['editCancel', 'recSave', 'recDelete', 'editArrayProp'],

  data () {
    return {}
  },

  computed: {
    formFields() {
      var out = [];

      for (const prop of this.schema.properties) {
        if (prop.hidden || prop.readonly) continue;

        const type = prop.type.name === 'variable'
                ? this.rec[prop.type.typeProp]
                : prop.type;

        this.$_addInputFor(out, prop.title, type, prop);
      }

      return out;
    }
  },

  created() {
    this.types = {
      props: { name: 'select', source: 'SYS_Props', value: 'name', title: 'title'},
      stores: { name: 'select', source: 'ADM_AppStores', value: 'name', title: 'title' },
      types: { name: 'select', source: 'SYS_Types', value: 'name', title: 'name' },
    };
  },

  methods: {
    $_addInputFor(out, label, type, prop, subProp = null, onInput = null) {
      if (type.name === 'type') {
        if (this.rec.hasOwnProperty(prop.name))
          this.$_addTypeFormFields(out, prop);

        return;
      }

      const valProp = type.name === 'checkbox' ? 'checked' : 'value';
      const props = {
        readonly: prop.readonly,
        required: prop.required,
        onInput: onInput
          ? onInput
          : (e) => {
            const val = type.name === 'number'
              ? parseFloat(e.target[valProp])
              : e.target[valProp];
            if (subProp)
              this.rec[prop.name][subProp] = val;
            else
              this.rec[prop.name] = val;
          }
      };

      let input = undefined;

      props[valProp] = subProp
        ? this.rec[prop.name][subProp]
        : this.rec[prop.name];

      switch (type.name) {
        case 'array':
          input = prop.type.name === 'variable'
            ? null
            : h('button', { type: 'button', onClick: () => this.$_editArrayProp(prop)}, 'Edit');
          break;
        case 'textarea':
          input = h('textarea', props);
          break;
        case 'select':
        case 'selectMulti':
          const store = this.$_getStore(type);
          props.valueKey = type.value;
          props.valueTitle = type.title;
          props.schema = store.schema;
          props.records = store.records;
          props.isMultiSelect = type.name === 'selectMulti';
          input = h(TableLookUp, props);
          break;
        case 'number':
          props.type = type.name;
          props.step = type.step;
          props.min = type.min;
          break;
        case 'text':
          props.type = type.name;
          if (type.autocomplete)
            props.autocomplete = 'on';
          break;
        case 'checkbox':
          props.type = type.name;
          props.required = false;
          break;
        case 'color':
          props.type = type.name;
          break;
        case 'date':
          props.type = type.name;
          break;
      }

      if (input === undefined)
        input = h('input', props);

      out.push({ subLevel: subProp !== null, label: label, input: input });
    },

    $_addTypeFormFields(out, prop) {
      this.$_addInputFor(out, prop.title, this.types.types, prop, 'name',
        (e) => {
          this.rec[prop.name] = this.$_getTypeClone(e.target.value);
          const varProp = this.schema.properties.find(x => x.type.typeProp === prop.name);
          if (varProp)
            this.rec[varProp.name] = null;
        });

      out[out.length - 1].subLevel = false;

      if (!this.rec[prop.name])
        return;

      // add additional inputs for Type edit
      switch (this.rec[prop.name].name) {
        case 'text':
          this.$_addInputFor(out, 'Autocomplete', { name: 'checkbox' }, prop, 'autocomplete');
          break;
        case 'number':
          this.$_addInputFor(out, 'Step', { name: 'number', step: 'any' }, prop, 'step');
          this.$_addInputFor(out, 'Min', { name: 'number', step: 'any' }, prop, 'min');
          break;
        case 'select':
        case 'selectMulti':
          this.$_addInputFor(out, 'Source', this.types.stores, prop, 'source',
            (e) => {
              this.rec[prop.name].source = e.target.value;
              this.db.data(this.db.stores[e.target.value], { sorted: true });
            });

          this.types.props.prop = prop;
          this.$_addInputFor(out, 'Value', this.types.props, prop, 'value');
          this.$_addInputFor(out, 'Title', this.types.props, prop, 'title');
          break;
        case 'variable':
          this.$_addInputFor(out, 'Type prop', { name: 'text' }, prop, 'typeProp');
          break;
      }

      return out;
    },

    $_getStore(type) {
      if (type.source !== 'SYS_Props')
        return this.db.stores[type.source ? type.source : 'SYS_Empty'];
      
      if (!this.rec[type.prop.name].source)
        return this.db.stores['SYS_Empty'];

      return {
        schema: {
          properties: [
            { name: 'name', title: 'Name', type: 'text' },
            { name: 'title', title: 'Title', type: 'text' }]},
        records: this.db.stores[this.rec[type.prop.name].source].schema.properties };
    },

    $_getTypeClone(typeName) {
      const type = this.db.stores.SYS_Types.records.find(x => x.name === typeName);
      return Vue.reactive(JSON.parse(JSON.stringify(type)));
    },

    $_isFormValid() {
      // TODO check for required tableLookUp
      return this.$refs.tableEdit.querySelectorAll(':invalid').length === 0;
    },

    $_onSave() {
      if (this.$_isFormValid())
        this.$emit('recSave');
    },

    $_editArrayProp(prop) {
      if (this.$_isFormValid())
        this.$emit('editArrayProp', prop);
    }
  },

  render() {
    return h('div', { class: 'tableEdit', ref: 'tableEdit' },
      h('form', { onSubmit: (e) => e.preventDefault() }, [
        h('table', this.formFields.map((field, index) => {
          return h('tr', { key: index }, [
            h('td', field.subLevel ? { class: 'subLevel' } : null, field.label),
            h('td', field.input)])})),
        h('div', [
          h('button', { type: 'button', onClick: () => this.$emit('recDelete') }, 'Smazat'),
          h('button', { type: 'button', onClick: () => this.$emit('editCancel') }, 'Zrušit'),
          h('button', { type: 'submit', onClick: () => this.$_onSave() }, 'Uložit')])]));
  }
}