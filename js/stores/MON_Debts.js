const MON_Debts = {
  records: [],
  schema: {
    id: 22,
    name: 'MON_Debts',
    title: 'Dluhy',
    orderBy: 'date',
    orderAsc: false,
    properties: [
      { name: 'id', title: 'Id', type: 'int', required: true, hidden: true },
      { name: 'date', title: 'Datum', type: 'date', required: true, align: 'center' },
      { name: 'payerId', title: 'Zaplatil', type: 'select', required: true, source: { name: 'GLO_People', property: 'name' } },
      { name: 'debtorId', title: 'Komu', type: 'select', required: true, source: { name: 'GLO_People', property: 'name' } },
      { name: 'amount', title: 'Částka', type: 'num', required: true, align: 'right' },
      { name: 'currencyId', title: 'Měna', type: 'select', required: true, align: 'center', default: [8], source: { name: 'MON_Currencies', property: 'code' } },
      { name: 'desc', title: 'Popis', type: 'text' }
    ],
    reports: [
      { name: 'RepMonDebtsCalc', title: 'Vyúčtování' }
    ]
  }
};

export default MON_Debts;