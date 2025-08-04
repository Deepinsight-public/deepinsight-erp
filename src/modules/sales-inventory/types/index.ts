export interface SalesOrderDTO {
  id?: string;
  orderNumber?: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  orderDate: string;
  orderType: 'retail' | 'wholesale';
  status: 'draft' | 'submitted' | 'pending' | 'confirmed' | 'shipped' | 'completed' | 'cancelled';
  subTotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  lines: SalesOrderLineDTO[];
}

export interface SalesOrderLineDTO {
  id?: string;
  productId: string;
  sku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  subTotal: number;
}

export interface ProductLookupItem {
  id: string;
  sku: string;
  productName: string;
  price: number;
  availableStock: number;
}

export interface StockLevel {
  sku: string;
  availableStock: number;
  reservedQuantity: number;
}

export interface ListParams {
  search?: string;
  status?: string[];
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface KPIData {
  todaySales: number;
  todayOrderCount: number;
}