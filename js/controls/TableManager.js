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
      editRec: null,
      selectedRecs: []
    }
  },

  methods: {
    $_gridRecSelected(rec) {
      this.isEditVisible = true;
      this.editRec = rec;
      this.selectedRecs.length = 0;
      this.selectedRecs.push(rec);
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
      :key="0"
      :schema="store.schema"
      :records="store.records"
      :selectedRecs="selectedRecs"
      @recSelected="$_gridRecSelected">
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