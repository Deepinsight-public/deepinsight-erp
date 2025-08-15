import { supabase } from '@/integrations/supabase/client';
import { UpdateProfileRequest, Store } from '../types';

export const updateProfile = async (userId: string, data: UpdateProfileRequest) => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .update(data)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return profile;
};

export const searchStores = async (searchQuery: string = ''): Promise<Store[]> => {
  let query = supabase
    .from('stores')
    .select('id, store_name, store_code, region, status')
    .eq('status', 'active');

  if (searchQuery.trim()) {
    query = query.or(`store_name.ilike.%${searchQuery}%,store_code.ilike.%${searchQuery}%`);
  }

  const { data: stores, error } = await query
    .order('store_name')
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  return stores || [];
};