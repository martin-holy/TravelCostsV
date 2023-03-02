import TableGrid from "./TableGrid.js";
import TableEdit from "./TableEdit.js";

const { h } = Vue;

export default {
  name: 'TableManager',

  props: {
    store: { type: Object }
  },

  data () {
    return {
      editArrayProp: null,
      editArrayPropStoreRec: null,
      editRec: null,
      isEditVisible: false,
      selectedRecs: [],
      schema: { properties: [] },
      records: []
    }
  },

  computed: {
    title() {
      return this.editArrayProp && this.editArrayPropStoreRec
        ? `${this.editArrayPropStoreRec.title} - ${this.editArrayProp.title}`
        : this.store
          ? this.store.schema.title
          : this.appName;
    }
  },

  watch: {
    isEditVisible() {
      if (!this.isEditVisible)
        this.editRec = null;
    },

    store() {
      this.editArrayProp = null;
      this.editArrayPropStoreRec = null;
      this.schema = this.store.schema;
      this.records = this.store.records;
      this.isEditVisible = false;
    }
  },

  created() {
    this.recBackUp = {};

    if (this.store) {
      this.schema = this.store.schema;
      this.records = this.store.records;
    }
  },

  methods: {
    $_onGridRecSelected(rec) {
      this.recBackUp = JSON.parse(JSON.stringify(rec));
      this.editRec = rec;
      this.isEditVisible = true;
      this.selectedRecs.length = 0;
      this.selectedRecs.push(rec);
    },

    async $_onEditArrayProp(prop) {
      const editRec = this.editRec;

      if (JSON.stringify(this.editRec) !== JSON.stringify(this.recBackUp))
        await this.$_onEditRecSave();

      this.editArrayProp = prop;
      this.editArrayPropStoreRec = editRec;
      this.isEditVisible = false;
      this.schema = prop.type.schema;
      this.records = this.editArrayPropStoreRec[prop.name];
    },

    $_backToStoreEdit() {
      this.editArrayProp = null;
      this.editArrayPropStoreRec = null;
      this.schema = this.store.schema;
      this.records = this.store.records;
    },

    $_onEditCancel() {
      const backUpKeys = Object.keys(this.recBackUp),
            toDeleteKeys = Object.keys(this.editRec)
              .filter(x => !backUpKeys.includes(x));

      for (const prop of toDeleteKeys)
        delete this.editRec[prop];
      for (const prop of backUpKeys)
        this.editRec[prop] = this.recBackUp[prop];

      this.isEditVisible = false;
    },

    async $_onEditRecDelete() {
      //Do you want to delete this record?
      if (confirm('Opravdu chcete smazat tento záznam?')) {

        if (this.editArrayPropStoreRec) {
          const array = this.editArrayPropStoreRec[this.editArrayProp.name];
          array.splice(array.indexOf(this.editRec), 1);
          await this.$_onEditRecSave();
        }
        else if (await this.db.canDelete(this.store.schema.name, this.editRec)) {
          await this.db.delete(this.store, [this.editRec]);
          await this.$_dispatchEvent('onDelete');
        }

        this.isEditVisible = false;
        this.selectedRecs.length = 0;
      }
    },

    async $_onEditRecSave() {
      if (this.editArrayPropStoreRec) {
        await this.db.iudStoreData(this.store, 'update', [this.editArrayPropStoreRec]);
        this.isEditVisible = false;

        return;
      }

      await this.$_dispatchEvent('onBeforeSave');
      await this.db.iudStoreData(this.store, this.editRec.id ? 'update' : 'insert', [this.editRec]);
      await this.$_dispatchEvent('onAfterSave');
      this.isEditVisible = false;
    },

    async $_dispatchEvent(name) {
      const detail = { detail: {
        db: this.db,
        store: this.store,
        rec: this.editRec }};

      for (const event of this.db.events[name])
        await event(detail);
    },

    $_editRecNew() {
      this.editRec = this.$_getNewRec();
      this.isEditVisible = true;
      this.selectedRecs.length = 0;
      this.selectedRecs.push(this.editRec);

      if (this.editArrayPropStoreRec)
        this.editArrayPropStoreRec[this.editArrayProp.name].push(this.editRec);
    },

    $_getNewRec() {
      const newRec = Vue.reactive({});

      for (const prop of this.schema.properties) {
        if (prop.name === 'id') continue;

        switch (prop.type.name) {
          case 'array':
            newRec[prop.name] = [];
            break;
          case 'date':
            newRec[prop.name] = new Date().toYMD();
            break;
          case 'select':
          case 'selectMulti':
            newRec[prop.name] = prop.default
              ? prop.default
              : [];
            break;
          case 'type':
            newRec[prop.name] = { name: 'text' };
            break;
          default:
            newRec[prop.name] = prop.default ? prop.default : null;
        }
      }
      
      return newRec;
    }
  },

  render() {
    const toolBar = !this.store || this.isEditVisible
      ? null
      : h('div', { class: 'toolBar' }, [
          h('div', {
            class: 'btn icon',
            title: 'New record',
            onClick: () => this.$_editRecNew() },
            '+'),
          this.editArrayProp
            ? h('div', {
                class: 'btn icon',
                title: 'Back to store edit',
                onClick: () => this.$_backToStoreEdit() },
                'c')
            : null]);

    const header = h('header', [
      h('div', { class: 'title' }, [
        this.store && this.store.schema.icon
          ? h('span', { class: 'icon' }, this.store.schema.icon)
          : null,
        h('span', this.title)]),
      toolBar,
      this.store ? null : h('span', { class: 'version' }, this.appVersion)]);

    const grid = !this.store
      ? null
      : h(TableGrid, {
          schema: this.schema,
          records: this.records,
          selectedRecs: this.selectedRecs,
          onRecSelected: (rec) => this.$_onGridRecSelected(rec)});

    const edit = !this.store || !this.isEditVisible
      ? null
      : h(TableEdit, {
          schema: this.schema,
          rec: this.editRec,
          onEditArrayProp: (prop) => this.$_onEditArrayProp(prop),
          onEditCancel: () => this.$_onEditCancel(),
          onRecDelete: () => this.$_onEditRecDelete(),
          onRecSave: () => this.$_onEditRecSave() });

    return h('div', { class: 'tableManager flexCol flexOne' }, [
      header,
      h('div', { class: 'flexCol flexOne' }, [ grid, edit ])]);
  }
}