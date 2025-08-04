import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Breadcrumbs, DataTable, StatusBadge } from '@/components';

const mockSalesOrders = [
  {
    id: '1',
    orderNumber: 'SO-2024-001',
    customerName: 'John Smith',
    status: 'pending',
    totalAmount: 1250.00,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    orderNumber: 'SO-2024-002',
    customerName: 'Sarah Johnson',
    status: 'confirmed',
    totalAmount: 890.50,
    createdAt: '2024-01-14',
  },
  {
    id: '3',
    orderNumber: 'SO-2024-003',
    customerName: 'Mike Brown',
    status: 'shipped',
    totalAmount: 2100.75,
    createdAt: '2024-01-13',
  },
];

export default function SalesOrders() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  const columns = [
    {
      key: 'orderNumber',
      title: 'Order Number',
      render: (value: string) => (
        <span className="font-medium text-primary">{value}</span>
      ),
    },
    {
      key: 'customerName',
      title: 'Customer',
    },
    {
      key: 'status',
      title: 'Status',
      render: (value: string) => (
        <StatusBadge status={value as any} />
      ),
    },
    {
      key: 'totalAmount',
      title: 'Total Amount',
      render: (value: number) => (
        <span className="font-medium">${value.toFixed(2)}</span>
      ),
    },
    {
      key: 'createdAt',
      title: 'Created Date',
    },
  ];

  const handleRowClick = (order: any) => {
    console.log('Navigate to order:', order.id);
    // Navigation to order details would be implemented here
  };

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ title: t('salesOrders') }]} />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('salesOrders')}</h1>
            <p className="text-muted-foreground mt-2">
              Manage and track all sales orders from your store.
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          Filter
        </Button>
        <Button variant="outline">
          Export
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        data={mockSalesOrders}
        columns={columns}
        onRowClick={handleRowClick}
      />
    </div>
  );
}