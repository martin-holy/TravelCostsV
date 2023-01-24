const hardCoded = {
  monTransportCostTypeId: 3,
  monEURCurrencyId: 9,
  carDieselCostTypeId: 3,
  carAmortizationCostTypeId: 4,
  carUnknownConsumption: 7.3,
  carUnknownConsumptionForKm: 3000,
  carAmortizationUntilTotalKm: 300000,
  carTotalKmStart: 156327, // stav při koupení auta
  gloPeopleCarryId: 3,
  openExchangeRatesApiId: '87daff001ce54adcb026f28899a098ca'
};

// gets actual rate for a day or last actual rate if not found
async function amountInEUR(db, rec, roundTo = 2) {
  if (rec.currencyId === hardCoded.monEURCurrencyId)
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

// gets number of days between rec.dateFrom and rec.dateTo
function numberOfDaysBetween(rec) {
  const a = new Date(rec.dateFrom)
          .setHours(0, 0, 0, 0),
        b = new Date(rec.dateTo == null
            ? Date.now()
            : rec.dateTo)
          .setHours(0, 0, 0, 0);
  return Math.round((b - a) / 86400000 + 1);
}

// get days as years months days
function daysToYMD(days, short = false) {
  const y = Math.floor(days / 365);
  days -= y * 365;
  const m = Math.floor(days / 30.4);
  days -= m * 30.4;
  const d = Math.round(days);

  if (short)
    return [`${y ? `${y}y ` : ''}`,
            `${m ? `${m}m ` : ''}`,
            `${d ? `${d}d` : ''}`].join('');

  return [`${y ? (`${y} year${y > 1 ? 's ' : ' '}`) : ''}`,
          `${m ? (`${m} month${m > 1 ? 's ' : ' '}`) : ''}`,
          `${d ? (`${d} day${d > 1 ? 's' : ''}`) : ''}`].join('');
}

// returns min a max date from data containing dateFrom and dateTo
function getMinMaxDatesFromRange(data) {
  let min = '', max = '';
  for (const item of data) {
    if (!min || min > item.dateFrom)
      min = item.dateFrom;
    if (!max || max < item.dateTo)
      max = item.dateTo;
  }
  return [min, max];
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
      kmTo: lastPrice.kmTo + hardCoded.carUnknownConsumptionForKm,
      consumption: hardCoded.carUnknownConsumption,
      EURPerL: lastPrice.EURPerL
    });

    //Adding eurTotal, eurPerKm and found flag
    //Rounding km
    for (let price of arrPrice) {
      price.kmFrom = price.kmFrom.round(0);
      price.kmTo = price.kmTo.round(0);
      price.eurTotal = ((price.consumption / 100.0) * (price.kmTo - price.kmFrom) * price.EURPerL).round(3);
      price.eur = (price.eurTotal / (price.kmTo - price.kmFrom)).round(3);
      price.costTypeId = hardCoded.carDieselCostTypeId;
      price.found = false;
    }

    let arrPricePerKmDiesel = (await db.data(db.stores.CAR_PricePerKm))
          .filter(p => p.costTypeId === hardCoded.carDieselCostTypeId),
        tx = db.db.transaction(['CAR_PricePerKm'], 'readwrite'),
        store = tx.objectStore('CAR_PricePerKm'),
        found = false;

    tx.oncomplete = () => {
      delete db.stores.CAR_PricePerKm.cache;
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
              pricePerDay = price.eurTotal / numberOfDaysBetween(price);

        eur += numberOfDaysBetween({dateFrom: from, dateTo: to}) * pricePerDay;
      }
    }
    i.eurTotal = eur;
  }
}

async function carUpdatePricePerDrives(db) {
  await carUpdateAmortizationPricePerKm(db);

  const arrDrives = Array.from(await db.data(db.stores.CAR_Drives)).orderBy('kmTotal'),
        arrPricePerKm = await db.data(db.stores.CAR_PricePerKm);
  let kmFrom = hardCoded.carTotalKmStart;

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
  const arrPricePerKmAmorti = (await db.data(db.stores.CAR_PricePerKm))
    .filter(x => x.costTypeId === hardCoded.carAmortizationCostTypeId);

  let lastKmTotal = Array.from(await db.data(db.stores.CAR_Drives)).orderBy('kmTotal', false)[0];

  // Extending Amortization
  lastKmTotal = lastKmTotal
    ? lastKmTotal.kmTotal
    : hardCoded.carAmortizationUntilTotalKm;

  for (let a of arrPricePerKmAmorti) {
    a.kmTo = lastKmTotal;
    a.eur = (a.eurTotal / (a.kmTo - a.kmFrom)).round(5);
  }

  await db.update(db.stores.CAR_PricePerKm, arrPricePerKmAmorti);
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
  hardCoded,
  amountInEUR,
  numberOfDaysBetween,
  daysToYMD,
  carUpdateDieselPricePerKm,
  combineDateIntervals,
  mapDataToIntervals,
  splitPriceInIntervals,
  carUpdatePricePerDrives,
  canvas,
  getMinMaxDatesFromRange,
  getMonthIntervals }