import { supabase } from '@/integrations/supabase/client';
import type { ProductLookupItem } from '../types';

export interface AvailableProduct {
  productId: string;
  sku: string;
  name: string;
  price: number;
  stockQty: number;
}

export const searchAvailableProducts = async (search: string): Promise<ProductLookupItem[]> => {
  console.log('🔍 searchAvailableProducts called with query:', search);
  
  // Get current user profile to filter by store
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  console.log('👤 Current user ID:', user.id);

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('store_id')
    .eq('user_id', user.id)
    .single();

  if (profileError) {
    console.error('❌ Profile error:', profileError);
    throw profileError;
  }
  console.log('🏪 Current store ID:', profile.store_id);
  
  let query = supabase
    .from('inventory')
    .select(`
      product_id,
      quantity,
      reserved_quantity,
      store_id,
      products!inner (
        id,
        sku,
        product_name,
        price,
        cost,
        map_price,
        is_new,
        is_active
      )
    `)
    .eq('store_id', profile.store_id)
    .eq('products.is_active', true)
    .limit(500);

  // Only apply search filter if search term is provided
  if (search && search.trim()) {
    query = query.or(`products.sku.ilike.%${search}%,products.product_name.ilike.%${search}%`);
    console.log('🔍 Applied search filter for:', search);
  }

  console.log('🗄️ About to execute query with store_id:', profile.store_id);
  const { data, error } = await query;
  console.log('📊 Query completed. Error:', error, 'Data length:', data?.length);

  if (error) {
    console.error('Error fetching products:', error);
    throw error;
  }

  console.log('📦 Raw inventory data from database:', data?.length, 'inventory records found');
  console.log('📦 Raw inventory data details:', data?.map(inv => ({ 
    product_id: inv.product_id,
    quantity: inv.quantity,
    reserved_quantity: inv.reserved_quantity,
    store_id: inv.store_id,
    product: inv.products
  })));

  const products = (data || [])
    .map(inventoryRecord => {
      const product = inventoryRecord.products;
      const availableStock = (inventoryRecord.quantity || 0) - (inventoryRecord.reserved_quantity || 0);
      
      return {
        id: product.id,
        sku: product.sku,
        productName: product.product_name,
        price: product.price || 0,
        cost: product.cost || 0,
        mapPrice: product.map_price || 0,
        isNew: product.is_new || false,
        availableStock: Math.max(0, availableStock) // Ensure non-negative
      };
    })
    // Sort by availability first (in stock first), then by name
    .sort((a, b) => {
      if (a.availableStock > 0 && b.availableStock === 0) return -1;
      if (a.availableStock === 0 && b.availableStock > 0) return 1;
      if (a.availableStock !== b.availableStock) return b.availableStock - a.availableStock;
      return a.productName.localeCompare(b.productName);
    });

  console.log('✅ Processed products for store', profile.store_id, ':', products.map(p => ({ 
    id: p.id, 
    sku: p.sku, 
    name: p.productName, 
    stock: p.availableStock 
  })));
  return products;
};