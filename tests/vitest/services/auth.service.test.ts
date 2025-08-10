import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../../../packages/core/src/services/auth.service';
import { ErrorCodes } from '../../../packages/shared/src/errors/error-codes';

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
  })),
  supabaseUrl: 'https://test.supabase.co',
  supabaseKey: 'test-key',
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService('https://test.supabase.co', 'test-key');
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };
      const mockSession = {
        access_token: 'token',
        refresh_token: 'refresh',
        expires_at: 1234567890,
      };
      const mockProfile = {
        role: 'store_manager',
        store_id: 'store-1',
        full_name: 'John Doe',
      };

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          })),
        })),
      });

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual({
        user: mockUser,
        session: mockSession,
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          role: 'store_manager',
          storeId: 'store-1',
        },
      });
    });

    it('should throw error for invalid credentials', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      });

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('canSeeCostData', () => {
    it('should return true for hq_admin', () => {
      expect(authService.canSeeCostData('hq_admin')).toBe(true);
    });

    it('should return true for store_manager', () => {
      expect(authService.canSeeCostData('store_manager')).toBe(true);
    });

    it('should return false for store_employee', () => {
      expect(authService.canSeeCostData('store_employee')).toBe(false);
    });
  });
});