import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSearchParams } from 'react-router-dom';

interface UseStoreIdResult {
  storeId: string | null;
  isLoading: boolean;
  error: string | null;
  needsStoreSelection: boolean;
  isHQUser: boolean;
}

export function useStoreId(): UseStoreIdResult {
  const { user, profile, roles, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user has HQ permissions
  const isHQUser = roles.some(role => 
    role.role === 'hq_admin' || role.role === 'warehouse_admin'
  );

  useEffect(() => {
    if (authLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // Method 1: Check URL query parameter ?storeId=
      const urlStoreId = searchParams.get('storeId');
      if (urlStoreId) {
        setStoreId(urlStoreId);
        setIsLoading(false);
        return;
      }

      // Method 2: Get from user profile (support both id and store_id fields)
      const profileStoreId = profile?.store_id || (profile as any)?.id;
      if (profileStoreId) {
        setStoreId(profileStoreId);
        setIsLoading(false);
        return;
      }

      // Method 3: Get from user metadata (fallback)
      const metadataStoreId = user?.user_metadata?.store_id;
      if (metadataStoreId) {
        setStoreId(metadataStoreId);
        setIsLoading(false);
        return;
      }

      // Method 4: For HQ users, allow no store (can browse all)
      if (isHQUser) {
        setStoreId(null); // This is valid for HQ users
        setIsLoading(false);
        return;
      }

      // Method 5: No store found and not HQ user
      setStoreId(null);
      setError('No store assigned');
      setIsLoading(false);
    } catch (err) {
      console.error('Error determining store ID:', err);
      setError('Error determining store');
      setStoreId(null);
      setIsLoading(false);
    }
  }, [user, profile, roles, authLoading, searchParams, isHQUser]);

  const needsStoreSelection = !storeId && !isHQUser && !authLoading && !isLoading;

  return {
    storeId,
    isLoading: isLoading || authLoading,
    error,
    needsStoreSelection,
    isHQUser,
  };
}