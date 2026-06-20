export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/queue/index',
    'pages/orders/index',
    'pages/mine/index',
    'pages/appointment-detail/index',
    'pages/stylist-manage/index',
    'pages/station-manage/index',
    'pages/member-center/index',
    'pages/dashboard/index',
    'pages/station-detail/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#8B5CF6',
    navigationBarTitleText: '美发预约',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#9CA3AF',
    selectedColor: '#8B5CF6',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '预约'
      },
      {
        pagePath: 'pages/queue/index',
        text: '叫号'
      },
      {
        pagePath: 'pages/orders/index',
        text: '订单'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
