import common from './../common.js';

const MON_Rates = {
  records: [],
  schema: {
    id: 26,
    name: 'MON_Rates',
    title: 'Kurzy',
    orderBy: 'date',
    orderAsc: false,
    properties: [
      { name: 'id', title: 'Id', type: 'int', required: true, hidden: true },
      { name: 'date', title: 'Datum', type: 'date', required: true, align: 'center' },
      { name: 'amount', title: 'Kurz/EUR', type: 'num', required: true, align: 'right' },
      { name: 'currencyId', title: 'Měna', type: 'select', required: true, align: 'center', source: { name: 'MON_Currencies', property: 'code' } }
    ],
    functions: [
      { name: 'monUpdateMissingRates', title: 'Aktualizovat kurzy' }
    ]
  },

  monUpdateMissingRates: async function(db) {
    const oldRates = await db.data(db.stores.MON_Rates),
          currencies = await db.data(db.stores.MON_Currencies);
    let costsToUpdate = [],
        incomesToUpdate = [],
        newRates = [];
  
    for (const storeName of ['CAR_Refueling', 'MON_Costs', 'MON_Incomes', 'MON_Debts']) {
      const storeData = await db.data(db.stores[storeName]),
            toUpdate = [];
      for (const rec of storeData) {
        if (rec.currencyId === common.hardCoded.monEURCurrencyId) continue;
        if (oldRates.find(x => x.date === rec.date && x.currencyId === rec.currencyId) != undefined) continue;
        toUpdate.push(rec);
        if (newRates.find(x => x.date === rec.date && x.currencyId === rec.currencyId) != undefined) continue;
        newRates.push({date: rec.date, currencyId: rec.currencyId});  
      }
      switch (storeName) {
        case 'MON_Costs': costsToUpdate = toUpdate; break;
        case 'MON_Incomes': incomesToUpdate = toUpdate;
      }
    }
    
    // Get Historical Rates of new records
    let errGettingRates = false;
    for (let rate of newRates) {
      await fetch(`https://openexchangerates.org/api/historical/${rate.date}.json?app_id=${common.hardCoded.openExchangeRatesApiId}`)
        .then((response) => {
          if (response.ok)
            return response.json();
          throw new Error('Network response was not ok.');
        }).then((json) => {
          const code = currencies.find(x => x.id === rate.currencyId).code;
          rate.amount = (json.rates[code] / json.rates['EUR']).toFixed(4);
        }).catch((error) => {
          db.log(error.message, true);
          errGettingRates = true;
        });
      
      if (errGettingRates)
        break;
    }

    if (errGettingRates)
      return;
  
    newRates = newRates.filter(x => x.amount);
  
    const updateEur = function (data) {
      for (let rec of data) {
        const rate = newRates.find(x => x.date === rec.date && x.currencyId === rec.currencyId);
        if (!rate) continue;
        rec.eur = (rec.amount / rate.amount).round(2);
      }
    };
  
    updateEur(costsToUpdate);
    updateEur(incomesToUpdate);
    await db.update(db.stores.MON_Costs, costsToUpdate);
    await db.update(db.stores.MON_Incomes, incomesToUpdate);
    await db.insert(db.stores.MON_Rates, newRates);
    await common.carUpdateDieselPricePerKm(db);
    await common.carUpdatePricePerDrives(db);
    db.log('Done', true);
  }
};

export default MON_Rates;