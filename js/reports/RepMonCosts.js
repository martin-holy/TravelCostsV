import TableLookUp from './../controls/TableLookUp.js';
import TheYearGroupsRep from './../TheYearGroupsRep.js';
import common from './../common.js';

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
      costsTypes: [],
      costsTypesStore: {}
    }
  },

  async created() {
    this.records = await this.getDataFromDb();
    
    // select all costs types
    for (const type of this.costsTypesStore.records)
      this.costsTypes.push(type.id);

    this.dataReady = true;
  },

  methods: {
    async getDataFromDb() {
      this.costsTypesStore = this.db.stores.MON_CostsTypes;

      const ctData = await this.db.data(this.db.stores.MON_CostsTypes),
            costs = (await this.db.data(this.db.stores.MON_Costs))
             .map(rec => ({
                date: rec.date,
                eur: rec.eur,
                desc: rec.desc,
                type: ctData.find(t => t.id === rec.costTypeId) })),
            transportData = await this.getTransportData(),
            allData = costs.concat(transportData).orderBy('date', false);

      for (const rec of allData) {
        const y = Number.parseInt(rec.date.substring(0, 4)),
              m = Number.parseInt(rec.date.substring(5, 7));
              
        rec.year = y;
        rec.month = m;
      }

      return allData;
    },

    async getTransportData() {
      const presencePerDay = Array.from(await this.db.data(this.db.stores.CAR_PresencePerDay)),
            pricePerDay = Array.from(await this.db.data(this.db.stores.CAR_PricePerDay)),
            person = (await this.db.data(this.db.stores.GLO_People)).find(x => x.active === true),
            personId = person ? person.id : 0,
            minMaxDate = common.getMinMaxDatesFromRange(pricePerDay),
            yearFrom = Number.parseInt(minMaxDate[0].substring(0, 4)),
            yearTo = Number.parseInt(minMaxDate[1].substring(0, 4)),
            monthIntervals = common.getMonthIntervals(yearFrom, yearTo),
            intervals = common.combineDateIntervals([monthIntervals, presencePerDay, pricePerDay], minMaxDate[1]),
            recType = this.costsTypesStore.records.find(t => t.id === common.hardCoded.monTransportCostTypeId),
            output = [];
  
      presencePerDay.forEach(x => { if (!x.dateTo) x.dateTo = minMaxDate[1]; });
      common.mapDataToIntervals(presencePerDay, 'people', intervals);
      common.mapDataToIntervals(pricePerDay, 'prices', intervals);
      common.splitPriceInIntervals(intervals);
  
      for (const i of intervals) {
        if (!i.people || !i.people.find(x => x.personId === personId)) continue;
        output.push({
          date: i.dateFrom,
          eur: i.eurTotal / i.people.length,
          desc: 'Insurance and MOT',
          type: recType,
        });
      }
  
      const drives = await this.db.data(this.db.stores.CAR_Drives);
      for (const d of drives) {
        if (!d.people.find(x => x === personId)) continue;
        output.push({
          date: d.date,
          eur: d.eur / d.people.length,
          desc: `${d.desc} ${d.km}km`,
          type: recType,
        });
      }
  
      return output;
    }
  },

  template: `
    <div
      class="repMonCosts flexColContainer">

      <table-look-up
        :value="groupsInYear"
        :schema="groupsInYearSchema"
        :records="groupsInYearRecords"
        displayField="group"
        @input="groupsInYear = $event">
      </table-look-up>

      <table-look-up
        :value="costsTypes"
        :schema="costsTypesStore.schema"
        :records="costsTypesStore.records"
        displayField="name"
        :isMultiSelect="true"
        @input="costsTypes = $event">
      </table-look-up>

      <TheYearGroupsRep
        v-if="dataReady"
        :groupsInYear="groupsInYear"
        :records="records"
        :recTypes="costsTypes"
        sumPropName="eur"
        sumSuffix="€">
      </TheYearGroupsRep>

    </div>`
}