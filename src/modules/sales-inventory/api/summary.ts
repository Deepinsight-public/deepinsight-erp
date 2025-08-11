import { supabase } from '@/integrations/supabase/client';
import type { SalesOrderSummary, SalesOrderSummaryFilters, SalesOrderSummaryResponse } from '../types/summary';

async function getUserProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('user_id, store_id')
    .eq('user_id', user.id)
    .single();

  if (error) throw error;
  return profile;
}

export async function fetchSalesOrdersSummary(
  filters: SalesOrderSummaryFilters = {}
): Promise<SalesOrderSummaryResponse> {
  try {
    const profile = await getUserProfile();
    const {
      dateFrom,
      dateTo,
      status,
      storeId,
      customerId,
      paymentStatus,
      q,
      page = 1,
      limit = 50
    } = filters;

    // Build query
    let query = supabase
      .from('sales_orders')
      .select(`
        id,
        order_number,
        order_date,
        store_id,
        customer_name,
        cashier_id,
        status,
        walk_in_delivery,
        total_amount,
        discount_amount,
        tax_amount,
        warranty_amount,
        accessory,
        other_services,
        other_fee,
        sales_order_items(
          quantity,
          unit_price,
          total_amount
        )
      `)
      .eq('store_id', storeId || profile.store_id)
      .order('order_date', { ascending: false })
      .order('created_at', { ascending: false });

    // Apply filters
    if (dateFrom) {
      query = query.gte('order_date', dateFrom);
    }
    if (dateTo) {
      query = query.lte('order_date', dateTo);
    }
    if (status && status.length > 0) {
      query = query.in('status', status);
    }
    // Note: customer_id column doesn't exist in current schema, skipping this filter
    // if (customerId) {
    //   query = query.eq('customer_id', customerId);
    // }
    if (q) {
      query = query.or(`order_number.ilike.%${q}%,customer_name.ilike.%${q}%`);
    }

    // Get total count with a simpler approach
    const { count } = await supabase
      .from('sales_orders')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId || profile.store_id);

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    const { data, error } = await query.range(from, to);

    if (error) throw error;

    // Transform to summary format
    const summaryData: SalesOrderSummary[] = (data || []).map(order => {
      const items = order.sales_order_items || [];
      const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
      const subTotal = items.reduce((sum, item) => sum + item.total_amount, 0);
      
      // Calculate fees
      const accessoryFee = parseFloat(order.accessory?.replace(/[^\d.-]/g, '') || '0');
      const deliveryFee = order.walk_in_delivery === 'delivery' ? 50 : 0; // Default delivery fee
      const otherFee = order.other_fee || 0;
      
      // For now, assume fully paid (in real implementation, query payments table)
      const paidTotal = order.total_amount;
      const balanceAmount = 0;

      return {
        orderId: order.id,
        orderNumber: order.order_number,
        orderDate: order.order_date,
        storeId: order.store_id,
        customerName: order.customer_name,
        cashierId: order.cashier_id,
        orderType: 'retail' as const, // Default since order_type doesn't exist in schema
        status: order.status as SalesOrderSummary['status'],
        walkInDelivery: order.walk_in_delivery,
        itemsCount,
        subTotal,
        discountAmount: order.discount_amount || 0,
        accessoryFee,
        deliveryFee,
        otherFee,
        warrantyAmount: order.warranty_amount || 0,
        taxTotal: order.tax_amount || 0,
        totalAmount: order.total_amount,
        paidTotal,
        balanceAmount,
        productsTotal: subTotal,
        servicesTotal: accessoryFee + otherFee,
      };
    });

    // Apply payment status filter if specified
    let filteredData = summaryData;
    if (paymentStatus) {
      filteredData = summaryData.filter(item => {
        if (paymentStatus === 'paid') return item.balanceAmount <= 0.005;
        if (paymentStatus === 'partial') return item.paidTotal > 0 && item.balanceAmount > 0;
        if (paymentStatus === 'unpaid') return item.paidTotal === 0;
        return true;
      });
    }

    return {
      data: filteredData,
      total: count || 0,
      page,
      limit,
    };
  } catch (error) {
    console.error('Error fetching sales orders summary:', error);
    throw error;
  }
}

export async function fetchSalesOrderSummary(orderId: string): Promise<SalesOrderSummary> {
  try {
    const { data, error } = await supabase
      .from('sales_orders')
      .select(`
        id,
        order_number,
        order_date,
        store_id,
        customer_name,
        cashier_id,
        status,
        walk_in_delivery,
        total_amount,
        discount_amount,
        tax_amount,
        warranty_amount,
        accessory,
        other_services,
        other_fee,
        sales_order_items(
          quantity,
          unit_price,
          total_amount
        )
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;

    const items = data.sales_order_items || [];
    const itemsCount = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
    const subTotal = items.reduce((sum: number, item: any) => sum + item.total_amount, 0);
    
    const accessoryFee = parseFloat(data.accessory?.replace(/[^\d.-]/g, '') || '0');
    const deliveryFee = data.walk_in_delivery === 'delivery' ? 50 : 0;
    const otherFee = data.other_fee || 0;
    
    const paidTotal = data.total_amount;
    const balanceAmount = 0;

    return {
      orderId: data.id,
      orderNumber: data.order_number,
      orderDate: data.order_date,
      storeId: data.store_id,
      customerName: data.customer_name,
      cashierId: data.cashier_id,
      orderType: 'retail' as const, // Default since order_type doesn't exist in schema
      status: data.status as SalesOrderSummary['status'],
      walkInDelivery: data.walk_in_delivery,
      itemsCount,
      subTotal,
      discountAmount: data.discount_amount || 0,
      accessoryFee,
      deliveryFee,
      otherFee,
      warrantyAmount: data.warranty_amount || 0,
      taxTotal: data.tax_amount || 0,
      totalAmount: data.total_amount,
      paidTotal,
      balanceAmount,
      productsTotal: subTotal,
      servicesTotal: accessoryFee + otherFee,
    };
  } catch (error) {
    console.error('Error fetching sales order summary:', error);
    throw error;
  }
}