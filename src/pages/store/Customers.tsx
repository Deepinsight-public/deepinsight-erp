import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { StandardSearchBar } from '@/components/shared/StandardSearchBar';
import { Breadcrumbs } from '@/components';
import { CustomerList } from '@/modules/crm-analytics/components/CustomerList';
import { AddCustomerDialog } from '@/modules/crm-analytics/components/AddCustomerDialog';
import { EditCustomerDialog } from '@/modules/crm-analytics/components/EditCustomerDialog';
import { Customer } from '@/modules/crm-analytics/types/customer';
import { getCustomers } from '@/modules/crm-analytics/api/customers';
import { exportToCSV, exportToXLSX } from '@/modules/crm-analytics/utils/exportUtils';

export default function Customers() {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState(''); // Applied search term
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCustomerClick = (customer: Customer) => {
    console.log('Navigate to customer:', customer.id);
  };

  const handleCustomerAdded = (customer: Customer) => {
    console.log('Customer added:', customer);
    // Refresh the customer list by triggering a re-render
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCustomerEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsEditDialogOpen(true);
  };

  const handleCustomerUpdated = (customer: Customer) => {
    console.log('Customer updated:', customer);
    // Refresh the customer list by triggering a re-render
    setRefreshTrigger(prev => prev + 1);
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
  };

  const handleSearch = () => {
    setAppliedSearch(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setAppliedSearch('');
  };

  const handleExport = async (format: 'csv' | 'xlsx') => {
    try {
      const customers = await getCustomers();
      const filename = `customers-${new Date().toISOString().split('T')[0]}`;
      
      if (format === 'csv') {
        exportToCSV(customers, filename);
      } else {
        exportToXLSX(customers, filename);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ title: t('crm') }]} />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('crm.title')}</h1>
            <p className="text-muted-foreground mt-2">
              {t('crm.description')}
            </p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('crm.addCustomer')}
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <StandardSearchBar
            title={t('crm.search.title') || 'Search Customers'}
            searchValue={searchInput}
            searchPlaceholder={t('crm.searchPlaceholder')}
            onSearchChange={(value) => {
              handleSearchChange(value);
              if (value === '') {
                setAppliedSearch(''); // Clear applied search immediately when input is cleared
              }
            }}
            onSearch={handleSearch}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              {t('actions.export')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleExport('csv')}>
              <FileText className="h-4 w-4 mr-2" />
              {t('crm.export.csv')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('xlsx')}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              {t('crm.export.excel')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CustomerList 
        onCustomerClick={handleCustomerClick} 
        onCustomerEdit={handleCustomerEdit}
        searchTerm={appliedSearch || ''} // Ensure empty string when no search
        refreshTrigger={refreshTrigger}
      />
      
      <AddCustomerDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onCustomerAdded={handleCustomerAdded}
      />
      
      <EditCustomerDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        customer={editingCustomer}
        onCustomerUpdated={handleCustomerUpdated}
      />
    </div>
  );
}