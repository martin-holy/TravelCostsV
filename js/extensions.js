if (!Array.prototype.orderBy) {
  Array.prototype.orderBy = function(orderBy, asc = true) {
    return this.sort((a, b) => {
      const valA = getObjectValue(a, orderBy),
            valB = getObjectValue(b, orderBy);
      if (valA < valB) return asc ? -1 : 1;
      if (valA > valB) return asc ? 1 : -1;
      return 0;
    });
  };
}

function getObjectValue(obj, path) {
  const parts = path.split('.');
  let val = obj;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    val = val[part];
  }

  return val;
}

if (!Date.prototype.toYMD) {
  Date.prototype.toYMD = function (sep = '-') {
    return [
      this.getFullYear(),
      ('0' + (this.getMonth() + 1)).slice(-2),
      ('0' + this.getDate()).slice(-2)
    ].join(sep);
  };
}

if (!Date.prototype.addDays) {
    Date.prototype.addDays = function(days) {
      return this.setDate(this.getDate() + days) && this;
    };
  }

if (!Number.prototype.round) {
  Number.prototype.round = function(places) {
    places = Math.pow(10, places);
    return Math.round(this * places) / places;
  };
}

// gets number of days between dateFrom and dateTo
function numberOfDaysBetween(dateFrom, dateTo) {
  const a = new Date(dateFrom)
          .setHours(0, 0, 0, 0),
        b = new Date(dateTo == null
            ? Date.now()
            : dateTo)
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

function typeOf(obj) {
  return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();
}