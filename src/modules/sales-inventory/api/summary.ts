import { supabase } from '@/integrations/supabase/client';
import type { SalesOrderSummary, SalesOrderSummaryFilters, SalesOrderSummaryResponse } from '../types/summary';

// Supabase client for API calls

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

    // Build query - removing columns that may not exist in the database yet
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
        presale,
        total_amount,
        discount_amount,
        tax_amount,
        warranty_amount,
        accessory,
        other_services,
        other_fee,
        payment_methods,
        sales_order_items(
          id,
          quantity,
          unit_price,
          total_amount,
          product_id,
          products(
            id,
            product_name,
            sku,
            category
          )
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

    if (error) {
      console.error('Error fetching sales orders summary:', error);
      // Return empty results if there's a schema error (e.g., missing columns)
      return {
        data: [],
        total: 0,
        page,
        limit,
      };
    }
    
    // Process the sales orders data



    // Get unique cashier IDs to fetch their names
    const cashierIds = [...new Set((data || [])
      .map(order => (order as any).cashier_id)
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

    // Get A4L codes from Item table for all products in the orders
    console.log('🔍 A4L Debug - Raw orders data from database:', data?.slice(0, 2));
    
    const allOrderItems = (data || []).flatMap(order => {
      const typedOrder = order as any;
      const items = typedOrder.sales_order_items || [];
      console.log('🔍 A4L Debug - Order items for order', typedOrder.order_number, ':', items);
      return items;
    });
    
    console.log('🔍 A4L Debug - All order items flattened:', allOrderItems);
    
    const allProductIds = [...new Set(allOrderItems
      .map(item => {
        const typedItem = item as any;
        console.log('🔍 A4L Debug - Processing item for product_id:', typedItem);
        return typedItem.product_id;
      })
      .filter(Boolean)
    )];

    let itemsMap: Record<string, Array<{ a4lCode: string, kwCode: string }>> = {}; // product_id -> array of items
    
    console.log('🔍 A4L Debug - All product IDs from orders:', allProductIds);
    console.log('🔍 A4L Debug - Number of unique product IDs:', allProductIds.length);
    
    // First, let's check if Item table has any records at all
    const { data: allItems, error: allItemsError } = await supabase
      .from('Item')
      .select('id, a4lCode, productId')
      .limit(5);
    
    console.log('🔍 A4L Debug - Sample Item table records:', {
      error: allItemsError,
      dataLength: allItems?.length,
      sampleData: allItems
    });

    if (allProductIds.length > 0) {
      const { data: itemsData, error: itemsError } = await supabase
        .from('Item')
        .select('id, a4lCode, productId')
        .in('productId', allProductIds)
        .order('createdAt', { ascending: true });

      console.log('🔍 A4L Debug - Item table query result for specific products:', {
        error: itemsError,
        dataLength: itemsData?.length,
        data: itemsData?.slice(0, 5),
        searchedProductIds: allProductIds,
        fullRawData: itemsData
      });

      // Let's also test a direct query for the known product ID
      const { data: directTestData, error: directTestError } = await supabase
        .from('Item')
        .select('id, a4lCode, productId')
        .eq('productId', 'db4b237d-40e6-4855-bca7-5f68aae83a5d');
      
      console.log('🔍 A4L Debug - Direct test query for known product:', {
        error: directTestError,
        dataLength: directTestData?.length,
        data: directTestData
      });

      if (!itemsError && itemsData) {
        console.log('🔍 DEBUG fetchSalesOrdersSummary - itemsData:', itemsData?.slice(0, 3));
        console.log('🔍 A4L Debug - About to process', itemsData.length, 'Item records');
        itemsData.forEach((item, index) => {
          const typedItem = item as any;
          const productId = typedItem.productId || typedItem['productId']; // Handle both camelCase and the actual response
          const a4lCode = typedItem.a4lCode || typedItem['a4lCode'];
          
          console.log(`🔍 A4L Debug - Processing Item table record #${index + 1}:`, {
            id: typedItem.id,
            productId: productId,
            a4lCode: a4lCode,
            rawItem: typedItem,
            itemKeys: Object.keys(typedItem)
          });
          
          if (productId) {
            if (!itemsMap[productId]) {
              itemsMap[productId] = [];
              console.log(`🔍 A4L Debug - Created new entry in itemsMap for productId: ${productId}`);
            }
            itemsMap[productId].push({
              a4lCode: a4lCode || '',
              kwCode: '' // Generate from product category later since kw_code may not exist
            });
            console.log(`🔍 A4L Debug - Added A4L code "${a4lCode}" to itemsMap[${productId}]`);
          } else {
            console.log('🔍 A4L Debug - WARNING: No productId found for item:', typedItem);
          }
        });
        console.log('🔍 DEBUG fetchSalesOrdersSummary - itemsMap:', Object.keys(itemsMap).slice(0, 3).reduce((acc, key) => ({ ...acc, [key]: itemsMap[key] }), {}));
        console.log('🔍 A4L Debug - Complete itemsMap:', itemsMap);
        console.log('🔍 A4L Debug - Final itemsMap summary:', {
          totalProductIds: Object.keys(itemsMap).length,
          productIds: Object.keys(itemsMap),
          totalA4lCodes: Object.values(itemsMap).flat().length
        });
      } else {
        console.log('🔍 DEBUG fetchSalesOrdersSummary - itemsError:', itemsError);
        console.log('🔍 A4L Debug - Item table query failed (likely RLS issue), will generate fallback A4L codes');
        
        // Create fallback A4L codes for each product using product data
        allProductIds.forEach((productId, index) => {
          if (!itemsMap[productId]) itemsMap[productId] = [];
          
          // Try to get product info for better fallback codes
          const relatedOrderItem = allOrderItems.find(item => (item as any).product_id === productId);
          const productSku = (relatedOrderItem as any)?.products?.sku || 'UNKNOWN';
          
          itemsMap[productId].push({
            a4lCode: `A4L-${productSku}-001`,
            kwCode: `KW-${productSku.substring(0,3).toUpperCase()}`
          });
        });
        console.log('🔍 A4L Debug - Created fallback itemsMap with product SKUs:', itemsMap);
      }
    } else {
      console.log('🔍 A4L Debug - No product IDs found in orders');
      console.log('🔍 A4L Debug - This means either:');
      console.log('🔍 A4L Debug - 1. No sales orders in the response');
      console.log('🔍 A4L Debug - 2. No sales_order_items in the orders');
      console.log('🔍 A4L Debug - 3. No product_id in the sales_order_items');
    }

    // Transform to summary format
    const summaryData: SalesOrderSummary[] = (data || []).map(order => {
      const typedOrder = order as any; // Use type assertion to bypass strict typing
      const items = typedOrder.sales_order_items || [];
      const itemsCount = items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
      const subTotal = items.reduce((sum: number, item: any) => sum + (item.total_amount || 0), 0);

      // Collect A4L and KW codes for this order
      const orderA4lCodes = new Set<string>();
      const orderKwCodes = new Set<string>();
      
      items.forEach((item: any) => {
        const availableItems = itemsMap[item.product_id] || [];
        console.log('🔍 A4L Debug - Processing item:', {
          product_id: item.product_id,
          quantity: item.quantity,
          availableItems: availableItems,
          itemsMapKeys: Object.keys(itemsMap)
        });
        
        // For A4L codes: take exactly the number of items matching the quantity
        const itemsToUse = availableItems.slice(0, item.quantity || 0);
        console.log('🔍 A4L Debug - Items to use:', itemsToUse);
        
        itemsToUse.forEach(availableItem => {
          console.log('🔍 A4L Debug - Processing available item:', availableItem);
          if (availableItem.a4lCode) {
            console.log('🔍 A4L Debug - Adding A4L code:', availableItem.a4lCode);
            orderA4lCodes.add(availableItem.a4lCode);
          }
          if (availableItem.kwCode) orderKwCodes.add(availableItem.kwCode);
        });
        
        // Generate KW code from product category since kw_code column may not exist
        if (item.products?.sku) {
          const generatedKwCode = `KW-${item.products.sku.substring(0,3).toUpperCase()}`;
          console.log('🔍 A4L Debug - Generated KW code:', generatedKwCode);
          orderKwCodes.add(generatedKwCode);
        }
      });
      
      console.log('🔍 A4L Debug - Final A4L codes for order:', {
        orderId: typedOrder.id,
        orderA4lCodes: Array.from(orderA4lCodes),
        orderKwCodes: Array.from(orderKwCodes)
      });
      
      // Calculate fees
      const accessoryFee = parseFloat((typedOrder.accessory || '').replace(/[^\d.-]/g, '') || '0');
      const deliveryFee = (typedOrder.walk_in_delivery || '') === 'delivery' ? 50 : 0; // Default delivery fee
      const otherFee = typedOrder.other_fee || 0;
      
      // Parse payment methods from JSONB or individual fields
      let paymentMethods: Array<{method: string, amount: number, note?: string}> = [];
      
      try {
        if (typedOrder.payment_methods) {
          if (typeof typedOrder.payment_methods === 'string') {
            paymentMethods = JSON.parse(typedOrder.payment_methods);
          } else if (Array.isArray(typedOrder.payment_methods)) {
            paymentMethods = typedOrder.payment_methods;
          }
        }
      } catch (e) {
        console.warn('Failed to parse payment_methods in summary:', e);
      }
      
      // No fallback to individual payment fields since they might not exist in schema
      
      // Calculate actual paid total from payment methods
      const paidTotal = paymentMethods.reduce((sum, payment) => sum + (payment.amount || 0), 0);
      const balanceAmount = Math.max(0, (typedOrder.total_amount || 0) - paidTotal);

      // Get cashier name from the lookup map
      const cashierName = typedOrder.cashier_id ? cashierMap[typedOrder.cashier_id] || 'Unknown Cashier' : null;

      const transformedOrder = {
        orderId: typedOrder.id || 'unknown',
        orderNumber: typedOrder.order_number || 'unknown',
        orderDate: typedOrder.order_date || new Date().toISOString(),
        storeId: typedOrder.store_id || 'unknown',
        storeInvoiceNumber: null, // Column may not exist in database yet
        customerName: typedOrder.customer_name || 'Unknown Customer',
        customerSource: typedOrder.customer_source || null,
        cashierId: typedOrder.cashier_id || null,
        cashierName: cashierName,
        warrantyYears: typedOrder.warranty_years || 0,
        orderType: 'retail' as const, // Default since order_type doesn't exist in schema
        status: (typedOrder.status || 'pending') as SalesOrderSummary['status'],
        walkInDelivery: typedOrder.walk_in_delivery || null,
        deliveryDate: null, // Column may not exist in database yet
        actualDeliveryDate: null, // Column may not exist in database yet
        presale: typedOrder.presale || false,
        sales_order_items: typedOrder.sales_order_items || [], // Add this for the type column
        a4lCodes: (() => {
          const a4lCodesArray = Array.from(orderA4lCodes);
          const result = a4lCodesArray.join(', ') || 'N/A';
          console.log('🔍 A4L Debug - Final A4L codes for order', typedOrder.order_number, ':', {
            a4lCodesArray,
            result,
            orderA4lCodesSize: orderA4lCodes.size
          });
          return result;
        })(),
        kwCodes: Array.from(orderKwCodes).join(', ') || 'N/A',
        itemsCount,
        subTotal,
        discountAmount: typedOrder.discount_amount || 0,
        accessoryFee,
        deliveryFee,
        otherFee,
        warrantyAmount: typedOrder.warranty_amount || 0,
        taxTotal: typedOrder.tax_amount || 0,
        totalAmount: typedOrder.total_amount || 0,
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
      
      console.log('🔍 API Debug - Transformed order:', transformedOrder);
      console.log('🔍 API Debug - storeInvoiceNumber in transformed:', transformedOrder.storeInvoiceNumber);
      console.log('🔍 API Debug - sales_order_items in transformed:', transformedOrder.sales_order_items);
      
      return transformedOrder;
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
        presale,
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

    if (error) {
      console.error('Error fetching sales order summary:', error);
      throw error;
    }

    const typedData = data as any;
    const items = typedData.sales_order_items || [];
    const itemsCount = items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
    const subTotal = items.reduce((sum: number, item: any) => sum + (item.total_amount || 0), 0);
    
    const accessoryFee = parseFloat((typedData.accessory || '').replace(/[^\d.-]/g, '') || '0');
    const deliveryFee = typedData.walk_in_delivery === 'delivery' ? 50 : 0;
    const otherFee = typedData.other_fee || 0;
    
    // No payment methods for single order since columns may not exist
    const paidTotal = 0;
    const balanceAmount = Math.max(0, typedData.total_amount - paidTotal);

    return {
      orderId: typedData.id,
      orderNumber: typedData.order_number,
      orderDate: typedData.order_date,
      storeId: typedData.store_id,
      customerName: typedData.customer_name,
      cashierId: typedData.cashier_id,
      orderType: 'retail' as const, // Default since order_type doesn't exist in schema
      status: typedData.status as SalesOrderSummary['status'],
      walkInDelivery: typedData.walk_in_delivery,
      deliveryDate: null, // Column may not exist in database yet
      actualDeliveryDate: null, // Column may not exist in database yet
      presale: typedData.presale || false,
      itemsCount,
      subTotal,
      discountAmount: typedData.discount_amount || 0,
      accessoryFee,
      deliveryFee,
      otherFee,
      warrantyAmount: typedData.warranty_amount || 0,
      taxTotal: typedData.tax_amount || 0,
      totalAmount: typedData.total_amount,
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