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

  // Get customers
  const { data: customersData, error: customersError } = await supabase
    .from('customers')
    .select('*')
    .eq('store_id', profile.store_id)
    .order('created_at', { ascending: false });

  if (customersError) throw customersError;

  // Backward-compatible mapping: synthesize `name` from first/last
  return (customersData || []).map((c: any) => ({
    ...c,
    name: [c.first_name, c.last_name].filter(Boolean).join(' ').trim(),
  }));
};

export const getCustomerById = async (id: string): Promise<Customer | null> => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return { ...(data as any), name: [data.first_name, data.last_name].filter(Boolean).join(' ').trim() } as Customer;
};

export const searchCustomers = async (query: string): Promise<Customer[]> => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%,customer_code.ilike.%${query}%`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((c: any) => ({
    ...c,
    name: [c.first_name, c.last_name].filter(Boolean).join(' ').trim(),
  }));
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
        first_name: customerData.name?.split(' ')[0] || customerData.name,
        last_name: customerData.name?.split(' ').slice(1).join(' ') || null,
        email: customerData.email,
        phone: customerData.phone,
        address: customerData.address,
        store_id: profile.store_id,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return { ...(data as any), name: [data.first_name, data.last_name].filter(Boolean).join(' ').trim() } as Customer;
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