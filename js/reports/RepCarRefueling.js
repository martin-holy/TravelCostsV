import custom from './../custom.js';

const { h } = Vue;

export default {
  props: {
    repData: { type: Object }
  },

  data () {
    return { }
  },

  async created() {
    const data = Array.from(await this.db.data(this.db.stores.CAR_Refueling)).orderBy('kmTotal');
    this.$_render(data);
  },

  methods: {
    $_render(data) {
      const pxPerL = 40,
            pxPerKm = 0.05,
            leftOffset = -80,
            topOffset = 20;

      let arrCoords = [],
          startKm = data[0].kmTotal;

      for (let ref of data) {
        if (ref.consumption === 0) continue;
        arrCoords.push({
          date: ref.date,
          kmTotal: ref.kmTotal,
          consumption: ref.consumption,
          x: Math.ceil(leftOffset + (pxPerL * ref.consumption)),
          y: Math.ceil(topOffset + ((ref.kmTotal - startKm) * pxPerKm))
        });
      }

      //Init Canvas
      const canvas = this.$refs.canvas,
            ctx = canvas.getContext('2d'),
            dpr = window.devicePixelRatio;
      let width = 400,
          height = Math.ceil((arrCoords[arrCoords.length - 1].kmTotal - startKm) * pxPerKm) + 2 * topOffset;

      width = Math.ceil(width * dpr);
      height = Math.ceil(height * dpr);
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${width / dpr}px`;
      canvas.style.height = `${height / dpr}px`;
      ctx.scale(dpr, dpr);

      ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.font = '12px sans-serif';

      // Draw Graph
      ctx.beginPath();
      ctx.moveTo(leftOffset, topOffset);
      for (const rec of arrCoords)
        ctx.lineTo(rec.x, rec.y);
      ctx.lineTo(leftOffset, arrCoords[arrCoords.length - 1].y);
      ctx.fill();
      ctx.stroke();

      // Draw Consumptions texts
      let lastBottom = 0;
      for (const rec of arrCoords) {
        let textTop = rec.y - 8;
        if (textTop < lastBottom)
          textTop = lastBottom;
        lastBottom = textTop + 16;

        ctx.beginPath();
        ctx.moveTo(rec.x, rec.y);
        ctx.lineTo(rec.x + 20, textTop + 8);
        ctx.stroke();
        // consumption
        let consRectWidth = ctx.measureText(rec.consumption).width + 4;
        custom.canvas.drawRect(ctx, rec.x + 20, textTop, consRectWidth, 16, 'rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 1)');
        custom.canvas.drawText(ctx, rec.consumption, rec.x + 22, textTop + 12, 'rgba(255, 255, 255, 1)');
        // date
        custom.canvas.drawRect(ctx, rec.x + consRectWidth + 24, textTop, ctx.measureText(rec.date.substring(0, 7)).width + 4, 16, 'rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 1)');
        custom.canvas.drawText(ctx, rec.date.substring(0, 7), rec.x + consRectWidth + 26, textTop + 12, 'rgba(255, 255, 255, 1)');
      }

      // Draw km
      const kmFrom = Math.ceil(arrCoords[0].kmTotal / 1000) - 1,
            kmTo = Math.ceil(arrCoords[arrCoords.length - 1].kmTotal / 1000);

      ctx.font = '16px sans-serif';
      ctx.strokeStyle = 'rgba(255, 255, 255, 1)';

      for (let km = kmFrom; km < kmTo; km++) {
        const y = (((km * 1000) - startKm) * pxPerKm) + topOffset;
        ctx.beginPath();
        ctx.moveTo(10, y);
        ctx.lineTo(130, y);
        ctx.stroke();
        custom.canvas.drawText(ctx, km * 1000, 20, y - 2, 'rgba(255, 255, 255, 1)');
      }
    }
  },

  render() {
    return h('div', { class: 'repCarDrives flexCol flexOne' }, [
      h('header',
        h('span', { class: 'title'}, [
          h('span', { class: 'icon' }, this.repData.icon ? this.repData.icon : 'T'),
          h('span', this.repData.title)])),
      h('div', { class: 'flexOne' },
        h('canvas', { ref: 'canvas' }))]);
  }
}