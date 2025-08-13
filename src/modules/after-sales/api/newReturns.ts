import { supabase } from '@/integrations/supabase/client';
import type { ReturnFormData, CustomerLookupResult, WarehouseOption, ProductMapData, AfterSalesReturn } from '../types/newReturn';
import type { ProductLookupItem } from '@/modules/sales-inventory/types';

export const searchCustomersByEmail = async (email: string): Promise<CustomerLookupResult[]> => {
  if (!email.trim()) return [];
  
  const { data, error } = await supabase
    .from('customers')
    .select('id, first_name, last_name, email')
    .ilike('email', `%${email}%`)
    .limit(10);

  if (error) {
    console.error('Error searching customers:', error);
    throw error;
  }

  return (data || []).map(customer => {
    const fullName = [customer.first_name, customer.last_name].filter(Boolean).join(' ').trim();
    return {
      id: customer.id,
      name: fullName,
      email: customer.email,
      customerFirst: customer.first_name || '',
      customerLast: customer.last_name || '',
    };
  });
};

export const getWarehouses = async (): Promise<WarehouseOption[]> => {
  // For now, return a mock warehouse since we don't have a warehouses table
  // This would normally query a warehouses table
  return [
    { value: '11111111-1111-1111-1111-111111111111', label: 'Main Warehouse' },
    { value: '22222222-2222-2222-2222-222222222222', label: 'Secondary Warehouse' },
  ];
};

export const getCustomerPurchaseHistory = async (customerEmail: string): Promise<ProductLookupItem[]> => {
  if (!customerEmail.trim()) return [];
  
  try {
    // Get all sales orders for this customer with their items and order totals
    const { data: orders, error } = await supabase
      .from('sales_orders')
      .select(`
        id,
        order_number,
        order_date,
        status,
        total_amount,
        discount_amount,
        tax_amount,
        warranty_amount,
        other_fee,
        accessory,
        other_services,
        walk_in_delivery,
        sales_order_items (
          id,
          product_id,
          quantity,
          unit_price,
          total_amount,
          products:product_id (
            id,
            sku,
            product_name,
            price,
            cost
          )
        )
      `)
      .eq('customer_email', customerEmail)
      .neq('status', 'cancelled')
      .order('order_date', { ascending: false });

    if (error) {
      console.error('Error fetching customer purchase history:', error);
      throw error;
    }

    if (!orders || orders.length === 0) {
      return [];
    }

    // Extract unique products from all orders, but keep order-level information
    const productMap = new Map<string, ProductLookupItem>();
    
    orders.forEach(order => {
      if (order.sales_order_items) {
        order.sales_order_items.forEach((item: any) => {
          const product = item.products;
          if (product) {
            // Use a composite key: product_id + order_id to allow same product from different orders
            const key = `${product.id}_${order.id}`;
            if (!productMap.has(key)) {
              productMap.set(key, {
                id: product.id,
                sku: product.sku,
                productName: product.product_name,
                price: product.price || 0,
                cost: product.cost || 0,
                availableStock: 0, // Not relevant for returns
                // Add purchase info for better display
                lastPurchaseDate: order.order_date,
                orderNumber: order.order_number,
                quantityPurchased: item.quantity,
                unitPrice: item.unit_price,
                // Add order-level information for calculating total refund
                orderId: order.id,
                orderGrandTotal: order.total_amount || 0,
                orderItemsCount: order.sales_order_items?.length || 1,
                // Individual item's share of the order total
                itemTotalAmount: item.total_amount
              });
            }
          }
        });
      }
    });

    return Array.from(productMap.values()).sort((a, b) => 
      new Date(b.lastPurchaseDate || 0).getTime() - new Date(a.lastPurchaseDate || 0).getTime()
    );
  } catch (error) {
    console.error('Error in getCustomerPurchaseHistory:', error);
    throw error;
  }
};

