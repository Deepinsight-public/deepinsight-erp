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
        customer_source,
        cashier_id,
        warranty_years,
        status,
        walk_in_delivery,
        total_amount,
        discount_amount,
        tax_amount,
        warranty_amount,
        accessory,
        other_services,
        other_fee,
        payment_methods,
        payment_method1,
        payment_amount1,
        payment_method2,
        payment_amount2,
        payment_method3,
        payment_amount3,
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
      // include from start of day
      query = query.gte('order_date', `${dateFrom}T00:00:00.000Z`);
    }
    if (dateTo) {
      // include entire end day by comparing to next day's 00:00 (half-open interval)
      const nextDay = new Date(`${dateTo}T00:00:00.000Z`);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      query = query.lt('order_date', nextDay.toISOString());
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
      .eq('store_id', storeId || profile.store_id)
      .gte('order_date', dateFrom ? `${dateFrom}T00:00:00.000Z` : '0001-01-01T00:00:00.000Z')
      .lt('order_date', (() => { if (!dateTo) return '9999-12-31T23:59:59.999Z'; const d = new Date(`${dateTo}T00:00:00.000Z`); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString(); })());
    ;

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    const { data, error } = await query.range(from, to);

    if (error) throw error;



    // Get unique cashier IDs to fetch their names
    const cashierIds = [...new Set((data || [])
      .map(order => order.cashier_id)
      .filter(Boolean)
    )];

    // Fetch cashier names if we have any cashier IDs
    let cashierMap: Record<string, string> = {};
    if (cashierIds.length > 0) {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', cashierIds);

      if (!profileError && profiles) {
        cashierMap = profiles.reduce((acc, profile) => {
          const name = profile.first_name && profile.last_name 
            ? `${profile.first_name} ${profile.last_name}`
            : profile.first_name || profile.last_name || 'Unknown';
          acc[profile.user_id] = name;
          return acc;
        }, {} as Record<string, string>);
      }
    }

    // Transform to summary format
    const summaryData: SalesOrderSummary[] = (data || []).map(order => {
      const items = order.sales_order_items || [];
      const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
      const subTotal = items.reduce((sum, item) => sum + item.total_amount, 0);
      
      // Calculate fees
      const accessoryFee = parseFloat(order.accessory?.replace(/[^\d.-]/g, '') || '0');
      const deliveryFee = order.walk_in_delivery === 'delivery' ? 50 : 0; // Default delivery fee
      const otherFee = order.other_fee || 0;
      
      // Parse payment methods from JSONB or individual fields
      let paymentMethods: Array<{method: string, amount: number, note?: string}> = [];
      
      try {
        if (order.payment_methods) {
          if (typeof order.payment_methods === 'string') {
            paymentMethods = JSON.parse(order.payment_methods);
          } else if (Array.isArray(order.payment_methods)) {
            paymentMethods = order.payment_methods;
          }
        }
      } catch (e) {
        console.warn('Failed to parse payment_methods in summary:', e);
      }
      
      // Fallback to individual payment fields if JSONB is empty
      if (paymentMethods.length === 0) {
        if (order.payment_method1 && order.payment_amount1) {
          paymentMethods.push({ method: order.payment_method1, amount: order.payment_amount1 });
        }
        if (order.payment_method2 && order.payment_amount2) {
          paymentMethods.push({ method: order.payment_method2, amount: order.payment_amount2 });
        }
        if (order.payment_method3 && order.payment_amount3) {
          paymentMethods.push({ method: order.payment_method3, amount: order.payment_amount3 });
        }
      }

      // For now, assume fully paid (in real implementation, query payments table)
      const paidTotal = order.total_amount;
      const balanceAmount = 0;

      // Get cashier name from the lookup map
      const cashierName = order.cashier_id ? cashierMap[order.cashier_id] || 'Unknown Cashier' : null;

      return {
        orderId: order.id,
        orderNumber: order.order_number,
        orderDate: order.order_date,
        storeId: order.store_id,
        customerName: order.customer_name,
        customerSource: order.customer_source,
        cashierId: order.cashier_id,
        cashierName: cashierName,
        warrantyYears: order.warranty_years,
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
        // Add individual payment fields for the table display
        paymentMethod1: paymentMethods[0]?.method || null,
        paymentAmount1: paymentMethods[0]?.amount || null,
        paymentMethod2: paymentMethods[1]?.method || null,
        paymentAmount2: paymentMethods[1]?.amount || null,
        paymentMethod3: paymentMethods[2]?.method || null,
        paymentAmount3: paymentMethods[2]?.amount || null,
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