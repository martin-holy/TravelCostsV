import common from './../common.js';

export default {
  data () {
    return {
      dataReady: false,
      countries: []
    }
  },

  computed: {
    rep() {
      const svgRects = [],
            svgNameTexts = [],
            svgPaths = [],
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

        svgRects.push({ x: 20, y: top, height: 20, width: 30, fill: color });
        svgNameTexts.push({ x: 55, y: top + 11, text: country.name, days: common.daysToYMD(country.days, true) });
        svgPaths.push({ fill: color, d: this.describeArc(hw, hw, hw - 20, lastAngle, endAngle) });

        lastAngle = endAngle;
        lastColor += degPerColor;
        top += 22;
        daysSum += country.days;
      }

      return {
        width: hw * 2,
        height: top,
        circle: { cx: hw, cy: hw, r: hw / 2, fill: '#33373A' },
        sumText: { x: hw, y: hw - 20, class: 'daysSum', text: daysSum },
        sumTextSpread: { x: hw, y: hw + 30, class: 'daysSumSpread', text: common.daysToYMD(daysSum) },
        svgRects: svgRects,
        svgNameTexts: svgNameTexts,
        svgPaths: svgPaths
      };
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
                stay.days = common.numberOfDaysBetween(stay);
      
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

  template: `
    <div
      class="repGloCountriesStaySum"
      ref="repDiv">

      <svg
        xmlns="http://www.w3.org/2000/svg"
        v-if="dataReady"
        :width="rep.width"
        :height="rep.height">

        <rect
          v-for="(rec, index) in rep.svgRects"
          :key="index"
          :x="rec.x"
          :y="rec.y"
          :width="rec.width"
          :height="rec.height"
          :fill="rec.fill" />

        <text
          v-for="(rec, index) in rep.svgNameTexts"
          :key="index"
          :x="rec.x"
          :y="rec.y">
          {{ rec.text }} <tspan>{{ rec.days }}</tspan>
        </text>

        <path
          v-for="(rec, index) in rep.svgPaths"
          :key="index"
          :fill="rec.fill"
          :d="rec.d" />

        <circle
          :cx="rep.circle.cx"
          :cy="rep.circle.cy"
          :r="rep.circle.r"
          :fill="rep.circle.fill" />

        <text
          :x="rep.sumText.x"
          :y="rep.sumText.y"
          :class="rep.sumText.class">
          {{ rep.sumText.text }}
        </text>

        <text
          :x="rep.sumTextSpread.x"
          :y="rep.sumTextSpread.y"
          :class="rep.sumTextSpread.class">
          {{ rep.sumTextSpread.text }}
        </text>
      </svg>

    </div>`
}