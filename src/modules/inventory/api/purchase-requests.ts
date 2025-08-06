import { supabase } from '@/integrations/supabase/client';
import { 
  WarehouseAllocation, 
  PurchaseTurn, 
  PurchaseRequest, 
  PurchaseRequestItem,
  CreatePurchaseRequestDTO,
  PurchaseRequestListParams,
  PurchaseQueue,
  QueuePosition
} from '../types/purchase-requests';

// Get current warehouse allocations
export const fetchWarehouseAllocations = async (warehouseId?: string): Promise<WarehouseAllocation[]> => {
  let query = supabase
    .from('warehouse_allocations')
    .select('*')
    .gt('qty_left', 0);

  if (warehouseId) {
    query = query.eq('warehouse_id', warehouseId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch warehouse allocations: ${error.message}`);
  }

  return data.map(item => ({
    id: item.id,
    warehouseId: item.warehouse_id,
    sku: item.sku,
    qtyTotal: item.qty_total,
    qtyLeft: item.qty_left,
    createdAt: item.created_at,
    updatedAt: item.updated_at
  }));
};

// Get current purchase turn for a warehouse
export const fetchPurchaseTurn = async (warehouseId: string): Promise<PurchaseTurn | null> => {
  const { data, error } = await supabase
    .from('purchase_turns')
    .select('*')
    .eq('warehouse_id', warehouseId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch purchase turn: ${error.message}`);
  }

  if (!data) return null;

  return {
    id: data.id,
    warehouseId: data.warehouse_id,
    currentStoreId: data.current_store_id,
    roundNumber: data.round_number,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

// Check if current store can place order (is their turn)
export const canStoreOrder = async (storeId: string, warehouseId: string): Promise<boolean> => {
  const turn = await fetchPurchaseTurn(warehouseId);
  return turn?.currentStoreId === storeId;
};

// Get purchase requests for a store
export const fetchPurchaseRequests = async (
  storeId: string, 
  params: PurchaseRequestListParams = {}
): Promise<PurchaseRequest[]> => {
  let query = supabase
    .from('purchase_requests')
    .select('*')
    .eq('store_id', storeId);

  if (params.warehouseId) {
    query = query.eq('warehouse_id', params.warehouseId);
  }

  if (params.status) {
    query = query.eq('status', params.status);
  }

  if (params.limit) {
    query = query.limit(params.limit);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch purchase requests: ${error.message}`);
  }

  return data.map(item => ({
    id: item.id,
    storeId: item.store_id,
    warehouseId: item.warehouse_id,
    allocationId: item.allocation_id,
    items: item.items as unknown as PurchaseRequestItem[],
    status: item.status as PurchaseRequest['status'],
    createdAt: item.created_at,
    updatedAt: item.updated_at
  }));
};

// Create a new purchase request
export const createPurchaseRequest = async (
  storeId: string,
  requestData: CreatePurchaseRequestDTO
): Promise<PurchaseRequest> => {
  // First check if it's the store's turn
  const canOrder = await canStoreOrder(storeId, requestData.warehouseId);
  if (!canOrder) {
    throw new Error('It is not your store\'s turn to place an order');
  }

  // Create the purchase request
  const { data, error } = await supabase
    .from('purchase_requests')
    .insert({
      store_id: storeId,
      warehouse_id: requestData.warehouseId,
      allocation_id: requestData.allocationId,
      items: requestData.items as any,
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create purchase request: ${error.message}`);
  }

  // TODO: Update warehouse allocation quantities
  // This will be implemented with proper database functions later

  // Advance to next store in round-robin
  await advanceToNextStore(requestData.warehouseId);

  return {
    id: data.id,
    storeId: data.store_id,
    warehouseId: data.warehouse_id,
    allocationId: data.allocation_id,
    items: data.items as unknown as PurchaseRequestItem[],
    status: data.status as PurchaseRequest['status'],
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

// Get purchase queue with positions for a warehouse
export const fetchPurchaseQueue = async (warehouseId: string, currentStoreId: string): Promise<PurchaseQueue> => {
  // Get current turn
  const turn = await fetchPurchaseTurn(warehouseId);
  if (!turn) {
    throw new Error('No purchase turn found for warehouse');
  }

  // Get ordered stores from sequence table
  const { data: sequenceData, error: sequenceError } = await supabase
    .from('warehouse_store_sequence')
    .select(`
      store_id,
      seq,
      stores!inner(store_name)
    `)
    .eq('warehouse_id', warehouseId)
    .order('seq', { ascending: true });

  if (sequenceError) {
    throw new Error(`Failed to fetch warehouse sequence: ${sequenceError.message}`);
  }

  if (!sequenceData || sequenceData.length === 0) {
    throw new Error('No stores found in warehouse sequence');
  }

  // Build queue with positions
  const queue: QueuePosition[] = sequenceData.map((item, index) => ({
    storeId: item.store_id,
    storeName: (item.stores as any).store_name,
    position: index + 1
  }));

  // Find current store's position
  const yourPosition = queue.find(q => q.storeId === currentStoreId)?.position || 0;

  // Get allocations
  const allocations = await fetchWarehouseAllocations(warehouseId);

  return {
    currentStoreId: turn.currentStoreId,
    roundNumber: turn.roundNumber,
    queue,
    yourPosition,
    allocations
  };
};

// Advance to next store in round-robin
const advanceToNextStore = async (warehouseId: string): Promise<void> => {
  // Get ordered stores from sequence
  const { data: sequenceData, error: sequenceError } = await supabase
    .from('warehouse_store_sequence')
    .select('store_id, seq')
    .eq('warehouse_id', warehouseId)
    .order('seq', { ascending: true });

  if (sequenceError || !sequenceData) {
    throw new Error('Failed to fetch warehouse sequence');
  }

  // Get current turn
  const turn = await fetchPurchaseTurn(warehouseId);
  if (!turn) {
    throw new Error('No purchase turn found');
  }

  // Find current store index
  const currentIndex = sequenceData.findIndex(s => s.store_id === turn.currentStoreId);
  if (currentIndex === -1) {
    throw new Error('Current store not found in sequence');
  }

  // Calculate next store and round
  const nextIndex = (currentIndex + 1) % sequenceData.length;
  const nextStoreId = sequenceData[nextIndex].store_id;
  const newRoundNumber = nextIndex === 0 ? turn.roundNumber + 1 : turn.roundNumber;

  // Update purchase turn
  const { error: updateError } = await supabase
    .from('purchase_turns')
    .update({
      current_store_id: nextStoreId,
      round_number: newRoundNumber,
      updated_at: new Date().toISOString()
    })
    .eq('warehouse_id', warehouseId);

  if (updateError) {
    throw new Error(`Failed to advance turn: ${updateError.message}`);
  }
};