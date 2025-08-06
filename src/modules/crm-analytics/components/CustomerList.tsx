import React, { useState, useEffect } from 'react';
import { DataTable } from '@/components';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { Customer } from '../types/customer';
import { getCustomers } from '../api/customers';

interface CustomerListProps {
  onCustomerClick?: (customer: Customer) => void;
  onCustomerEdit?: (customer: Customer) => void;
  searchTerm?: string;
  refreshTrigger?: number;
}

export function CustomerList({ onCustomerClick, onCustomerEdit, searchTerm, refreshTrigger }: CustomerListProps) {
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
  }, [refreshTrigger]);

  const columns = [
    {
      key: 'name',
      title: 'Name',
      render: (value: string, record: Customer) => (
        <div className="flex flex-col">
          <span className="font-medium">{value}</span>
          <span className="text-sm text-muted-foreground">{record.customer_code || record.id.substring(0, 8)}</span>
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
      render: (value: string | null) => (
        <span className="text-muted-foreground">{value || '-'}</span>
      ),
      width: '200px',
    },
    {
      key: 'address',
      title: 'Delivery Address',
      render: (value: string | null) => (
        <span className="text-sm text-muted-foreground truncate block max-w-[200px]" title={value || ''}>
          {value || '-'}
        </span>
      ),
      width: '250px',
    },
    {
      key: 'status',
      title: 'Status',
      render: (value: string) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          value === 'active' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
      width: '100px',
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (value: any, record: Customer) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onCustomerEdit?.(record);
          }}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      ),
      width: '80px',
    },
  ];

  const filteredCustomers = customers.filter((customer) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      (customer.email && customer.email.toLowerCase().includes(searchLower)) ||
      (customer.phone && customer.phone.toLowerCase().includes(searchLower)) ||
      (customer.customer_code && customer.customer_code.toLowerCase().includes(searchLower)) ||
      (customer.address && customer.address.toLowerCase().includes(searchLower))
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