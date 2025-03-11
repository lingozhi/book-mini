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
    bookAuthor: '',
    bookCover: '',
    contents: [],
  },

  onLoad(options) {
    const { id, type, chapter } = options;
    this.bookId = id; // Store book ID for later use
    
    console.log('阅读器页面加载, ID:', id, 'Type:', type, 'Chapter:', chapter);
    console.log('组件是否已注册:', !!this.selectComponent('text-reader'));
    
    // 设置默认内容
    this.setData({ 
      contentType: type || 'text',
      currentChapter: parseInt(chapter) || 1,
      'chapter.title': '加载中...',
      'chapter.content': '正在加载图书内容，请稍候...'
    });
    
    // 加载图书信息，根据返回的数据决定内容类型
    if (id) {
      this.loadBookInfo(id);
    } else {
      console.error('未提供图书ID');
      wx.showToast({
        title: '缺少图书ID',
        icon: 'none'
      });
    }
  },

  initAudio(audioUrl) {
    const audioContext = wx.createInnerAudioContext();
    audioContext.src = audioUrl || '';
    
    audioContext.onTimeUpdate(() => {
      this.setData({
        currentTime: this.formatTime(audioContext.currentTime),
        duration: this.formatTime(audioContext.duration),
        progress: (audioContext.currentTime / audioContext.duration) * 100
      });
    });
    
    audioContext.onEnded(() => {
      this.setData({ isPlaying: false });
      // 自动播放下一章
      if (this.data.currentChapter < this.data.totalChapters) {
        this.nextChapter();
      }
    });
    
    audioContext.onError((err) => {
      console.error('音频播放错误:', err);
      wx.showToast({
        title: '音频加载失败',
        icon: 'none'
      });
    });
    
    this.setData({ audioContext });
  },

  onVideoReady(e) {
    const { videoContext } = e.detail;
    this.setData({
      videoContext: videoContext
    });
    
    // 记录视频时长
    setTimeout(() => {
      if (this.data.videoContext) {
        this.data.videoContext.getDuration({
          success: (res) => {
            this.setData({
              duration: this.formatTime(res.duration)
            });
          }
        });
      }
    }, 1000);
  },

  onVideoFullscreenChange(e) {
    const isFullScreen = e.detail.fullScreen;
    
    // 在全屏模式下隐藏控制栏
    if (isFullScreen) {
      this.setData({
        showControls: false
      });
    }
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
    
    console.log('正在加载图书ID:', id);
    
    wx.request({
      url: getApp().globalData.baseUrl + `/book/get/${id}`,
      method: 'GET',
      success: (res) => {
        console.log('图书数据响应:', res.data);
        
        if (res.statusCode === 200 && (res.data.code === 0 || res.data.code === 200)) {
          const bookData = res.data.data;
          console.log('解析到的图书数据:', bookData);
          
          // 设置基本图书信息
          this.setData({
            bookTitle: bookData.name || '未知标题',
            bookAuthor: bookData.author || '',
            bookCover: bookData.coverPath || ''
          });
          
          // 动态设置导航栏标题为书籍名称
          if (bookData.name) {
            wx.setNavigationBarTitle({
              title: bookData.name
            });
          }
          
          // 判断图书类型
          if (bookData.series === true) {
            console.log('检测到套装书');
            this.handleSeriesBook(bookData);
          } else if (bookData.contents && bookData.contents.length > 0) {
            console.log('检测到带内容的图书, 内容数量:', bookData.contents.length);
            this.handleBookWithContents(bookData);
          } else {
            console.log('图书没有内容');
            this.setData({
              contentType: 'text',
              'chapter.title': bookData.name || '未知标题',
              'chapter.content': '暂无内容',
              totalChapters: 1,
              progress: 100
            });
          }
          
          // 保存阅读进度
          this.saveReadingProgress();
        } else {
          console.error('API返回错误:', res.data);
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

  // 处理套装书
  handleSeriesBook(bookData) {
    if (bookData.sonBooks && bookData.sonBooks.length > 0) {
      // 格式化子图书列表
      const collection = bookData.sonBooks.map(book => ({
        id: book.id,
        title: book.name,
        cover: book.coverPath || '/images/covers/default.jpg',
        author: book.author || ''
      }));
      
      // 更新UI为集合视图
      this.setData({
        contentType: 'collection',
        collection: collection
      });
    } else {
      // 套装书但没有子图书
      this.setData({
        contentType: 'text',
        'chapter.title': bookData.name,
        'chapter.content': '此套装书暂无内容',
        totalChapters: 1,
        progress: 100
      });
    }
  },

  // 处理有内容的图书
  handleBookWithContents(bookData) {
    const contents = bookData.contents || [];
    console.log('处理图书内容:', contents);
    
    if (contents.length === 0) {
      console.log('内容列表为空');
      this.setData({
        contentType: 'text',
        'chapter.title': bookData.name || '未知标题',
        'chapter.content': '暂无内容',
        totalChapters: 1,
        progress: 100
      });
      return;
    }
    
    // 获取第一个内容项
    const firstContent = contents[0];
    console.log('第一个内容项:', firstContent);
    
    // 根据内容类型设置不同的阅读模式
    switch (firstContent.type) {
      case 1: // 视频
        console.log('设置视频模式, URL:', firstContent.filePath);
        
        // 检查URL是否有效
        const videoUrl = firstContent.filePath || '';
        if (!videoUrl) {
          console.error('视频URL为空');
          wx.showToast({
            title: '视频地址无效',
            icon: 'none'
          });
        }
        
        this.setData({
          contentType: 'video',
          'chapter.title': firstContent.name || bookData.name || '未知标题',
          'chapter.content': '',
          videoUrl: videoUrl,
          totalChapters: contents.length,
          contents: contents
        });
        break;
        
      case 2: // 音频
        console.log('设置音频模式');
        this.setData({
          contentType: 'audio',
          'chapter.title': firstContent.name || bookData.name || '未知标题',
          'chapter.content': '',
          totalChapters: contents.length,
          contents: contents
        });
        this.initAudio(firstContent.filePath || '');
        break;
        
      case 3: // 富文本
      default:
        console.log('设置文本模式, 内容:', firstContent.richText?.substring(0, 50));
        this.setData({
          contentType: 'text',
          'chapter.title': firstContent.name || bookData.name || '未知标题',
          'chapter.content': firstContent.richText || '暂无内容',
          totalChapters: contents.length,
          contents: contents,
          progress: (this.data.currentChapter / contents.length) * 100
        });
        break;
    }
  },

  loadChapter(chapterNo) {
    // 检查章节号是否有效
    if (chapterNo < 1 || chapterNo > this.data.totalChapters) {
      wx.showToast({
        title: '无效的章节',
        icon: 'none'
      });
      return;
    }
    
    // 如果没有内容列表，直接返回
    if (!this.data.contents || this.data.contents.length === 0) {
      return;
    }
    
    // 获取当前章节内容
    const content = this.data.contents[chapterNo - 1];
    if (!content) return;
    
    // 更新章节标题
    this.setData({
      'chapter.title': content.name,
      currentChapter: chapterNo,
      progress: (chapterNo / this.data.totalChapters) * 100
    });
    
    // 根据内容类型处理不同的加载逻辑
    switch (this.data.contentType) {
      case 'audio':
        // 停止当前音频
        if (this.data.audioContext) {
          this.data.audioContext.stop();
        }
        // 初始化新的音频
        this.initAudio(content.filePath);
        break;
        
      case 'video':
        // 更新视频源
        this.setData({
          videoUrl: content.filePath
        });
        // 重新加载视频
        if (this.data.videoContext) {
          this.data.videoContext.stop();
          setTimeout(() => {
            this.data.videoContext.play();
          }, 300);
        }
        break;
        
      case 'text':
      default:
        // 更新文本内容
        this.setData({
          'chapter.content': content.richText || '暂无内容'
        });
        break;
    }
    
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
    if (this.data.contentType === 'audio') {
      const { audioContext, isPlaying } = this.data;
      if (isPlaying) {
        audioContext.pause();
      } else {
        audioContext.play();
      }
      this.setData({ isPlaying: !isPlaying });
    } else if (this.data.contentType === 'video') {
      const { videoContext, isPlaying } = this.data;
      if (videoContext) {
        if (isPlaying) {
          videoContext.pause();
        } else {
          videoContext.play();
        }
        this.setData({ isPlaying: !isPlaying });
      }
    }
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

  // 添加视频错误处理方法
  onVideoError(e) {
    console.error('视频播放错误:', e);
    wx.showToast({
      title: '视频加载失败',
      icon: 'none',
      duration: 2000
    });
  },

  // 添加视频状态变化处理
  onVideoStateChange(e) {
    const { isPlaying } = e.detail;
    this.setData({ isPlaying });
  },

  // 添加视频结束处理
  onVideoEnded() {
    console.log('视频播放结束');
    // 自动播放下一章
    if (this.data.currentChapter < this.data.totalChapters) {
      this.nextChapter();
    }
  },
}); 