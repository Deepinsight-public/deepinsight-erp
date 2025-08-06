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
  cost?: number;
  estimatedCompletion?: string;
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
  productId: string;
  customerId: string;
  type: 'warranty' | 'paid' | 'goodwill';
  description: string;
  cost?: number;
  estimatedCompletion?: string;
}