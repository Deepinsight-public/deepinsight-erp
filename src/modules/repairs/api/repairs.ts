import { supabase } from '@/integrations/supabase/client';
import { Repair, RepairFilters, CreateRepairData } from '../types';

export const getRepairs = async (filters?: RepairFilters): Promise<Repair[]> => {
  // Get user profile to get store_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('store_id')
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
    .single();

  if (!profile?.store_id) {
    throw new Error('User store not found');
  }

  let query = supabase
    .from('repairs')
    .select('*')
    .eq('store_id', profile.store_id)
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.type) {
    query = query.eq('type', filters.type);
  }

  if (filters?.search) {
    query = query.or(`repair_id.ilike.%${filters.search}%,description.ilike.%${filters.search}%,status.ilike.%${filters.search}%`);
  }

  if (filters?.dateFrom) {
    query = query.gte('created_at', filters.dateFrom);
  }

  if (filters?.dateTo) {
    query = query.lte('created_at', filters.dateTo);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Transform data to match our Repair interface
  return (data || []).map(item => ({
    id: item.id,
    repairId: item.repair_id,
    date: item.created_at,
    type: item.type as 'warranty' | 'paid' | 'goodwill',
    product: {
      id: item.product_id || '',
      name: 'Product Name', // Will be populated when we add product lookup
      sku: 'PRODUCT-SKU'
    },
    status: item.status as 'pending' | 'in_progress' | 'completed' | 'cancelled',
    description: item.description || '',
    customerId: item.customer_id,
    customerName: item.customer_name,
    cost: item.cost ? parseFloat(item.cost.toString()) : undefined,
    estimatedCompletion: item.estimated_completion,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }));
};

export const createRepair = async (repairData: CreateRepairData): Promise<Repair> => {
  console.log('Creating repair with data:', repairData);
  
  // Get user profile to get store_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('store_id')
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
    .single();

  if (!profile?.store_id) {
    throw new Error('User store not found');
  }

  // Generate repair ID
  const { data: repairIdData, error: repairIdError } = await supabase.rpc('generate_repair_id');
  if (repairIdError) throw repairIdError;

  // Handle custom products by creating a temporary product record
  let productId = repairData.productId;
  if (!productId && repairData.customProduct) {
    console.log('Creating custom product:', repairData.customProduct);
    
    const { data: customProductData, error: customProductError } = await supabase
      .from('products')
      .insert({
        product_name: repairData.customProduct,
        sku: `CUSTOM-${Date.now()}`,
        is_active: true
      })
      .select('id')
      .single();

    if (customProductError) {
      console.error('Error creating custom product:', customProductError);
      throw new Error('Failed to create custom product');
    }

    productId = customProductData.id;
  }

  if (!productId) {
    throw new Error('Product ID is required');
  }

  // Prepare description with additional context for custom products
  let description = repairData.description;
  if (repairData.customProduct) {
    description = `[CUSTOM_PRODUCT]=${repairData.customProduct}\n${description}`;
  }
  if (repairData.model) {
    description = `[MODEL]=${repairData.model}\n${description}`;
  }
  if (repairData.partsRequired) {
    description = `[PARTS_REQUIRED]=${repairData.partsRequired}\n${description}`;
  }

  const { data, error } = await supabase
    .from('repairs')
    .insert({
      repair_id: repairIdData,
      store_id: profile.store_id,
      product_id: productId,
      customer_id: repairData.customerId,
      customer_name: repairData.customerName,
      sales_order_id: repairData.salesOrderId,
      type: repairData.type,
      description: description,
      cost: repairData.cost,
      estimated_completion: repairData.estimatedCompletion ? repairData.estimatedCompletion.toISOString() : null,
      warranty_status: repairData.warrantyStatus || 'unknown',
      warranty_expires_at: repairData.warrantyExpiresAt ? repairData.warrantyExpiresAt.toISOString() : null,
      status: 'pending',
    })
    .select('*')
    .single();

  if (error) throw error;

  return {
    id: data.id,
    repairId: data.repair_id,
    date: data.created_at,
    type: data.type as 'warranty' | 'paid' | 'goodwill',
    product: {
      id: data.product_id || '',
      name: 'Product Name', // Will be populated when we add product lookup
      sku: 'PRODUCT-SKU'
    },
    status: data.status as 'pending' | 'in_progress' | 'completed' | 'cancelled',
    description: data.description || '',
    customerId: data.customer_id,
    customerName: data.customer_name,
    salesOrderId: data.sales_order_id,
    cost: data.cost ? parseFloat(data.cost.toString()) : undefined,
    estimatedCompletion: data.estimated_completion,
    warrantyStatus: data.warranty_status,
    warrantyExpiresAt: data.warranty_expires_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};