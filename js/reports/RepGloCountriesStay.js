import common from './../common.js';
import InfoCursor from '../components/InfoCursor.js';

const { h } = Vue;

export default {
  props: {
    repData: { type: Object }
  },

  data () {
    return {
      dataReady: false,
      pxPerDayCountries: 4,
      pxPerDayDrives: 10,
      scrollTopUpdating: false,
      countries: [],
      drives: [],
      infoCursor: {
        min: 0,
        max: 0,
        pos: 0,
        date: ''
      },
      infoForDays: 0
    }
  },

  computed: {
    rep() {
      let top = 0,
          nameTop = 0,
          daysTotal = 0;

      // Countries Stay
      const cd = [];

      for (const stay of this.countries) {
        const height = stay.days * this.pxPerDayCountries,
              halfTop = top + (height / 2);

        nameTop = halfTop - nameTop < 25
          ? nameTop + 25
          : halfTop;

        cd.push(h('rect', { x: 10, y: top, width: 20, height: height }));
        cd.push(h('text', { x: 85, y: nameTop, class: 'stayDays' }, stay.days));
        cd.push(h('line', { x1: 30, y1: halfTop, x2: 52, y2: nameTop }));
        cd.push(h('image', { x: 50, y: nameTop - 10, height: 21, href: `./img/flags/${stay.code}.png`}));

        top += height;
        daysTotal += stay.days;
      }

      const countries = h('div', {
        ref: 'countries',
        onScroll: (e) => this.$_onScroll(e) }, [
        h('svg', {
          xmlns: 'http://www.w3.org/2000/svg',
          width: 120,
          height: top }, cd)]);

      // Drives
      const dd = [];

      top = 0;
      nameTop = 0;

      for (const drive of this.drives) {
        const height = drive.days * this.pxPerDayDrives,
              halfTop = top + (height / 2);
  
        nameTop = halfTop - nameTop < 15
          ? nameTop + 15
          : halfTop;

        dd.push(h('rect', { x: 0, y: top, width: 20, height: height }));
        dd.push(h('text', { x: 40, y: nameTop, class: 'driveName' }, [drive.name, h('tspan', drive.days)]));
        dd.push(h('line', { x1: 20, y1: halfTop, x2: 38, y2: nameTop }));
  
        top += height;
      }

      const drives = h('div', {
        ref: 'drives',
        onScroll: (e) => this.$_onScroll(e) }, [
        h('svg', {
          xmlns: 'http://www.w3.org/2000/svg',
          width: 250,
          height: daysTotal * this.pxPerDayDrives }, dd)]);

      return { countries: countries, drives: drives };
    },

    info() {
      const getRec = (data, d) => {
        for (const x of data) {
          d -= x.days;
          if (d < 0)
            return x;
        }
        return null;
      };
  
      const df = (date) => date.split('-').join('.');
  
      const ul = [],
            drive = getRec(this.drives, this.infoForDays),
            country = getRec(this.countries, this.infoForDays);
  
      if (country) {
        ul.push(h('li', [
          `${df(country.dateFrom)} - ${df(country.dateTo)} - `,
          h('span', `${country.days} days`)]));
        ul.push(h('li', country.name));
      }
  
      if (drive) {
        ul.push(h('li', [
          `${df(drive.dateFrom)} - ${df(drive.dateTo)} - `,
          h('span', `${drive.days} days`)]));
        ul.push(h('li', [
          `${drive.name} `,
          h('span', `${drive.km} km`)]));
      }

      return h('div', { class: 'footer' }, [
        h('div', 
          country
            ? h('img', { src: `./img/flags/${country.code}.png` })
            : null),
        h('ul', ul)]);
    }
  },

  async created() {
    this.countries = await this.$_getCountries();
    this.drives = await this.$_getDrives();
    this.dataReady = true;
    this.$_onScroll(null);
  },

  mounted() {
    this.infoCursor.min = this.$refs.countries.offsetTop;
    this.infoCursor.max = this.$refs.countries.clientHeight;
    this.infoCursor.pos = this.infoCursor.min + 10;
  },

  methods: {
    async $_getCountries() {
      const countries = await this.db.data(this.db.stores.GLO_Countries);

      return (await this.db.data(this.db.stores.GLO_CountriesStay, { sorted: true }))
        .map(cs => {
          const country = countries.find(c => c.id === cs.countryId),
                o = {
                  dateFrom: cs.dateFrom,
                  dateTo: cs.dateTo
                    ? cs.dateTo
                    : new Date(Date.now()).toYMD(),
                  name: country.name,
                  code: country.code
                };

          o.days = cs.days
            ? cs.days
            : numberOfDaysBetween(o.dateFrom, o.dateTo);

          return o;
        });
    },

    async $_getDrives() {
      let lastDate = new Date().addDays(1).toYMD();
      
      return Array.from(await this.db.data(this.db.stores.CAR_Drives))
        .orderBy('date', false)
        .map(d => {
          const o = {
            dateFrom: d.date,
            dateTo: lastDate,
            name: d.desc,
            km: d.km
          };

          o.days = numberOfDaysBetween(o.dateFrom, o.dateTo) - 1;
          lastDate = d.date;

          return o;
        });
    },

    $_infoCursorChanged(pos) {
      this.infoCursor.pos = pos;
      this.$_onScroll(null);
    },

    $_onScroll(e) {
      if (this.scrollTopUpdating) {
        this.scrollTopUpdating = false;
        return;
      }
  
      const cursorOffset = this.infoCursor.pos - this.infoCursor.min,
            scrollOnCountries = !e || e.target === this.$refs.countries,
            days = scrollOnCountries
              ? (cursorOffset + this.$refs.countries.scrollTop) / this.pxPerDayCountries
              : (cursorOffset + this.$refs.drives.scrollTop) / this.pxPerDayDrives,
            div = scrollOnCountries
              ? this.$refs.drives
              : this.$refs.countries,
            targetPxPerDay = scrollOnCountries
              ? this.pxPerDayDrives
              : this.pxPerDayCountries,
            targetScrollTop = Math.round((days * targetPxPerDay) - cursorOffset);
  
      if (this.countries.length !== 0)
        this.infoCursor.date = new Date(this.countries[0].dateTo)
          .addDays(days * -1)
          .toYMD('.');      

      if (Math.round(div.scrollTop) !== targetScrollTop) {
        this.scrollTopUpdating = true;
        div.scrollTop = targetScrollTop;
        this.infoForDays = days;
      }
    }
  },

  render() {
    return h('div', { class: 'repGloCountriesStay flexCol flexOne' }, [
      h(InfoCursor, {
        min: this.infoCursor.min,
        max: this.infoCursor.max,
        pos: this.infoCursor.pos,
        onChanged: (e) => this.$_infoCursorChanged(e) }),
      h('div', {
        class: 'cursorDate',
        style: { top: `${this.infoCursor.pos}px` } },
        this.infoCursor.date),
      h('header',
        h('span', { class: 'title'}, [
          h('span', { class: 'icon' }, this.repData.icon ? this.repData.icon : 'T'),
          h('span', this.repData.title)])),
      h('div', { class: 'flexRow' }, [
        this.rep.countries,
        this.rep.drives]),
      this.info]);
  }
}