const MON_IncomesTypes = {
  records: [],
  schema: {
    id: 25,
    name: 'MON_IncomesTypes',
    title: 'Typy příjmů',
    orderBy: 'name',
    properties: [
      { name: 'id', title: 'Id', type: 'int', required: true, hidden: true },
      { name: 'name', title: 'Název', type: 'text', required: true },
      { name: 'bgColor', title: 'Barva', type: 'text' }
    ]
  }
};

export default MON_IncomesTypes;