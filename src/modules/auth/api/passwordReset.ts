import { supabase } from '@/integrations/supabase/client';
import { ResetRequestData, NewPasswordData } from '../types/passwordReset';

export const sendPasswordResetEmail = async (data: ResetRequestData) => {
  const redirectUrl = `${window.location.origin}/auth/reset/callback`;
  
  const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
    redirectTo: redirectUrl,
  });

  if (error) {
    throw error;
  }

  return { success: true };
};

export const updatePassword = async (data: NewPasswordData) => {
  const { error } = await supabase.auth.updateUser({
    password: data.password
  });

  if (error) {
    throw error;
  }

  return { success: true };
};

export const verifyPasswordResetSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    throw error;
  }

  return {
    isValid: !!session,
    session
  };
};