import { useRealTimeNotifications } from '@/modules/notifications/hooks/useRealTimeNotifications';

export type { Notification } from '@/modules/notifications/types';
export function useNotifications() {
  return useRealTimeNotifications();
}