if (!Array.prototype.orderBy) {
  Array.prototype.orderBy = function(orderBy, asc = true) {
    return this.sort((a, b) => {
      const valA = a[orderBy],
            valB = b[orderBy];
      if (valA < valB) return asc ? -1 : 1;
      if (valA > valB) return asc ? 1 : -1;
      return 0;
    });
  };
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