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

export interface CreatePurchaseRequestDTO {
  warehouseId: string;
  allocationId: string;
  items: PurchaseRequestItem[];
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
}

export interface PurchaseRequestListParams {
  warehouseId?: string;
  status?: string;
  limit?: number;
  page?: number;
}