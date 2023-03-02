import InfoCursor from '../components/InfoCursor.js';

const { h } = Vue;

export default {
  name: 'YearGroupsRep',

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
            yearGroupsData = this.$_getYearGroupsData(yearFrom, yearTo, this.groupsInYear)
      
      this.$_mapDateData(yearGroupsData, this.records, this.sumPropName, this.groupsInYear);
      
      return yearGroupsData;
    },

    rep() {
      const ic = [],
            dc = [],
            typePxPerEur = 1,
            space = 2,
            rowHeight = 20,
            halfRow = rowHeight / 2,
            yearHeight = (this.groupsInYear * (rowHeight + space)) - space,
            gSumRectX = (2 * rowHeight) + (3 * space),
            gSumRectWidth = 2 * (rowHeight + space),
            svgHeight = (this.groupedRecords.length * (yearHeight + space));
      let chWidth = 0;

      for (let i = 0; i < this.groupedRecords.length; i++) {
        // Years
        const year = this.groupedRecords[i],
            yRectY = (i * (yearHeight + space)) + space,
            yTextY = yRectY + ((yearHeight - space) / 2),
            yRect = { x: space, y: yRectY },
            yText = { y: yTextY, class: 'yearName' };

        if (this.groupsInYear === 1) {
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

        ic.push(h('rect', yRect));
        ic.push(h('text', yText, year.name));

        // Groups
        for (let j = 0; j < year.groups.length; j++) {
          const group = year.groups[j],
                gRectY = yRectY + (j * (rowHeight + space));

          if (this.groupsInYear !== 1) {
            const gRectX = rowHeight + (2 * space),
                  gRect = { x: gRectX, y: gRectY, width: rowHeight, height: rowHeight },
                  gText = { x: gRectX + halfRow, y: gRectY + halfRow };
            
            ic.push(h('rect', gRect));
            ic.push(h('text', gText, group.name));
          }

          // Types
          let tRectX = 0,
              tSum = 0,
              tSumWidth = 0,
              types = group.types
                .filter(x => this.recTypes.includes(x.type.id))
                .orderBy('type.name');

          for (const type of types) {
            const tWidth = (typePxPerEur === 1
                    ? type.sum
                    : type.sum * typePxPerEur).round(0);

            if (tWidth > 0) {
              dc.push(h('rect', { x: tRectX, y: gRectY, width: tWidth, height: rowHeight, fill: type.type.bgColor }));
              tRectX += tWidth;
            }

            tSum += type.sum;
            tSumWidth += tWidth;
          }

          if (chWidth < tSumWidth)
            chWidth = tSumWidth;

          // Group Sum
          ic.push(h('rect', { x: gSumRectX, y: gRectY, width: gSumRectWidth, height: rowHeight }));
          ic.push(h('text', { x: gSumRectX + (gSumRectWidth / 2), y: gRectY + halfRow, class: 'partSum' },
            `${tSum.round(0)}${this.sumSuffix}`));
        }
      }

      return {
        infoColumn: h('svg', {
          xmlns: 'http://www.w3.org/2000/svg',
          class: 'infoColumn',
          width: (4 * space) + (2 * rowHeight) + gSumRectWidth,
          height: svgHeight }, ic),
        dataColumn: h('svg', {
          xmlns: 'http://www.w3.org/2000/svg',
          width: chWidth,
          height: svgHeight }, dc)};
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
      const types = this.cursorGroup.types
        .filter(x => this.recTypes.includes(x.type.id))
        .orderBy('type.name');

      return h('ul', types.map(type => {
        return h('li', { style: { backgroundColor: type.type.bgColor }}, [
          h('div', { class: 'typeHeader' }, [
            h('span', type.type.name),
            h('span', { class: 'eurText greyBox' }, `${type.sum.round(2)}€`)]),
          h('ul', type.data.map(rec => {
            return h('li', { class: 'greyBox spanRow' }, [
              h('span', rec.date.split('-').join('.')),
              h('span', { class: 'eurText' }, `${rec.eur.round(2)}€`),
              rec.desc
                ? h('span', rec.desc)
                : null])}))])}));
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
    $_onContentScroll() {
      this.scrollTop = this.$refs.content.scrollTop;
    },

    $_infoCursorChanged(pos) {
      this.infoCursor.pos = pos;
    },

    $_getYearGroupsData(yearFrom, yearTo, groupsInYear) {
      const data = [];
    
      for (let y = yearTo; y > yearFrom - 1; y--) {
        const year = { name: y, groups: [] };
        
        for (let g = groupsInYear; g > 0; g--)
          year.groups.push({ name: g, sum: 0, types: [] });
    
        data.push(year);
      }
    
      return data;
    },
    
    $_mapDateData(data, records, sumProp, groupsInYear) {
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
    }
  },

  render() {
    return h('div', { class: 'yearGroupsRep flexCol flexOne' }, [
      h(InfoCursor, {
        min: this.infoCursor.min,
        max: this.infoCursor.max,
        pos: this.infoCursor.pos,
        onChanged: (e) => this.$_infoCursorChanged(e)}),
      h('div', {
        class: 'flexRow flexOne',
        ref: 'content',
        onScroll: () => this.$_onContentScroll() }, [
        this.rep.infoColumn,
        this.rep.dataColumn]),
      h('div', { class: 'footer' },
        this.$slots.footer
          ? this.$slots.footer({ cursorGroup: this.cursorGroup })
          : this.repDetail)]);
  }
}