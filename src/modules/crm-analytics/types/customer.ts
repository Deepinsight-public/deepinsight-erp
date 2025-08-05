export interface Customer {
  id: string;
  customerNumber: string;
  name: string;
  email: string;
  phone: string;
  deliveryAddress: string;
  numberOfOrders: number;
  status: 'active' | 'inactive';
  totalSpent: number;
  lastOrderDate: string;
}

export interface CustomerFilters {
  search?: string;
  status?: string;
  minOrders?: number;
}