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
      const availableStock = (inventory?.quantity || 0) - (inventory?.reserved_quantity || 0);
      
      return {
        id: product.id,
        sku: product.sku,
        productName: product.product_name,
        price: product.price || 0,
        availableStock
      };
    })
    .filter(product => product.availableStock >= 0) // Show products even with 0 stock
    .sort((a, b) => b.availableStock - a.availableStock);

  console.log('Processed products:', products);
  return products;
};