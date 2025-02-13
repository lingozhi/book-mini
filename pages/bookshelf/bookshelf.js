const app = getApp();

Page({
  data: {
    books: [],
    isEditing: false
  },

  onLoad() {
    this.setTabBarStyle();
  },

  onShow() {
    // 每次显示页面时刷新书架数据
    this.setData({
      books: app.globalData.books
    });
  },

  setTabBarStyle() {
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#ff6b81'
    });
  },

  onBookTap(e) {
    if (this.data.isEditing) return;
    
    const bookId = e.currentTarget.dataset.id;
    const progress = app.globalData.readingProgress[bookId] || {};
    
    wx.navigateTo({
      url: `/pages/reader/reader?id=${bookId}&chapter=${progress.chapter || 1}`
    });
  },

  onLongPress() {
    this.setData({
      isEditing: true
    });
  },

  onDeleteBook(e) {
    const bookId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '提示',
      content: '确定要删除这本书吗？',
      success: (res) => {
        if (res.confirm) {
          const books = this.data.books.filter(book => book.id !== bookId);
          this.setData({ books });
          app.globalData.books = books;
          app.saveBooks();
        }
      }
    });
  },

  exitEditing() {
    this.setData({
      isEditing: false
    });
  },

  onAddTap() {
    wx.navigateTo({
      url: '/pages/bookstore/bookstore'
    });
  }
}) 