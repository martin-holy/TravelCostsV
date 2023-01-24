import common from './../common.js';

const MON_Costs = {
  records: [],
  schema: {
    id: 20,
    name: 'MON_Costs',
    title: 'Výdaje',
    orderBy: 'date',
    orderAsc: false,
    properties: [
      { name: 'id', title: 'Id', type: 'int', required: true, hidden: true },
      { name: 'date', title: 'Datum', type: 'date', required: true, align: 'center' },
      { name: 'amount', title: 'Částka', type: 'num', required: true, align: 'right' },
      { name: 'currencyId', title: 'Měna', type: 'select', required: true, align: 'center', default: [8], source: { name: 'MON_Currencies', property: 'code' } },
      { name: 'eur', title: 'EUR', type: 'calc', align: 'right', funcName: 'amountInEUR' },
      { name: 'costTypeId', title: 'Typ', type: 'select', required: true, default: [1], source: { name: 'MON_CostsTypes', property: 'name' } },
      { name: 'desc', title: 'Popis', type: 'text' },
      { name: 'countryId', title: 'Země', type: 'select', required: true, default: [16], source: { name: 'GLO_Countries', property: 'name' } }
    ],
    reports: [
      { name: 'RepMonCosts', title: 'Výdaje' }
    ]
  },
  amountInEUR: common.amountInEUR
};

export default MON_Costs;