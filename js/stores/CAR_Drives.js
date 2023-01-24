import common from './../common.js';

const CAR_Drives = {
  records: [],
  schema: {
    id: 30,
    name: 'CAR_Drives',
    title: 'Jízdy',
    orderBy: 'kmTotal',
    orderAsc: false,
    onSaveFunc: 'carUpdatePricePerDrives',
    properties: [
      { name: 'id', title: 'Id', type: 'int', required: true, hidden: true },
      { name: 'date', title: 'Datum', type: 'date', required: true, align: 'center' },
      { name: 'kmTotal', title: 'Celkové km', type: 'int', required: true, align: 'right' },
      { name: 'km', title: 'Km', type: 'readOnly', align: 'right' },
      { name: 'eur', title: 'EUR', type: 'readOnly', align: 'right' },
      { name: 'desc', title: 'Popis', type: 'text' },
      { name: 'people', title: 'Cestující', type: 'multiSelect', required: true, default: [1, 2], source: { name: 'GLO_People', property: 'name' } }
    ],
    reports: [
      { name: 'RepCarDrives', title: 'Jízdy km/€' }, 
      { name: 'RepCarDrivesOld', title: 'Jízdy km/Dny/Místa' }
    ]
  },

  carUpdatePricePerDrives: common.carUpdatePricePerDrives
};

export default CAR_Drives;