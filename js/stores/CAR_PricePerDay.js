import common from './../common.js';

const CAR_PricePerDay = {
  records: [],
  schema: {
    id: 33,
    name: 'CAR_PricePerDay',
    title: 'Cena za den',
    orderBy: 'dateFrom',
    properties: [
      { name: 'id', title: 'Id', type: 'int', required: true, hidden: true },
      { name: 'dateFrom', title: 'Od', type: 'date', required: true, align: 'center' },
      { name: 'dateTo', title: 'Do', type: 'date', required: true, align: 'center' },
      { name: 'eur', title: 'EUR', type: 'calc', align: 'right', funcName: 'carGetEurPerDay' },
      { name: 'eurTotal', title: 'EUR celkem', type: 'num', required: true, align: 'right' },
      { name: 'costTypeId', title: 'Typ', type: 'select', required: true, align: 'center', source: { name: 'CAR_CostsTypes', property: 'name' } }
    ]
  },

  carGetEurPerDay: function(db, rec) {
    return (rec.eurTotal / common.numberOfDaysBetween(rec)).round(3);
  }
};

export default CAR_PricePerDay;