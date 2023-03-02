import RepCarDrives from './reports/RepCarDrives.js';
import RepCarDrivesOld from './reports/RepCarDrivesOld.js';
import RepCarRefueling from './reports/RepCarRefueling.js';
import RepGloCountriesStay from './reports/RepGloCountriesStay.js';
import RepGloCountriesStaySum from './reports/RepGloCountriesStaySum.js';
import RepMonCosts from './reports/RepMonCosts.js';
import RepMonDebtsCalc from './reports/RepMonDebtsCalc.js';
import RepMonIncomes from './reports/RepMonIncomes.js';

function attachCustom(db, app) {
  app.component('RepCarDrives', RepCarDrives)
    .component('RepCarDrivesOld', RepCarDrivesOld)
    .component('RepCarRefueling', RepCarRefueling)
    .component('RepGloCountriesStay', RepGloCountriesStay)
    .component('RepGloCountriesStaySum', RepGloCountriesStaySum)
    .component('RepMonCosts', RepMonCosts)
    .component('RepMonDebtsCalc', RepMonDebtsCalc)
    .component('RepMonIncomes', RepMonIncomes);

  db.events.onBeforeSave.push(async (e) => {
    const { db, store, rec } = e.detail;
    
    switch (store.schema.name) {
      case 'GLO_CountriesStay':
      case 'GLO_HelpPlaces':
        rec.days = numberOfDaysBetween(rec.dateFrom, rec.dateTo);
        break;
      case 'MON_Costs':
      case 'MON_Incomes':
        rec.eur = await amountInEUR(db, rec);
        break;
      case 'CAR_PricePerKm':
        rec.eur = carGetEurPerKm(rec);
        break;
      case 'CAR_PricePerDay':
        rec.eur = carGetEurPerDay(rec);
        break;
    }
  });

  db.events.onAfterSave.push(async (e) => {
    const { db, store, rec } = e.detail;

    switch (store.schema.name) {
      case 'CAR_Drives':
        await carUpdatePricePerDrives(db);
        break;
      case 'CAR_Refueling':
        await carCalcConsumptions(db);
        break;
    }
  });

  db.stores.SYS_GroupsInYear = {
    records: [
      { id: 12, group: '1 Měsíc' },
      { id: 4, group: '3 Měsíce' },
      { id: 2, group: '6 Měsíců' },
      { id: 1, group: '1 Rok' }],
    schema: {
      name: 'SYS_GroupsInYear',
      properties: [
        { name: 'id', title: 'Id', type: 'int', required: true, hidden: true },
        { name: 'group', title: 'Skupina', type: 'text' }]}
  };

  db.stores.CAR_Drives.reports = [
    { icon: 'M', name: 'RepCarDrives', title: 'Jízdy km/€' }, 
    { icon: 'M', name: 'RepCarDrivesOld', title: 'Jízdy km/Dny/Místa' }
  ];

  db.stores.CAR_PricePerKm.carUpdateDieselPricePerKm = (db, rec) => carUpdateDieselPricePerKm(db);
  db.stores.CAR_PricePerKm.functions = [
    { icon: 'H', name: 'carUpdateDieselPricePerKm', title: 'Aktualizuj cenu/Km' }
  ];

  db.stores.CAR_Refueling.reports = [
    { icon: 'N', name: 'RepCarRefueling', title: 'Spotřeba paliva' }
  ];

  db.stores.GLO_CountriesStay.reports = [
    { icon: 'O', name: 'RepGloCountriesStay', title: 'Pobyt v zemích' }, 
    { icon: 'O', name: 'RepGloCountriesStaySum', title: 'Pobyt v zemích celkem' }
  ];

  db.stores.MON_Costs.reports = [
    { icon: 'E', name: 'RepMonCosts', title: 'Výdaje' }
  ];

  db.stores.MON_Currencies.monUpdateRates = (db, rec) => monUpdateRates(db);
  db.stores.MON_Currencies.functions = [
    { icon: 'J', name: 'monUpdateRates', title: 'Aktualizovat kurzy' }
  ];

  db.stores.MON_Debts.reports = [
    { icon: 'G', name: 'RepMonDebtsCalc', title: 'Vyúčtování' }
  ];

  db.stores.MON_Incomes.reports = [
    { icon: 'F', name: 'RepMonIncomes', title: 'Příjmy' }
  ];

  db.stores.MON_Rates.monUpdateMissingRates = (db, rec) => monUpdateMissingRates(db);
  db.stores.MON_Rates.functions = [
    { icon: 'J', name: 'monUpdateMissingRates', title: 'Aktualizovat kurzy' }
  ];
}

