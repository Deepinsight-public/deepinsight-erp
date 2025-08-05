import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Download, FileText, FileSpreadsheet, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
  const [searchTerm, setSearchTerm] = useState('');
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

  const handleSearch = () => {
    setSearchTerm(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchTerm('');
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
            <h1 className="text-3xl font-bold">{t('crm')}</h1>
            <p className="text-muted-foreground mt-2">
              Manage customer relationships and track customer activity.
            </p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
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
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10 pr-10"
          />
          {searchInput && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button onClick={handleSearch}>
          Search
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleExport('csv')}>
              <FileText className="h-4 w-4 mr-2" />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('xlsx')}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export as Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CustomerList 
        onCustomerClick={handleCustomerClick} 
        onCustomerEdit={handleCustomerEdit}
        searchTerm={searchTerm}
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