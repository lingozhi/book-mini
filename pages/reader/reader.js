const app = getApp();

Page({
  data: {
    bookId: '',
    bookTitle: '',
    contentType: 'text', // 'text', 'audio', 'video', 'collection'
    chapter: {
      title: '',
      content: ''
    },
    chapters: [],
    currentChapter: 1,
    totalChapters: 1,
    fontSize: 36,
    theme: 'light',
    showControls: false,
    showFontPanel: false,
    showCatalog: false,
    progress: 0,
    isPlaying: false,
    currentTime: '00:00',
    duration: '00:00',
    collection: []
  },

  onLoad(options) {
    const { id, chapter } = options;
    this.setData({
      bookId: id,
      currentChapter: parseInt(chapter) || 1
    });

    // 获取图书信息
    this.fetchBookInfo(id);
  },

  fetchBookInfo(bookId) {
    wx.showLoading({
      title: '加载中...',
    });

    // 获取token
    const token = wx.getStorageSync('token');

    wx.request({
      url: `${app.globalData.baseUrl}/book/get/${bookId}`,
      method: 'GET',
      header: {
        'content-type': 'application/json',
        'token': token
      },
      success: (res) => {
        wx.hideLoading();
        
        if (res.statusCode === 200 && res.data.code === 200) {
          const bookData = res.data.data;
          
          // 设置书籍标题
          this.setData({
            bookTitle: bookData.name
          });

          // 判断内容类型
          if (bookData.series === true && bookData.sonBooks && bookData.sonBooks.length > 0) {
            // 这是一个图书集合
            this.handleCollectionBook(bookData);
          } else if (bookData.contents && bookData.contents.length > 0) {
            // 处理图书内容
            this.handleBookContents(bookData.contents);
          } else {
            wx.showToast({
              title: '该书暂无内容',
              icon: 'none'
            });
          }
        } else {
          console.error('API返回错误:', res.data);
          wx.showToast({
            title: res.data.message || '获取图书信息失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
        console.error('获取图书信息失败:', err);
      }
    });
  },

  handleCollectionBook(bookData) {
    // 处理图书集合
    const collection = bookData.sonBooks.map(book => ({
      id: book.id,
      title: book.name,
      cover: book.coverPath || '/images/default-cover.png'
    }));

    this.setData({
      contentType: 'collection',
      collection: collection
    });
  },

  handleBookContents(contents) {
    // 根据内容类型设置阅读器模式
    if (contents.length > 0) {
      const firstContent = contents[0];
      
      // 根据类型设置内容
      switch (firstContent.type) {
        case 1: // 视频
          this.setData({
            contentType: 'video',
            chapters: contents.map((content, index) => ({
              id: content.id,
              title: content.name,
              url: content.filePath
            })),
            totalChapters: contents.length
          });
          this.loadVideoChapter(this.data.currentChapter);
          break;
        
        case 2: // 音频
          this.setData({
            contentType: 'audio',
            chapters: contents.map((content, index) => ({
              id: content.id,
              title: content.name,
              url: content.filePath
            })),
            totalChapters: contents.length
          });
          this.loadAudioChapter(this.data.currentChapter);
          break;
        
        case 3: // 富文本
          this.setData({
            contentType: 'text',
            chapters: contents.map((content, index) => ({
              id: content.id,
              title: content.name,
              content: content.richText
            })),
            totalChapters: contents.length
          });
          this.loadTextChapter(this.data.currentChapter);
          break;
        
        default:
          wx.showToast({
            title: '不支持的内容类型',
            icon: 'none'
          });
      }
    }
  },

  loadTextChapter(chapterIndex) {
    if (chapterIndex < 1 || chapterIndex > this.data.chapters.length) {
      wx.showToast({
        title: '没有更多章节了',
        icon: 'none'
      });
      return;
    }

    const chapter = this.data.chapters[chapterIndex - 1];
    this.setData({
      currentChapter: chapterIndex,
      chapter: {
        title: chapter.title,
        content: chapter.content
      },
      progress: (chapterIndex / this.data.totalChapters) * 100
    });

    // 保存阅读进度
    this.saveReadingProgress();
  },

  loadAudioChapter(chapterIndex) {
    if (chapterIndex < 1 || chapterIndex > this.data.chapters.length) {
      wx.showToast({
        title: '没有更多章节了',
        icon: 'none'
      });
      return;
    }

    const chapter = this.data.chapters[chapterIndex - 1];
    
    // 停止当前播放的音频
    if (this.audioContext) {
      this.audioContext.stop();
    }

    // 创建新的音频上下文
    this.audioContext = wx.createInnerAudioContext();
    this.audioContext.src = chapter.url;
    this.audioContext.onPlay(() => {
      this.setData({ isPlaying: true });
    });
    this.audioContext.onPause(() => {
      this.setData({ isPlaying: false });
    });
    this.audioContext.onStop(() => {
      this.setData({ isPlaying: false });
    });
    this.audioContext.onEnded(() => {
      this.setData({ isPlaying: false });
      // 自动播放下一章
      this.nextChapter();
    });
    this.audioContext.onTimeUpdate(() => {
      const currentTime = this.formatTime(this.audioContext.currentTime);
      const duration = this.formatTime(this.audioContext.duration);
      const progress = (this.audioContext.currentTime / this.audioContext.duration) * 100;
      
      this.setData({
        currentTime,
        duration,
        progress
      });
    });
    this.audioContext.onError((err) => {
      console.error('音频播放错误:', err);
      wx.showToast({
        title: '音频播放失败',
        icon: 'none'
      });
    });

    this.setData({
      currentChapter: chapterIndex,
      chapter: {
        title: chapter.title
      }
    });

    // 保存阅读进度
    this.saveReadingProgress();
  },

  loadVideoChapter(chapterIndex) {
    if (chapterIndex < 1 || chapterIndex > this.data.chapters.length) {
      wx.showToast({
        title: '没有更多章节了',
        icon: 'none'
      });
      return;
    }

    const chapter = this.data.chapters[chapterIndex - 1];
    
    // 获取视频上下文
    this.videoContext = wx.createVideoContext('reader-video');
    
    this.setData({
      currentChapter: chapterIndex,
      chapter: {
        title: chapter.title
      },
      videoUrl: chapter.url
    });

    // 保存阅读进度
    this.saveReadingProgress();
  },

  onVideoReady() {
    // 视频准备就绪
    this.videoContext.play();
    this.setData({ isPlaying: true });
  },

  formatTime(seconds) {
    if (isNaN(seconds)) return '00:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  },

  toggleControls() {
    this.setData({
      showControls: !this.data.showControls,
      showFontPanel: false
    });
  },

  togglePlay() {
    if (this.data.contentType === 'audio') {
      if (this.data.isPlaying) {
        this.audioContext.pause();
      } else {
        this.audioContext.play();
      }
    } else if (this.data.contentType === 'video') {
      if (this.data.isPlaying) {
        this.videoContext.pause();
        this.setData({ isPlaying: false });
      } else {
        this.videoContext.play();
        this.setData({ isPlaying: true });
      }
    }
  },

  prevChapter() {
    const prevChapter = this.data.currentChapter - 1;
    
    if (this.data.contentType === 'text') {
      this.loadTextChapter(prevChapter);
    } else if (this.data.contentType === 'audio') {
      this.loadAudioChapter(prevChapter);
    } else if (this.data.contentType === 'video') {
      this.loadVideoChapter(prevChapter);
    }
  },

  nextChapter() {
    const nextChapter = this.data.currentChapter + 1;
    
    if (this.data.contentType === 'text') {
      this.loadTextChapter(nextChapter);
    } else if (this.data.contentType === 'audio') {
      this.loadAudioChapter(nextChapter);
    } else if (this.data.contentType === 'video') {
      this.loadVideoChapter(nextChapter);
    }
  },

  toggleTheme() {
    this.setData({
      theme: this.data.theme === 'light' ? 'night' : 'light'
    });
  },

  toggleFontPanel() {
    this.setData({
      showFontPanel: !this.data.showFontPanel
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

  showMenu() {
    this.setData({
      showCatalog: true
    });
  },

  hideCatalog() {
    this.setData({
      showCatalog: false
    });
  },

  jumpToChapter(e) {
    const chapter = e.currentTarget.dataset.chapter;
    
    if (this.data.contentType === 'text') {
      this.loadTextChapter(chapter);
    } else if (this.data.contentType === 'audio') {
      this.loadAudioChapter(chapter);
    } else if (this.data.contentType === 'video') {
      this.loadVideoChapter(chapter);
    }
    
    this.setData({
      showCatalog: false
    });
  },

  onProgressChange(e) {
    const value = e.detail.value;
    
    if (this.data.contentType === 'text') {
      // 文本内容的进度条表示章节
      const chapter = Math.ceil((value / 100) * this.data.totalChapters);
      this.loadTextChapter(chapter);
    } else if (this.data.contentType === 'audio') {
      // 音频内容的进度条表示播放进度
      const seekTime = (value / 100) * this.audioContext.duration;
      this.audioContext.seek(seekTime);
    } else if (this.data.contentType === 'video') {
      // 视频内容的进度条表示播放进度
      const seekTime = (value / 100) * this.videoContext.duration;
      this.videoContext.seek(seekTime);
    }
  },

  onScroll(e) {
    // 滚动时隐藏控制面板
    if (this.data.showControls) {
      this.setData({
        showControls: false,
        showFontPanel: false
      });
    }
  },

  saveReadingProgress() {
    // 保存阅读进度到全局数据
    if (!app.globalData.readingProgress) {
      app.globalData.readingProgress = {};
    }
    
    app.globalData.readingProgress[this.data.bookId] = {
      chapter: this.data.currentChapter,
      timestamp: new Date().getTime()
    };
    
    // 也可以保存到本地存储
    wx.setStorage({
      key: `reading_progress_${this.data.bookId}`,
      data: {
        chapter: this.data.currentChapter,
        timestamp: new Date().getTime()
      }
    });
  },

  openBook(e) {
    const bookId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/reader/reader?id=${bookId}&chapter=1`
    });
  },

  goBack() {
    wx.navigateBack();
  },

  onUnload() {
    // 页面卸载时释放资源
    if (this.audioContext) {
      this.audioContext.stop();
      this.audioContext.destroy();
    }
    
    if (this.videoContext) {
      this.videoContext = null;
    }
  }
}); 