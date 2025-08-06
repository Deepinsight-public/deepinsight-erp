import { supabase } from '@/integrations/supabase/client';
import { Notification, NotificationCreateData, NotificationUpdateData } from '../types';

export const notificationApi = {
  // Get notifications for current user
  async getUserNotifications(): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Notification[];
  },

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
  },

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false);

    if (error) throw error;
  },

  // Create new notification (for testing)
  async createNotification(data: NotificationCreateData): Promise<Notification> {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return notification as Notification;
  }
};