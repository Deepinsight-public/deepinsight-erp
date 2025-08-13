export interface Repair {
  id: string;
  repairId: string;
  date: string;
  type: 'warranty' | 'paid' | 'goodwill';
  product: {
    id: string;
    name: string;
    sku: string;
  };
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  description: string;
  customerId?: string;
  customerName?: string;
  salesOrderId?: string;
  cost?: number;
  estimatedCompletion?: string;
  warrantyStatus?: string;
  warrantyExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RepairFilters {
  search?: string;
  status?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateRepairData {
  productId?: string;
  customProduct?: string;
  model?: string;
  partsRequired?: string;
  customerId?: string;
  customerName?: string;
  salesOrderId?: string;
  type: string;
  description: string;
  cost?: number;
  estimatedCompletion?: Date;
  warrantyStatus?: string;
  warrantyExpiresAt?: Date;
}