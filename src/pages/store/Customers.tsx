import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Breadcrumbs, DataTable, StatusBadge } from '@/components';

const mockCustomers = [
  {
    id: '1',
    customerNumber: 'CUST-001',
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '+1 (555) 123-4567',
    status: 'active',
    totalOrders: 15,
    totalSpent: 3450.75,
    lastOrderDate: '2024-01-10',
  },
  {
    id: '2',
    customerNumber: 'CUST-002',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    phone: '+1 (555) 987-6543',
    status: 'active',
    totalOrders: 8,
    totalSpent: 1890.50,
    lastOrderDate: '2024-01-08',
  },
];

export default function Customers() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  const columns = [
    {
      key: 'customerNumber',
      title: 'Customer #',
      render: (value: string) => (
        <span className="font-medium text-primary">{value}</span>
      ),
    },
    {
      key: 'name',
      title: 'Name',
      render: (value: string, record: any) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-muted-foreground">{record.email}</div>
        </div>
      ),
    },
    {
      key: 'phone',
      title: 'Phone',
    },
    {
      key: 'status',
      title: 'Status',
      render: (value: string) => (
        <StatusBadge status={value as any} />
      ),
    },
    {
      key: 'totalOrders',
      title: 'Orders',
      render: (value: number) => (
        <span className="font-medium">{value}</span>
      ),
    },
    {
      key: 'totalSpent',
      title: 'Total Spent',
      render: (value: number) => (
        <span className="font-medium">${value.toFixed(2)}</span>
      ),
    },
    {
      key: 'lastOrderDate',
      title: 'Last Order',
    },
  ];

  const handleRowClick = (customer: any) => {
    console.log('Navigate to customer:', customer.id);
  };

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ title: t('crm') }]} />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('crm')}</h1>
            <p className="text-muted-foreground mt-2">
              Manage customer relationships and track customer activity.
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">Filter</Button>
        <Button variant="outline">Export</Button>
      </div>

      <DataTable
        data={mockCustomers}
        columns={columns}
        onRowClick={handleRowClick}
      />
    </div>
  );
}