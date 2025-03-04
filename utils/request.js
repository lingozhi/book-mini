const app = getApp();

// 封装请求方法
const request = (url, method, data, showLoading = true) => {
  return new Promise((resolve, reject) => {
    if (showLoading) {
      wx.showLoading({
        title: '加载中',
        mask: true
      });
    }
    
    wx.request({
      url: app.globalData.baseUrl + url,
      method: method,
      data: data,
      success: (res) => {
        if (res.statusCode === 200) {
          // 请求成功
          if (res.data.code === 0) {
            // 业务逻辑成功
            resolve(res.data);
          } else {
            // 业务逻辑失败
            wx.showToast({
              title: res.data.message || '请求失败',
              icon: 'none'
            });
            reject(res.data);
          }
        } else if (res.statusCode === 401) {
          // token 过期或无效，需要重新登录
          handleTokenExpired();
          reject(res.data);
        } else {
          // 其他错误
          wx.showToast({
            title: '服务器错误',
            icon: 'none'
          });
          reject(res);
        }
      },
      fail: (err) => {
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
        reject(err);
      },
      complete: () => {
        if (showLoading) {
          wx.hideLoading();
        }
      }
    });
  });
};

// 处理 token 过期
const handleTokenExpired = () => {
  // 清除本地存储的 token
  wx.removeStorageSync('token');
  
  // 更新全局状态
  app.globalData.isLoggedIn = false;
  app.globalData.userInfo = null;
  
  // 提示用户
  wx.showToast({
    title: '登录已过期，请重新登录',
    icon: 'none',
    duration: 2000
  });
  
  // 延迟跳转到登录页面
  setTimeout(() => {
    wx.navigateTo({
      url: '/pages/mine/mine'
    });
  }, 2000);
};

// 导出请求方法
module.exports = {
  get: (url, data, showLoading) => {
    return request(url, 'GET', data, showLoading);
  },
  post: (url, data, showLoading) => {
    return request(url, 'POST', data, showLoading);
  },
  put: (url, data, showLoading) => {
    return request(url, 'PUT', data, showLoading);
  },
  delete: (url, data, showLoading) => {
    return request(url, 'DELETE', data, showLoading);
  }
}; 