// app.js
App({
  globalData: {
    userInfo: null,
    isLoggedIn: false,
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

  saveBooks() {
    wx.setStorageSync('books', this.globalData.books);
  }
})
