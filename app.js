// app.js
App({
  globalData: {
    userInfo: null,
    isLoggedIn: false,
    baseUrl: 'https://book.aimoda.tech', // 替换为你的实际接口地址
    books: [
      {
        id: '1',
        title: '软浅',
        coverUrl: 'https://img.xibook.info/upload/book/20230812/1691827726_64d73c1e42fbe.jpg',
        author: '墨上筠'
      },
      {
        id: '2',
        title: '北派盗墓笔记',
        coverUrl: 'https://img.xibook.info/upload/book/20230812/1691827726_64d73c1e42fbe.jpg',
        author: '黑色火种'
      },
      {
        id: '3',
        title: '诡舍',
        coverUrl: 'https://img.xibook.info/upload/book/20230812/1691827726_64d73c1e42fbe.jpg',
        author: '零下九度'
      },
      {
        id: '4',
        title: '天渊',
        coverUrl: 'https://img.xibook.info/upload/book/20230812/1691827726_64d73c1e42fbe.jpg',
        author: '默默猴'
      },
      {
        id: '5',
        title: '她引神明坠落',
        coverUrl: 'https://img.xibook.info/upload/book/20230812/1691827726_64d73c1e42fbe.jpg',
        author: '九月的茉莉'
      },
      {
        id: '6',
        title: '绝香情',
        coverUrl: 'https://img.xibook.info/upload/book/20230812/1691827726_64d73c1e42fbe.jpg',
        author: '沐清雨'
      },
      {
        id: '7',
        title: '青山似玉',
        coverUrl: 'https://img.xibook.info/upload/book/20230812/1691827726_64d73c1e42fbe.jpg',
        author: '风青阳'
      },
      {
        id: '8',
        title: '千朵桃花一处开',
        coverUrl: 'https://img.xibook.info/upload/book/20230812/1691827726_64d73c1e42fbe.jpg',
        author: '叶笑'
      },
      {
        id: '9',
        title: '十日终焉',
        coverUrl: 'https://img.xibook.info/upload/book/20230812/1691827726_64d73c1e42fbe.jpg',
        author: '青丘白玉'
      },
      {
        id: '10',
        title: '全球冰封',
        coverUrl: 'https://img.xibook.info/upload/book/20230812/1691827726_64d73c1e42fbe.jpg',
        author: '末日游戏'
      }
    ],
    readingProgress: {}
  },

  onLaunch() {
    // 设置请求拦截器
    this.setupRequestInterceptor();
    
    // 加载用户数据
    this.loadUserData();

    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 检查登录状态
    if (!this.checkLoginStatus()) {
      // 未登录，执行登录流程
      wx.login({
        success: res => {
          if (res.code) {
            // 发送 res.code 到后台换取 token
            this.login(res.code).then(data => {
              console.log('登录成功', data);
            }).catch(err => {
              console.error('登录失败', err);
            });
          } else {
            console.error('微信登录失败', res.errMsg);
          }
        }
      });
    }
  },

  // 设置请求拦截器，为所有请求添加 token
  setupRequestInterceptor() {
    // 保存原始的 wx.request 方法
    const originalRequest = wx.request;
    
    // 重写 wx.request 方法
    Object.defineProperty(wx, 'request', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: (options) => {
        // 获取本地存储的 token
        const token = wx.getStorageSync('token');
        
        // 如果有 token，添加到请求头
        if (token) {
          // 确保 header 对象存在
          options.header = options.header || {};
          
          // 添加 token 到请求头
          options.header['Authorization'] = `Bearer ${token}`;
        }
        
        // 调用原始的 request 方法
        return originalRequest(options);
      }
    });
  },
  
  // 加载用户数据
  loadUserData() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo) {
        this.globalData.userInfo = userInfo;
      }
    } catch (e) {
      console.error('加载用户数据失败', e);
    }
  },

  saveBooks() {
    wx.setStorageSync('books', this.globalData.books);
  },

  // 登录方法
  login(code) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: this.globalData.baseUrl + '/user/login',
        method: 'POST',
        data: {
          code: code
        },
        success: (res) => {
          if (res.statusCode === 200 && res.data.code === 0) {
            // 保存 token
            wx.setStorageSync('token', res.data.data.token);
            
            // 更新全局状态
            this.globalData.isLoggedIn = true;
            this.globalData.userInfo = res.data.data.userInfo;
            
            // 保存用户信息
            wx.setStorageSync('userInfo', res.data.data.userInfo);
            
            resolve(res.data.data);
          } else {
            wx.showToast({
              title: res.data.message || '登录失败',
              icon: 'none'
            });
            reject(res.data);
          }
        },
        fail: (err) => {
          wx.showToast({
            title: '网络错误',
            icon: 'none'
          });
          reject(err);
        }
      });
    });
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    if (token) {
      this.globalData.isLoggedIn = true;
      return true;
    } else {
      this.globalData.isLoggedIn = false;
      return false;
    }
  },

  // 退出登录
  logout() {
    // 清除本地存储的 token 和用户信息
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
    
    // 更新全局状态
    this.globalData.isLoggedIn = false;
    this.globalData.userInfo = null;
  }
})
