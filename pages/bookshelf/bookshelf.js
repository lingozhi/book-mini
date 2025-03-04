const app = getApp();
const request = require('../../utils/request');

Page({
  data: {
    books: [],
    loading: false,
    pageIndex: 1,
    pageSize: 10,
    hasMore: true
  },

  onLoad() {
    this.fetchBooks();
  },

  onShow() {
    // 每次显示页面时刷新书架数据
    this.fetchBooks(true);
  },

  fetchBooks(refresh = false) {
    if (refresh) {
      this.setData({
        pageIndex: 1,
        hasMore: true
      });
    }
    
    if (!this.data.hasMore || this.data.loading) return;
    
    this.setData({ loading: true });
    
    request.post('/book/list', {
      pageIndex: this.data.pageIndex,
      pageSize: this.data.pageSize,
      // 其他筛选参数可以根据需要添加
    }, false).then(res => {
      const newBooks = res.data.list.map(book => ({
        id: book.id,
        title: book.name,
        author: book.author,
        coverUrl: book.coverPath,
        illustrator: book.illustrator,
        isbn: book.isbn
      }));
      
      this.setData({
        books: refresh ? newBooks : [...this.data.books, ...newBooks],
        pageIndex: this.data.pageIndex + 1,
        hasMore: newBooks.length === this.data.pageSize
      });
    }).catch(err => {
      console.error('获取书籍列表失败', err);
    }).finally(() => {
      this.setData({ loading: false });
      wx.stopPullDownRefresh();
    });
  },

  onBookTap(e) {
    const bookId = e.currentTarget.dataset.id;
    const progress = app.globalData.readingProgress[bookId] || {};
    
    wx.navigateTo({
      url: `/pages/reader/reader?id=${bookId}&chapter=${progress.chapter || 1}`
    });
  },

  onAddTap() {
    wx.navigateTo({
      url: '/pages/bookstore/bookstore'
    });
  },
  
  onPullDownRefresh() {
    this.fetchBooks(true);
  },
  
  onReachBottom() {
    this.fetchBooks();
  }
}); 