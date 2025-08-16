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
      // Mock implementation for now since the RPC function doesn't exist
      console.log('✅ Inventory sync completed (mock implementation)');
      return [];
      
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
      // Mock implementation for now since the RPC function doesn't exist
      console.log('📊 Sync Status check completed (mock implementation)');
      return [];
      
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
      // Mock implementation for now since the RPC function doesn't exist
      console.log('✅ Single product sync completed (mock implementation)');
      
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
      // Mock implementation for now
      console.log('✅ Generated A4L codes (mock implementation)');
      return 0;
      
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