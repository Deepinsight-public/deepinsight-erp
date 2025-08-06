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
      
      // Auth
      'auth.welcome': 'Welcome to ERP System',
      'auth.description': 'Sign in or register to access the sales order management system',
      'auth.signIn': 'Sign In',
      'auth.signUp': 'Sign Up',
      'auth.email': 'Email',
      'auth.password': 'Password',
      'auth.confirmPassword': 'Confirm Password',
      'auth.name': 'Full Name',
      'auth.role': 'Role',
      'auth.store': 'Store',
      'auth.selectRole': 'Select Role',
      'auth.selectStore': 'Select Store',
      'auth.signingIn': 'Signing in...',
      'auth.signingUp': 'Registering...',
      'auth.passwordMismatch': 'Passwords do not match',
      'auth.nameRequired': 'Name is required',
      'auth.storeRequired': 'Store selection is required for store roles',
      'auth.success': 'Success',
      'auth.signInSuccess': 'Successfully signed in!',
      'auth.signUpSuccess': 'Account created successfully, redirecting...',
      'auth.checkEmail': 'Check your email',
      'auth.checkEmailDesc': 'Account created. Please check your email for confirmation.',
      'auth.emailConfirmation': 'Please check your email and click the confirmation link to activate your account. If you don\'t receive the email, check your spam folder.',
      'auth.enterEmail': 'Please enter your email address first',
      'auth.confirmationResent': 'Confirmation email resent',
      'auth.checkEmailAgain': 'Please check your email',
      'auth.resendConfirmation': 'Resend confirmation email',
      'auth.registrationFailed': 'Registration failed',
      'auth.registrationSuccess': 'Registration Successful',
      'auth.checkEmailToComplete': 'Please check your email and click the confirmation link to complete your registration',
      'auth.emailConfirmationRequired': 'Email confirmation required. Please check your email and click the confirmation link before signing in.',

      // Profile
      'profile.edit.title': 'Edit Profile',
      'profile.edit.name': 'Name',
      'profile.edit.email': 'Email',
      'profile.edit.phone': 'Phone',
      'profile.edit.namePlaceholder': 'Enter your name',
      'profile.edit.emailPlaceholder': 'Enter your email',
      'profile.edit.phonePlaceholder': 'Enter your phone number',
      'profile.edit.nameRequired': 'Name is required',
      'profile.edit.emailInvalid': 'Invalid email address',
      'profile.edit.success': 'Profile updated successfully',
      'profile.edit.error': 'Failed to update profile',

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
      
      // Auth
      'auth.welcome': '欢迎使用ERP系统',
      'auth.description': '登录或注册以访问销售订单管理系统',
      'auth.signIn': '登录',
      'auth.signUp': '注册',
      'auth.email': '邮箱',
      'auth.password': '密码',
      'auth.confirmPassword': '确认密码',
      'auth.name': '姓名',
      'auth.role': '角色',
      'auth.store': '门店',
      'auth.selectRole': '选择角色',
      'auth.selectStore': '选择门店',
      'auth.signingIn': '登录中...',
      'auth.signingUp': '注册中...',
      'auth.passwordMismatch': '密码不匹配',
      'auth.nameRequired': '请输入姓名',
      'auth.storeRequired': '请选择门店',
      'auth.success': '成功',
      'auth.signInSuccess': '登录成功！',
      'auth.signUpSuccess': '账户创建成功，正在跳转...',
      'auth.checkEmail': '请检查邮箱',
      'auth.checkEmailDesc': '账户已创建，请查看邮箱确认链接',
      'auth.emailConfirmation': '请检查您的邮箱并点击确认链接激活账户。如果没有收到邮件，请检查垃圾邮件文件夹。',
      'auth.enterEmail': '请先输入邮箱地址',
      'auth.confirmationResent': '确认邮件已重发',
      'auth.checkEmailAgain': '请检查您的邮箱',
      'auth.resendConfirmation': '重新发送确认邮件',
      'auth.registrationFailed': '注册失败',
      'auth.registrationSuccess': '注册成功',
      'auth.checkEmailToComplete': '请检查您的邮箱并点击确认链接以完成注册',
      'auth.emailConfirmationRequired': '需要邮箱确认。请先检查您的邮箱并点击确认链接，然后再登录。',

      // Profile
      'profile.edit.title': '编辑个人资料',
      'profile.edit.name': '姓名',
      'profile.edit.email': '邮箱',
      'profile.edit.phone': '电话',
      'profile.edit.namePlaceholder': '请输入姓名',
      'profile.edit.emailPlaceholder': '请输入邮箱',
      'profile.edit.phonePlaceholder': '请输入电话号码',
      'profile.edit.nameRequired': '请输入姓名',
      'profile.edit.emailInvalid': '邮箱格式不正确',
      'profile.edit.success': '个人资料更新成功',
      'profile.edit.error': '更新个人资料失败',

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