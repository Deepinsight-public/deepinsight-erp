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

  // Handle custom products - use the generic "Custom Product" placeholder
  let productId = repairData.productId;
  
  if (!productId && repairData.customProduct) {
    console.log('Using custom product:', repairData.customProduct);
    
    // Find the "Custom Product" placeholder that was created in the migration
    const { data: customProductPlaceholder, error: placeholderError } = await supabase
      .from('products')
      .select('id')
      .eq('sku', 'CUSTOM-PLACEHOLDER')
      .eq('product_name', 'Custom Product')
      .single();
    
    if (placeholderError || !customProductPlaceholder) {
      console.error('Custom product placeholder not found:', placeholderError);
      throw new Error('Custom product support is not available. Please contact administrator.');
    }
    
    productId = customProductPlaceholder.id;
  }
  
  if (!productId) {
    throw new Error('Product selection is required');
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

export const getRepair = async (id: string): Promise<Repair> => {
  // Get user profile to get store_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('store_id')
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
    .single();

  if (!profile?.store_id) {
    throw new Error('User store not found');
  }

  const { data, error } = await supabase
    .from('repairs')
    .select('*')
    .eq('id', id)
    .eq('store_id', profile.store_id)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Repair not found');

  // Get product details separately
  let productData = null;
  if (data.product_id) {
    const { data: product } = await supabase
      .from('products')
      .select('id, product_name, sku, brand, model')
      .eq('id', data.product_id)
      .single();
    productData = product;
  }

  // Get customer details separately
  let customerData = null;
  if (data.customer_id) {
    const { data: customer } = await supabase
      .from('customers')
      .select('id, first_name, last_name, email, phone')
      .eq('id', data.customer_id)
      .single();
    customerData = customer;
  }

  // Parse custom product info from description if it exists
  const customProductInfo = {
    customProduct: '',
    model: '',
    partsRequired: ''
  };

  if (data.description) {
    const customProductMatch = data.description.match(/\[CUSTOM_PRODUCT\]=([^\n]+)/);
    const modelMatch = data.description.match(/\[MODEL\]=([^\n]+)/);
    const partsMatch = data.description.match(/\[PARTS_REQUIRED\]=([^\n]+)/);
    
    if (customProductMatch) customProductInfo.customProduct = customProductMatch[1];
    if (modelMatch) customProductInfo.model = modelMatch[1];
    if (partsMatch) customProductInfo.partsRequired = partsMatch[1];
  }

  return {
    id: data.id,
    repairId: data.repair_id,
    date: data.created_at,
    type: data.type as 'warranty' | 'paid' | 'goodwill',
    product: {
      id: data.product_id || '',
      name: productData?.product_name || customProductInfo.customProduct || 'Unknown Product',
      sku: productData?.sku || 'CUSTOM',
      brand: productData?.brand,
      model: productData?.model || customProductInfo.model
    },
    status: data.status as 'pending' | 'in_progress' | 'completed' | 'cancelled',
    description: data.description || '',
    customerId: data.customer_id,
    customerName: data.customer_name || (customerData ? `${customerData.first_name} ${customerData.last_name}` : undefined),
    salesOrderId: data.sales_order_id,
    cost: data.cost ? parseFloat(data.cost.toString()) : undefined,
    estimatedCompletion: data.estimated_completion,
    warrantyStatus: data.warranty_status,
    warrantyExpiresAt: data.warranty_expires_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    // Add custom product details
    customProduct: customProductInfo.customProduct,
    model: customProductInfo.model,
    partsRequired: customProductInfo.partsRequired,
    // Add customer details if available
    customerEmail: customerData?.email,
    customerPhone: customerData?.phone,
  };
};