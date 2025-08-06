import { supabase } from '@/integrations/supabase/client';
import { UpdateProfileRequest } from '../types';

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