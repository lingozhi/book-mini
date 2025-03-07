Page({
  data: {
    bookTitle: '',
    chapter: {
      title: '',
      content: ''
    },
    currentChapter: 1,
    totalChapters: 100,
    progress: 0,
    showControls: false,
    theme: 'light',
    fontSize: 32,
    showFontPanel: false,
    showCatalog: false,
    chapters: [], // 章节列表
    contentType: 'text', // 'text' | 'audio' | 'video' | 'collection'
    audioContext: null,
    videoContext: null,
    isPlaying: false,
    currentTime: '00:00',
    duration: '30:00',
    collection: [], // 图书集合
  },

  onLoad(options) {
    const { id, type, chapter } = options;
    this.bookId = id; // Store book ID for later use
    this.setData({ 
      contentType: type || 'text',
      currentChapter: parseInt(chapter) || 1
    });
    
    switch (type) {
      case 'audio':
        this.initAudio();
        break;
      case 'video':
        // 视频context会在视频组件ready后初始化
        break;
      case 'collection':
        this.loadCollection(id);
        break;
      default:
        this.loadBookInfo(id);
        break;
    }
    
    this.loadChapters();
  },

  initAudio() {
    const audioContext = wx.createInnerAudioContext();
    audioContext.src = 'your_audio_url';
    
    audioContext.onTimeUpdate(() => {
      this.setData({
        currentTime: this.formatTime(audioContext.currentTime),
        progress: (audioContext.currentTime / audioContext.duration) * 100
      });
    });
    
    audioContext.onEnded(() => {
      this.setData({ isPlaying: false });
    });
    
    this.setData({ audioContext });
  },

  onVideoReady() {
    this.setData({
      videoContext: wx.createVideoContext('reader-video')
    });
  },

  loadCollection(id) {
    // 从服务器加载图书集合
    const collection = [
      { id: 1, title: '第一册', cover: '/images/covers/1.jpg' },
      { id: 2, title: '第二册', cover: '/images/covers/2.jpg' },
      // ...更多册
    ];
    this.setData({ collection });
  },

  openBook(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/reader/reader?id=${id}&type=text`
    });
  },

  loadBookInfo(id) {
    wx.showLoading({
      title: '加载中...',
    });
    
    wx.request({
      url: getApp().globalData.baseUrl + `/book/get/${id}`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 0) {
          const bookData = res.data.data;
          this.setData({
            bookTitle: bookData.name,
            'chapter.content': bookData.richText || '暂无内容',
            totalChapters: 1, // 如果没有章节信息，默认为1章
            progress: (this.data.currentChapter / 1) * 100
          });
          
          // 更新章节标题
          this.setData({
            'chapter.title': `${bookData.name}`
          });
          
          // 保存阅读进度
          this.saveReadingProgress();
        } else {
          wx.showToast({
            title: res.data.message || '获取图书信息失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('请求失败:', err);
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  loadChapter(chapterNo) {
    // 如果是单章节内容，直接使用已加载的内容
    if (this.data.totalChapters === 1) {
      this.setData({
        currentChapter: 1,
        progress: 100
      });
      return;
    }
    
    // 这里应该从服务器获取章节内容
    // 如果有多章节API，可以在这里实现
    this.setData({
      'chapter.title': `第${chapterNo}章`,
      'chapter.content': '正在加载章节内容...',
      currentChapter: chapterNo,
      progress: (chapterNo / this.data.totalChapters) * 100
    });
    
    // 保存阅读进度
    this.saveReadingProgress();
  },

  saveReadingProgress() {
    // 保存阅读进度到全局数据
    const app = getApp();
    if (!app.globalData.readingProgress) {
      app.globalData.readingProgress = {};
    }
    
    app.globalData.readingProgress[this.bookId] = {
      chapter: this.data.currentChapter,
      progress: this.data.progress,
      timestamp: new Date().getTime()
    };
    
    // 可以选择同步到服务器
    // this.syncReadingProgress();
  },

  syncReadingProgress() {
    // 将阅读进度同步到服务器的示例代码
    const token = wx.getStorageSync('token');
    if (!token) return;
    
    wx.request({
      url: getApp().globalData.baseUrl + '/reading/progress/save',
      method: 'POST',
      data: {
        bookId: this.bookId,
        chapter: this.data.currentChapter,
        progress: this.data.progress
      },
      header: {
        'content-type': 'application/json',
        'token': token
      },
      success: (res) => {
        console.log('Progress synced:', res);
      },
      fail: (err) => {
        console.error('Progress sync failed:', err);
      }
    });
  },

  toggleControls() {
    this.setData({
      showControls: !this.data.showControls
    });
  },

  goBack() {
    wx.navigateBack();
  },

  showMenu() {
    this.setData({
      showCatalog: true,
      showControls: false
    });
  },

  prevChapter() {
    if (this.data.currentChapter > 1) {
      this.loadChapter(this.data.currentChapter - 1);
    }
  },

  nextChapter() {
    if (this.data.currentChapter < this.data.totalChapters) {
      this.loadChapter(this.data.currentChapter + 1);
    }
  },

  onProgressChange(e) {
    if (this.data.contentType === 'audio') {
      const { audioContext } = this.data;
      const position = (e.detail.value / 100) * audioContext.duration;
      audioContext.seek(position);
    } else {
      const chapter = Math.round((e.detail.value / 100) * this.data.totalChapters);
      this.loadChapter(chapter || 1);
    }
  },

  toggleTheme() {
    this.setData({
      theme: this.data.theme === 'light' ? 'night' : 'light'
    });
  },

  toggleFontSize() {
    // 字体大小调节
  },

  onScroll() {
    // 隐藏控制栏
    if (this.data.showControls) {
      this.setData({
        showControls: false
      });
    }
  },

  toggleFontPanel() {
    this.setData({
      showFontPanel: !this.data.showFontPanel,
      showControls: false
    });
  },

  increaseFontSize() {
    if (this.data.fontSize < 48) {
      this.setData({
        fontSize: this.data.fontSize + 2
      });
    }
  },

  decreaseFontSize() {
    if (this.data.fontSize > 28) {
      this.setData({
        fontSize: this.data.fontSize - 2
      });
    }
  },

  hideCatalog() {
    this.setData({
      showCatalog: false
    });
  },

  jumpToChapter(e) {
    const chapter = e.currentTarget.dataset.chapter;
    this.loadChapter(chapter);
    this.hideCatalog();
  },

  loadChapters() {
    // 这里应该从服务器获取章节列表
    const chapters = Array(this.data.totalChapters).fill(null).map((_, index) => ({
      title: `示例章节${index + 1}`
    }));
    
    this.setData({ chapters });
  },

  togglePlay() {
    const { audioContext, isPlaying } = this.data;
    if (isPlaying) {
      audioContext.pause();
    } else {
      audioContext.play();
    }
    this.setData({ isPlaying: !isPlaying });
  },

  formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  },

  onUnload() {
    // 页面卸载时释放音频资源
    if (this.data.audioContext) {
      this.data.audioContext.destroy();
    }
  },
}); 