async function carUpdatePricePerDrives(db) {
  await carUpdateAmortizationPricePerKm(db);

  const arrDrives = Array.from(await db.data(db.stores.CAR_Drives)).orderBy('kmTotal'),
        arrPricePerKm = await db.data(db.stores.CAR_PricePerKm);
  let kmFrom = appSettings.get('carTotalKmStart');

  for (let drv of arrDrives) {
    let eur = 0;
    drv.km = drv.kmTotal - kmFrom;

    for (let price of arrPricePerKm) {
      if (price.kmTo <= kmFrom || price.kmFrom >= drv.kmTotal) continue;

      const pricePerKm = price.eurTotal / (price.kmTo - price.kmFrom),
            from = price.kmFrom < kmFrom ? kmFrom : price.kmFrom,
            to = price.kmTo > drv.kmTotal ? drv.kmTotal : price.kmTo;

      eur += (to - from) * pricePerKm;
    }

    drv.eur = eur.round(2);
    kmFrom = drv.kmTotal;
  }

  await db.update(db.stores.CAR_Drives, arrDrives);
}

async function carUpdateAmortizationPricePerKm(db) {
  const carAmortizationCostTypeId = appSettings.get('carAmortizationCostTypeId'), 
        arrPricePerKmAmorti = (await db.data(db.stores.CAR_PricePerKm))
          .filter(x => x.costTypeId === carAmortizationCostTypeId);

  let lastKmTotal = Array.from(await db.data(db.stores.CAR_Drives)).orderBy('kmTotal', false)[0];

  // Extending Amortization
  lastKmTotal = lastKmTotal
    ? lastKmTotal.kmTotal
    : appSettings.get('carAmortizationUntilTotalKm');

  for (let a of arrPricePerKmAmorti) {
    a.kmTo = lastKmTotal;
    a.eur = (a.eurTotal / (a.kmTo - a.kmFrom)).round(5);
  }

  await db.update(db.stores.CAR_PricePerKm, arrPricePerKmAmorti);
}

function carGetEurPerDay(rec) {
  return (rec.eurTotal / numberOfDaysBetween(rec.dateFrom, rec.dateTo)).round(3);
}

function carGetEurPerKm(rec) {
  return (rec.eurTotal / (rec.kmTo - rec.kmFrom)).round(3);
}

// gets actual rate for a day or last actual rate if not found
async function amountInEUR(db, rec, roundTo = 2) {
  if (rec.currencyId === appSettings.get('monEURCurrencyId'))
    return rec.amount;

  let rate = (await db.data(db.stores.MON_Rates))
    .find(x => x.date === rec.date && x.currencyId === rec.currencyId);

  if (!rate)
    rate = (await db.data(db.stores.MON_Currencies))
      .find(x => x.id === rec.currencyId);

  return rate
    ? (rec.amount / rate.amount).round(roundTo)
    : 0;
}

