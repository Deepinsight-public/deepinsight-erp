import { supabase } from '@/integrations/supabase/client';

export interface CustomerOption {
  value: string;
  label: string;
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export async function searchCustomers(query: string): Promise<CustomerOption[]> {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, email, phone, customer_code')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,customer_code.ilike.%${query}%`)
      .order('name')
      .limit(20);

    if (error) {
      console.error('Error searching customers:', error);
      throw error;
    }

    return (data || []).map(customer => ({
      value: customer.id,
      label: `${customer.name}${customer.email ? ` (${customer.email})` : ''}${customer.customer_code ? ` - ${customer.customer_code}` : ''}`,
      id: customer.id,
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || undefined,
    }));
  } catch (error) {
    console.error('Error in searchCustomers:', error);
    return [];
  }
}

export async function getCustomerById(id: string) {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error getting customer:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getCustomerById:', error);
    throw error;
  }
}