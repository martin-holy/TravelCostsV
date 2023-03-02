import TableGrid from '../components/TableGrid.js';
import custom from './../custom.js';

const { h } = Vue;

export default {
  props: {
    repData: { type: Object }
  },

  data () {
    return {
      gridSchema: { properties: [
        { name: 'payerId', title: 'Zaplatil', type: { name: 'select', source: 'GLO_People', value: 'id', title: 'name' }},
        { name: 'debtorId', title: 'Komu', type: { name: 'select', source: 'GLO_People', value: 'id', title: 'name' }},
        { name: 'eurCalc', title: 'EUR', type: { name: 'number' }, align: 'right' }]},
      gridRecords: []
    }
  },

  async created() {
    this.gridRecords = await this.$_getRecords();
  },

  methods: {
    async $_getPricesByDay() {
      const presencePerDay = Array.from(await this.db.data(this.db.stores.CAR_PresencePerDay)),
            pricesPerDay = Array.from(await this.db.data(this.db.stores.CAR_PricePerDay)),
            intervals = custom.combineDateIntervals([presencePerDay], new Date().toYMD());
    
      custom.mapDataToIntervals(presencePerDay, 'people', intervals);
      custom.mapDataToIntervals(pricesPerDay, 'prices', intervals);
      custom.splitPriceInIntervals(intervals);
      
      return intervals;
    },

    async $_getRecords() {
      const gloPeopleCarryId = appSettings.get('gloPeopleCarryId');
      let presencePerDay = Array.from(await this.db.data(this.db.stores.CAR_PresencePerDay)),
          intervals = await this.$_getPricesByDay(),
          people = [];
        
      for (let p of presencePerDay)
        people.push({ id: p.personId, eur: 0 });
    
      for (let i of intervals) {
        let eurPerPerson = i.eurTotal / i.people.length;

        for (let p of i.people)
          people.find(x => x.id === p.personId).eur += eurPerPerson;
      }
    
      // CALCULATING PRICE FOR DIESEL, OIL, AMORTIZATION, TIRES => DRIVES
      let drives = await this.db.data(this.db.stores.CAR_Drives);

      for (let drv of drives) {
        let eurPerPerson = drv.eur / drv.people.length;

        for (let pId of drv.people)
          people.find(p => p.id === pId).eur += eurPerPerson;
      }
    
      // CALCULATING DEBTS RECORDS
      let debts = await this.db.data(this.db.stores.MON_Debts),
          pairs = [];

      for (let d of debts) {
        let pair = pairs.find(p => p.payerId === d.payerId && p.debtorId === d.debtorId);
        
        if (!pair) {
          pair = { payerId: d.payerId, debtorId: d.debtorId, eur: 0 };
          pairs.push(pair);
        }
        pair.eur += await custom.amountInEUR(this.db, d);
      }
    
      // COMBINATING DEBTS RECORDS WITH DRIVES, MOT AND INSURANCE
      for (let pair of pairs) {
        let mp = pairs.find(p => p.payerId === pair.debtorId && p.debtorId === pair.payerId);
        
        pair.eurCalc = mp === undefined
          ? 0 :
          pair.eur - mp.eur;
    
        if (pair.debtorId === gloPeopleCarryId)
          pair.eurCalc -= people.find(p => p.id === pair.payerId).eur;
    
        if (pair.payerId === gloPeopleCarryId)
          pair.eurCalc += people.find(p => p.id === pair.debtorId).eur;
      }
    
      for (let pair of pairs) {
        pair.eur = pair.eur.round(0);
        pair.eurCalc = pair.eurCalc.round(0);
      }
    
      return pairs.filter(p => p.eurCalc > 0);
    }
  },

  render() {
    return h('div', { class: 'repMonDebtsCalc flexCol flexOne' },
      h('header',
        h('span', { class: 'title rborder'}, [
          h('span', { class: 'icon' }, this.repData.icon ? this.repData.icon : 'T'),
          h('span', this.repData.title)])),
      h('div', { class: 'flexOne' },
        h(TableGrid, {
          schema: this.gridSchema,
          records: this.gridRecords})));
  }
}