function monUpdateRates(db) {
  const openExchangeRatesApiId = appSettings.get('openExchangeRatesApiId');
  fetch(`https://openexchangerates.org/api/latest.json?app_id=${openExchangeRatesApiId}`)
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

async function monUpdateMissingRates(db) {
  const oldRates = await db.data(db.stores.MON_Rates),
        currencies = await db.data(db.stores.MON_Currencies),
        monEURCurrencyId = appSettings.get('monEURCurrencyId'),
        openExchangeRatesApiId = appSettings.get('openExchangeRatesApiId');
  let costsToUpdate = [],
      incomesToUpdate = [],
      newRates = [];

  for (const storeName of ['CAR_Refueling', 'MON_Costs', 'MON_Incomes', 'MON_Debts']) {
    const storeData = await db.data(db.stores[storeName]),
          toUpdate = [];
    for (const rec of storeData) {
      if (rec.currencyId === monEURCurrencyId) continue;
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
    await fetch(`https://openexchangerates.org/api/historical/${rate.date}.json?app_id=${openExchangeRatesApiId}`)
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
  await carUpdateDieselPricePerKm(db);
  await carUpdatePricePerDrives(db);
  db.log('Done', true);
}

function carUpdateDieselPricePerKm(db) {
  return new Promise(async (resolve) => {
    let refueling = Array.from(await db.data(db.stores.CAR_Refueling)).orderBy('kmTotal'),
        arrLiters = [],
        arrPrice = [],
        arrKm = [],
        litersFrom = 0,
        litersTotal = 0,
        lastLitersTotal = 0,
        kmFrom = 0;

    for (let ref of refueling) {
      // | kmFrom | kmTo | consumption | litersFrom | litersTo |
      if (kmFrom !== 0) litersTotal += ref.liters;
      if (ref.fullTank) {
        if (kmFrom !== 0) {
          arrKm.push({
            kmFrom: kmFrom,
            kmTo: ref.kmTotal,
            consumption: ref.consumption,
            litersFrom: lastLitersTotal,
            litersTo: litersTotal
          });
          lastLitersTotal = litersTotal;
        }
        kmFrom = ref.kmTotal;
      }

      // | litersFrom | litersTo | eur per liter |
      arrLiters.push({
        litersFrom: litersFrom, 
        litersTo: litersFrom + ref.liters, 
        eur: await amountInEUR(db, {
          date: ref.date, 
          currencyId: ref.currencyId, 
          amount: ref.pricePerLiter}, 3)});

      litersFrom += ref.liters;
    }

    arrKm = arrKm.orderBy('kmFrom');

    for (let km of arrKm) {
      for (let l of arrLiters) {
        if ((km.litersFrom >= l.litersFrom) && (km.litersTo <= l.litersTo)) {
          arrPrice.push({
            kmFrom: km.kmFrom,
            kmTo: km.kmTo,
            consumption: km.consumption,
            EURPerL: l.eur
          });
        }

        if ((km.litersFrom >= l.litersFrom) && (km.litersTo > l.litersTo) && (km.litersFrom < l.litersTo)) {
          arrPrice.push({
            kmFrom: km.kmFrom,
            kmTo: km.kmFrom + ((l.litersTo - km.litersFrom) * km.consumption),
            consumption: km.consumption,
            EURPerL: l.eur
          });
        }

        if ((km.litersFrom < l.litersFrom) && (km.litersTo <= l.litersTo) && (km.litersTo > l.litersFrom)) {
          arrPrice.push({
            kmFrom: km.kmFrom + ((l.litersFrom - km.litersFrom) * km.consumption),
            kmTo: km.kmTo,
            consumption: km.consumption,
            EURPerL: l.eur
          });
        }

        if ((km.litersFrom < l.litersFrom) && (km.litersTo > l.litersTo)) {
          arrPrice.push({
            kmFrom: km.kmFrom + ((l.litersFrom - km.litersFrom) * km.consumption),
            kmTo: km.kmFrom + ((l.litersFrom - km.litersFrom) * km.consumption) + ((l.litersTo - l.litersFrom) * km.consumption),
            consumption: km.consumption,
            EURPerL: l.eur
          });
        }
      }
    }

    //Last record for drivers after last full tank refueling
    let lastPrice = arrPrice[arrPrice.length - 1];
    arrPrice.push({
      kmFrom: lastPrice.kmTo,
      kmTo: lastPrice.kmTo + appSettings.get('carUnknownConsumptionForKm'),
      consumption: appSettings.get('carUnknownConsumption'),
      EURPerL: lastPrice.EURPerL
    });

    const carDieselCostTypeId = appSettings.get('carDieselCostTypeId');

    //Adding eurTotal, eurPerKm and found flag
    //Rounding km
    for (let price of arrPrice) {
      price.kmFrom = price.kmFrom.round(0);
      price.kmTo = price.kmTo.round(0);
      price.eurTotal = ((price.consumption / 100.0) * (price.kmTo - price.kmFrom) * price.EURPerL).round(3);
      price.eur = (price.eurTotal / (price.kmTo - price.kmFrom)).round(3);
      price.costTypeId = carDieselCostTypeId;
      price.found = false;
    }

    let arrPricePerKmDiesel = (await db.data(db.stores.CAR_PricePerKm))
          .filter(p => p.costTypeId === carDieselCostTypeId),
        tx = db.db.transaction(['CAR_PricePerKm'], 'readwrite'),
        store = tx.objectStore('CAR_PricePerKm'),
        found = false;

    tx.oncomplete = () => {
      db.stores.CAR_PricePerKm.records.length = 0;
      resolve();
    };

    //Comparing data
    for (let ppk of arrPricePerKmDiesel) {
      found = false;
      for (let p of arrPrice) {
        if (ppk.kmFrom === p.kmFrom && ppk.kmTo === p.kmTo && ppk.eurTotal === p.eurTotal) {
          p.found = true;
          found = true;
          break;
        }
      }
      //Deleting old ones
      if (!found)
        store.delete(ppk.id);
    }

    //Inserting new ones
    for (let p of arrPrice)
      if (!p.found)
        store.add(p);
  });
}

async function carCalcConsumptions(db) {
  // recalculate consumptions for all refueling
  const refueling = Array.from(await db.data(db.stores.CAR_Refueling)).orderBy('kmTotal');
  let kmFrom = 0,
      l = 0;

  for (let ref of refueling) {
    if (kmFrom === 0) {
      kmFrom = ref.kmTotal;
      ref.consumption = 0;
      continue;
    }
    
    l += ref.liters;

    if (ref.fullTank) {
      ref.consumption = ((100.0 / (ref.kmTotal - kmFrom)) * l).round(2);
      kmFrom = ref.kmTotal;
      l = 0;
    } else {
      ref.consumption = 0;
    }
  }

  await db.update(db.stores.CAR_Refueling, refueling);
  await carUpdateDieselPricePerKm(db);
}

function getMonthIntervals(yearFrom, yearTo) {
  const monthIntervals = [];
  for (let y = yearFrom; y < yearTo + 1; y++) {
    for (let m = 0; m < 12; m++) {
      monthIntervals.push({ 
        dateFrom: new Date(y, m, 1).toYMD(), 
        dateTo: new Date(y, m + 1, 0).toYMD() });
    }
  }
  return monthIntervals;
}

function combineDateIntervals(arrays, nullDateTo) {
  const from = new Set(),
        to = new Set();

  // getting dates from and dates to
  arrays.forEach(a => a.forEach(x => {
    const dateTo = x.dateTo == null ? nullDateTo : x.dateTo;
    from.add(x.dateFrom);
    from.add(new Date(dateTo).addDays(1).toYMD());
    to.add(dateTo);
    to.add(new Date(x.dateFrom).addDays(-1).toYMD());
  }));

  const arrFrom = [...from].sort(),
        arrTo = [...to].sort(),
        intervals = [];

  // skipping first dateTo and last dateFrom
  for (let i = 1; i < arrTo.length; i++) {
    intervals.push({
      dateFrom: arrFrom[i-1], 
      dateTo: arrTo[i]});
  }

  return intervals;
}

function mapDataToIntervals(data, mapTo, intervals) {
  for(let i of intervals) {
    for (let d of data) {
      const dataDateTo = d.dateTo == null ? new Date().toYMD() : d.dateTo;
      if (d.dateFrom > i.dateTo || dataDateTo < i.dateFrom) continue;
      if (!i[mapTo]) i[mapTo] = [];
      i[mapTo].push(d);
    }
  }
  return intervals;
}

function splitPriceInIntervals(intervals) {
  // calculating total price for intervals
  for (let i of intervals) {
    let eur = 0;
    if (i.prices) {
      for (let price of i.prices) {
        const from = price.dateFrom < i.dateFrom ? i.dateFrom : price.dateFrom,
              to = price.dateTo > i.dateTo ? i.dateTo : price.dateTo,
              pricePerDay = price.eurTotal / numberOfDaysBetween(price.dateFrom, price.dateTo);

        eur += numberOfDaysBetween(from, to) * pricePerDay;
      }
    }
    i.eurTotal = eur;
  }
}

const canvas = {
  drawRect: function(ctx, x, y, width, height, fillStyle, strokeStyle, angle) {
    const tX = x,
          tY = y;

    if (angle !== 0 || angle !== undefined) {
      ctx.save();
      ctx.translate(tX, tY);
      ctx.rotate((angle * Math.PI) / 180);
      x = 0;
      y = 0;
    }

    if (fillStyle !== undefined) {
      ctx.fillStyle = fillStyle;
      ctx.fillRect(x, y, width, height);
    }

    if (strokeStyle !== undefined) {
      ctx.strokeStyle = strokeStyle;
      ctx.strokeRect(x, y, width, height);
    }

    if (angle !== 0 || angle !== undefined) {
      ctx.translate(-tX, -tY);
      ctx.restore();
    }
  },

  drawText: function(ctx, text, x, y, fillStyle, strokeStyle, font, angle) {
    const tX = x,
          tY = y;

    if (angle !== 0 || angle !== undefined) {
      ctx.save();
      ctx.translate(tX, tY);
      ctx.rotate((angle * Math.PI) / 180);
      x = 0;
      y = 0;
    }

    if (font !== undefined)
      ctx.font = font;

    if (fillStyle !== undefined) {
      ctx.fillStyle = fillStyle;
      ctx.fillText(text, x, y);
    }

    if (strokeStyle !== undefined) {
      ctx.strokeStyle = strokeStyle;
      ctx.strokeText(text, x, y);
    }

    if (angle !== 0 || angle !== undefined) {
      ctx.translate(-tX, -tY);
      ctx.restore();
    }
  }
};

export default {
  attachCustom,
  amountInEUR,
  getMonthIntervals,
  combineDateIntervals,
  mapDataToIntervals,
  splitPriceInIntervals,
  canvas
}