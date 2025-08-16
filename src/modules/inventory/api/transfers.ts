import { supabase } from '@/integrations/supabase/client';
import type { TransferOrder, TransferItem } from '../types';

export const transfersApi = {
  // 调拨管理 (Transfer Management)
  async getTransfers(storeId: string, type?: 'transfer_out' | 'transfer_in'): Promise<TransferOrder[]> {
    // Mock implementation for now - will need actual database tables
    return [
      {
        id: '1',
        transferNumber: 'TRF-OUT-001',
        fromStoreId: storeId,
        fromStoreName: 'Store A',
        toStoreId: 'other-store-id',
        toStoreName: 'Store B',
        status: 'shipped',
        items: [
          {
            id: '1',
            productId: 'prod-1',
            sku: 'SKU001',
            productName: 'Test Product',
            quantityRequested: 10,
            quantityShipped: 0,
            quantityReceived: 0,
            status: 'in_stock',
          }
        ],
        reason: 'Stock rebalancing',
        createdBy: 'user1',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      }
    ];
  },

  async createTransferOut(transfer: Omit<TransferOrder, 'id' | 'transferNumber' | 'createdAt' | 'updatedAt'>): Promise<TransferOrder> {
    const transferNumber = `TRF-OUT-${Date.now()}`;
    
    // Mock implementation for now
    return {
      id: `transfer-${Date.now()}`,
      transferNumber,
      fromStoreId: transfer.fromStoreId,
      fromStoreName: transfer.fromStoreName,
      toStoreId: transfer.toStoreId,
      toStoreName: transfer.toStoreName,
      status: transfer.status,
      items: transfer.items,
      reason: transfer.reason,
      notes: transfer.notes,
      createdBy: transfer.createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  async confirmTransferIn(transferId: string, items: TransferItem[]): Promise<void> {
    // Mock implementation for now
    console.log('Confirming transfer in:', transferId, items);
    
    // Would update inventory quantities in real implementation
    for (const item of items) {
      console.log(`Updating inventory for ${item.sku}: +${item.quantityReceived}`);
    }
  },
};