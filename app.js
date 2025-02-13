// app.js
App({
  globalData: {
    userInfo: null,
    isLoggedIn: false
  },

  onLaunch() {
    // 加载本地存储的用户数据
    wx.getStorage({
      key: 'userInfo',
      success: (res) => {
        this.globalData.userInfo = res.data;
        this.globalData.isLoggedIn = true;
      }
    });

    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
  },
})
