import { supabase } from '@/integrations/supabase/client';
import type { ProductSearchItem, ProductSearchParams, ProductSearchResponse } from '../types';

export const searchProducts = async (params: ProductSearchParams): Promise<ProductSearchResponse> => {
  const { 
    kwCode, 
    a4lCode, 
    modelNumber, 
    search,
    page = 1, 
    limit = 20 
  } = params;

  let query = supabase
    .from('products')
    .select(`
      id,
      sku,
      product_name,
      brand,
      model,
      category,
      price,
      map_price,
      inventory (
        quantity,
        reserved_quantity
      )
    `, { count: 'exact' })
    .eq('is_active', true);

  // Apply filters
  if (search && search.trim()) {
    query = query.or(`sku.ilike.%${search}%,product_name.ilike.%${search}%,model.ilike.%${search}%`);
  }

  if (kwCode && kwCode.trim()) {
    query = query.ilike('sku', `%${kwCode}%`);
  }

  if (a4lCode && a4lCode.trim()) {
    query = query.ilike('sku', `%${a4lCode}%`);
  }

  if (modelNumber && modelNumber.trim()) {
    query = query.ilike('model', `%${modelNumber}%`);
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error searching products:', error);
    throw error;
  }

  const searchResults: ProductSearchItem[] = (data || []).map(product => {
    const inventory = product.inventory?.[0];
    const availableStock = inventory ? (inventory.quantity || 0) - (inventory.reserved_quantity || 0) : 0;
    
    return {
      id: product.id,
      a4lCode: product.sku || '', // Using SKU as A4L Code for now
      type: product.category || 'Unknown',
      kwCode: product.brand || '', // Using brand as KW Code for now
      grade: 'Standard', // Default grade since not in schema
      model: product.model || '',
      inStock: availableStock > 0,
      mapPrice: product.map_price || product.price || 0,
      sku: product.sku,
      productName: product.product_name
    };
  });

  const totalPages = Math.ceil((count || 0) / limit);

  return {
    data: searchResults,
    total: count || 0,
    page,
    totalPages
  };
};