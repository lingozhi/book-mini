Page({
  data: {
    url: ''
  },

  onLoad(options) {
    const type = options.type;
    let title = '';
    let url = '';

    switch(type) {
      case 'service':
        title = '用户服务协议';
        url = 'https://your-domain.com/service.html';
        break;
      case 'privacy':
        title = '隐私协议';
        url = 'https://your-domain.com/privacy.html';
        break;
    }

    wx.setNavigationBarTitle({
      title: title
    });

    this.setData({ url });
  }
}); 