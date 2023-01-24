export default {
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

  template: `
    <div
      class="infoCursor"
      @mousedown="canDrag = true"
      @touchstart="canDrag = true"
      @mouseup="canDrag = false"
      @touchend="canDrag = false"
      @mousemove="$_dragCursor($event)"
      @touchmove="$_dragCursor($event)"
      :style="{ top: top + 'px' }">

      <svg height="20" width="20">
        <polygon points="0,0 20,10 0,20" />
      </svg>

    </div>`
}