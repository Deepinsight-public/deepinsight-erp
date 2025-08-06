import { Repair, RepairFilters, CreateRepairData } from '../types';

// Mock data for now - replace with Supabase queries when repairs table is created
const mockRepairs: Repair[] = [
  {
    id: '1',
    repairId: 'REP-20241201-001',
    date: '2024-12-01T10:00:00Z',
    type: 'warranty',
    product: {
      id: 'prod-1',
      name: 'iPhone 15 Pro',
      sku: 'IPH15PRO-256'
    },
    status: 'in_progress',
    description: 'Screen replacement due to manufacturing defect',
    customerId: 'cust-1',
    customerName: 'John Doe',
    cost: 0,
    estimatedCompletion: '2024-12-05T17:00:00Z',
    createdAt: '2024-12-01T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z'
  },
  {
    id: '2',
    repairId: 'REP-20241130-002',
    date: '2024-11-30T14:30:00Z',
    type: 'paid',
    product: {
      id: 'prod-2',
      name: 'MacBook Air M2',
      sku: 'MBA-M2-512'
    },
    status: 'completed',
    description: 'Battery replacement and keyboard cleaning',
    customerId: 'cust-2',
    customerName: 'Jane Smith',
    cost: 299.99,
    estimatedCompletion: '2024-12-02T17:00:00Z',
    createdAt: '2024-11-30T14:30:00Z',
    updatedAt: '2024-12-02T16:45:00Z'
  },
  {
    id: '3',
    repairId: 'REP-20241129-003',
    date: '2024-11-29T09:15:00Z',
    type: 'goodwill',
    product: {
      id: 'prod-3',
      name: 'iPad Pro 12.9"',
      sku: 'IPADPRO-129-1TB'
    },
    status: 'pending',
    description: 'Customer satisfaction repair - minor screen scratch',
    customerId: 'cust-3',
    customerName: 'Mike Johnson',
    cost: 0,
    createdAt: '2024-11-29T09:15:00Z',
    updatedAt: '2024-11-29T09:15:00Z'
  }
];

export const getRepairs = async (filters?: RepairFilters): Promise<Repair[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  let filteredRepairs = [...mockRepairs];

  // Apply filters
  if (filters?.status) {
    filteredRepairs = filteredRepairs.filter(repair => repair.status === filters.status);
  }

  if (filters?.type) {
    filteredRepairs = filteredRepairs.filter(repair => repair.type === filters.type);
  }

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    filteredRepairs = filteredRepairs.filter(repair =>
      repair.repairId.toLowerCase().includes(searchLower) ||
      repair.description.toLowerCase().includes(searchLower) ||
      repair.status.toLowerCase().includes(searchLower) ||
      repair.product.name.toLowerCase().includes(searchLower)
    );
  }

  return filteredRepairs;
};

export const createRepair = async (repairData: CreateRepairData): Promise<Repair> => {
  // Mock implementation - replace with actual Supabase insert when repairs table is created
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const newRepair: Repair = {
    id: `repair-${Date.now()}`,
    repairId: `REP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    date: new Date().toISOString(),
    type: repairData.type,
    product: {
      id: repairData.productId,
      name: 'Sample Product', // Would come from product lookup
      sku: 'SAMPLE-SKU'
    },
    status: 'pending',
    description: repairData.description,
    customerId: repairData.customerId,
    customerName: 'Sample Customer', // Would come from customer lookup
    cost: repairData.cost,
    estimatedCompletion: repairData.estimatedCompletion,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return newRepair;
};