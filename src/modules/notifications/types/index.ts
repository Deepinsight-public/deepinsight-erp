export interface Notification {
  id: string;
  user_id: string;
  type: 'new_order' | 'product_return' | 'inventory_alert' | 'system_alert' | 'customer_message';
  title: string;
  message: string;
  is_read: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface NotificationCreateData {
  user_id: string;
  type: Notification['type'];
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface NotificationUpdateData {
  is_read?: boolean;
  metadata?: Record<string, any>;
}