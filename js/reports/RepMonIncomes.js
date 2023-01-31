import TableLookUp from './../controls/TableLookUp.js';
import TheYearGroupsRep from './../TheYearGroupsRep.js';

export default {
  components: {
    TableLookUp,
    TheYearGroupsRep
  },

  data () {
    return {
      dataReady: false,
      groupsInYear: 12,
      groupsInYearRecords: [
        { id: 12, group: '1 Měsíc' },
        { id: 4, group: '3 Měsíce' },
        { id: 2, group: '6 Měsíců' },
        { id: 1, group: '1 Rok' }
      ],
      groupsInYearSchema: {
        properties: [
          { name: 'id', title: 'Id', type: 'int', required: true, hidden: true },
          { name: 'group', title: 'Skupina', type: 'text' }
        ]
      },
      records: [],
      incomesTypes: [],
      incomesTypesStore: []
    }
  },

  async created() {
    this.records = await this.getDataFromDb();
    
    // select all costs types
    for (const type of this.incomesTypesStore.records)
      this.incomesTypes.push(type.id);

    this.dataReady = true;
  },

  methods: {
    async getDataFromDb() {
      this.incomesTypesStore = this.db.stores.MON_IncomesTypes;

      const itData = await this.db.data(this.db.stores.MON_IncomesTypes),
            incomes = (await this.db.data(this.db.stores.MON_Incomes))
             .map(rec => ({
                date: rec.date,
                eur: rec.eur,
                desc: rec.desc,
                type: itData.find(t => t.id === rec.incomeTypeId) }))
              .orderBy('date', false);

      for (const rec of incomes) {
        const y = Number.parseInt(rec.date.substring(0, 4)),
              m = Number.parseInt(rec.date.substring(5, 7));
              
        rec.year = y;
        rec.month = m;
      }

      return incomes;
    }
  },

  template: `
    <div
      class="repMonIncomes flexColContainer">

      <table-look-up
        :value="groupsInYear"
        :schema="groupsInYearSchema"
        :records="groupsInYearRecords"
        displayField="group"
        @input="groupsInYear = $event">
      </table-look-up>

      <table-look-up
        :value="incomesTypes"
        :schema="incomesTypesStore.schema"
        :records="incomesTypesStore.records"
        displayField="name"
        :isMultiSelect="true"
        @input="incomesTypes = $event">
      </table-look-up>

      <TheYearGroupsRep
        v-if="dataReady"
        :groupsInYear="groupsInYear"
        :records="records"
        :recTypes="incomesTypes"
        sumPropName="eur"
        sumSuffix="€">
      </TheYearGroupsRep>

    </div>`
}