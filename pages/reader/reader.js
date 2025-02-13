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
  },

  onLoad(options) {
    const { id } = options;
    this.loadBookInfo(id);
    this.loadChapter(1);
    this.loadChapters();
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
    const chapter = Math.round((e.detail.value / 100) * this.data.totalChapters);
    this.loadChapter(chapter || 1);
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
  }
}); 