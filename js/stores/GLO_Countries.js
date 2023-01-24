const GLO_Countries = {
  records: [],
  schema: {
    id: 10,
    name: 'GLO_Countries',
    title: 'Země',
    orderBy: 'name',
    properties: [
      { name: 'id', title: 'Id', type: 'int', required: true, hidden: true },
      { name: 'name', title: 'Jméno', type: 'text', required: true },
      { name: 'code', title: 'Kód', type: 'text', required: true }
    ]
  }
};

export default GLO_Countries;