const app = getApp();

Page({
  data: {
    userInfo: {},
    readCount: 0,
    readTime: 0
  },

  onLoad() {
    this.checkLoginStatus();
    this.calculateReadingStats();
  },

  onShow() {
    this.calculateReadingStats();
  },

  checkLoginStatus() {
    const userInfo = app.globalData.userInfo;
    if (userInfo) {
      this.setData({ userInfo });
    }
  },

  login() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const userInfo = res.userInfo;
        this.setData({ userInfo });
        app.globalData.userInfo = userInfo;
        wx.setStorage({
          key: 'userInfo',
          data: userInfo
        });
      }
    });
  },

  calculateReadingStats() {
    const progress = app.globalData.readingProgress;
    const books = Object.keys(progress).length;
    
    // 计算总阅读时长（小时）
    let totalTime = 0;
    Object.values(progress).forEach(p => {
      if (p.timestamp) {
        totalTime += p.readTime || 0;
      }
    });

    this.setData({
      readCount: books,
      readTime: Math.round(totalTime / 3600) // 转换为小时
    });
  },

  onMenuTap(e) {
    const type = e.currentTarget.dataset.type;
    wx.navigateTo({
      url: `/pages/agreement/agreement?type=${type}`
    });
  },

  logout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除用户信息
          app.globalData.userInfo = null;
          wx.removeStorage({
            key: 'userInfo'
          });
          this.setData({
            userInfo: {}
          });
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    });
  },

  clearCache() {
    wx.showModal({
      title: '提示',
      content: '确定要清除缓存吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorage({
            success: () => {
              wx.showToast({
                title: '清除成功',
                icon: 'success'
              });
              // 重新加载数据
              app.loadUserData();
            }
          });
        }
      }
    });
  }
});