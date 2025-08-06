import { useRealTimeNotifications } from '@/modules/notifications/hooks/useRealTimeNotifications';

// Re-export types and hook for backwards compatibility
export type { Notification } from '@/modules/notifications/types';
export function useNotifications() {
  return useRealTimeNotifications();
}