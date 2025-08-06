export interface WarehouseInventoryItem {
  id: string;
  warehouseId: string;
  sku: string;
  name: string;
  price: number;
  qtyAvailable: number;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseAllocation {
  id: string;
  warehouseId: string;
  sku: string;
  qtyTotal: number;
  qtyLeft: number;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseTurn {
  id: string;
  warehouseId: string;
  currentStoreId: string;
  roundNumber: number;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseRequestItem {
  sku: string;
  qty: number;
}

export interface PurchaseRequest {
  id: string;
  storeId: string;
  warehouseId: string;
  allocationId: string;
  items: PurchaseRequestItem[];
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseSubmitItem {
  inventoryId: string;
  qty: number;
}

export interface CreatePurchaseRequestDTO {
  warehouseId: string;
  allocationId: string;
  items: PurchaseRequestItem[];
}

export interface PurchaseSubmitDTO {
  warehouseId: string;
  items: PurchaseSubmitItem[];
}

export interface QueuePosition {
  storeId: string;
  storeName: string;
  position: number;
}

export interface PurchaseQueue {
  currentStoreId: string;
  roundNumber: number;
  queue: QueuePosition[];
  yourPosition: number;
  allocations: WarehouseAllocation[];
  warehouseInventory: WarehouseInventoryItem[];
}

export interface PurchaseRequestListParams {
  warehouseId?: string;
  status?: string;
  limit?: number;
  page?: number;
}