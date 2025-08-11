// Inventory module i18n keys
export const inventoryI18nKeys = {
  en: {
    // General
    'inventory.title': 'Inventory Management',
    'inventory.description': 'Manage store inventory, transfers, purchases, and stock counts',
    'inventory.noStoreAccess': 'No store access configured',
    'inventory.settings': 'Settings',
    
    // Tabs
    'inventory.tabs.search': 'Inventory Search',
    'inventory.tabs.purchase': 'Purchase Management', 
    'inventory.tabs.transfers': 'Transfer Management',
    'inventory.tabs.counts': 'Stock Count',
    
    // Search
    'inventory.search.searchTerm': 'Search Term',
    'inventory.search.placeholder': 'Search by {type}...',
    'inventory.search.status': 'Status',
    'inventory.search.currentStoreOnly': 'Current Store Only',
    'inventory.search.results': 'Search Results ({count} items)',
    'inventory.search.hint': '→ Scroll horizontally to view more columns',
    
    // Filters
    'inventory.filters.allStatus': 'All Status',
    'inventory.filters.inStock': 'In Stock',
    'inventory.filters.inTransit': 'In Transit',
    'inventory.filters.pending': 'Pending',
    
    // Status
    'inventory.status.in_stock': 'In Stock',
    'inventory.status.in_transit': 'In Transit',
    'inventory.status.pending': 'Pending',
    'inventory.status.sold': 'Sold',
    'inventory.status.returned': 'Returned',
    'inventory.status.scrapped': 'Scrapped',
    
    // Columns
    'inventory.columns.a4lCode': 'A4L Code',
    'inventory.columns.epc': 'EPC',
    'inventory.columns.serial': 'Serial No',
    'inventory.columns.product': 'Product',
    'inventory.columns.grade': 'Grade',
    'inventory.columns.status': 'Status', 
    'inventory.columns.location': 'Location',
    'inventory.columns.daysOnHand': 'Days on Hand',
    
    // Actions
    'inventory.actions.export': 'Export',
    
    // Item Detail
    'inventory.itemDetail.title': 'Item Details: {code}',
    'inventory.itemDetail.a4lCode': 'A4L Code',
    'inventory.itemDetail.epc': 'EPC',
    'inventory.itemDetail.serial': 'Serial Number',
    'inventory.itemDetail.status': 'Status',
    'inventory.itemDetail.productInfo': 'Product Information',
    'inventory.itemDetail.productName': 'Product Name',
    'inventory.itemDetail.brand': 'Brand',
    'inventory.itemDetail.model': 'Model',
    'inventory.itemDetail.sku': 'SKU',
    'inventory.itemDetail.eventsTimeline': 'Events Timeline',
    'inventory.itemDetail.noEvents': 'No events recorded for this item',
    
    // Transfer Management
    'inventory.transfer.title': 'Transfer Management',
    'inventory.transfer.description': 'Manage inventory transfers between stores and warehouses',
    'inventory.transfer.loadError': 'Failed to load transfer data',
    'inventory.transfer.createSuccess': 'Transfer created successfully',
    'inventory.transfer.createError': 'Failed to create transfer',
    'inventory.transfer.shipSuccess': 'Transfer shipped successfully',
    'inventory.transfer.shipError': 'Failed to ship transfer',
    'inventory.transfer.receiveSuccess': 'Transfer received successfully',
    'inventory.transfer.receiveError': 'Failed to receive transfer',
    'inventory.transfer.validationError': 'Please select destination and add items',
    
    // Transfer Tabs
    'inventory.transfer.tabs.transferOut': 'Transfer Out',
    'inventory.transfer.tabs.transferIn': 'Transfer In',
    
    // Transfer Columns
    'inventory.transfer.columns.docNo': 'Document No',
    'inventory.transfer.columns.destination': 'Destination',
    'inventory.transfer.columns.source': 'Source',
    'inventory.transfer.columns.itemCount': 'Items',
    'inventory.transfer.columns.status': 'Status',
    'inventory.transfer.columns.created': 'Created',
    'inventory.transfer.columns.shipped': 'Shipped',
    'inventory.transfer.columns.actions': 'Actions',
    
    // Transfer Status
    'inventory.transfer.status.draft': 'Draft',
    'inventory.transfer.status.submitted': 'Submitted',
    'inventory.transfer.status.shipped': 'Shipped',
    'inventory.transfer.status.received': 'Received',
    'inventory.transfer.status.cancelled': 'Cancelled',
    
    // Transfer Actions
    'inventory.transfer.actions.createOut': 'New Transfer Out',
    'inventory.transfer.actions.ship': 'Ship',
    'inventory.transfer.actions.receive': 'Receive',
    'inventory.transfer.actions.create': 'Create Transfer',
    
    // Transfer Creation
    'inventory.transfer.create.title': 'Create Transfer Out',
    'inventory.transfer.create.destinationType': 'Destination Type',
    'inventory.transfer.create.toStore': 'To Store',
    'inventory.transfer.create.toWarehouse': 'To Warehouse',
    'inventory.transfer.create.destination': 'Destination',
    'inventory.transfer.create.selectDestination': 'Select destination...',
    'inventory.transfer.create.itemEPCs': 'Item EPCs',
    'inventory.transfer.create.epcPlaceholder': 'Enter EPC codes, one per line',
    'inventory.transfer.create.epcHint': 'You can scan barcodes or paste multiple EPCs',
    'inventory.transfer.create.reason': 'Reason (Optional)',
    'inventory.transfer.create.reasonPlaceholder': 'Stock rebalancing, store transfer, etc.',
    
    // Transfer Lists
    'inventory.transfer.out.title': 'Outgoing Transfers',
    'inventory.transfer.out.empty': 'No outgoing transfers',
    'inventory.transfer.in.title': 'Incoming Transfers',
    'inventory.transfer.in.empty': 'No incoming transfers',
    
    // Purchase Management
    'inventory.purchase.title': 'Purchase Management',
    'inventory.purchase.description': 'Create purchase requests and track deliveries',
    'inventory.purchase.loadError': 'Failed to load purchase requests',
    'inventory.purchase.createSuccess': 'Purchase request created successfully',
    'inventory.purchase.createError': 'Failed to create purchase request',
    
    // Purchase Info
    'inventory.purchase.info.title': 'Purchase Request Process',
    'inventory.purchase.info.description': 'Purchase requests are submitted to HQ. Approved items will be delivered via transfer system.',
    
    // Purchase Actions
    'inventory.purchase.actions.create': 'New Purchase Request',
    'inventory.purchase.actions.submit': 'Submit Request',
    'inventory.purchase.actions.trackDelivery': 'Track Delivery',
    
    // Purchase Creation
    'inventory.purchase.create.title': 'Create Purchase Request',
    'inventory.purchase.create.items': 'Requested Items',
    'inventory.purchase.create.sku': 'SKU',
    'inventory.purchase.create.productName': 'Product Name',
    'inventory.purchase.create.productNamePlaceholder': 'Enter product name or description',
    'inventory.purchase.create.quantity': 'Quantity',
    'inventory.purchase.create.notes': 'Notes',
    'inventory.purchase.create.notesPlaceholder': 'Specifications, preferences',
    'inventory.purchase.create.addItem': 'Add Item',
    'inventory.purchase.create.remarks': 'Remarks',
    'inventory.purchase.create.remarksPlaceholder': 'Additional notes for this request...',
    
    // Purchase Columns
    'inventory.purchase.columns.requestId': 'Request ID',
    'inventory.purchase.columns.items': 'Items',
    'inventory.purchase.columns.itemsCount': 'items',
    'inventory.purchase.columns.status': 'Status',
    'inventory.purchase.columns.remarks': 'Remarks',
    'inventory.purchase.columns.created': 'Created',
    'inventory.purchase.columns.actions': 'Actions',
    
    // Purchase Status
    'inventory.purchase.status.pending': 'Pending',
    'inventory.purchase.status.approved': 'Approved',
    'inventory.purchase.status.cancelled': 'Cancelled',
    'inventory.purchase.status.completed': 'Completed',
    
    // Purchase Validation
    'inventory.purchase.validation.noItems': 'Please add at least one item',
    
    // Purchase Lists
    'inventory.purchase.list.title': 'Purchase Requests',
    'inventory.purchase.list.empty': 'No purchase requests',
    
    // Stock Count Management
    'inventory.stockCount.title': 'Stock Count Management',
    'inventory.stockCount.description': 'Perform RFID-based inventory counts and track variances',
    'inventory.stockCount.startSuccess': 'Stock count session started',
    'inventory.stockCount.finishSuccess': 'Stock count completed',
    'inventory.stockCount.finishError': 'Failed to complete stock count',
    'inventory.stockCount.scanError': 'Please start a session and enter EPC',
    'inventory.stockCount.scanSuccess': 'Item scanned successfully',
    'inventory.stockCount.scanFailed': 'Failed to scan item',
    'inventory.stockCount.itemNotFound': 'Item not found: {epc}',
    'inventory.stockCount.alreadyScanned': 'Item already scanned',
    'inventory.stockCount.exportSuccess': 'Variance report exported',
    'inventory.stockCount.noActiveSession': 'No active stock count session',
    
    // Stock Count Tabs
    'inventory.stockCount.tabs.scan': 'Scan & Count',
    'inventory.stockCount.tabs.history': 'History',
    
    // Stock Count Actions
    'inventory.stockCount.actions.start': 'Start Count',
    'inventory.stockCount.actions.finish': 'Finish Count',
    'inventory.stockCount.actions.scan': 'Scan',
    'inventory.stockCount.actions.export': 'Export CSV',
    
    // Stock Count Session
    'inventory.stockCount.session.title': 'Active Session',
    'inventory.stockCount.session.started': 'Started',
    'inventory.stockCount.session.progress': 'Progress',
    'inventory.stockCount.session.active': 'Active',
    'inventory.stockCount.session.completed': 'Completed',
    
    // Stock Count Scan
    'inventory.stockCount.scan.placeholder': 'Scan or enter EPC code...',
    'inventory.stockCount.scan.hint': 'Use keyboard scanner or manually enter EPC codes',
    
    // Stock Count Columns
    'inventory.stockCount.columns.a4lCode': 'A4L Code',
    'inventory.stockCount.columns.epc': 'EPC',
    'inventory.stockCount.columns.product': 'Product',
    'inventory.stockCount.columns.status': 'Status',
    
    // Stock Count Scanned
    'inventory.stockCount.scanned.title': 'Scanned Items ({count})',
    'inventory.stockCount.scanned.empty': 'No items scanned yet',
    
    // Stock Count Variance
    'inventory.stockCount.variance.title': 'Stock Count Variance Report',
    'inventory.stockCount.variance.type': 'Variance Type',
    'inventory.stockCount.variance.found': 'Found',
    'inventory.stockCount.variance.missing': 'Missing',
    'inventory.stockCount.variance.extra': 'Extra',
    'inventory.stockCount.variance.items': 'Variance Items',
    'inventory.stockCount.variance.noVariance': 'No variance detected - perfect count!',
    
    // Stock Count History
    'inventory.stockCount.history.empty': 'No stock count history available',
    
    // Common
    'common.cancel': 'Cancel',
    'common.close': 'Close',
  },
  
  zh: {
    // General
    'inventory.title': '库存管理',
    'inventory.description': '管理门店库存、调拨、采购和盘点',
    'inventory.noStoreAccess': '未配置门店访问权限',
    'inventory.settings': '设置',
    
    // Tabs
    'inventory.tabs.search': '库存查询',
    'inventory.tabs.purchase': '采购管理',
    'inventory.tabs.transfers': '调拨管理', 
    'inventory.tabs.counts': '盘点管理',
    
    // Search
    'inventory.search.searchTerm': '搜索条件',
    'inventory.search.placeholder': '按{type}搜索...',
    'inventory.search.status': '状态',
    'inventory.search.currentStoreOnly': '仅当前门店',
    'inventory.search.results': '搜索结果（{count}项）',
    'inventory.search.hint': '→ 横向滚动查看更多列',
    
    // Filters
    'inventory.filters.allStatus': '全部状态',
    'inventory.filters.inStock': '在库',
    'inventory.filters.inTransit': '在途',
    'inventory.filters.pending': '待处理',
    
    // Status
    'inventory.status.in_stock': '在库',
    'inventory.status.in_transit': '在途',
    'inventory.status.pending': '待处理',
    'inventory.status.sold': '已售',
    'inventory.status.returned': '已退货',
    'inventory.status.scrapped': '已报废',
    
    // Columns
    'inventory.columns.a4lCode': 'A4L编码',
    'inventory.columns.epc': 'EPC',
    'inventory.columns.serial': '序列号',
    'inventory.columns.product': '产品',
    'inventory.columns.grade': '等级',
    'inventory.columns.status': '状态',
    'inventory.columns.location': '位置',
    'inventory.columns.daysOnHand': '在手天数',
    
    // Actions
    'inventory.actions.export': '导出',
    
    // Item Detail
    'inventory.itemDetail.title': '物品详情：{code}',
    'inventory.itemDetail.a4lCode': 'A4L编码',
    'inventory.itemDetail.epc': 'EPC',
    'inventory.itemDetail.serial': '序列号',
    'inventory.itemDetail.status': '状态',
    'inventory.itemDetail.productInfo': '产品信息',
    'inventory.itemDetail.productName': '产品名称',
    'inventory.itemDetail.brand': '品牌',
    'inventory.itemDetail.model': '型号',
    'inventory.itemDetail.sku': 'SKU',
    'inventory.itemDetail.eventsTimeline': '事件时间线',
    'inventory.itemDetail.noEvents': '此物品无事件记录',
    
    // Transfer Management
    'inventory.transfer.title': '调拨管理',
    'inventory.transfer.description': '管理门店和仓库间的库存调拨',
    'inventory.transfer.loadError': '加载调拨数据失败',
    'inventory.transfer.createSuccess': '调拨单创建成功',
    'inventory.transfer.createError': '创建调拨单失败',
    'inventory.transfer.shipSuccess': '调拨单发货成功',
    'inventory.transfer.shipError': '调拨单发货失败',
    'inventory.transfer.receiveSuccess': '调拨单签收成功',
    'inventory.transfer.receiveError': '调拨单签收失败',
    'inventory.transfer.validationError': '请选择目的地并添加物品',
    
    // Transfer Tabs
    'inventory.transfer.tabs.transferOut': '调出',
    'inventory.transfer.tabs.transferIn': '调入',
    
    // Transfer Columns
    'inventory.transfer.columns.docNo': '单据号',
    'inventory.transfer.columns.destination': '目的地',
    'inventory.transfer.columns.source': '来源',
    'inventory.transfer.columns.itemCount': '物品数',
    'inventory.transfer.columns.status': '状态',
    'inventory.transfer.columns.created': '创建时间',
    'inventory.transfer.columns.shipped': '发货时间',
    'inventory.transfer.columns.actions': '操作',
    
    // Transfer Status
    'inventory.transfer.status.draft': '草稿',
    'inventory.transfer.status.submitted': '已提交',
    'inventory.transfer.status.shipped': '已发货',
    'inventory.transfer.status.received': '已签收',
    'inventory.transfer.status.cancelled': '已取消',
    
    // Transfer Actions
    'inventory.transfer.actions.createOut': '新建调出',
    'inventory.transfer.actions.ship': '发货',
    'inventory.transfer.actions.receive': '签收',
    'inventory.transfer.actions.create': '创建调拨',
    
    // Transfer Creation
    'inventory.transfer.create.title': '创建调出单',
    'inventory.transfer.create.destinationType': '目的地类型',
    'inventory.transfer.create.toStore': '调至门店',
    'inventory.transfer.create.toWarehouse': '调至仓库',
    'inventory.transfer.create.destination': '目的地',
    'inventory.transfer.create.selectDestination': '选择目的地...',
    'inventory.transfer.create.itemEPCs': '物品EPC',
    'inventory.transfer.create.epcPlaceholder': '输入EPC码，每行一个',
    'inventory.transfer.create.epcHint': '可扫描条码或粘贴多个EPC',
    'inventory.transfer.create.reason': '原因（可选）',
    'inventory.transfer.create.reasonPlaceholder': '库存调配、门店调货等',
    
    // Transfer Lists
    'inventory.transfer.out.title': '调出记录',
    'inventory.transfer.out.empty': '无调出记录',
    'inventory.transfer.in.title': '调入记录',
    'inventory.transfer.in.empty': '无调入记录',
    
    // Purchase Management
    'inventory.purchase.title': '采购管理',
    'inventory.purchase.description': '创建采购申请并跟踪交付',
    'inventory.purchase.loadError': '加载采购申请失败',
    'inventory.purchase.createSuccess': '采购申请创建成功',
    'inventory.purchase.createError': '创建采购申请失败',
    
    // Purchase Info
    'inventory.purchase.info.title': '采购申请流程',
    'inventory.purchase.info.description': '采购申请提交至总部，批准后物品将通过调拨系统配送。',
    
    // Purchase Actions
    'inventory.purchase.actions.create': '新建采购申请',
    'inventory.purchase.actions.submit': '提交申请',
    'inventory.purchase.actions.trackDelivery': '跟踪配送',
    
    // Purchase Creation
    'inventory.purchase.create.title': '创建采购申请',
    'inventory.purchase.create.items': '申请物品',
    'inventory.purchase.create.sku': 'SKU',
    'inventory.purchase.create.productName': '产品名称',
    'inventory.purchase.create.productNamePlaceholder': '输入产品名称或描述',
    'inventory.purchase.create.quantity': '数量',
    'inventory.purchase.create.notes': '备注',
    'inventory.purchase.create.notesPlaceholder': '规格、偏好等',
    'inventory.purchase.create.addItem': '添加物品',
    'inventory.purchase.create.remarks': '备注',
    'inventory.purchase.create.remarksPlaceholder': '此申请的额外说明...',
    
    // Purchase Columns
    'inventory.purchase.columns.requestId': '申请编号',
    'inventory.purchase.columns.items': '物品',
    'inventory.purchase.columns.itemsCount': '项',
    'inventory.purchase.columns.status': '状态',
    'inventory.purchase.columns.remarks': '备注',
    'inventory.purchase.columns.created': '创建时间',
    'inventory.purchase.columns.actions': '操作',
    
    // Purchase Status
    'inventory.purchase.status.pending': '待处理',
    'inventory.purchase.status.approved': '已批准',
    'inventory.purchase.status.cancelled': '已取消',
    'inventory.purchase.status.completed': '已完成',
    
    // Purchase Validation
    'inventory.purchase.validation.noItems': '请至少添加一项物品',
    
    // Purchase Lists
    'inventory.purchase.list.title': '采购申请',
    'inventory.purchase.list.empty': '无采购申请',
    
    // Stock Count Management
    'inventory.stockCount.title': '盘点管理',
    'inventory.stockCount.description': '执行基于RFID的库存盘点并跟踪差异',
    'inventory.stockCount.startSuccess': '盘点会话已开始',
    'inventory.stockCount.finishSuccess': '盘点已完成',
    'inventory.stockCount.finishError': '完成盘点失败',
    'inventory.stockCount.scanError': '请开始会话并输入EPC',
    'inventory.stockCount.scanSuccess': '物品扫描成功',
    'inventory.stockCount.scanFailed': '物品扫描失败',
    'inventory.stockCount.itemNotFound': '未找到物品：{epc}',
    'inventory.stockCount.alreadyScanned': '物品已扫描',
    'inventory.stockCount.exportSuccess': '差异报告已导出',
    'inventory.stockCount.noActiveSession': '无活动盘点会话',
    
    // Stock Count Tabs
    'inventory.stockCount.tabs.scan': '扫描盘点',
    'inventory.stockCount.tabs.history': '历史记录',
    
    // Stock Count Actions
    'inventory.stockCount.actions.start': '开始盘点',
    'inventory.stockCount.actions.finish': '完成盘点',
    'inventory.stockCount.actions.scan': '扫描',
    'inventory.stockCount.actions.export': '导出CSV',
    
    // Stock Count Session
    'inventory.stockCount.session.title': '活动会话',
    'inventory.stockCount.session.started': '开始时间',
    'inventory.stockCount.session.progress': '进度',
    'inventory.stockCount.session.active': '活动中',
    'inventory.stockCount.session.completed': '已完成',
    
    // Stock Count Scan
    'inventory.stockCount.scan.placeholder': '扫描或输入EPC码...',
    'inventory.stockCount.scan.hint': '使用键盘扫描器或手动输入EPC码',
    
    // Stock Count Columns
    'inventory.stockCount.columns.a4lCode': 'A4L编码',
    'inventory.stockCount.columns.epc': 'EPC',
    'inventory.stockCount.columns.product': '产品',
    'inventory.stockCount.columns.status': '状态',
    
    // Stock Count Scanned
    'inventory.stockCount.scanned.title': '已扫描物品（{count}）',
    'inventory.stockCount.scanned.empty': '尚未扫描任何物品',
    
    // Stock Count Variance
    'inventory.stockCount.variance.title': '盘点差异报告',
    'inventory.stockCount.variance.type': '差异类型',
    'inventory.stockCount.variance.found': '已找到',
    'inventory.stockCount.variance.missing': '缺失',
    'inventory.stockCount.variance.extra': '多余',
    'inventory.stockCount.variance.items': '差异物品',
    'inventory.stockCount.variance.noVariance': '无差异检测 - 完美盘点！',
    
    // Stock Count History
    'inventory.stockCount.history.empty': '无盘点历史记录',
    
    // Common
    'common.cancel': '取消',
    'common.close': '关闭',
  }
};