export interface Return {
  id: string;
  returnNumber: string;
  date: string;
  numberOfItems: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  totalMap: number;
  refundAmount: number;
  reason: string;
  orderId?: string;
  customerId?: string;
  customerName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnFilters {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateReturnData {
  orderId: string;
  customerId: string;
  items: Array<{
    productId: string;
    quantity: number;
    reason: string;
  }>;
  reason: string;
  totalMap: number;
  refundAmount: number;
}