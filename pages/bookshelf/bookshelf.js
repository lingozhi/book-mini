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
    
    // 获取token
    const token = wx.getStorageSync('token');
    console.log('Using token for book list request:', token);
    
    // if (!token) {
    //   console.log('No token available, redirecting to login');
    //   wx.showToast({
    //     title: '请先登录',
    //     icon: 'none',
    //     duration: 2000
    //   });
      
    //   setTimeout(() => {
    //     wx.navigateTo({
    //       url: '/pages/mine/mine'
    //     });
    //   }, 2000);
      
    //   this.setData({ loading: false });
    //   return;
    // }
    
    // Try a direct wx.request approach instead of using the utility
    wx.request({
      url: app.globalData.baseUrl + '/book/list',
      method: 'POST',
      data: {
        pageIndex: this.data.pageIndex,
        pageSize: this.data.pageSize
      },
      header: {
        'content-type': 'application/json',
        'token': token
      },
      success: (res) => {
        console.log('Book list response:', res);
        
        if (res.statusCode === 200 && res.data.code === 200) {
          const newBooks = res.data.data.list.map(book => ({
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
        } else if (res.statusCode === 401 || (res.data && res.data.errorCode === "401")) {
          console.error('Token authentication failed:', res);
          wx.showToast({
            title: '请先登录',
            icon: 'none',
            duration: 2000
          });
          
          // Clear invalid token
          wx.removeStorageSync('token');
          
          setTimeout(() => {
            wx.navigateTo({
              url: '/pages/mine/mine'
            });
          }, 2000);
        } else {
          console.error('获取书籍列表失败', res);
          wx.showToast({
            title: res.data.message || '获取书籍列表失败',
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
        this.setData({ loading: false });
        wx.stopPullDownRefresh();
      }
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