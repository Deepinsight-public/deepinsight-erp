// Inventory management types
export interface InventoryItem {
  id: string;
  epc: string;
  a4lCode: string;
  serialNo?: string;
  status: 'in_stock' | 'in_transit' | 'pending' | 'sold' | 'returned' | 'scrapped';
  currentStoreId?: string;
  gradeLabel?: string;
  productId: string;
  loadDate?: string;
  createdAt: string;
  updatedAt: string;
  // Product info joined
  productName?: string;
  brand?: string;
  model?: string;
  sku?: string;
  barcode?: string;
  cost?: number; // Hidden for store employees
  price?: number;
}

export interface ItemEvent {
  id: string;
  itemId: string;
  type: string;
  docType?: string;
  docId?: string;
  docNo?: string;
  storeId?: string;
  payload?: any;
  createdById?: string;
  createdAt: string;
}

export interface InventorySearchFilters {
  q?: string;
  by?: 'a4l' | 'kw' | 'model' | 'epc';
  status?: string;
  currentStoreOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface TransferOrder {
  id: string;
  docNo: string;
  kind: string;
  status: 'DRAFT' | 'SUBMITTED' | 'SHIPPED' | 'RECEIVED' | 'CANCELLED';
  fromStoreId: string;
  toStoreId: string;
  reason?: string;
  createdAt: string;
  updatedAt: string;
  // Joined data
  fromStoreName?: string;
  toStoreName?: string;
  itemCount?: number;
}

export interface TransferLine {
  id: string;
  orderId: string;
  itemId: string;
}

export interface CreateTransferRequest {
  toStoreId: string;
  itemEPCs?: string[];
  itemIds?: string[];
  reason?: string;
}

export interface PurchaseRequestItem {
  productId?: string;
  sku?: string;
  productName?: string;
  quantity: number;
  notes?: string;
}

export interface PurchaseRequest {
  id: string;
  storeId: string;
  status: 'pending' | 'approved' | 'cancelled' | 'completed';
  items: PurchaseRequestItem[];
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseRequest {
  items: PurchaseRequestItem[];
  remarks?: string;
}

export interface ScanLogEntry {
  id: string;
  epc: string;
  itemId: string;
  action: 'COUNT_START' | 'COUNT_SCAN' | 'COUNT_CLOSE' | 'TRANSFER_SCAN' | 'RETURN_SCAN';
  docType?: string;
  docId?: string;
  storeId?: string;
  createdAt: string;
}

export interface StockCountSession {
  docId: string;
  status: 'active' | 'completed';
  startTime: string;
  endTime?: string;
  scannedItems: InventoryItem[];
  expectedItems: InventoryItem[];
  variance: {
    missing: InventoryItem[];
    extra: InventoryItem[];
    found: InventoryItem[];
  };
}

export interface CreateScanLogRequest {
  epc: string;
  itemId?: string;
  action: 'COUNT_START' | 'COUNT_SCAN' | 'COUNT_CLOSE';
  docType: 'STOCKCOUNT';
  docId: string;
}

export interface Store {
  id: string;
  storeCode: string;
  storeName: string;
  status: 'active' | 'inactive';
  region?: string;
}

export interface Warehouse {
  id: string;
  warehouseCode: string;
  warehouseName: string;
  status: 'active' | 'inactive';
}