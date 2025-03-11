Component({
  properties: {
    chapter: {
      type: Object,
      value: { title: '', content: '' }
    },
    fontSize: {
      type: Number,
      value: 32
    },
    theme: {
      type: String,
      value: 'light'
    }
  },

  methods: {
    onScroll() {
      this.triggerEvent('scroll');
    }
  }
}); 