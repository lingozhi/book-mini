Component({
  properties: {
    chapter: {
      type: Object,
      value: { title: '', filePath: '' }
    },
    isPlaying: {
      type: Boolean,
      value: false
    }
  },

  methods: {
    // 组件方法可以在父页面中调用
    play() {
      // 播放逻辑由父页面控制
    },
    
    pause() {
      // 暂停逻辑由父页面控制
    }
  }
}); 