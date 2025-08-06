import { supabase } from '@/integrations/supabase/client';
import { Customer } from '../types/customer';

export const getCustomers = async (): Promise<Customer[]> => {
  // Get user profile to get store_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('store_id')
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
    .single();

  if (!profile?.store_id) {
    throw new Error('User store not found');
  }

  // First get customers
  const { data: customersData, error: customersError } = await supabase
    .from('customers')
    .select('*')
    .eq('store_id', profile.store_id)
    .order('created_at', { ascending: false });

  if (customersError) throw customersError;

  // Get order counts for each customer by matching name, phone, and email
  const customers = await Promise.all(
    (customersData || []).map(async (customer) => {
      const { count, error: countError } = await supabase
        .from('sales_orders')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', profile.store_id)
        .or(`customer_name.eq.${customer.name},customer_phone.eq.${customer.phone || ''},customer_email.eq.${customer.email || ''}`);

      if (countError) {
        console.error('Error counting orders for customer:', customer.id, countError);
        return { ...customer, order_count: 0 };
      }

      return { ...customer, order_count: count || 0 };
    })
  );

  return customers;
};

export const getCustomerById = async (id: string): Promise<Customer | null> => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const searchCustomers = async (query: string): Promise<Customer[]> => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%,customer_code.ilike.%${query}%`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const addCustomer = async (customerData: {
  name: string;
  email: string;
  phone: string;
  address: string;
}): Promise<Customer> => {
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
    .from('customers')
    .insert([
      {
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        address: customerData.address,
        store_id: profile.store_id,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateCustomer = async (
  id: string,
  customerData: {
    name: string;
    email: string;
    phone: string;
    address: string;
  }
): Promise<Customer> => {
  const { data, error } = await supabase
    .from('customers')
    .update({
      name: customerData.name,
      email: customerData.email,
      phone: customerData.phone,
      address: customerData.address,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};