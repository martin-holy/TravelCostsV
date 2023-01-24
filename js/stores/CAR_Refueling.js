import common from './../common.js';

const CAR_Refueling = {
  records: [],
  schema: {
    id: 31,
    name: 'CAR_Refueling',
    title: 'Tankování',
    orderBy: 'kmTotal',
    orderAsc: false,
    onSaveFunc: 'carCalcConsumptions',
    properties: [
      { name: 'id', title: 'Id', type: 'int', required: true, hidden: true },
      { name: 'date', title: 'Datum', type: 'date', required: true, align: 'center' },
      { name: 'kmTotal', title: 'Km', type: 'int', required: true, align: 'right' },
      { name: 'liters', title: 'Litrů', type: 'num', required: true, align: 'right' },
      { name: 'pricePerLiter', title: 'Cena/l', type: 'num', required: true, align: 'right' },
      { name: 'currencyId', title: 'Měna', type: 'select', required: true, align: 'center', source: { name: 'MON_Currencies', property: 'code' } },
      { name: 'fullTank', title: 'Plná', type: 'bool' },
      { name: 'consumption', title: 'l/100km', type: 'readOnly', align: 'right' }
    ],
    reports: [
      { name: 'RepCarRefueling', title: 'Spotřeba paliva' }
    ]
  },

  carCalcConsumptions: async function(db) {
    // recalculate consumptions for all refueling
    const refueling = Array.from(await db.data(db.stores.CAR_Refueling)).orderBy('kmTotal');
    let kmFrom = 0,
        l = 0;

    for (let ref of refueling) {
      if (kmFrom === 0) {
        kmFrom = ref.kmTotal;
        ref.consumption = 0;
        continue;
      }
      
      l += ref.liters;

      if (ref.fullTank) {
        ref.consumption = ((100.0 / (ref.kmTotal - kmFrom)) * l).round(2);
        kmFrom = ref.kmTotal;
        l = 0;
      } else {
        ref.consumption = 0;
      }
    }

    await db.update(db.stores.CAR_Refueling, refueling);
    await common.carUpdateDieselPricePerKm(db);
  }
};

export default CAR_Refueling;