import { supabase } from '@/integrations/supabase/client';
import { Repair } from '../types';

export const getRepairById = async (repairId: string): Promise<Repair> => {
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
    .eq('id', repairId)
    .eq('store_id', profile.store_id)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Repair not found');

  // Get product details separately
  let productData = null;
  if (data.product_id) {
    const { data: product } = await supabase
      .from('products')
      .select('id, sku, product_name, brand, model')
      .eq('id', data.product_id)
      .single();
    productData = product;
  }

  return {
    id: data.id,
    repairId: data.repair_id,
    date: data.created_at,
    type: data.type as 'warranty' | 'paid' | 'goodwill',
    product: {
      id: productData?.id || data.product_id || '',
      name: productData?.product_name || 'Unknown Product',
      sku: productData?.sku || 'N/A'
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

export const updateRepairStatus = async (repairId: string, status: string): Promise<void> => {
  // Get user profile to get store_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('store_id')
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
    .single();

  if (!profile?.store_id) {
    throw new Error('User store not found');
  }

  const { error } = await supabase
    .from('repairs')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', repairId)
    .eq('store_id', profile.store_id);

  if (error) throw error;
};

export const updateRepairDetails = async (
  repairId: string, 
  updates: {
    description?: string;
    cost?: number;
    estimatedCompletion?: Date;
  }
): Promise<void> => {
  // Get user profile to get store_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('store_id')
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
    .single();

  if (!profile?.store_id) {
    throw new Error('User store not found');
  }

  const updateData: any = {
    updated_at: new Date().toISOString()
  };

  if (updates.description !== undefined) {
    updateData.description = updates.description;
  }
  if (updates.cost !== undefined) {
    updateData.cost = updates.cost;
  }
  if (updates.estimatedCompletion !== undefined) {
    updateData.estimated_completion = updates.estimatedCompletion.toISOString();
  }

  const { error } = await supabase
    .from('repairs')
    .update(updateData)
    .eq('id', repairId)
    .eq('store_id', profile.store_id);

  if (error) throw error;
};