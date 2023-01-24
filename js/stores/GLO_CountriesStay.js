import common from './../common.js';

const GLO_CountriesStay = {
  records: [],
  schema: {
    id: 11,
    name: 'GLO_CountriesStay',
    title: 'Pobyt v zemích',
    orderBy: 'dateFrom',
    orderAsc: false,
    properties: [
      { name: 'id', title: 'Id', type: 'int', required: true, hidden: true },
      { name: 'dateFrom', title: 'Od', type: 'date', required: true, align: 'center' },
      { name: 'dateTo', title: 'Do', type: 'date', align: 'center' },
      { name: 'countryId', title: 'Země', type: 'select', required: true, source: { name: 'GLO_Countries', property: 'name' } },
      { name: 'days', title: 'Dny', type: 'calc', align: 'right', funcName: 'numberOfDaysBetween' }
    ],
    reports: [
      { name: 'RepGloCountriesStay', title: 'Pobyt v zemích' }, 
      { name: 'RepGloCountriesStaySum', title: 'Pobyt v zemích celkem' }
    ]
  },

  numberOfDaysBetween: function(db, rec) {
    return common.numberOfDaysBetween(rec);
  }
};

export default GLO_CountriesStay;