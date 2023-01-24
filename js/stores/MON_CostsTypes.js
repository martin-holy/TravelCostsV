const MON_CostsTypes = {
  records: [],
  schema: {
    id: 23,
    name: 'MON_CostsTypes',
    title: 'Typy výdajů',
    orderBy: 'name',
    properties: [
      { name: 'id', title: 'Id', type: 'int', required: true, hidden: true },
      { name: 'name', title: 'Název', type: 'text', required: true },
      { name: 'bgColor', title: 'Barva', type: 'text' }
    ]
  }
};

export default MON_CostsTypes;