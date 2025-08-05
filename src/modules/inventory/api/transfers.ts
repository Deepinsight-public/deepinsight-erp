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
        type: 'transfer_out',
        fromStoreId: storeId,
        toStoreId: 'other-store-id',
        status: 'submitted',
        items: [
          {
            id: '1',
            productId: 'prod-1',
            sku: 'SKU001',
            productName: 'Test Product',
            quantityRequested: 10,
            quantityShipped: 0,
            quantityReceived: 0,
          }
        ],
        reason: 'Stock rebalancing',
        requestedBy: 'user1',
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
      type: 'transfer_out',
      fromStoreId: transfer.fromStoreId,
      toStoreId: transfer.toStoreId,
      status: transfer.status,
      items: transfer.items,
      reason: transfer.reason,
      notes: transfer.notes,
      requestedBy: transfer.requestedBy,
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