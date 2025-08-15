import { supabase } from '@/integrations/supabase/client';
import type { ProductSearchItem, ProductSearchParams, ProductSearchResponse } from '../types';

export const searchProducts = async (params: ProductSearchParams): Promise<ProductSearchResponse> => {
  const { 
    kwCode, 
    a4lCode, 
    modelNumber, 
    search,
    storeId,
    storeRegion,
    page = 1, 
    limit = 20 
  } = params;

  // Query products table directly to avoid complex relationship issues
  
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
      is_active
    `, { count: 'exact' })
    .eq('is_active', true);

  // Apply filters to products table
  if (search && search.trim()) {
    query = query.or(`
      sku.ilike.%${search}%,
      product_name.ilike.%${search}%,
      model.ilike.%${search}%
    `);
  }

  if (kwCode && kwCode.trim()) {
    // Search in product category for KW code
    query = query.ilike('category', `%${kwCode}%`);
  }

  if (a4lCode && a4lCode.trim()) {
    // For A4L code search, we'll search in product name or SKU as fallback
    query = query.or(`sku.ilike.%${a4lCode}%,product_name.ilike.%${a4lCode}%`);
  }

  if (modelNumber && modelNumber.trim()) {
    query = query.ilike('model', `%${modelNumber}%`);
  }

  // Note: storeId and storeRegion filters are not applicable for products table
  // In a real implementation, these would require joining with inventory/store tables

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error searching products:', error);
    return {
      data: [],
      total: 0,
      page,
      totalPages: 0
    };
  }

  const searchResults: ProductSearchItem[] = (data || []).map((product, index) => ({
    id: product.id,
    inventoryId: `product-${product.id}`,
    a4lCode: `A4L-${product.sku}-001`, // Generated A4L code
    type: product.category || 'Unknown',
    kwCode: `KW-${product.category?.substring(0,3).toUpperCase() || 'GEN'}`, // Generated KW code
    grade: 'Standard',
    model: product.model || '',
    inStock: true, // Assume in stock for now
    currentStock: 1,
    availableStock: 1,
    mapPrice: product.map_price || product.price || 0,
    sku: product.sku,
    productName: product.product_name,
    storeName: 'Multi-Store Inventory', // Generic since we're showing all stores
    storeCode: 'ALL',
    storeRegion: 'All Regions',
    loadNumber: 'N/A',
    loadInDate: new Date().toISOString(),
    isInStock: true,
    currentLocation: 'Available Across Stores'
  }));

  const totalPages = Math.ceil((count || 0) / limit);

  return {
    data: searchResults,
    total: count || 0,
    page,
    totalPages
  };
};