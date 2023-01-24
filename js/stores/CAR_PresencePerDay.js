const CAR_PresencePerDay = {
  records: [],
  schema: {
    id: 34,
    name: 'CAR_PresencePerDay',
    title: 'Přítomnost ve dnech',
    orderBy: 'dateFrom',
    properties: [
      { name: 'id', title: 'Id', type: 'int', required: true, hidden: true },
      { name: 'dateFrom', title: 'Od', type: 'date', required: true, align: 'center' },
      { name: 'dateTo', title: 'Do', type: 'date', align: 'center' },
      { name: 'personId', title: 'Osoba', type: 'select', required: true, source: { name: 'GLO_People', property: 'name' } }
    ]
  }
};

export default CAR_PresencePerDay;