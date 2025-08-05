import React, { useState, useEffect } from 'react';
import { DataTable } from '@/components';
import { Customer } from '../types/customer';
import { getCustomers } from '../api/customers';

interface CustomerListProps {
  onCustomerClick?: (customer: Customer) => void;
  searchTerm?: string;
}

export function CustomerList({ onCustomerClick, searchTerm }: CustomerListProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoading(true);
        const data = await getCustomers();
        setCustomers(data);
      } catch (error) {
        console.error('Failed to load customers:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, []);

  const columns = [
    {
      key: 'name',
      title: 'Name',
      render: (value: string, record: Customer) => (
        <div className="flex flex-col">
          <span className="font-medium">{value}</span>
          <span className="text-sm text-muted-foreground">{record.customerNumber}</span>
        </div>
      ),
      width: '200px',
    },
    {
      key: 'phone',
      title: 'Phone',
      width: '140px',
    },
    {
      key: 'email',
      title: 'Email',
      render: (value: string) => (
        <span className="text-muted-foreground">{value}</span>
      ),
      width: '200px',
    },
    {
      key: 'deliveryAddress',
      title: 'Delivery Address',
      render: (value: string) => (
        <span className="text-sm text-muted-foreground truncate block max-w-[200px]" title={value}>
          {value}
        </span>
      ),
      width: '250px',
    },
    {
      key: 'numberOfOrders',
      title: 'Number of Orders',
      render: (value: number) => (
        <span className="font-medium">{value}</span>
      ),
      width: '120px',
    },
  ];

  const filteredCustomers = customers.filter((customer) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      customer.email.toLowerCase().includes(searchLower) ||
      customer.phone.toLowerCase().includes(searchLower) ||
      customer.customerNumber.toLowerCase().includes(searchLower) ||
      customer.deliveryAddress.toLowerCase().includes(searchLower)
    );
  });

  return (
    <DataTable
      data={filteredCustomers}
      columns={columns}
      loading={loading}
      onRowClick={onCustomerClick}
    />
  );
}