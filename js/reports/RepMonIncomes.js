import xSelect from './../controls/xSelect.js';
import TheYearGroupsRep from './../TheYearGroupsRep.js';

export default {
  components: {
    xSelect,
    TheYearGroupsRep
  },

  data () {
    return {
      dataReady: false,
      groupsInYear: 12,
      groupsInYearData: [
        { value: 12, name: '1 Month' },
        { value: 4, name: '3 Months' },
        { value: 2, name: '6 Months' },
        { value: 1, name: '1 Year' }
      ],
      records: [],
      incomesTypes: [],
      incomesTypesData: []
    }
  },

  async created() {
    this.records = await this.getDataFromDb();
    
    // select all costs types
    for (const type of this.incomesTypesData)
      this.incomesTypes.push(type.value);

    this.dataReady = true;
  },

  methods: {
    async getDataFromDb() {
      this.incomesTypesData = (await this.db.data(this.db.stores.MON_IncomesTypes))
        .map(x => ({ ...x, value: x.id }))
        .orderBy('name');

      const incomes = (await this.db.data(this.db.stores.MON_Incomes))
             .map(rec => ({
                date: rec.date,
                eur: rec.eur,
                desc: rec.desc,
                type: this.incomesTypesData.find(t => t.id === rec.incomeTypeId) }))
              .orderBy('date', false);

      for (const rec of incomes) {
        const y = Number.parseInt(rec.date.substring(0, 4)),
              m = Number.parseInt(rec.date.substring(5, 7));
              
        rec.year = y;
        rec.month = m;

        // Temporary
        if (!rec.type)
          rec.type = this.incomesTypesData[0];
      }

      return incomes;
    }
  },

  template: `
    <div
      class="repMonIncomes flexColContainer">

      <x-select
        :value="groupsInYear"
        :data="groupsInYearData"
        :isMulti="false"
        @input="(event) => groupsInYear = event">
      </x-select>

      <x-select
        :value="incomesTypes"
        :data="incomesTypesData"
        :isMulti="true"
        @input="(event) => incomesTypes = event">
      </x-select>

      <TheYearGroupsRep
        v-if="dataReady"
        :groupsInYear="groupsInYear"
        :records="records"
        :recTypes="incomesTypes"
        :recTypesData="incomesTypesData"
        sumPropName="eur"
        sumSuffix="€">
      </TheYearGroupsRep>

    </div>`
}