// Inventory Query Types
export interface InventoryItem {
  id: string;
  productId: string;
  a4lCode: string;
  kwCode: string;
  sku: string;
  productName: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  upc?: string;
  currentStock: number;
  allocatedStock: number;
  availableStock: number;
  reservedStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  reorderPoint: number;
  location?: string;
  lastCountedAt?: string;
  status: 'active' | 'discontinued' | 'blocked';
  createdAt: string;
  updatedAt: string;
}

export interface InventorySearchFilters {
  searchTerm?: string;
  a4lCode?: string;
  kwCode?: string;
  status?: string;
  lowStock?: boolean;
  category?: string;
  brand?: string;
  page?: number;
  limit?: number;
}

// Purchase Management Types
export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  storeId: string;
  warehouseId: string;
  status: 'draft' | 'submitted' | 'approved_by_hq' | 'shipped' | 'partially_received' | 'received' | 'closed' | 'canceled';
  items: PurchaseOrderItem[];
  totalAmount: number;
  notes?: string;
  submittedAt?: string;
  approvedAt?: string;
  shippedAt?: string;
  receivedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
  totalCost: number;
  status: 'pending' | 'partially_received' | 'received' | 'canceled';
}

export interface ReceiptConfirmation {
  purchaseOrderId: string;
  items: ReceiptItem[];
  notes?: string;
  receivedBy: string;
}

export interface ReceiptItem {
  itemId: string;
  quantityReceived: number;
  condition: 'good' | 'damaged' | 'defective';
  notes?: string;
}

// Transfer Management Types
export interface TransferOrder {
  id: string;
  transferNumber: string;
  type: 'transfer_out' | 'transfer_in';
  fromStoreId: string;
  toStoreId: string;
  status: 'draft' | 'submitted' | 'approved' | 'shipped' | 'received' | 'canceled';
  items: TransferItem[];
  reason?: string;
  notes?: string;
  requestedBy: string;
  approvedBy?: string;
  shippedAt?: string;
  receivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransferItem {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  quantityRequested: number;
  quantityShipped: number;
  quantityReceived: number;
  condition?: 'good' | 'damaged' | 'defective';
  notes?: string;
}

// Inventory Count Types
export interface InventoryCount {
  id: string;
  countNumber: string;
  storeId: string;
  type: 'full' | 'partial' | 'cycle';
  status: 'draft' | 'in_progress' | 'completed' | 'reviewed' | 'approved';
  scheduledDate: string;
  startedAt?: string;
  completedAt?: string;
  countedBy: string[];
  reviewedBy?: string;
  approvedBy?: string;
  items: InventoryCountItem[];
  adjustments: InventoryAdjustment[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryCountItem {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  systemQuantity: number;
  countedQuantity: number;
  difference: number;
  location?: string;
  countedAt: string;
  countedBy: string;
  scanMethod: 'manual' | 'barcode' | 'rfid';
  notes?: string;
}

export interface InventoryAdjustment {
  id: string;
  productId: string;
  sku: string;
  adjustmentType: 'increase' | 'decrease';
  quantity: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScanQueueItem {
  id: string;
  sku: string;
  quantity: number;
  location?: string;
  scanMethod: 'barcode' | 'rfid';
  scannedAt: string;
  uploaded: boolean;
}

// Product Database Types (Read-only)
export interface ProductInfo {
  id: string;
  sku: string;
  productName: string;
  brand: string;
  model: string;
  category: string;
  subcategory?: string;
  description?: string;
  specifications: Record<string, any>;
  mapPrice: number;
  msrp: number;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  barcode?: string;
  upc?: string;
  images: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}