import TableLookUp from '../components/TableLookUp.js';
import YearGroupsRep from './YearGroupsRep.js';

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
      incomesTypes: []
    }
  },

  async created() {
    this.records = await this.getDataFromDb();
    
    // select all costs types
    for (const type of this.db.stores.MON_IncomesTypes.records)
      this.incomesTypes.push(type.id);

    this.dataReady = true;
  },

  methods: {
    async getDataFromDb() {
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

  render() {
    return h('div', { class: 'repMonIncomes flexCol flexOne' }, [
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
        h(TableLookUp, {
          valueKey: 'id',
          valueTitle: 'name',
          value: this.incomesTypes,
          schema: this.db.stores.MON_IncomesTypes.schema,
          records: this.db.stores.MON_IncomesTypes.records,
          isMultiSelect: true,
          onInput: (e) => this.incomesTypes = e.target.value }),
        this.dataReady
          ? h(YearGroupsRep, {
              groupsInYear: this.groupsInYear,
              records: this.records,
              recTypes: this.incomesTypes,
              sumPropName: 'eur',
              sumSuffix: '€' })
          : null])]);
  }
}