import { supabase } from '@/integrations/supabase/client';

export interface SalesOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email?: string;
  order_date: string;
  warranty_years?: number;
  warranty_amount?: number;
  total_amount: number;
  status: string;
}

export async function searchSalesOrders(query: string): Promise<SalesOrder[]> {
  try {
    // Get current user's profile to get store_id
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('store_id')
      .eq('user_id', user.id)
      .single();

    if (profileError) throw profileError;

    const { data, error } = await supabase
      .from('sales_orders')
      .select(`
        id,
        order_number,
        customer_name,
        customer_email,
        order_date,
        warranty_years,
        warranty_amount,
        total_amount,
        status
      `)
      .eq('store_id', profile.store_id)
      .or(`order_number.ilike.%${query}%,customer_name.ilike.%${query}%`)
      .order('order_date', { ascending: false })
      .limit(10);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error searching sales orders:', error);
    throw error;
  }
}

export async function getSalesOrderDetails(orderId: string): Promise<SalesOrder | null> {
  try {
    const { data, error } = await supabase
      .from('sales_orders')
      .select(`
        id,
        order_number,
        customer_name,
        customer_email,
        order_date,
        warranty_years,
        warranty_amount,
        total_amount,
        status
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error getting sales order details:', error);
    return null;
  }
}