export const searchProducts = async (search: string): Promise<ProductLookupItem[]> => {
  console.log('Searching for products with query:', search);
  
  let query = supabase
    .from('products')
    .select(`
      id,
      sku,
      product_name,
      price,
      inventory (
        quantity,
        reserved_quantity
      )
    `)
    .eq('is_active', true)
    .limit(20);

  // Only apply search filter if search term is provided
  if (search && search.trim()) {
    query = query.or(`sku.ilike.%${search}%,product_name.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching products:', error);
    throw error;
  }

  console.log('Raw product data from database:', data);

  const products = (data || [])
    .map(product => {
      const inventory = product.inventory?.[0];
      const availableStock = inventory ? (inventory.quantity || 0) - (inventory.reserved_quantity || 0) : 0;
      
      return {
        id: product.id,
        sku: product.sku,
        productName: product.product_name,
        price: product.price || 0,
        availableStock: Math.max(0, availableStock)
      };
    })
    .sort((a, b) => b.availableStock - a.availableStock);

  console.log('Processed products:', products);
  return products;
};

export const getProductMapPrice = async (productId: string): Promise<ProductMapData> => {
  const { data, error } = await supabase
    .from('products')
    .select('map_price')
    .eq('id', productId)
    .single();

  if (error) {
    console.error('Error fetching MAP price:', error);
    throw error;
  }

  return {
    mapPrice: data?.map_price || 0,
  };
};

export const createAfterSalesReturn = async (returnData: ReturnFormData): Promise<AfterSalesReturn> => {
  // Get current user's store ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('store_id')
    .eq('user_id', user.id)
    .single();

  if (!profile?.store_id) throw new Error('Store not found for user');

  // Create the return record
  const insertData: any = {
    store_id: profile.store_id,
    return_date: returnData.returnDate.toISOString().split('T')[0],
    return_type: returnData.returnType,
    warehouse_id: returnData.warehouseId || null,
    customer_email: returnData.customerEmail || null,
    customer_first: returnData.customerFirst || null,
    customer_last: returnData.customerLast || null,
    product_id: returnData.productId,
    reason: returnData.reason,
    refund_amount: returnData.refundAmount,
  };

  // Only add new columns if they are provided (to avoid errors if columns don't exist yet)
  if (returnData.status) insertData.status = returnData.status;
  if (returnData.selfScraped !== undefined) insertData.self_scraped = returnData.selfScraped;
  if (returnData.mapPrice !== undefined) insertData.map_price = returnData.mapPrice;
  if (returnData.totalAmountPaid !== undefined) insertData.total_amount_paid = returnData.totalAmountPaid;

  const { data, error } = await supabase
    .from('after_sales_returns')
    .insert([insertData])
    .select()
    .single();

  if (error) {
    console.error('Error creating return:', error);
    throw error;
  }

  // Handle stock adjustment
  if (returnData.returnType === 'store') {
    // Get current inventory to increment
    const { data: inventoryData, error: fetchError } = await supabase
      .from('inventory')
      .select('quantity')
      .eq('product_id', returnData.productId)
      .eq('store_id', profile.store_id)
      .single();

    if (!fetchError && inventoryData) {
      const { error: inventoryError } = await supabase
        .from('inventory')
        .update({ 
          quantity: inventoryData.quantity + 1,
          updated_at: new Date().toISOString()
        })
        .eq('product_id', returnData.productId)
        .eq('store_id', profile.store_id);

      if (inventoryError) {
        console.error('Error adjusting inventory:', inventoryError);
      }
    }
  } else if (returnData.returnType === 'warehouse' && returnData.warehouseId) {
    // Get current warehouse inventory to increment
    const { data: warehouseData, error: fetchError } = await supabase
      .from('warehouse_inventory')
      .select('qty_available')
      .eq('warehouse_id', returnData.warehouseId)
      .single();

    if (!fetchError && warehouseData) {
      const { error: warehouseInventoryError } = await supabase
        .from('warehouse_inventory')
        .update({ 
          qty_available: warehouseData.qty_available + 1,
          updated_at: new Date().toISOString()
        })
        .eq('warehouse_id', returnData.warehouseId);

      if (warehouseInventoryError) {
        console.error('Error adjusting warehouse inventory:', warehouseInventoryError);
      }
    }
  }

  const createdItem = data as any;
  return {
    id: createdItem.id,
    storeId: createdItem.store_id,
    returnDate: createdItem.return_date,
    returnType: createdItem.return_type as 'store' | 'warehouse',
    warehouseId: createdItem.warehouse_id,
    customerEmail: createdItem.customer_email,
    customerFirst: createdItem.customer_first,
    customerLast: createdItem.customer_last,
    productId: createdItem.product_id,
    reason: createdItem.reason,
    refundAmount: Number(createdItem.refund_amount),
    createdAt: createdItem.created_at,
    updatedAt: createdItem.updated_at,
    // New columns with safe fallbacks
    approvalMonth: createdItem.approval_month || undefined,
    status: (createdItem.status as 'processing' | 'failed' | 'approved') || 'processing',
    selfScraped: Boolean(createdItem.self_scraped) || false,
    mapPrice: createdItem.map_price ? Number(createdItem.map_price) : undefined,
    totalAmountPaid: createdItem.total_amount_paid ? Number(createdItem.total_amount_paid) : undefined,
  };
};

export const getAfterSalesReturnById = async (returnId: string): Promise<AfterSalesReturn | null> => {
  const { data, error } = await supabase
    .from('after_sales_returns')
    .select('*')
    .eq('id', returnId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching return:', error);
    throw error;
  }

  if (!data) return null;

  // Fetch product details separately
  const { data: productData } = await supabase
    .from('products')
    .select('sku, product_name, price')
    .eq('id', data.product_id)
    .maybeSingle();

  const dataItem = data as any;
  return {
    id: dataItem.id,
    storeId: dataItem.store_id,
    returnDate: dataItem.return_date,
    returnType: dataItem.return_type as 'store' | 'warehouse',
    warehouseId: dataItem.warehouse_id,
    customerEmail: dataItem.customer_email,
    customerFirst: dataItem.customer_first,
    customerLast: dataItem.customer_last,
    productId: dataItem.product_id,
    reason: dataItem.reason,
    refundAmount: Number(dataItem.refund_amount),
    createdAt: dataItem.created_at,
    updatedAt: dataItem.updated_at,
    // New columns with safe fallbacks
    approvalMonth: dataItem.approval_month || undefined,
    status: (dataItem.status as 'processing' | 'failed' | 'approved') || 'processing',
    selfScraped: Boolean(dataItem.self_scraped) || false,
    mapPrice: dataItem.map_price ? Number(dataItem.map_price) : undefined,
    totalAmountPaid: dataItem.total_amount_paid ? Number(dataItem.total_amount_paid) : undefined,
    product: productData ? {
      sku: productData.sku,
      productName: productData.product_name,
      price: productData.price || 0,
    } : undefined,
  };
};

export const getAllAfterSalesReturns = async (): Promise<AfterSalesReturn[]> => {
  // Get current user's store ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('store_id')
    .eq('user_id', user.id)
    .single();

  if (!profile?.store_id) throw new Error('Store not found for user');

  const { data, error } = await supabase
    .from('after_sales_returns')
    .select('*')
    .eq('store_id', profile.store_id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching returns:', error);
    throw error;
  }

  // Fetch product information for all returns
  const productIds = (data || []).map(item => item.product_id);
  const uniqueProductIds = [...new Set(productIds)];
  
  const { data: productsData } = await supabase
    .from('products')
    .select('id, sku, product_name, price')
    .in('id', uniqueProductIds);

  const productsMap = new Map();
  (productsData || []).forEach(product => {
    productsMap.set(product.id, {
      sku: product.sku,
      productName: product.product_name,
      price: product.price || 0,
    });
  });

  return (data || []).map((item: any) => ({
    id: item.id,
    storeId: item.store_id,
    returnDate: item.return_date,
    returnType: item.return_type as 'store' | 'warehouse',
    warehouseId: item.warehouse_id,
    customerEmail: item.customer_email,
    customerFirst: item.customer_first,
    customerLast: item.customer_last,
    productId: item.product_id,
    reason: item.reason,
    refundAmount: Number(item.refund_amount),
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    // New columns with safe fallbacks
    approvalMonth: item.approval_month || undefined,
    status: (item.status as 'processing' | 'failed' | 'approved') || 'processing',
    selfScraped: Boolean(item.self_scraped) || false,
    mapPrice: item.map_price ? Number(item.map_price) : undefined,
    totalAmountPaid: item.total_amount_paid ? Number(item.total_amount_paid) : undefined,
    product: productsMap.get(item.product_id),
  }));
};