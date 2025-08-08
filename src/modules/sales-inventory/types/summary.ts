export interface SalesOrderSummary {
  orderId: string;
  orderNumber: string;
  orderDate: string;
  storeId: string;
  storeName?: string;
  customerId?: string;
  customerName?: string;
  cashierId?: string;
  cashierName?: string;
  orderType: 'retail' | 'wholesale';
  status: 'draft' | 'submitted' | 'pending' | 'confirmed' | 'shipped' | 'completed' | 'cancelled';
  walkInDelivery?: string;
  deliveryDate?: string;
  customerSource?: string;
  
  // Item counts and totals
  itemsCount: number;
  subTotal: number;
  discountAmount: number;
  accessoryFee: number;
  deliveryFee: number;
  otherFee: number;
  warrantyAmount: number;
  warrantyYears?: number;
  taxTotal: number;
  totalAmount: number;
  paidTotal: number;
  balanceAmount: number;
  
  // Optional calculated fields
  productsTotal?: number;
  servicesTotal?: number;
  msrpTotal?: number;
  mapTotal?: number;
  savingsVsMsrp?: number;
  cogsTotal?: number;
  grossProfit?: number;
  marginPct?: number;
  productMapRate?: number;
  invoiceUrl?: string;
  
  // Payment details
  paymentMethod1?: string;
  paymentAmount1?: number;
  paymentMethod2?: string;
  paymentAmount2?: number;
  paymentMethod3?: string;
  paymentAmount3?: number;
}

export interface SalesOrderSummaryFilters {
  dateFrom?: string;
  dateTo?: string;
  status?: string[];
  storeId?: string;
  customerId?: string;
  paymentStatus?: 'paid' | 'partial' | 'unpaid';
  q?: string;
  page?: number;
  limit?: number;
}

export interface DerivedMetrics {
  effectiveTaxRate: number;
  avgItemPrice: number;
  warrantyShare: number;
  savingsPct: number;
  paidPct: number;
  ageDays: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  hasWarranty: boolean;
  feesTotal: number;
  productMapRate: number;
}

export interface SalesOrderSummaryResponse {
  data: SalesOrderSummary[];
  total: number;
  page: number;
  limit: number;
}