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
  if (!search.trim()) {
    return [];
  }

  const { data, error } = await supabase
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
    .or(`sku.ilike.%${search}%,product_name.ilike.%${search}%`)
    .eq('is_active', true)
    .not('inventory', 'is', null)
    .limit(20);

  if (error) throw error;

  return (data || [])
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
    .filter(product => product.availableStock > 0)
    .sort((a, b) => b.availableStock - a.availableStock);
};