import common from './../common.js';

export default {
  data () {
    return { }
  },

  created() {
    this.db.data(this.db.stores.CAR_Drives)
      .then(res => {
        const drives = Array.from(res).orderBy('date', false),
              data = [];
        let lastDate = new Date().addDays(1).toYMD();
    
        for (const drv of drives) {
          data.push({
            date: drv.date,
            name: drv.desc,
            km: drv.km,
            days: common.numberOfDaysBetween({ dateFrom: drv.date, dateTo: lastDate }) - 1
          });
          lastDate = drv.date;
        }

        this.$_render(data);
      });
  },

  methods: {
    $_render(data) {
      // get max km
      let maxKm = 0;
      for (const drv of data)
        if (maxKm < drv.km)
          maxKm = drv.km;

      //Init Canvas
      const canvas = this.$refs.canvas,
            ctx = canvas.getContext('2d'),
            dpr = window.devicePixelRatio;
      let width = 800,
          height = data.length * 20,
          lastBottom = 0;

      width = Math.ceil(width * dpr);
      height = Math.ceil(height * dpr);
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${width / dpr}px`;
      canvas.style.height = `${height / dpr}px`;
      ctx.scale(dpr, dpr);

      //Draw Drives
      const pxPerDay = 2,
            pxPerKm = 0.5,
            center = maxKm * pxPerKm;

      for (const drv of data) {
        // name
        //app.canvas.drawText(ctx, drv.name, center - Math.ceil(ctx.measureText(drv.name).width / 2), lastBottom + 13, 'rgba(255, 255, 255, 1)');
        //lastBottom += 20;
        // km
        common.canvas.drawRect(ctx, center - (drv.km * pxPerKm), lastBottom, drv.km * pxPerKm, 20, 'rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 1)');
        // km text
        //app.canvas.drawRect(ctx, drvsLeftOffset, textTop, ctx.measureText(drv.desc).width + 4, drvTextBoxHeight, 'rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 1)');
        common.canvas.drawText(ctx, drv.km, center - (drv.km * pxPerKm) - ctx.measureText(drv.km).width - 4, lastBottom + 13, 'rgba(255, 255, 255, 1)');
        // days
        common.canvas.drawRect(ctx, center + 10, lastBottom, drv.days * pxPerDay, 20, 'rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 1)');
        // days text
        common.canvas.drawRect(ctx, center + (drv.days * pxPerDay) + 14, lastBottom + 2, ctx.measureText(drv.days).width + 5, 14, 'rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 1)');
        common.canvas.drawText(ctx, drv.days + '   ' + drv.name, center + (drv.days * pxPerDay) + 4 + 12, lastBottom + 13, 'rgba(255, 255, 255, 1)');
        lastBottom += 20;
      }
    }
  },

  template: `
    <canvas
      ref="canvas">
    </canvas>`
}