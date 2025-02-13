const app = getApp();

Page({
  data: {
    books: [],
    isEditing: false
  },

  onLoad() {
    this.setData({
      books: app.globalData.books
    });
  },

  onShow() {
    // 每次显示页面时刷新书架数据
    this.setData({
      books: app.globalData.books
    });
  },

  toggleEdit() {
    this.setData({
      isEditing: !this.data.isEditing
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
      title: '删除提示',
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

  onAddTap() {
    wx.navigateTo({
      url: '/pages/bookstore/bookstore'
    });
  }
}); 