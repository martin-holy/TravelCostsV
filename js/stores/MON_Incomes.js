import common from './../common.js';

const MON_Incomes = {
  records: [],
  schema: {
    id: 21,
    name: 'MON_Incomes',
    title: 'Příjmy',
    orderBy: 'date',
    orderAsc: false,
    properties: [
      { name: 'id', title: 'Id', type: 'int', required: true, hidden: true },
      { name: 'date', title: 'Datum', type: 'date', required: true, align: 'center' },
      { name: 'amount', title: 'Částka', type: 'num', required: true, align: 'right' },
      { name: 'currencyId', title: 'Měna', type: 'select', required: true, align: 'center', default: [9], source: { name: 'MON_Currencies', property: 'code' } },
      { name: 'eur', title: 'EUR', type: 'calc', align: 'right', funcName: 'amountInEUR' },
      { name: 'incomeTypeId', title: 'Typ', type: 'select', required: true, default: [1], source: { name: 'MON_IncomesTypes', property: 'name' } },
      { name: 'desc', title: 'Popis', type: 'text' }
    ],
    reports: [
      { name: 'RepMonIncomes', title: 'Příjmy' }
    ]
  },
  amountInEUR: common.amountInEUR
};

export default MON_Incomes;