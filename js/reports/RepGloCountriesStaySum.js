const { h } = Vue;

export default {
  props: {
    repData: { type: Object }
  },

  data () {
    return {
      dataReady: false,
      countries: []
    }
  },

  computed: {
    rep() {
      if (!this.dataReady) return [];

      const ch = [],
            degPerDay = 360 / this.countries.reduce((acc, cur) => acc + cur.days, 0),
            degPerColor = Math.round(360 / this.countries.length),
            hw = this.$refs.repDiv.clientWidth / 2;
      let lastAngle = 0,
          lastColor = 0,
          top = hw * 2,
          daysSum = 0;

      for (const country of this.countries) {
        const endAngle = lastAngle + (degPerDay * country.days),
              color = `hsl(${lastColor}, 50%, 40%)`;

        ch.push(h('path', { fill: color, d: this.describeArc(hw, hw, hw - 20, lastAngle, endAngle) }));
        ch.push(h('rect', { x: 20, y: top, height: 20, width: 30, fill: color }));
        ch.push(h('text', { x: 55, y: top + 11 }, [
          country.name,
          h('tspan', ` ${daysToYMD(country.days, true)}`)]));

        lastAngle = endAngle;
        lastColor += degPerColor;
        top += 22;
        daysSum += country.days;
      }

      ch.push(h('circle', { cx: hw, cy: hw, r: hw / 2, fill: '#33373A' }));
      ch.push(h('text', { x: hw, y: hw - 20, class: 'daysSum' }, daysSum));
      ch.push(h('text', { x: hw, y: hw + 30, class: 'daysSumSpread' }, daysToYMD(daysSum)));

      return h('svg', {
        xmlns: 'http://www.w3.org/2000/svg',
        width: hw * 2,
        height: top }, ch);
    }
  },

  async created() {
    this.countries = await this.getDataFromDb();
    this.dataReady = true;
  },

  methods: {
    async getDataFromDb() {
      const countriesStay = await this.db.data(this.db.stores.GLO_CountriesStay);
      const countries = (await this.db.data(this.db.stores.GLO_Countries))
        .map(country => {
          const days = countriesStay
            .filter(stay => stay.countryId === country.id)
            .map(stay => {
              if (!stay.dateTo)
                stay.dateTo = new Date(Date.now()).toYMD();
              if (!stay.days)
                stay.days = numberOfDaysBetween(stay.dateFrom, stay.dateTo);
      
              return stay; })
            .reduce((acc, cur) => acc + cur.days, 0);
    
          return { name: country.name, days };
        });
  
      return countries
        .filter(x => x.days)
        .orderBy('days', false);
    },

    polarToCartesian(centerX, centerY, radius, angleInDegrees) {
      const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;

      return {
        x: (centerX + (radius * Math.cos(angleInRadians))).round(2),
        y: (centerY + (radius * Math.sin(angleInRadians))).round(2)
      };
    },

    describeArc(x, y, radius, startAngle, endAngle) {
      const start = this.polarToCartesian(x, y, radius, endAngle),
            end = this.polarToCartesian(x, y, radius, startAngle),
            largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

      return [
        'M', x, y,
        'L', start.x, start.y,
        'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
        'Z'
      ].join(' ');
    }
  },

  render() {
    return h('div', {
      class: 'repGloCountriesStaySum flexCol flexOne',
      ref: 'repDiv' },
      h('header',
        h('span', { class: 'title rborder'}, [
          h('span', { class: 'icon' }, this.repData.icon ? this.repData.icon : 'T'),
          h('span', this.repData.title)])),
      h('div', { class: 'flexOne' }, this.rep));
  }
}