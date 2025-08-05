import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Breadcrumbs } from '@/components';
import { CustomerList } from '@/modules/crm-analytics/components/CustomerList';
import { Customer } from '@/modules/crm-analytics/types/customer';

export default function Customers() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  const handleCustomerClick = (customer: Customer) => {
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

      <CustomerList onCustomerClick={handleCustomerClick} />
    </div>
  );
}