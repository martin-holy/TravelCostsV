const GLO_People = {
  records: [],
  schema: {
    id: 13,
    name: 'GLO_People',
    title: 'Osoby',
    properties: [
      { name: 'id', title: 'Id', type: 'int', required: true, hidden: true },
      { name: 'name', title: 'Jméno', type: 'text', required: true },
      { name: 'active', title: 'Aktivní', type: 'bool' },
      { name: 'bgColor', title: 'Barva', type: 'text' }
    ]
  }
};

export default GLO_People;