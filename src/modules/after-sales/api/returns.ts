import { supabase } from '@/integrations/supabase/client';
import { Return, ReturnFilters, CreateReturnData } from '../types';

export const getReturns = async (filters?: ReturnFilters): Promise<Return[]> => {
  // Get user profile to get store_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('store_id')
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
    .single();

  if (!profile?.store_id) {
    throw new Error('User store not found');
  }

  // For now, return mock data until the returns table migration is executed
  // TODO: Replace with actual database query once migration is approved
  const mockReturns: Return[] = [
    {
      id: '1',
      returnNumber: 'RET-001',
      date: new Date().toISOString(),
      numberOfItems: 2,
      status: 'pending',
      totalMap: 299.99,
      refundAmount: 250.00,
      reason: 'Defective product',
      orderId: 'ORD-123',
      customerId: 'CUST-456',
      customerName: 'John Doe',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      returnNumber: 'RET-002',
      date: new Date(Date.now() - 86400000).toISOString(),
      numberOfItems: 1,
      status: 'approved',
      totalMap: 149.99,
      refundAmount: 149.99,
      reason: 'Changed mind',
      orderId: 'ORD-124',
      customerId: 'CUST-457',
      customerName: 'Jane Smith',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  // Apply filters to mock data
  let filteredReturns = mockReturns;

  if (filters?.status) {
    filteredReturns = filteredReturns.filter(r => r.status === filters.status);
  }

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    filteredReturns = filteredReturns.filter(r => 
      r.returnNumber.toLowerCase().includes(searchLower) ||
      r.reason.toLowerCase().includes(searchLower) ||
      r.status.toLowerCase().includes(searchLower)
    );
  }

  if (filters?.dateFrom) {
    filteredReturns = filteredReturns.filter(r => r.date >= filters.dateFrom!);
  }

  if (filters?.dateTo) {
    filteredReturns = filteredReturns.filter(r => r.date <= filters.dateTo!);
  }

  return filteredReturns;
};

export const createReturn = async (returnData: CreateReturnData): Promise<Return> => {
  // For now, return mock data until the returns table migration is executed
  // TODO: Replace with actual database insert once migration is approved
  const newReturn: Return = {
    id: Math.random().toString(36).substr(2, 9),
    returnNumber: `RET-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    date: new Date().toISOString(),
    numberOfItems: returnData.items.length,
    status: 'pending',
    totalMap: returnData.totalMap,
    refundAmount: returnData.refundAmount,
    reason: returnData.reason,
    orderId: returnData.orderId,
    customerId: returnData.customerId,
    customerName: 'Customer Name', // Would be fetched from customer_id in real implementation
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return newReturn;
};