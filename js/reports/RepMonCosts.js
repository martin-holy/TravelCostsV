import TableLookUp from '../components/TableLookUp.js';
import YearGroupsRep from './YearGroupsRep.js';
import custom from './../custom.js';

const { h } = Vue;

export default {
  props: {
    repData: { type: Object }
  },

  data () {
    return {
      dataReady: false,
      groupsInYear: 12,
      records: [],
      costsTypes: []
    }
  },

  async created() {
    this.records = await this.getDataFromDb();
    
    // select all costs types
    for (const type of this.db.stores.MON_CostsTypes.records)
      this.costsTypes.push(type.id);

    this.dataReady = true;
  },

  methods: {
    async getDataFromDb() {
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
            minMaxDate = getMinMaxDatesFromRange(pricePerDay),
            yearFrom = Number.parseInt(minMaxDate[0].substring(0, 4)),
            yearTo = Number.parseInt(minMaxDate[1].substring(0, 4)),
            monthIntervals = custom.getMonthIntervals(yearFrom, yearTo),
            intervals = custom.combineDateIntervals([monthIntervals, presencePerDay, pricePerDay], minMaxDate[1]),
            monTransportCostTypeId = appSettings.get('monTransportCostTypeId'),
            recType = this.db.stores.MON_CostsTypes.records.find(t => t.id === monTransportCostTypeId),
            output = [];
  
      presencePerDay.forEach(x => { if (!x.dateTo) x.dateTo = minMaxDate[1]; });
      custom.mapDataToIntervals(presencePerDay, 'people', intervals);
      custom.mapDataToIntervals(pricePerDay, 'prices', intervals);
      custom.splitPriceInIntervals(intervals);
  
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

  render() {
    return h('div', { class: 'repMonCosts flexCol flexOne' }, [
      h('header', [
        h('span', { class: 'title rborder'}, [
          h('span', { class: 'icon' }, this.repData.icon ? this.repData.icon : 'T'),
          h('span', this.repData.title)]),
        h(TableLookUp, {
          valueKey: 'id',
          valueTitle: 'group',
          value: this.groupsInYear,
          schema: this.db.stores.SYS_GroupsInYear.schema,
          records: this.db.stores.SYS_GroupsInYear.records,
          onInput: (e) => this.groupsInYear = e.target.value })]),
      h('div', { class: 'flexCol flexOne' }, [
        h(TableLookUp, {
          valueKey: 'id',
          valueTitle: 'name',
          value: this.costsTypes,
          schema: this.db.stores.MON_CostsTypes.schema,
          records: this.db.stores.MON_CostsTypes.records,
          isMultiSelect: true,
          onInput: (e) => this.costsTypes = e.target.value }),
        this.dataReady
          ? h(YearGroupsRep, {
              groupsInYear: this.groupsInYear,
              records: this.records,
              recTypes: this.costsTypes,
              sumPropName: 'eur',
              sumSuffix: '€' })
          : null])]);
  }
}