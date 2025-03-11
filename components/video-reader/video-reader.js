Component({
  properties: {
    chapter: {
      type: Object,
      value: { title: '', filePath: '' }
    },
    videoUrl: {
      type: String,
      value: ''
    }
  },

  data: {
    isFullScreen: false,
    isLoading: true,
    hasError: false,
    errorMsg: '',
    isPlaying: false
  },

  methods: {
    onVideoReady() {
      this.videoContext = wx.createVideoContext('reader-video', this);
      this.triggerEvent('videoReady', { videoContext: this.videoContext });
      
      // 自动播放视频
      setTimeout(() => {
        this.videoContext.play();
        
        // 强制隐藏加载状态
        setTimeout(() => {
          if (this.data.isLoading) {
            console.log('强制隐藏加载状态');
            this.setData({
              isLoading: false
            });
          }
        }, 2000);
      }, 500);
      
      // 添加加载超时处理
      this.loadingTimeout = setTimeout(() => {
        // 如果5秒后仍然显示加载中，尝试重新加载
        if (this.data.isLoading) {
          console.log('视频加载超时，尝试重新加载');
          this.retryVideo();
        }
      }, 5000);
    },
    
    play() {
      if (this.videoContext) {
        this.videoContext.play();
      }
    },
    
    pause() {
      if (this.videoContext) {
        this.videoContext.pause();
      }
    },
    
    onFullScreenChange(e) {
      this.setData({
        isFullScreen: e.detail.fullScreen
      });
      
      // 通知父组件全屏状态变化
      this.triggerEvent('fullscreenchange', { 
        fullScreen: e.detail.fullScreen 
      });
    },
    
    onVideoLoad() {
      this.setData({
        isLoading: false,
        hasError: false
      });
    },
    
    onVideoError(e) {
      console.error('视频加载错误:', e);
      this.setData({
        isLoading: false,
        hasError: true,
        errorMsg: '视频加载失败，请检查网络连接'
      });
      
      // 通知父组件视频加载错误
      this.triggerEvent('videoerror', e.detail);
    },
    
    // 重试加载视频
    retryVideo() {
      this.setData({
        isLoading: true,
        hasError: false
      });
      
      setTimeout(() => {
        if (this.videoContext) {
          this.videoContext.play();
        }
      }, 1000);
    },

    onVideoPlay() {
      console.log('视频开始播放');
      this.setData({
        isLoading: false,
        hasError: false,
        isPlaying: true
      });
      
      // 通知父组件
      this.triggerEvent('statechange', { isPlaying: true });
    },

    onVideoPause() {
      console.log('视频暂停');
      this.setData({
        isPlaying: false
      });
      
      // 通知父组件
      this.triggerEvent('statechange', { isPlaying: false });
    },

    onVideoEnd() {
      console.log('视频播放结束');
      this.setData({
        isPlaying: false
      });
      
      // 通知父组件视频结束，可以自动播放下一个
      this.triggerEvent('ended');
    },

    // 修改togglePlay方法
    togglePlay() {
      if (this.videoContext) {
        if (this.data.isPlaying) {
          this.videoContext.pause();
        } else {
          this.videoContext.play();
        }
      }
    },

    // 添加上一个和下一个视频方法
    prevVideo() {
      this.triggerEvent('prev');
    },

    nextVideo() {
      this.triggerEvent('next');
    },

    // 在组件生命周期函数中清除超时计时器
    detached() {
      if (this.loadingTimeout) {
        clearTimeout(this.loadingTimeout);
      }
    }
  }
}); 