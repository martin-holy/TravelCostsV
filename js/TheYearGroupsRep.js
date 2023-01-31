import InfoCursor from './controls/InfoCursor.js';

export default {
  components: {
    InfoCursor
  },

  props: {
    groupsInYear: { type: Number },
    records: { type: Array },
    recTypes: { type: Array },
    sumPropName: { type: String },
    sumSuffix: { type: String }
  },

  data () {
    return {
      scrollTop: 0,
      infoCursor: {
        min: 0,
        max: 0,
        pos: 0
      },
    }
  },
  
  computed: {
    groupedRecords() {
      const yearFrom = this.records[this.records.length - 1].year,
            yearTo = this.records[0].year,
            yearGroupsData = this.getYearGroupsData(yearFrom, yearTo, this.groupsInYear)
      
      this.mapDateData(yearGroupsData, this.records, this.sumPropName, this.groupsInYear);
      
      return yearGroupsData;
    },

    rep() {
      return this.getYearGroupsRep(
        this.groupedRecords, 
        this.groupsInYear,
        this.recTypes,
        2,
        20);
    },

    cursorGroup() {
      const cursorPos = this.infoCursor.pos - this.infoCursor.min + this.scrollTop,
            space = 2,
            rowHeight = 20,
            yearHeight = (this.groupsInYear * (rowHeight + space)),
            yearIndex = Math.floor(cursorPos / yearHeight),
            group = this.groupsInYear - Math.floor((cursorPos - (yearIndex * yearHeight)) / (rowHeight + space));

      return this.groupedRecords[yearIndex].groups
        .find(g => g.name === group);
    },

    repDetail() {
      return this.cursorGroup.types
        .filter(x => this.recTypes.includes(x.type.id))
        .orderBy('type.name');
    }
  },

  watch: {
    groupsInYear() {
      this.scrollTop = 0;
      this.$refs.content.scrollTop = 0;
      this.infoCursor.pos = this.infoCursor.min;
    }
  },

  mounted() {
    this.infoCursor.min = this.$refs.content.offsetTop;
    this.infoCursor.max = this.$refs.content.clientHeight;
    this.infoCursor.pos = this.infoCursor.min + 10;
  },

  methods: {
    onContentScroll() {
      this.scrollTop = this.$refs.content.scrollTop;
    },

    $_infoCursorChanged(pos) {
      this.infoCursor.pos = pos;
    },

    getYearGroupsData(yearFrom, yearTo, groupsInYear) {
      const data = [];
    
      for (let y = yearTo; y > yearFrom - 1; y--) {
        const year = { name: y, groups: [] };
        
        for (let g = groupsInYear; g > 0; g--)
          year.groups.push({ name: g, sum: 0, types: [] });
    
        data.push(year);
      }
    
      return data;
    },
    
    mapDateData(data, records, sumProp, groupsInYear) {
      for (const rec of records) {
        const groupId = Math.trunc((rec.month - 1) / (12 / groupsInYear)) + 1,
              group = data.find(y => y.name === rec.year)
                      .groups.find(g => g.name === groupId);
    
        let type = group.types.find(x => x.type.id === rec.type.id);
    
        if (!type) {
          type = { type: rec.type, sum: 0, data: [] };
          group.types.push(type);
        }
    
        group.sum += rec[sumProp];
        type.sum += rec[sumProp];
        type.data.push(rec);
      }
    },
    
    getYearGroupsRep(yearGroupsData, groupsInYear, recTypes, space, rowHeight) {
      const yearRects = [],
            yearTexts = [],
            groupRects = [],
            groupTexts = [],
            groupSumRects = [],
            groupSumTexts = [],
            typeRects = [],
            typePxPerEur = 1,
            halfRow = rowHeight / 2,
            yearHeight = (groupsInYear * (rowHeight + space)) - space,
            gSumRectX = (2 * rowHeight) + (3 * space),
            gSumRectWidth = 2 * (rowHeight + space),
            svgHeight = (yearGroupsData.length * (yearHeight + space));
      let chWidth = 0;
    
      for (let i = 0; i < yearGroupsData.length; i++) {
        // Years
        const year = yearGroupsData[i],
            yRectY = (i * (yearHeight + space)) + space,
            yTextY = yRectY + ((yearHeight - space) / 2),
            yRect = { x: space, y: yRectY },
            yText = { y: yTextY, text: year.name };
    
        if (groupsInYear === 1) {
          yRect.width = (2 * rowHeight) + space;
          yRect.height = rowHeight;
          yText.x = rowHeight + space;
        }
        else {
          yRect.width = rowHeight;
          yRect.height = yearHeight;
          yText.x = halfRow + space;
          yText.transform = `rotate(270,${halfRow + space},${yTextY})`;
        }
    
        yearRects.push(yRect);
        yearTexts.push(yText);
    
        // Groups
        for (let j = 0; j < year.groups.length; j++) {
          const group = year.groups[j],
                gRectY = yRectY + (j * (rowHeight + space));
    
          if (groupsInYear !== 1) {
            const gRectX = rowHeight + (2 * space),
                  gRect = { x: gRectX, y: gRectY, width: rowHeight, height: rowHeight },
                  gText = { x: gRectX + halfRow, y: gRectY + halfRow, text: group.name };
            
            groupRects.push(gRect);
            groupTexts.push(gText);
          }
    
          // Types
          let tRectX = 0,
              tSum = 0,
              tSumWidth = 0,
              types = group.types
                .filter(x => recTypes.includes(x.type.id))
                .orderBy('type.name');

          for (const type of types) {
            const tWidth = (typePxPerEur === 1
                    ? type.sum
                    : type.sum * typePxPerEur).round(0);
    
            if (tWidth > 0) {
              typeRects.push({ x: tRectX, y: gRectY, width: tWidth, height: rowHeight, fill: type.type.bgColor });
              tRectX += tWidth;
            }
    
            tSum += type.sum;
            tSumWidth += tWidth;
          }
    
          if (chWidth < tSumWidth)
            chWidth = tSumWidth;
    
          // Group Sum
          groupSumRects.push({ x: gSumRectX, y: gRectY, width: gSumRectWidth, height: rowHeight });
          groupSumTexts.push({ x: gSumRectX + (gSumRectWidth / 2), y: gRectY + halfRow, text: `${tSum.round(0)}${this.sumSuffix}` });
        }
      }
    
      return {
        ygWidth: (4 * space) + (2 * rowHeight) + gSumRectWidth,
        chWidth: chWidth,
        height: svgHeight,
        yearRects: yearRects,
        yearTexts: yearTexts,
        groupRects: groupRects,
        groupTexts: groupTexts,
        groupSumRects: groupSumRects,
        groupSumTexts: groupSumTexts,
        typeRects: typeRects
      };
    }
  },

  template: `
    <div class="theYearGroupsRep flexColContainer">

      <InfoCursor
        :min="infoCursor.min"
        :max="infoCursor.max"
        :pos="infoCursor.pos"
        @changed="$_infoCursorChanged($event)">
      </InfoCursor>

      <div
        class="mainContent"
        ref="content"
        @scroll="onContentScroll">

        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="infoColumn"
          :width="rep.ygWidth"
          :height="rep.height">

          <rect
            v-for="(rec, index) in rep.yearRects"
            :key="index"
            :x="rec.x"
            :y="rec.y"
            :width="rec.width"
            :height="rec.height" />

          <text
            v-for="(rec, index) in rep.yearTexts"
            :key="index"
            :x="rec.x"
            :y="rec.y"
            :transform="rec.transform"
            class="yearName">
            {{ rec.text }}
          </text>

          <rect
            v-for="(rec, index) in rep.groupRects"
            :key="index"
            :x="rec.x"
            :y="rec.y"
            :width="rec.width"
            :height="rec.height" />

          <text
            v-for="(rec, index) in rep.groupTexts"
            :key="index"
            :x="rec.x"
            :y="rec.y">
            {{ rec.text }}
          </text>

          <rect
            v-for="(rec, index) in rep.groupSumRects"
            :key="index"
            :x="rec.x"
            :y="rec.y"
            :width="rec.width"
            :height="rec.height" />

          <text
            v-for="(rec, index) in rep.groupSumTexts"
            :key="index"
            :x="rec.x"
            :y="rec.y"
            class="partSum">
            {{ rec.text }}
          </text>
        </svg>

        <div class="dataColumn">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            :width="rep.chWidth"
            :height="rep.height">
            <rect
              v-for="(rec, index) in rep.typeRects"
              :key="index"
              :x="rec.x"
              :y="rec.y"
              :width="rec.width"
              :height="rec.height"
              :fill="rec.fill" />
          </svg>
        </div>

      </div>

      <div class="footer">
        <slot
          :cursorGroup="cursorGroup">
          <ul>
            <li
              v-for="type in repDetail"
              :key="type.type.id"
              :style="{ backgroundColor: type.type.bgColor }">

              <div class="typeHeader">
                <span>
                  {{ type.type.name }}
                </span>
                <span class="eurText greyBox">
                  {{ type.sum.round(2) }}€
                </span>
              </div>

              <ul>
                <li
                  v-for="(rec, index) in type.data"
                  class="greyBox spanRow">

                  <span>
                    {{ rec.date.split('-').join('.') }}
                  </span>
                  <span class="eurText">
                    {{ rec.eur.round(2) }}€
                  </span>
                  <span
                    v-if="rec.desc">
                    {{ rec.desc }}
                  </span>
                </li>
              </ul>
            </li>
          </ul>
        </slot>
      </div>
    </div>`
}