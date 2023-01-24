import TableGrid from "./TableGrid.js";
import TableEdit from "./TableEdit.js";

export default {
  components: {
    TableGrid,
    TableEdit
  },

  props: {
    store: { type: Object }
  },

  data () {
    return {
      isEditVisible: false,
      editRec: null
    }
  },

  methods: {
    $_gridItemSelected(rec) {
      this.isEditVisible = true;
      this.editRec = rec;
    },

    $_editCanceled() {
      this.isEditVisible = false;
    },

    $_editRecNew() {
      this.editRec = {};
      this.isEditVisible = true;
    },

    $_editRecSaved() {
      this.isEditVisible = false;
    },

    $_editRecDeleted() {
      this.isEditVisible = false;
    }
  },

  template: `
    <table-grid
      ref="theGrid"
      :schema="store.schema"
      :records="store.records"
      @itemSelected="$_gridItemSelected">
    </table-grid>

    <table-edit
      v-if="isEditVisible"
      :store="store"
      :rec="editRec"
      @editCanceled="$_editCanceled"
      @recSaved="$_editRecSaved"
      @recDeleted="$_editRecDeleted">
    </table-edit>`
}