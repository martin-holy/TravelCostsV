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
            minMaxDate = getMinMaxDatesFromRange(pricePerDay),
            yearFrom = Number.parseInt(minMaxDate[0].substring(0, 4)),
            yearTo = Number.parseInt(minMaxDate[1].substring(0, 4)),
            monthIntervals = custom.getMonthIntervals(yearFrom, yearTo),
            insAndMot = [];

      custom.mapDataToIntervals(pricePerDay, 'prices', monthIntervals);
      custom.splitPriceInIntervals(monthIntervals);
  
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

  render() {
    const footerSlot = (cursorGroup) => {
      return [
        h('div', [
          h('span', 'Pojištění a technická'),
          h('span', `${this.getGroupSum(cursorGroup.cursorGroup)}€`),
          h('span', 'Celkem'),
          h('span', `${this.getGroupSumTotal(cursorGroup.cursorGroup)}€`)]),
        h('ul', this.getGroupDrives(cursorGroup.cursorGroup).map((drive, index) => {
          return h('li', { key: index }, [
            h('span', drive.date.split('-').join('.')),
            h('span', drive.desc),
            h('span', `${drive.km} km`),
            h('span', `${drive.eur}€`)])}))];
    };

    return h('div', { class: 'repCarDrives flexCol flexOne' }, [
      h('header', [
        h('span', { class: 'title'}, [
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
        this.dataReady
          ? h(YearGroupsRep, {
              groupsInYear: this.groupsInYear,
              records: this.records,
              recTypes: this.costsTypes,
              sumPropName: 'km',
              sumSuffix: '' }, {
                footer: footerSlot })
          : null])]);
  }
}