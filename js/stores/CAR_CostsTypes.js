const CAR_CostsTypes = {
  records: [],
  schema: {
    id: 35,
    name: 'CAR_CostsTypes',
    title: 'Typy výdajů',
    orderBy: 'name',
    properties: [
      { name: 'id', title: 'Id', type: 'int', required: true, hidden: true },
      { name: 'name', title: 'Název', type: 'text', required: true },
      { name: 'bgColor', title: 'Barva', type: 'text' }
    ]
  }
};

export default CAR_CostsTypes;