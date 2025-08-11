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
  const { data, error } = await supabase
    .from('after_sales_returns')
    .insert([{
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
    }])
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

  return {
    id: data.id,
    storeId: data.store_id,
    returnDate: data.return_date,
    returnType: data.return_type as 'store' | 'warehouse',
    warehouseId: data.warehouse_id,
    customerEmail: data.customer_email,
    customerFirst: data.customer_first,
    customerLast: data.customer_last,
    productId: data.product_id,
    reason: data.reason,
    refundAmount: Number(data.refund_amount),
    createdAt: data.created_at,
    updatedAt: data.updated_at,
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

  return {
    id: data.id,
    storeId: data.store_id,
    returnDate: data.return_date,
    returnType: data.return_type as 'store' | 'warehouse',
    warehouseId: data.warehouse_id,
    customerEmail: data.customer_email,
    customerFirst: data.customer_first,
    customerLast: data.customer_last,
    productId: data.product_id,
    reason: data.reason,
    refundAmount: Number(data.refund_amount),
    createdAt: data.created_at,
    updatedAt: data.updated_at,
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

  return (data || []).map(item => {
    return {
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
      product: productsMap.get(item.product_id),
    };
  });
};