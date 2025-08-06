import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './useAuth';

export interface Notification {
  id: string;
  type: 'new_order' | 'product_return' | 'inventory_alert' | 'system_alert' | 'customer_message';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  orderId?: string;
  customerId?: string;
}

// Mock notifications data
const generateMockNotifications = (): Notification[] => [
  {
    id: '1',
    type: 'new_order',
    title: 'New Order Received',
    message: 'Order #ORD-20250106-001 has been placed by John Smith',
    isRead: false,
    createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    orderId: 'ORD-20250106-001'
  },
  {
    id: '2',
    type: 'inventory_alert',
    title: 'Low Stock Alert',
    message: 'iPhone 15 Pro is running low in stock (5 units remaining)',
    isRead: false,
    createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
  },
  {
    id: '3',
    type: 'product_return',
    title: 'Product Return Request',
    message: 'Return request submitted for Samsung Galaxy S24',
    isRead: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
  },
  {
    id: '4',
    type: 'customer_message',
    title: 'Customer Inquiry',
    message: 'Customer asking about delivery status for order #ORD-20250105-002',
    isRead: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: '5',
    type: 'system_alert',
    title: 'System Maintenance',
    message: 'Scheduled maintenance will occur tonight at 2:00 AM',
    isRead: true,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
  }
];

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Simulate API call
      setTimeout(() => {
        setNotifications(generateMockNotifications());
        setIsLoading(false);
      }, 500);
    }
  }, [user]);

  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.isRead).length, 
    [notifications]
  );

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'new_order':
        return '🛍️';
      case 'product_return':
        return '↩️';
      case 'inventory_alert':
        return '⚠️';
      case 'system_alert':
        return '🔧';
      case 'customer_message':
        return '💬';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'new_order':
        return 'text-green-600';
      case 'product_return':
        return 'text-blue-600';
      case 'inventory_alert':
        return 'text-orange-600';
      case 'system_alert':
        return 'text-purple-600';
      case 'customer_message':
        return 'text-indigo-600';
      default:
        return 'text-gray-600';
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    getNotificationIcon,
    getNotificationColor
  };
}