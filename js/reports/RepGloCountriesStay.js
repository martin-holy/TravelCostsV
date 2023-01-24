import common from './../common.js';
import InfoCursor from './../controls/InfoCursor.js';

export default {
  components: {
    InfoCursor
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
      const svgCRects = [],
            svgCTexts = [],
            svgCLines = [],
            svgCImages = [],
            svgDRects = [],
            svgDTexts = [],
            svgDLines = [];
      let top = 0,
          nameTop = 0,
          daysTotal = 0,
          svgCHeight = 0,
          svgDHeight = 0;
  
      // Countries Stay
      for (const stay of this.countries) {
        const height = stay.days * this.pxPerDayCountries,
              halfTop = top + (height / 2);
  
        nameTop = halfTop - nameTop < 25
          ? nameTop + 25
          : halfTop;

        svgCTexts.push({ x: 85, y: nameTop, class: 'stayDays', text: stay.days });
        svgCLines.push({ x1: 30, y1: halfTop, x2: 52, y2: nameTop });
        svgCImages.push({ x: 50, y: nameTop - 10, height: 21, flag: stay.code});
        svgCRects.push({ x: 10, y: top, width: 20, height: height });
  
        top += height;
        daysTotal += stay.days;
      }

      svgCHeight = top;
      svgDHeight = daysTotal * this.pxPerDayDrives;
  
      // Drives
      top = 0;
      nameTop = 0;

      for (const drive of this.drives) {
        const height = drive.days * this.pxPerDayDrives,
              halfTop = top + (height / 2);
  
        nameTop = halfTop - nameTop < 15
          ? nameTop + 15
          : halfTop;

        svgDTexts.push({ x: 40, y: nameTop, class: 'driveName', name: drive.name, days: drive.days });
        svgDLines.push({ x1: 20, y1: halfTop, x2: 38, y2: nameTop });
        svgDRects.push({ x: 0, y: top, width: 20, height: height });
  
        top += height;
      }

      return {
        cWidth: 120,
        cHeight: svgCHeight,
        dWidth: 250,
        dHeight: svgDHeight,
        cRects: svgCRects,
        cTexts: svgCTexts,
        cLines: svgCLines,
        cImages: svgCImages,
        dRects: svgDRects,
        dTexts: svgDTexts,
        dLines: svgDLines
      };
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
            country = getRec(this.countries, this.infoForDays),
            countryCode = country ? country.code : '';
  
      if (country) {
        ul.push({ text: `${df(country.dateFrom)} - ${df(country.dateTo)} - `, span: `${country.days} days` });
        ul.push({ text: country.name });
      }
  
      if (drive) {
        ul.push({ text: `${df(drive.dateFrom)} - ${df(drive.dateTo)} - `, span: `${drive.days} days` });
        ul.push({ text: `${drive.name} `, span: `${drive.km} km` });
      }

      return {
        flag: countryCode,
        ul: ul
      };
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
            : common.numberOfDaysBetween(o);

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

          o.days = common.numberOfDaysBetween(o) - 1;
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

  template: `
    <div
      class="repGloCountriesStay flexColContainer">

      <InfoCursor
        :min="infoCursor.min"
        :max="infoCursor.max"
        :pos="infoCursor.pos"
        @changed="$_infoCursorChanged($event)">
      </InfoCursor>

      <div
        class="cursorDate"
        :style="{ top: infoCursor.pos + 'px' }">
        {{ infoCursor.date }}
      </div>
      
      <div class="mainContent">

        <div
          ref="countries"
          @scroll="$_onScroll($event)">

          <svg
            xmlns="http://www.w3.org/2000/svg"
            v-if="dataReady"
            :width="rep.cWidth"
            :height="rep.cHeight">

            <rect
              v-for="(rec, index) in rep.cRects"
              :key="index"
              :x="rec.x"
              :y="rec.y"
              :width="rec.width"
              :height="rec.height" />

            <text
              v-for="(rec, index) in rep.cTexts"
              :key="index"
              :x="rec.x"
              :y="rec.y"
              :class="rec.class">
              {{ rec.text }}
            </text>

            <line
              v-for="(rec, index) in rep.cLines"
              :key="index"
              :x1="rec.x1"
              :y1="rec.y1"
              :x2="rec.x2"
              :y2="rec.y2" />

            <image
              v-for="(rec, index) in rep.cImages"
              :key="index"
              :x="rec.x"
              :y="rec.y"
              :height="rec.height"
              :href="'./img/flags/' + rec.flag + '.png'" />

          </svg>
        </div>

        <div
          ref="drives"
          @scroll="$_onScroll($event)">

          <svg
            xmlns="http://www.w3.org/2000/svg"
            v-if="dataReady"
            :width="rep.dWidth"
            :height="rep.dHeight">

            <rect
              v-for="(rec, index) in rep.dRects"
              :key="index"
              :x="rec.x"
              :y="rec.y"
              :width="rec.width"
              :height="rec.height" />

            <text
              v-for="(rec, index) in rep.dTexts"
              :key="index"
              :x="rec.x"
              :y="rec.y"
              :class="rec.class">
              {{ rec.name }} <tspan>{{ rec.days }}</tspan>
            </text>

            <line
              v-for="(rec, index) in rep.dLines"
              :key="index"
              :x1="rec.x1"
              :y1="rec.y1"
              :x2="rec.x2"
              :y2="rec.y2" />

          </svg>
        </div>

      </div>

      <div class="footer">
        <div>
          <img
            v-if="info.flag"
            :src="'./img/flags/' + info.flag + '.png'" />
        </div>
        <ul>
          <li
            v-for="(li, index) in info.ul"
            :key="index">
            {{ li.text }}
            <span
              v-if="li.span">
              {{ li.span }}
            </span>
          </li>
        </ul>
      </div>
    </div>`
}