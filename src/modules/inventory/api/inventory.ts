import { supabase } from '@/integrations/supabase/client';
import type { 
  InventoryItem, 
  InventorySearchFilters,
  ProductInfo
} from '../types';

export const inventoryApi = {
  // 库存查询 (Inventory Query)
  async getInventory(storeId: string, filters?: InventorySearchFilters): Promise<InventoryItem[]> {
    // Simplified query to avoid type issues
    const { data: inventoryData, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('store_id', storeId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    // Get product details separately to avoid join complexity
    const productIds = inventoryData?.map(item => item.product_id) || [];
    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);

    const productsMap = new Map(productsData?.map(p => [p.id, p]) || []);

    return inventoryData?.map(item => {
      const product = productsMap.get(item.product_id);
      return {
        id: item.id,
        productId: item.product_id,
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
      status: 'active',
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    })) || [];
  },
};