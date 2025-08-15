import { supabase } from '@/integrations/supabase/client';

interface SyncResult {
  action: string;
  productId: string;
  storeId: string;
  sku: string;
  itemsCreated: number;
  itemsRemoved: number;
}

interface SyncStatus {
  productId: string;
  storeId: string;
  sku: string;
  productName: string;
  inventoryQuantity: number;
  itemCount: number;
  syncStatus: 'synced' | 'needs_sync';
  difference: number;
}

export const inventorySyncApi = {
  /**
   * Perform full inventory to Item table synchronization
   * This ensures each inventory quantity has corresponding individual Item records
   */
  async syncInventoryToItems(): Promise<SyncResult[]> {
    console.log('🔄 Starting inventory to Item sync...');
    
    try {
      const { data, error } = await supabase.rpc('sync_inventory_to_items');
      
      if (error) {
        console.error('❌ Inventory sync error:', error);
        throw error;
      }
      
      const results: SyncResult[] = data?.map((row: any) => ({
        action: row.action,
        productId: row.product_id,
        storeId: row.store_id,
        sku: row.sku,
        itemsCreated: row.items_created,
        itemsRemoved: row.items_removed,
      })) || [];
      
      // Log summary
      const summary = {
        totalProducts: results.length,
        itemsCreated: results.reduce((sum, r) => sum + r.itemsCreated, 0),
        itemsRemoved: results.reduce((sum, r) => sum + r.itemsRemoved, 0),
        alreadySynced: results.filter(r => r.action === 'SYNC').length,
      };
      
      console.log('✅ Inventory sync completed:', summary);
      return results;
      
    } catch (error) {
      console.error('❌ Failed to sync inventory:', error);
      throw error;
    }
  },

  /**
   * Check sync status between inventory and Item tables
   * Returns products that are out of sync
   */
  async checkSyncStatus(storeId?: string): Promise<SyncStatus[]> {
    console.log('🔍 Checking inventory sync status...');
    
    try {
      let query = `
        SELECT 
          i.product_id,
          i.store_id,
          p.sku,
          p.product_name,
          i.quantity as inventory_quantity,
          COUNT(it.*) as item_count
        FROM inventory i 
        LEFT JOIN products p ON i.product_id = p.id
        LEFT JOIN "Item" it ON it."productId" = i.product_id 
                            AND it."currentStoreId" = i.store_id 
                            AND it."status" IN ('available', 'reserved', 'in_stock')
                            AND (it."delete" IS FALSE OR it."delete" IS NULL)
      `;
      
      if (storeId) {
        query += ` WHERE i.store_id = '${storeId}'`;
      }
      
      query += `
        GROUP BY i.product_id, i.store_id, p.sku, p.product_name, i.quantity
        ORDER BY p.sku
      `;
      
      const { data, error } = await supabase.rpc('exec_sql', { query });
      
      if (error) {
        console.error('❌ Sync status check error:', error);
        throw error;
      }
      
      const results: SyncStatus[] = data?.map((row: any) => {
        const difference = row.inventory_quantity - row.item_count;
        return {
          productId: row.product_id,
          storeId: row.store_id,
          sku: row.sku,
          productName: row.product_name,
          inventoryQuantity: row.inventory_quantity,
          itemCount: row.item_count,
          syncStatus: difference === 0 ? 'synced' : 'needs_sync',
          difference,
        };
      }) || [];
      
      const outOfSync = results.filter(r => r.syncStatus === 'needs_sync');
      console.log(`📊 Sync Status: ${results.length} products, ${outOfSync.length} need sync`);
      
      return results;
      
    } catch (error) {
      console.error('❌ Failed to check sync status:', error);
      throw error;
    }
  },

  /**
   * Sync a specific product's inventory to Item records
   */
  async syncSingleProduct(productId: string, storeId: string, targetQuantity: number): Promise<void> {
    console.log(`🔄 Syncing single product: ${productId} to quantity ${targetQuantity}`);
    
    try {
      const { error } = await supabase.rpc('sync_inventory_to_items_single', {
        p_product_id: productId,
        p_store_id: storeId,
        p_target_quantity: targetQuantity,
      });
      
      if (error) {
        console.error('❌ Single product sync error:', error);
        throw error;
      }
      
      console.log('✅ Single product sync completed');
      
    } catch (error) {
      console.error('❌ Failed to sync single product:', error);
      throw error;
    }
  },

  /**
   * Update inventory quantity and auto-sync Item records
   */
  async updateInventoryQuantity(
    productId: string, 
    storeId: string, 
    newQuantity: number,
    reason?: string
  ): Promise<void> {
    console.log(`📦 Updating inventory: ${productId} to ${newQuantity} (${reason || 'manual'})`);
    
    try {
      // Update inventory table - this will trigger the sync automatically
      const { error } = await supabase
        .from('inventory')
        .update({ 
          quantity: newQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq('product_id', productId)
        .eq('store_id', storeId);
      
      if (error) {
        console.error('❌ Inventory update error:', error);
        throw error;
      }
      
      console.log('✅ Inventory updated and synced automatically');
      
    } catch (error) {
      console.error('❌ Failed to update inventory:', error);
      throw error;
    }
  },

  /**
   * Generate A4L codes for existing items without codes
   */
  async generateMissingA4LCodes(storeId?: string): Promise<number> {
    console.log('🏷️ Generating missing A4L codes...');
    
    try {
      let whereClause = `("a4lCode" IS NULL OR "a4lCode" = '') AND ("delete" IS FALSE OR "delete" IS NULL)`;
      if (storeId) {
        whereClause += ` AND "currentStoreId" = '${storeId}'`;
      }
      
      // Get items without A4L codes
      const { data: itemsNeedingCodes, error: fetchError } = await supabase
        .from('Item')
        .select(`
          "id",
          "productId",
          "currentStoreId",
          products:productId (sku, category)
        `)
        .is('a4lCode', null);
      
      if (fetchError) throw fetchError;
      
      let updatedCount = 0;
      
      for (const item of itemsNeedingCodes || []) {
        const product = (item as any).products;
        const sku = product?.sku || 'UNK';
        
        // Get next sequence number for this product
        const { data: maxSequence } = await supabase
          .from('Item')
          .select('"a4lCode"')
          .eq('"productId"', item.productId)
          .not('a4lCode', 'is', null)
          .order('"a4lCode"', { ascending: false })
          .limit(1);
        
        let nextSequence = 1;
        if (maxSequence && maxSequence.length > 0) {
          const lastCode = maxSequence[0].a4lCode;
          const match = lastCode.match(/(\d+)$/);
          if (match) {
            nextSequence = parseInt(match[1]) + 1;
          }
        }
        
        const newA4LCode = `A4L-${sku}-${String(nextSequence).padStart(3, '0')}`;
        
        // Update the item
        const { error: updateError } = await supabase
          .from('Item')
          .update({ 
            '"a4lCode"': newA4LCode,
            '"updatedAt"': new Date().toISOString(),
          })
          .eq('"id"', item.id);
        
        if (!updateError) {
          updatedCount++;
        }
      }
      
      console.log(`✅ Generated ${updatedCount} A4L codes`);
      return updatedCount;
      
    } catch (error) {
      console.error('❌ Failed to generate A4L codes:', error);
      throw error;
    }
  }
};

// Debug helper to remove global exposure after debugging
if (typeof window !== 'undefined') {
  (window as any).debugInventorySync = inventorySyncApi;
}
