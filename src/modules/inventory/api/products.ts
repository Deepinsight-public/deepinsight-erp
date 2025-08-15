import { supabase } from '@/integrations/supabase/client';
import type { Product, ProductFilters, ProductsListResponse, ProductType } from '../types/products';

export const productsApi = {
  async getProducts(filters?: ProductFilters): Promise<ProductsListResponse> {
    const {
      searchTerm,
      productType,
      brand,
      priceMin,
      priceMax,
      page = 1,
      limit = 20
    } = filters || {};

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('delete', false) // Only active products
      .order('updated_at', { ascending: false });

    // Apply search filter
    if (searchTerm && searchTerm.trim()) {
      query = query.or(`model.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,kw_code.ilike.%${searchTerm}%`);
    }

    // Apply product type filter
    if (productType && productType !== 'all') {
      query = query.eq('product_type', productType);
    }

    // Apply brand filter
    if (brand && brand.trim()) {
      query = query.ilike('brand', `%${brand}%`);
    }

    // Apply price range filter
    if (priceMin !== undefined) {
      query = query.gte('map_price', priceMin);
    }
    if (priceMax !== undefined) {
      query = query.lte('map_price', priceMax);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }

    const products: Product[] = (data || []).map(product => ({
      id: product.id,
      brand: product.brand,
      model: product.model,
      kwCode: product.kw_code,
      description: product.description,
      mapPrice: Number(product.map_price) || 0,
      productType: product.product_type || 'OTHER',
      dimensions: product.dimensions,
      features: product.features,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
      delete: product.delete,
      delete_by: product.delete_by,
      delete_on: product.delete_on,
    }));

    const totalPages = Math.ceil((count || 0) / limit);

    return {
      data: products,
      total: count || 0,
      page,
      totalPages
    };
  },

  async getProductById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('delete', false)
      .single();

    if (error) {
      console.error('Error fetching product by ID:', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      brand: data.brand,
      model: data.model,
      kwCode: data.kw_code,
      description: data.description,
      mapPrice: Number(data.map_price) || 0,
      productType: data.product_type || 'OTHER',
      dimensions: data.dimensions,
      features: data.features,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      delete: data.delete,
      delete_by: data.delete_by,
      delete_on: data.delete_on,
    };
  },

  async getBrands(): Promise<string[]> {
    const { data, error } = await supabase
      .from('products')
      .select('brand')
      .eq('delete', false)
      .not('brand', 'is', null);

    if (error) {
      console.error('Error fetching brands:', error);
      return [];
    }

    // Get unique brands
    const brands = [...new Set(data.map(item => item.brand).filter(Boolean))].sort();
    return brands;
  }
};
