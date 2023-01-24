import common from './../common.js';

const CAR_PricePerKm = {
  records: [],
  schema: {
    id: 32,
    name: 'CAR_PricePerKm',
    title: 'Cena za Km',
    orderBy: 'kmFrom',
    orderAsc: false,
    properties: [
      { name: 'id', title: 'Id', type: 'int', required: true, hidden: true },
      { name: 'kmFrom', title: 'Km od', type: 'int', required: true, align: 'right' },
      { name: 'kmTo', title: 'Km do', type: 'int', required: true, align: 'right' },
      { name: 'eur', title: 'EUR', type: 'calc', align: 'right', funcName: 'carGetEurPerKm' },
      { name: 'eurTotal', title: 'EUR celkem', type: 'num', required: true, align: 'right' },
      { name: 'costTypeId', title: 'Typ', type: 'select', required: true, align: 'center', source: { name: 'CAR_CostsTypes', property: 'name' } },
      { name: 'desc', title: 'Popis', type: 'text' }
    ],
    functions: [
      { name: 'carUpdateDieselPricePerKm', title: 'Aktualizuj cenu/Km' }
    ]
  },

  carGetEurPerKm: function(db, rec) {
    return (rec.eurTotal / (rec.kmTo - rec.kmFrom)).round(3);
  },

  carUpdateDieselPricePerKm: common.carUpdateDieselPricePerKm
};

export default CAR_PricePerKm;