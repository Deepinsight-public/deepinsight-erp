import { supabase } from '@/integrations/supabase/client';
import { Return, ReturnFilters, CreateReturnData } from '../types';

export const getReturns = async (filters?: ReturnFilters): Promise<Return[]> => {
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
    .from('returns')
    .select('*')
    .eq('store_id', profile.store_id)
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.search) {
    query = query.or(`return_number.ilike.%${filters.search}%,reason.ilike.%${filters.search}%,status.ilike.%${filters.search}%`);
  }

  if (filters?.dateFrom) {
    query = query.gte('created_at', filters.dateFrom);
  }

  if (filters?.dateTo) {
    query = query.lte('created_at', filters.dateTo);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Transform data to match our Return interface
  return (data || []).map(item => ({
    id: item.id,
    returnNumber: item.return_number || `RET-${item.id.slice(0, 8).toUpperCase()}`,
    date: item.created_at,
    numberOfItems: item.number_of_items || 0,
    status: item.status as 'pending' | 'approved' | 'rejected' | 'completed',
    totalMap: parseFloat(item.total_map?.toString() || '0'),
    refundAmount: parseFloat(item.refund_amount?.toString() || '0'),
    reason: item.reason || '',
    orderId: item.order_id,
    customerId: item.customer_id,
    customerName: item.customer_name,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }));
};

export const createReturn = async (returnData: CreateReturnData): Promise<Return> => {
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
    .from('returns')
    .insert({
      store_id: profile.store_id,
      order_id: returnData.orderId,
      customer_id: returnData.customerId,
      reason: returnData.reason,
      total_map: returnData.totalMap,
      refund_amount: returnData.refundAmount,
      number_of_items: returnData.items.length,
      status: 'pending',
      items: returnData.items,
    })
    .select()
    .single();

  if (error) throw error;

  // Create notification for the new return
  const { data: currentUser } = await supabase.auth.getUser();
  if (currentUser.user) {
    await supabase
      .from('notifications')
      .insert({
        user_id: currentUser.user.id,
        type: 'product_return',
        title: 'New Product Return Created',
        message: `Return ${data.return_number || `RET-${data.id.slice(0, 8).toUpperCase()}`} has been created for ${returnData.items.length} item(s)`,
        metadata: {
          return_id: data.id,
          return_number: data.return_number || `RET-${data.id.slice(0, 8).toUpperCase()}`,
          customer_id: returnData.customerId,
          total_amount: returnData.refundAmount,
          item_count: returnData.items.length
        }
      });
  }

  return {
    id: data.id,
    returnNumber: data.return_number || `RET-${data.id.slice(0, 8).toUpperCase()}`,
    date: data.created_at,
    numberOfItems: data.number_of_items || 0,
    status: data.status as 'pending' | 'approved' | 'rejected' | 'completed',
    totalMap: parseFloat(data.total_map?.toString() || '0'),
    refundAmount: parseFloat(data.refund_amount?.toString() || '0'),
    reason: data.reason || '',
    orderId: data.order_id,
    customerId: data.customer_id,
    customerName: data.customer_name,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};