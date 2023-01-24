const ADM_AppStoreGroups = {
  records: [],
  schema: {
    id: 2,
    name: 'ADM_AppStoreGroups',
    title: 'Skupiny úložišť',
    orderBy: 'index',
    properties: [
      { name: 'id', title: 'Id', type: 'int', required: true, hidden: true },
      { name: 'name', title: 'Název', type: 'text', required: true },
      { name: 'icon', title: 'Ikona', type: 'text', required: true },
      { name: 'index', title: 'Index', type: 'int', required: true },
      { name: 'stores', title: 'Úložiště', type: 'multiSelect', required: true, source: { name: 'ADM_AppStores', property: 'name' } }
    ]
  }
};

export default ADM_AppStoreGroups;