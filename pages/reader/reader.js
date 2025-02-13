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
    const { id, type } = options;
    this.setData({ contentType: type || 'text' });
    
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
        this.loadChapter(1);
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
    // 这里应该从服务器获取书籍信息
    this.setData({
      bookTitle: '软诱',
      totalChapters: 100
    });
  },

  loadChapter(chapterNo) {
    // 这里应该从服务器获取章节内容
    this.setData({
      'chapter.title': `第${chapterNo}章 示例章节`,
      'chapter.content': '这是示例章节的内容...',
      currentChapter: chapterNo,
      progress: (chapterNo / this.data.totalChapters) * 100
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