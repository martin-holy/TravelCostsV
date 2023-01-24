const ADM_AppSettings = {
  records: [],
  schema: {
    id: 3,
    name: 'ADM_AppSettings',
    title: 'Nastavení aplikace',
    properties: [
      { name: 'id', title: 'Id', type: 'int', required: true, hidden: true },
      { name: 'dbVersion', title: 'DB Version', type: 'int', required: true }
    ]
  }
};

export default ADM_AppSettings;