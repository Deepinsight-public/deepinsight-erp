import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Navigation
      dashboard: 'Dashboard',
      salesOrders: 'Sales Orders',
      purchaseRequests: 'Purchase Requests',
      inventory: 'Inventory',
      crm: 'CRM',
      afterSales: 'After-Sales',
      repairs: 'Repairs',
      orderSearch: 'Order Search',
      customerReturns: 'Customer Returns',
      returnsToHQ: 'Returns to HQ',
      scrap: 'Scrap',
      settings: 'Settings',
      
      // Common
      search: 'Search',
      filter: 'Filter',
      export: 'Export',
      import: 'Import',
      add: 'Add',
      edit: 'Edit',
      delete: 'Delete',
      save: 'Save',
      cancel: 'Cancel',
      confirm: 'Confirm',
      loading: 'Loading...',
      noData: 'No data available',
      
      // Status
      active: 'Active',
      inactive: 'Inactive',
      pending: 'Pending',
      completed: 'Completed',
      cancelled: 'Cancelled',
      
      // Store
      storeName: 'Store Name',
      notifications: 'Notifications',
      profile: 'Profile',
      logout: 'Logout',
      language: 'Language'
    }
  },
  zh: {
    translation: {
      // Navigation
      dashboard: '仪表板',
      salesOrders: '销售订单',
      purchaseRequests: '采购申请',
      inventory: '库存管理',
      crm: '客户管理',
      afterSales: '售后服务',
      repairs: '维修管理',
      orderSearch: '订单查询',
      customerReturns: '客户退货',
      returnsToHQ: '退货总部',
      scrap: '报废管理',
      settings: '设置',
      
      // Common
      search: '搜索',
      filter: '筛选',
      export: '导出',
      import: '导入',
      add: '添加',
      edit: '编辑',
      delete: '删除',
      save: '保存',
      cancel: '取消',
      confirm: '确认',
      loading: '加载中...',
      noData: '暂无数据',
      
      // Status
      active: '激活',
      inactive: '未激活',
      pending: '待处理',
      completed: '已完成',
      cancelled: '已取消',
      
      // Store
      storeName: '门店名称',
      notifications: '通知',
      profile: '个人资料',
      logout: '退出登录',
      language: '语言'
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;