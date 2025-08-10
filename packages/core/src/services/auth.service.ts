import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { LoginRequest, LoginResponse, UserContext, ApiError, ErrorCodes } from '@erp/shared';

export class AuthService {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string, authToken?: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      }
    });
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const { email, password } = credentials;
    
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new ApiError(ErrorCodes.INVALID_CREDENTIALS, 401, error.message);
    }

    // Get user profile
    const { data: profile, error: profileError } = await this.supabase
      .from('profiles')
      .select('role, store_id, full_name')
      .eq('user_id', data.user.id)
      .single();

    if (profileError) {
      throw new ApiError(ErrorCodes.DATABASE_ERROR, 500, 'Failed to fetch user profile');
    }

    const [firstName, ...lastNameParts] = (profile?.full_name || '').split(' ');
    const lastName = lastNameParts.join(' ');

    return {
      user: {
        id: data.user.id,
        email: data.user.email!,
      },
      session: {
        access_token: data.session!.access_token,
        refresh_token: data.session!.refresh_token,
        expires_at: data.session!.expires_at!,
      },
      profile: {
        firstName,
        lastName,
        role: profile?.role,
        storeId: profile?.store_id,
      }
    };
  }

  async logout(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      throw new ApiError(ErrorCodes.DATABASE_ERROR, 500, error.message);
    }
  }

  async getUserContext(authToken: string): Promise<UserContext | null> {
    // Update client with auth token
    this.supabase = createClient(
      this.supabase.supabaseUrl,
      this.supabase.supabaseKey,
      {
        global: {
          headers: { Authorization: authToken }
        }
      }
    );

    const { data: { user }, error } = await this.supabase.auth.getUser();
    if (error || !user) return null;

    const { data: profile } = await this.supabase
      .from('profiles')
      .select('role, store_id, full_name')
      .eq('user_id', user.id)
      .single();

    if (!profile) return null;

    const [firstName, ...lastNameParts] = (profile.full_name || '').split(' ');
    const lastName = lastNameParts.join(' ');

    return {
      userId: user.id,
      role: profile.role,
      storeId: profile.store_id,
      firstName,
      lastName,
    };
  }

  canSeeCostData(role: string): boolean {
    return role === 'hq_admin' || role === 'store_manager';
  }
}