import { supabase } from '@/integrations/supabase/client';
import type { 
  InventoryItem, 
  InventorySearchFilters,
  ProductInfo
} from '../types';

// Extended types for advanced inventory features
export interface ItemEvent {
  id: string;
  itemId: string;
  type: string;
  docType?: string;
  docId?: string;
  docNo?: string;
  storeId?: string;
  payload?: any;
  createdById?: string;
  createdAt: string;
}

export interface TransferOrderExt {
  id: string;
  docNo: string;
  kind: string;
  status: 'DRAFT' | 'SUBMITTED' | 'SHIPPED' | 'RECEIVED' | 'CANCELLED';
  fromStoreId: string;
  toStoreId: string;
  reason?: string;
  createdAt: string;
  updatedAt: string;
  fromStoreName?: string;
  toStoreName?: string;
  itemCount?: number;
}

export interface PurchaseRequestExt {
  id: string;
  storeId: string;
  status: 'pending' | 'approved' | 'cancelled' | 'completed';
  items: any[];
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Store {
  id: string;
  storeCode: string;
  storeName: string;
  status: 'active' | 'inactive';
  region?: string;
}

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

  // Extended methods for advanced inventory management
  async getItemEvents(itemId: string): Promise<ItemEvent[]> {
    // Mock implementation - would query ItemEvent table
    return [
      {
        id: '1',
        itemId,
        type: 'CREATED',
        docType: 'PURCHASE',
        docNo: 'PO-001',
        storeId: 'store-1',
        createdAt: new Date().toISOString(),
      }
    ];
  },

  async getTransferOut(storeId: string): Promise<TransferOrderExt[]> {
    // Mock implementation - would query TransferOrder table
    return [
      {
        id: '1',
        docNo: 'TRF-OUT-001',
        kind: 'STORE_TO_STORE',
        status: 'DRAFT',
        fromStoreId: storeId,
        toStoreId: 'other-store',
        reason: 'Stock rebalancing',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fromStoreName: 'Current Store',
        toStoreName: 'Other Store',
        itemCount: 5,
      }
    ];
  },

  async getTransferIn(storeId: string): Promise<TransferOrderExt[]> {
    // Mock implementation
    return [];
  },

  async createTransferOut(storeId: string, request: any): Promise<TransferOrderExt> {
    // Mock implementation
    return {
      id: 'new-transfer',
      docNo: `TRF-OUT-${Date.now()}`,
      kind: 'STORE_TO_STORE',
      status: 'DRAFT',
      fromStoreId: storeId,
      toStoreId: request.toStoreId,
      reason: request.reason,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      itemCount: request.itemEPCs?.length || 0,
    };
  },

  async shipTransfer(transferId: string): Promise<void> {
    // Mock implementation
    console.log('Shipping transfer:', transferId);
  },

  async receiveTransfer(transferId: string, itemIds: string[]): Promise<void> {
    // Mock implementation
    console.log('Receiving transfer:', transferId, itemIds);
  },

  async getPurchaseRequests(storeId: string): Promise<PurchaseRequestExt[]> {
    // Mock implementation
    return [
      {
        id: '1',
        storeId,
        status: 'pending',
        items: [],
        remarks: 'Test request',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];
  },

  async createPurchaseRequest(storeId: string, request: any): Promise<PurchaseRequestExt> {
    // Mock implementation
    return {
      id: 'new-request',
      storeId,
      status: 'pending',
      items: request.items,
      remarks: request.remarks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  async createScanLog(storeId: string, request: any): Promise<any> {
    // Mock implementation
    return {
      id: 'scan-log',
      epc: request.epc,
      itemId: request.itemId,
      action: request.action,
      docType: request.docType,
      docId: request.docId,
      storeId,
      createdAt: new Date().toISOString(),
    };
  },

  async getScanLogs(storeId: string, docId?: string): Promise<any[]> {
    // Mock implementation
    return [];
  },

  async getStores(): Promise<Store[]> {
    const { data, error } = await supabase
      .from('stores')
      .select('id, store_code, store_name, status, region')
      .eq('status', 'active')
      .order('store_name');

    if (error) throw error;

    return data?.map(store => ({
      id: store.id,
      storeCode: store.store_code,
      storeName: store.store_name,
      status: store.status as any,
      region: store.region,
    })) || [];
  },

  async getWarehouses(): Promise<Store[]> {
    // Mock warehouses
    return [
      { id: 'wh-1', storeCode: 'WH01', storeName: 'Central Warehouse', status: 'active' },
      { id: 'wh-2', storeCode: 'WH02', storeName: 'Regional Warehouse', status: 'active' },
    ];
  },
};