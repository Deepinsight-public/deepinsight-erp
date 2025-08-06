import { supabase } from '@/integrations/supabase/client';
import { 
  WarehouseInventoryItem,
  WarehouseAllocation, 
  PurchaseTurn, 
  PurchaseRequest, 
  PurchaseRequestItem,
  CreatePurchaseRequestDTO,
  PurchaseRequestListParams,
  PurchaseQueue,
  QueuePosition,
  PurchaseSubmitDTO,
  PurchaseSubmitItem
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

// Get warehouse inventory items
export const fetchWarehouseInventory = async (warehouseId: string, search?: string): Promise<WarehouseInventoryItem[]> => {
  let query = supabase
    .from('warehouse_inventory')
    .select('*')
    .eq('warehouse_id', warehouseId)
    .gt('qty_available', 0);

  if (search) {
    query = query.or(`sku.ilike.%${search}%,name.ilike.%${search}%`);
  }

  const { data, error } = await query.order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch warehouse inventory: ${error.message}`);
  }

  return data.map(item => ({
    id: item.id,
    warehouseId: item.warehouse_id,
    sku: item.sku,
    name: item.name,
    price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
    qtyAvailable: item.qty_available,
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
  console.log('Checking if store can order:', { storeId, warehouseId });
  const turn = await fetchPurchaseTurn(warehouseId);
  console.log('Current turn:', turn);
  const canOrder = turn?.currentStoreId === storeId;
  console.log('Can order result:', canOrder);
  return canOrder;
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

  // Get ordered stores from sequence table with separate store name fetch
  const { data: sequenceData, error: sequenceError } = await supabase
    .from('warehouse_store_sequence')
    .select('store_id, seq')
    .eq('warehouse_id', warehouseId)
    .order('seq', { ascending: true });

  if (sequenceError) {
    throw new Error(`Failed to fetch warehouse sequence: ${sequenceError.message}`);
  }

  if (!sequenceData || sequenceData.length === 0) {
    throw new Error('No stores found in warehouse sequence');
  }

  // Fetch store names separately to avoid join issues
  const storeIds = sequenceData.map(item => item.store_id);
  const { data: storesData, error: storesError } = await supabase
    .from('stores')
    .select('id, store_name')
    .in('id', storeIds);

  if (storesError) {
    throw new Error(`Failed to fetch store names: ${storesError.message}`);
  }

  // Build queue with positions by combining the data
  const storeNameMap = new Map(storesData?.map(store => [store.id, store.store_name]) || []);
  const queue: QueuePosition[] = sequenceData.map((item, index) => ({
    storeId: item.store_id,
    storeName: storeNameMap.get(item.store_id) || 'Unknown Store',
    position: index + 1
  }));

  // Find current store's position
  const yourPosition = queue.find(q => q.storeId === currentStoreId)?.position || 0;

  // Get allocations and warehouse inventory
  const allocations = await fetchWarehouseAllocations(warehouseId);
  const warehouseInventory = await fetchWarehouseInventory(warehouseId);

  return {
    currentStoreId: turn.currentStoreId,
    roundNumber: turn.roundNumber,
    queue,
    yourPosition,
    allocations,
    warehouseInventory
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

// Submit purchase request with warehouse inventory deduction
export const submitPurchaseRequest = async (
  storeId: string,
  requestData: PurchaseSubmitDTO
): Promise<PurchaseRequest> => {
  // First check if it's the store's turn
  const canOrder = await canStoreOrder(storeId, requestData.warehouseId);
  if (!canOrder) {
    throw new Error('It is not your store\'s turn to place an order');
  }

  // Validate stock availability
  const inventoryIds = requestData.items.map(item => item.inventoryId);
  const { data: inventoryItems, error: inventoryError } = await supabase
    .from('warehouse_inventory')
    .select('*')
    .in('id', inventoryIds);

  if (inventoryError) {
    throw new Error(`Failed to fetch inventory: ${inventoryError.message}`);
  }

  // Check stock availability
  for (const item of requestData.items) {
    const inventoryItem = inventoryItems?.find(inv => inv.id === item.inventoryId);
    if (!inventoryItem) {
      throw new Error(`Inventory item not found: ${item.inventoryId}`);
    }
    if (inventoryItem.qty_available < item.qty) {
      throw new Error(`Insufficient stock for ${inventoryItem.sku}. Available: ${inventoryItem.qty_available}, Requested: ${item.qty}`);
    }
  }

  // Create purchase request items from warehouse inventory
  const purchaseItems: PurchaseRequestItem[] = requestData.items.map(item => {
    const inventoryItem = inventoryItems?.find(inv => inv.id === item.inventoryId);
    return {
      sku: inventoryItem?.sku || '',
      qty: item.qty
    };
  });

  // Create the purchase request
  const { data, error } = await supabase
    .from('purchase_requests')
    .insert({
      store_id: storeId,
      warehouse_id: requestData.warehouseId,
      allocation_id: requestData.items[0]?.inventoryId || '', // Using first item as allocation reference
      items: purchaseItems as any,
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create purchase request: ${error.message}`);
  }

  // Deduct stock from warehouse inventory
  for (const item of requestData.items) {
    const inventoryItem = inventoryItems?.find(inv => inv.id === item.inventoryId);
    if (inventoryItem) {
      const newQty = inventoryItem.qty_available - item.qty;
      const { error: updateError } = await supabase
        .from('warehouse_inventory')
        .update({
          qty_available: newQty,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.inventoryId);

      if (updateError) {
        throw new Error(`Failed to update inventory: ${updateError.message}`);
      }
    }
  }

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