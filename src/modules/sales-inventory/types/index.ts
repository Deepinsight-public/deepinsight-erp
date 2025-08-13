export interface SalesOrderDTO {
  id?: string;
  orderNumber?: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  // Customer details (denormalized)
  customerFirst?: string;
  customerLast?: string;
  addrCountry?: string;
  addrState?: string;
  addrCity?: string;
  addrStreet?: string;
  addrZipcode?: string;
  // Order details
  orderDate: string;
  orderType: 'retail' | 'wholesale';
  status: 'draft' | 'submitted' | 'pending' | 'confirmed' | 'shipped' | 'completed' | 'cancelled';
  subTotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  lines: SalesOrderLineDTO[];
  // Extras
  warrantyYears?: number;
  warrantyAmount?: number;
  walkInDelivery?: string;
  accessory?: string;
  otherServices?: string;
  otherFee?: number;
  paymentMethod?: string;
  paymentMethods?: Array<{
    method: string;
    amount: number;
    note?: string;
  }>;
  paymentNote?: string;
  customerSource?: string;
  cashierId?: string;
  storeInvoiceNumber?: string;
  // Meta
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  storeId?: string;
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
  cost?: number;
  availableStock: number;
  // Purchase history fields (optional, used in returns)
  lastPurchaseDate?: string;
  orderNumber?: string;
  quantityPurchased?: number;
  unitPrice?: number;
  // Order-level information for returns
  orderId?: string;
  orderGrandTotal?: number;
  orderItemsCount?: number;
  itemTotalAmount?: number;
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