import { supabase } from '@/integrations/supabase/client';

export interface ProductOption {
  value: string;
  label: string;
  id: string;
  sku: string;
  productName: string;
  brand?: string;
  model?: string;
  price?: number;
}

export async function searchProducts(query: string): Promise<ProductOption[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, sku, product_name, brand, model, price')
      .or(`sku.ilike.%${query}%,product_name.ilike.%${query}%,brand.ilike.%${query}%,model.ilike.%${query}%`)
      .eq('is_active', true)
      .order('product_name')
      .limit(20);

    if (error) {
      console.error('Error searching products:', error);
      throw error;
    }

    return (data || []).map(product => ({
      value: product.id,
      label: `${product.sku} - ${product.product_name}${product.brand ? ` (${product.brand}${product.model ? ` ${product.model}` : ''})` : ''}`,
      id: product.id,
      sku: product.sku,
      productName: product.product_name,
      brand: product.brand || undefined,
      model: product.model || undefined,
      price: product.price || undefined,
    }));
  } catch (error) {
    console.error('Error in searchProducts:', error);
    return [];
  }
}

export async function getProductById(id: string) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error getting product:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getProductById:', error);
    throw error;
  }
}