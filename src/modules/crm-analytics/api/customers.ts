import { Customer } from '../types/customer';

// Mock data with delivery addresses
let mockCustomers: Customer[] = [
  {
    id: '1',
    customerNumber: 'CUST-001',
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '+1 (555) 123-4567',
    deliveryAddress: '123 Main St, New York, NY 10001',
    numberOfOrders: 15,
    status: 'active',
    totalSpent: 3450.75,
    lastOrderDate: '2024-01-10',
  },
  {
    id: '2',
    customerNumber: 'CUST-002',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    phone: '+1 (555) 987-6543',
    deliveryAddress: '456 Oak Ave, Los Angeles, CA 90210',
    numberOfOrders: 8,
    status: 'active',
    totalSpent: 1890.50,
    lastOrderDate: '2024-01-08',
  },
  {
    id: '3',
    customerNumber: 'CUST-003',
    name: 'Michael Chen',
    email: 'michael.chen@email.com',
    phone: '+1 (555) 456-7890',
    deliveryAddress: '789 Pine Rd, Chicago, IL 60601',
    numberOfOrders: 22,
    status: 'active',
    totalSpent: 5240.30,
    lastOrderDate: '2024-01-12',
  },
  {
    id: '4',
    customerNumber: 'CUST-004',
    name: 'Emily Davis',
    email: 'emily.davis@email.com',
    phone: '+1 (555) 321-0987',
    deliveryAddress: '321 Elm St, Miami, FL 33101',
    numberOfOrders: 5,
    status: 'inactive',
    totalSpent: 892.45,
    lastOrderDate: '2023-12-20',
  },
];

export const getCustomers = async (): Promise<Customer[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockCustomers;
};

export const getCustomerById = async (id: string): Promise<Customer | null> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockCustomers.find(customer => customer.id === id) || null;
};

export const searchCustomers = async (query: string): Promise<Customer[]> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  const lowerQuery = query.toLowerCase();
  return mockCustomers.filter(customer =>
    customer.name.toLowerCase().includes(lowerQuery) ||
    customer.email.toLowerCase().includes(lowerQuery) ||
    customer.customerNumber.toLowerCase().includes(lowerQuery) ||
    customer.phone.includes(query)
  );
};

export const addCustomer = async (customerData: {
  name: string;
  email: string;
  phone: string;
  deliveryAddress: string;
}): Promise<Customer> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const newCustomer: Customer = {
    id: Date.now().toString(),
    customerNumber: `CUST-${String(mockCustomers.length + 1).padStart(3, '0')}`,
    name: customerData.name,
    email: customerData.email,
    phone: customerData.phone,
    deliveryAddress: customerData.deliveryAddress,
    numberOfOrders: 0,
    status: 'active',
    totalSpent: 0,
    lastOrderDate: new Date().toISOString().split('T')[0],
  };
  
  mockCustomers.push(newCustomer);
  return newCustomer;
};