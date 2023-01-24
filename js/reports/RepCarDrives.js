import xSelect from './../controls/xSelect.js';
import TheYearGroupsRep from './../TheYearGroupsRep.js';
import common from './../common.js';

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
      costsTypes: [],
      costsTypesData: [
        { id: 1, bgColor: '#1F4280' },
        { id: 2 }],
    }
  },

  async created() {
    this.records = await this.getDataFromDb();
    this.costsTypes = [1];
    this.dataReady = true;
  },

  methods: {
    async getDataFromDb() {
      const drives = (await this.db.data(this.db.stores.CAR_Drives))
              .map(x => ({ date: x.date, eur: x.eur, km: x.km, desc: x.desc, type: this.costsTypesData[0] })),
            pricePerDay = Array.from(await this.db.data(this.db.stores.CAR_PricePerDay)),
            minMaxDate = common.getMinMaxDatesFromRange(pricePerDay),
            yearFrom = Number.parseInt(minMaxDate[0].substring(0, 4)),
            yearTo = Number.parseInt(minMaxDate[1].substring(0, 4)),
            monthIntervals = common.getMonthIntervals(yearFrom, yearTo),
            insAndMot = [];

      common.mapDataToIntervals(pricePerDay, 'prices', monthIntervals);
      common.splitPriceInIntervals(monthIntervals);
  
      for (const i of monthIntervals) {
        insAndMot.push({
          date: i.dateFrom,
          eur: i.eurTotal,
          km: 0,
          desc: 'Insurance and MOT',
          type: this.costsTypesData[1],
        });
      }

      const allData = drives.concat(insAndMot).orderBy('date', false);

      for (const rec of allData) {
        const y = Number.parseInt(rec.date.substring(0, 4)),
              m = Number.parseInt(rec.date.substring(5, 7));
              
        rec.year = y;
        rec.month = m;
      }

      return allData;
    },

    getGroupSum(group) {
      const type = group.types.find(x => x.type.id === this.costsTypesData[1].id);

      return type
        ? type.data.reduce((acc, cur) => acc + cur.eur, 0).round(0)
        : 0;
    },

    getGroupSumTotal(group) {
      return group.types.reduce(
        (sumType, curType) => sumType + curType.data.reduce(
          (sumData, curData) => sumData + curData.eur, 0), 0).round(0);
    },

    getGroupDrives(group) {
      const type = group.types.find(x => x.type.id === this.costsTypesData[0].id);

      return type
        ? type.data
        : [];
    }
  },

  template: `
    <div
      class="repCarDrives flexColContainer">

      <x-select
        :value="groupsInYear"
        :data="groupsInYearData"
        :isMulti="false"
        @input="(event) => groupsInYear = event">
      </x-select>

      <TheYearGroupsRep
        v-if="dataReady"
        v-slot="{ cursorGroup }"
        :groupsInYear="groupsInYear"
        :records="records"
        :recTypes="costsTypes"
        :recTypesData="costsTypesData"
        sumPropName="km"
        sumSuffix="">

        <div>
          <span>Insurance and MOT</span>
          <span>{{ getGroupSum(cursorGroup) }}€</span>
          <span>Total</span>
          <span>{{ getGroupSumTotal(cursorGroup) }}€</span>
        </div>

        <ul>
          <li
            v-for="(drive, index) in getGroupDrives(cursorGroup)"
            :key="index">
            <span>{{ drive.date.split('-').join('.') }}</span>
            <span>{{ drive.desc }}</span>
            <span>{{ drive.km }} km</span>
            <span>{{ drive.eur }}€</span>
          </li>
        </ul>

      </TheYearGroupsRep>

    </div>`
}