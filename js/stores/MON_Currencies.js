import common from './../common.js';

const MON_Currencies = {
  records: [],
  schema: {
    id: 24,
    name: 'MON_Currencies',
    title: 'Měny',
    orderBy: 'code',
    properties: [
      { name: 'id', title: 'Id', type: 'int', required: true, hidden: true },
      { name: 'code', title: 'Kód', type: 'text', required: true },
      { name: 'name', title: 'Název', type: 'text', required: true },
      { name: 'date', title: 'Datum', type: 'date', required: true, align: 'center' },
      { name: 'amount', title: 'Kurz/EUR', type: 'num', required: true, align: 'right' }
    ],
    functions: [
      { name: 'monUpdateRates', title: 'Aktualizovat kurzy' }
    ]
  },

  monUpdateRates: function(db) {
    fetch(`https://openexchangerates.org/api/latest.json?app_id=${common.hardCoded.openExchangeRatesApiId}`)
      .then((response) => {
        if (response.ok)
          return response.json();
        throw new Error('Network response was not ok.');
      }).then(async (json) => {
        const currencies = await db.data(db.stores.MON_Currencies),
              date = new Date().toYMD();
  
        for (let rec of currencies) {
          rec.date = date;
          rec.amount = (json.rates[rec.code] / json.rates['EUR']).toFixed(4);
        }
  
        db.update(db.stores.MON_Currencies, currencies);
      }).catch((error) => {
        db.log(error.message, true);
      });
  }
};

export default MON_Currencies;