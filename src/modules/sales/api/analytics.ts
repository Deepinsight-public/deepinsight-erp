import { supabase } from '@/integrations/supabase/client';
import type { SalesOrderDTO, ListParams } from '@/modules/sales-inventory/types';

export interface PivotAnalyticsParams extends ListParams {
  groupBy?: string[];
  aggregateFields?: string[];
}

export const fetchSalesOrdersForPivot = async (params: PivotAnalyticsParams = {}): Promise<SalesOrderDTO[]> => {
  let query = supabase
    .from('sales_orders')
    .select(`
      *,
      sales_order_items (
        id,
        product_id,
        quantity,
        unit_price,
        discount_amount,
        total_amount,
        products:product_id (
          sku,
          product_name
        )
      )
    `)
    .order('created_at', { ascending: false });

  // Apply filters
  if (params.search) {
    query = query.or(`order_number.ilike.%${params.search}%,customer_name.ilike.%${params.search}%,customer_email.ilike.%${params.search}%`);
  }

  if (params.status && params.status.length > 0) {
    query = query.in('status', params.status);
  }

  if (params.dateFrom) {
    query = query.gte('order_date', params.dateFrom);
  }

  if (params.dateTo) {
    query = query.lte('order_date', params.dateTo);
  }

  // Apply pagination with higher limit for analytics
  const limit = params.limit || 10000;
  if (params.page) {
    const offset = (params.page - 1) * limit;
    query = query.range(offset, offset + limit - 1);
  } else {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(order => ({
    id: order.id,
    orderNumber: order.order_number,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone,
    orderDate: order.order_date,
    status: (order.status as "draft" | "submitted" | "pending" | "confirmed" | "shipped" | "completed" | "cancelled") || 'draft',
    orderType: 'retail' as const, // Default order type
    totalAmount: order.total_amount,
    discountAmount: order.discount_amount || 0,
    taxAmount: order.tax_amount || 0,
    subTotal: order.total_amount - (order.tax_amount || 0),
    paymentMethod: order.payment_method,
    customerSource: order.customer_source,
    // Additional fields for DTO compatibility
    customerFirst: order.customer_first || '',
    customerLast: order.customer_last || '',
    addrCountry: order.addr_country || '',
    addrState: order.addr_state || '',
    addrCity: order.addr_city || '',
    addrStreet: order.addr_street || '',
    addrZipcode: order.addr_zipcode || '',
    warrantyYears: order.warranty_years || 0,
    warrantyAmount: order.warranty_amount || 0,
    walkInDelivery: String(order.walk_in_delivery || false),
    accessory: order.accessory || '',
    otherServices: order.other_services || '',
    otherFee: order.other_fee || 0,
    paymentNote: order.payment_note || '',
    cashierId: order.cashier_id || '',
    lines: (order.sales_order_items || []).map((item: any) => ({
      id: item.id,
      productId: item.product_id,
      sku: item.products?.sku || '',
      productName: item.products?.product_name || '',
      quantity: item.quantity,
      unitPrice: item.unit_price,
      discountPercent: item.discount_amount > 0 ? (item.discount_amount / (item.unit_price * item.quantity)) * 100 : 0,
      subTotal: item.total_amount
    }))
  }));
};

export const fetchPivotMetrics = async (params: PivotAnalyticsParams = {}) => {
  const { data, error } = await supabase
    .from('sales_orders')
    .select(`
      status,
      order_date,
      total_amount,
      customer_source,
      payment_method
    `)
    .gte('order_date', params.dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .lte('order_date', params.dateTo || new Date().toISOString().split('T')[0]);

  if (error) throw error;

  const metrics = {
    totalOrders: data?.length || 0,
    totalRevenue: data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0,
    averageOrderValue: 0,
    statusBreakdown: {} as Record<string, number>,
    sourceBreakdown: {} as Record<string, number>,
    paymentMethodBreakdown: {} as Record<string, number>
  };

  if (metrics.totalOrders > 0) {
    metrics.averageOrderValue = metrics.totalRevenue / metrics.totalOrders;
    
    // Calculate breakdowns
    data?.forEach(order => {
      metrics.statusBreakdown[order.status] = (metrics.statusBreakdown[order.status] || 0) + 1;
      if (order.customer_source) {
        metrics.sourceBreakdown[order.customer_source] = (metrics.sourceBreakdown[order.customer_source] || 0) + 1;
      }
      if (order.payment_method) {
        metrics.paymentMethodBreakdown[order.payment_method] = (metrics.paymentMethodBreakdown[order.payment_method] || 0) + 1;
      }
    });
  }

  return metrics;
};