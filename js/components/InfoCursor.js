const { h } = Vue;

export default {
  name: 'InfoCursor',

  props: {
    min: { type: Number },
    max: { type: Number },
    pos: { type: Number }
  },

  emits: ['changed'],

  data () {
    return {
      canDrag: false
    }
  },

  computed: {
    top() {
      const min = this.max + this.min - 20;
      let top = this.pos - 10;

      if (top < this.min)
        top = this.min;
      else if (top > min)
        top = min;

      return top;
    }
  },

  methods: {
    $_dragCursor(e) {
      if (!this.canDrag) return;

      this.$emit('changed', e.pageY
        ? e.pageY
        : e.touches[0].pageY);
    }
  },

  render() {
    return h('div', {
      class: 'infoCursor',
      style: { top: `${this.top}px` },
      onMousedown: () => this.canDrag = true,
      onTouchstart: () => this.canDrag = true,
      onMouseup: () => this.canDrag = false,
      onTouchend: () => this.canDrag = false,
      onMousemove: (e) => this.$_dragCursor(e),
      onTouchmove: (e) => this.$_dragCursor(e)},
      h('svg', { height: 20, width: 20 },
        h('polygon', { points: '0,0 20,10 0,20' })));
  }
}