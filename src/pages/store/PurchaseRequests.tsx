import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Breadcrumbs, DataTable, StatusBadge } from '@/components';

const mockPurchaseRequests = [
  {
    id: '1',
    requestNumber: 'PR-2024-001',
    supplierName: 'Tech Supplies Inc.',
    status: 'pending',
    totalAmount: 5680.00,
    requestedBy: 'Store Manager',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    requestNumber: 'PR-2024-002',
    supplierName: 'Office Equipment Co.',
    status: 'approved',
    totalAmount: 2350.25,
    requestedBy: 'Assistant Manager',
    createdAt: '2024-01-14',
  },
];

export default function PurchaseRequests() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  const columns = [
    {
      key: 'requestNumber',
      title: 'Request Number',
      render: (value: string) => (
        <span className="font-medium text-primary">{value}</span>
      ),
    },
    {
      key: 'supplierName',
      title: 'Supplier',
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
      key: 'requestedBy',
      title: 'Requested By',
    },
    {
      key: 'createdAt',
      title: 'Created Date',
    },
  ];

  const handleRowClick = (request: any) => {
    console.log('Navigate to request:', request.id);
  };

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ title: t('purchaseRequests') }]} />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('purchaseRequests')}</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage purchase requests for inventory replenishment.
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">Filter</Button>
        <Button variant="outline">Export</Button>
      </div>

      <DataTable
        data={mockPurchaseRequests}
        columns={columns}
        onRowClick={handleRowClick}
      />
    </div>
  );
}