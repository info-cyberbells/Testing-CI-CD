
const menuItems = {
  items: [
    {
      id: 'navigation',
      title: 'Navigation',
      type: 'group',
      icon: 'icon-navigation',
      children: [
        {
          id: 'dashboard',
          title: 'Dashboard',
          type: 'item',
          icon: 'feather icon-home',
          url: '/'
        }
      ]
    },
   
    {
      id: 'ui-forms',
      title: 'Manage Profile',
      type: 'group',
      icon: 'icon-group',
      children: [
        {
          id: 'forms',
          title: 'Manage Profile',
          type: 'item',
          icon: 'feather icon-file-text',
          url: '/profile/profile'
        },
       
      ]
    },

    {
      id: 'administrators',
      title: 'Manage Administrators',
      type: 'group',
      icon: 'icon-group',
      children: [
        
        {
          id: 'administrators',
          title: 'Administrators',
          type: 'item',
          icon: 'feather icon-server',
          url: '/administrators'
        }
      ]
    },
    {
      id: 'staffMembers',
      title: 'Manage Staff Members',
      type: 'group',
      icon: 'icon-group',
      children: [
        
        {
          id: 'staffMembers',
          title: 'Staff Members',
          type: 'item',
          icon: 'feather icon-server',
          url: '/staff-members'
        }
      ]
    },
    {
      id: 'churches',
      title: 'Manage Churches',
      type: 'group',
      icon: 'icon-charts',
      children: [
        {
          id: 'charts',
          title: 'Churches',
          type: 'item',
          icon: 'feather icon-pie-chart',
          url: '/churches'
        },
       
      ]
    },
    {
      id: 'users',
      title: 'Manage Users',
      type: 'group',
      icon: 'icon-charts',
      children: [
        {
          id: 'users',
          title: 'Users',
          type: 'item',
          icon: 'feather icon-pie-chart',
          url: '/users'
        },
       
      ]
    },

    {
      id: 'church',
      title: 'Manage Church',
      type: 'group',
      icon: 'icon-charts',
      children: [
        {
          id: 'church',
          title: 'Church',
          type: 'item',
          icon: 'feather icon-pie-chart',
          url: '/church'
        },
       
      ]
    },
    {
      id: 'go-live',
      title: 'Manage Go Live',
      type: 'group',
      icon: 'icon-charts',
      children: [
        {
          id: 'go-live',
          title: 'Go Live',
          type: 'item',
          icon: 'feather icon-pie-chart',
          url: '/go-live'
        },
       
      ]
    },
    {
      id: 'join-live-sermons',
      title: 'Manage Live Sermons',
      type: 'group',
      icon: 'icon-charts',
      children: [
        {
          id: 'join-live-sermons',
          title: 'Join Live Sermons',
          type: 'item',
          icon: 'feather icon-pie-chart',
          url: '/join-live-sermons'
        },
       
      ]
    },
    {
      id: 'daily-devotional',
      title: 'Manage Daily Devotional',
      type: 'group',
      icon: 'icon-charts',
      children: [
        {
          id: 'daily-devotional',
          title: 'Daily Devotional',
          type: 'item',
          icon: 'feather icon-pie-chart',
          url: '/daily-devotionals'
        },
       
      ]
    },
    {
      id: 'prayer-request',
      title: 'Manage Prayer Request',
      type: 'group',
      icon: 'icon-charts',
      children: [
        {
          id: 'prayer-request',
          title: 'Prayer Request',
          type: 'item',
          icon: 'feather icon-pie-chart',
          url: '/prayer-requests'
        },
       
      ]
    },
    {
      id: 'donate',
      title: 'Manage Donate',
      type: 'group',
      icon: 'icon-charts',
      children: [
        {
          id: 'donate',
          title: 'Donate',
          type: 'item',
          icon: 'feather icon-pie-chart',
          url: '/donate '
        },
       
      ]
    },
    
  ]
};

export default menuItems;
