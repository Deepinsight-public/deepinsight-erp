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
      
      // Inventory
      'inventory.search.title': 'Inventory Search',
      'inventory.search.sku': 'SKU/UPC/Model/Serial',
      'inventory.search.placeholder': 'Enter SKU, UPC, Model or Serial Number',
      'inventory.search.results': 'Search Results',
      'inventory.list.title': 'Inventory List',
      'inventory.list.onHand': 'On Hand',
      'inventory.list.allocated': 'Allocated',
      'inventory.list.available': 'Available',
      'inventory.transfers.title': 'Transfer Management',
      'inventory.transfers.out': 'Transfer Out',
      'inventory.transfers.in': 'Transfer In',
      'inventory.transfers.records': 'Transfer Records',
      'inventory.count.title': 'Inventory Count',
      'inventory.count.scan': 'RFID/Barcode Scan',
      'inventory.count.differences': 'Count Differences',
      'inventory.count.history': 'Count History',
      
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
      
      // Inventory
      'inventory.search.title': '库存查询',
      'inventory.search.sku': 'SKU/UPC/型号/序列号',
      'inventory.search.placeholder': '输入SKU、UPC、型号或序列号',
      'inventory.search.results': '搜索结果',
      'inventory.list.title': '库存清单',
      'inventory.list.onHand': '现有库存',
      'inventory.list.allocated': '已分配',
      'inventory.list.available': '可用',
      'inventory.transfers.title': '调拨管理',
      'inventory.transfers.out': '调货申请',
      'inventory.transfers.in': '调货接收',
      'inventory.transfers.records': '调拨记录',
      'inventory.count.title': '盘点管理',
      'inventory.count.scan': 'RFID/条码扫描',
      'inventory.count.differences': '盘点差异',
      'inventory.count.history': '盘点历史',
      
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