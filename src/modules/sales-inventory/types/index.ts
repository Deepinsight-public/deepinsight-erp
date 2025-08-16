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
  deliveryDate?: string;
  actualDeliveryDate?: string;
  accessory?: string;
  otherServices?: string;
  otherFee?: number;
  deliveryFee?: number;
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
  presale?: boolean;
  // Tax Settings
  separateTaxRates?: boolean;
  uniformTaxRate?: number;
  servicesTaxRate?: number;
  warrantyTaxRate?: number;
  accessoryTaxRate?: number;
  deliveryTaxRate?: number;
  otherFeeTaxRate?: number;
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
  a4lCodes?: string[];
  kwCodes?: string[];
}

export interface ProductLookupItem {
  id: string;
  sku: string;
  productName: string;
  price: number;
  cost?: number;
  availableStock: number;
  mapPrice?: number;
  isNew?: boolean;
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
  // Extended order information for enhanced returns display
  storeInvoiceNumber?: string;
  orderStatus?: string;
  discountAmount?: number;
  taxAmount?: number;
  warrantyAmount?: number;
  otherFee?: number;
  totalPaid?: number;
  balance?: number;
  paymentMethods?: Array<{method: string, amount: number}>;
  // All items in this order for detailed display
  orderItems?: Array<{
    productId: string;
    sku: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    discountAmount: number;
    cost: number;
  }>;
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