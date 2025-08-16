import { supabase } from '@/integrations/supabase/client';
import type { 
  InventoryItem, 
  InventorySearchFilters,
  ProductInfo
} from '../types';

export const inventoryApi = {
  // 库存查询 (Inventory Query)
  async getInventory(storeId: string, filters?: InventorySearchFilters): Promise<InventoryItem[]> {
    // Build query with filters
    let query = supabase
      .from('inventory')
      .select('*')
      .eq('store_id', storeId);

    // Apply filters - removed since these fields don't exist on inventory table

    query = query.order('updated_at', { ascending: false });

    const { data: inventoryData, error } = await query;

    if (error) {
      console.error('Inventory query error:', error);
      throw error;
    }

    console.log('Raw inventory data from DB:', inventoryData?.slice(0, 2));

    // Get product details separately to avoid join complexity
    const productIds = inventoryData?.map(item => item.product_id) || [];
    let productsQuery = supabase
      .from('products')
      .select('*')
      .in('id', productIds);

    // Apply product-level filters
    if (filters?.searchTerm) {
      productsQuery = productsQuery.or(`
        sku.ilike.%${filters.searchTerm}%,
        product_name.ilike.%${filters.searchTerm}%,
        brand.ilike.%${filters.searchTerm}%
      `);
    }

    const { data: productsData } = await productsQuery;
    const productsMap = new Map(productsData?.map(p => [p.id, p]) || []);

    return inventoryData?.map(item => {
      const product = productsMap.get(item.product_id);
      
      return {
        id: item.id,
        productId: item.product_id,
        a4lCode: `A4L-${product?.sku || 'UNK'}-001`,
        kwCode: product?.kw_code || `KW-${product?.category?.substring(0,3).toUpperCase() || 'GEN'}`,
        sku: product?.sku || '',
        productName: product?.product_name || '',
        brand: product?.brand,
        model: product?.model,
        currentStock: item.quantity,
        allocatedStock: item.reserved_quantity,
        availableStock: item.quantity - item.reserved_quantity,
        reservedStock: item.reserved_quantity,
        minStockLevel: item.reorder_point,
        maxStockLevel: item.max_stock,
        reorderPoint: item.reorder_point,
        lastCountedAt: item.last_counted_at,
        status: 'active' as const,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      };
    }).filter(item => {
      // Filter out items if product filters don't match and product is missing
      if (filters?.searchTerm && !item.productName) {
        return false;
      }
      return true;
    }) || [];
  },

  async searchProducts(searchTerm: string): Promise<ProductInfo[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`
        sku.ilike.%${searchTerm}%,
        product_name.ilike.%${searchTerm}%,
        model.ilike.%${searchTerm}%,
        barcode.ilike.%${searchTerm}%
      `)
      .eq('is_active', true)
      .limit(20);

    if (error) throw error;

    return data?.map(product => ({
      id: product.id,
      sku: product.sku,
      productName: product.product_name,
      brand: product.brand || '',
      model: product.model || '',
      category: product.category || '',
      description: product.description,
      specifications: {},
      mapPrice: Number(product.map_price) || 0,
      msrp: Number(product.price) || 0,
      barcode: product.barcode,
      images: [],
      isActive: product.is_active,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    })) || [];
  },

  async getLowStockItems(storeId: string): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        *,
        products:product_id (
          sku,
          product_name,
          brand,
          model
        )
      `)
      .eq('store_id', storeId)
      .lt('quantity', 'reorder_point');

    if (error) throw error;

    return data?.map(item => ({
      id: item.id,
      productId: item.product_id,
      a4lCode: `A4L-${item.products?.sku || 'UNK'}-001`,
      kwCode: `KW-GEN`,
      sku: item.products?.sku || '',
      productName: item.products?.product_name || '',
      brand: item.products?.brand,
      model: item.products?.model,
      currentStock: item.quantity,
      allocatedStock: item.reserved_quantity,
      availableStock: item.quantity - item.reserved_quantity,
      reservedStock: item.reserved_quantity,
      minStockLevel: item.reorder_point,
      maxStockLevel: item.max_stock,
      reorderPoint: item.reorder_point,
      lastCountedAt: item.last_counted_at,
      status: 'active' as const,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    })) || [];
  },
};