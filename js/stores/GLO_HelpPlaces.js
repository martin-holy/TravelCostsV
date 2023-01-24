import common from './../common.js';

const GLO_HelpPlaces = {
  records: [],
  schema: {
    id: 12,
    name: 'GLO_HelpPlaces',
    title: 'Pobyt bez výdajů',
    orderBy: 'date',
    orderAsc: false,
    properties: [
      { name: 'id', title: 'id', type: 'int', required: true, hidden: true },
      { name: 'dateFrom', title: 'Od', type: 'date', required: true, align: 'center' },
      { name: 'dateTo', title: 'Do', type: 'date', align: 'center' },
      { name: 'name', title: 'Název', type: 'text', required: true },
      { name: 'days', title: 'Dní', type: 'calc', align: 'right', funcName: 'numberOfDaysBetween' }
    ]
  },

  numberOfDaysBetween: function(db, rec) {
    return common.numberOfDaysBetween(rec);
  }
};

export default GLO_HelpPlaces;