import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SelectWithSearch } from '@/components/shared/SelectWithSearch';
import { AddCustomerModal } from './AddCustomerModal';
import type { RepairFormData } from '../CreateRepairModal';

interface SourceAndPartiesStepProps {
  formData: RepairFormData;
  updateFormData: (updates: Partial<RepairFormData>) => void;
}

export function SourceAndPartiesStep({ formData, updateFormData }: SourceAndPartiesStepProps) {
  const { t } = useTranslation();
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [customerOptions, setCustomerOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [salesOrderOptions, setSalesOrderOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [warrantyCompanies] = useState([
    { value: 'manufacturer', label: 'Manufacturer Warranty' },
    { value: 'extended', label: 'Extended Warranty' },
    { value: 'store', label: 'Store Warranty' },
    { value: 'other', label: 'Other' },
  ]);

  const hearAboutUsOptions = [
    { value: 'referral', label: 'Customer Referral' },
    { value: 'advertising', label: 'Advertising' },
    { value: 'online', label: 'Online Search' },
    { value: 'walkin', label: 'Walk-in' },
    { value: 'other', label: 'Other' },
  ];

  // Mock data - in real app, these would come from API calls
  useEffect(() => {
    // Load customers
    setCustomerOptions([
      { value: 'cust1', label: 'John Doe - john@example.com' },
      { value: 'cust2', label: 'Jane Smith - jane@example.com' },
    ]);

    // Load sales orders
    setSalesOrderOptions([
      { value: 'order1', label: 'Order #1001 - John Doe' },
      { value: 'order2', label: 'Order #1002 - Jane Smith' },
    ]);
  }, []);

  const handleCustomerSelect = (customerId: string) => {
    const customer = customerOptions.find(c => c.value === customerId);
    if (customer) {
      // Extract customer name from label (format: "Name - email")
      const customerName = customer.label.split(' - ')[0];
      updateFormData({ 
        customerId,
        customerName
      });
    }
  };

  const handleCustomerSearch = (searchTerm: string) => {
    // In real app, this would filter the customer options
    console.log('Searching customers:', searchTerm);
  };

  const handleOrderSelect = (orderId: string) => {
    updateFormData({ salesOrderId: orderId });
  };

  const handleOrderSearch = (searchTerm: string) => {
    // In real app, this would filter the order options
    console.log('Searching orders:', searchTerm);
  };

  const handleCustomerCreated = (customer: any) => {
    // Add new customer to options and select it
    const newOption = { value: customer.id, label: `${customer.name} - ${customer.email}` };
    setCustomerOptions(prev => [...prev, newOption]);
    updateFormData({ 
      customerId: customer.id,
      customerName: customer.name
    });
    setShowAddCustomer(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">{t('repairs.wizard.sourceParties.title')}</h3>
        
        <div className="space-y-6">
          {/* Source Selection */}
          <div>
            <Label className="text-base font-medium">{t('repairs.wizard.sourceParties.source')}</Label>
            <div className="mt-2">
              <select
                className="w-full p-2 border rounded-md"
                value={formData.source}
                onChange={(e) => updateFormData({ source: e.target.value as "" | "warranty" | "external" | "original" })}
              >
                <option value="">{t('repairs.wizard.sourceParties.sourcePlaceholder')}</option>
                <option value="warranty">Warranty Transfer</option>
                <option value="external">External Customer</option>
                <option value="internal">Internal</option>
              </select>
            </div>
          </div>

          {/* Customer Selection */}
          <div>
            <Label className="text-base font-medium">{t('repairs.wizard.sourceParties.customer')}</Label>
            <div className="mt-2">
              <div className="flex gap-2">
                <div className="flex-1">
                  <SelectWithSearch
                    options={customerOptions}
                    value={formData.customerId || ''}
                    onValueChange={handleCustomerSelect}
                    onSearchChange={handleCustomerSearch}
                    placeholder={t('repairs.wizard.sourceParties.customerPlaceholder')}
                    searchPlaceholder={t('repairs.wizard.sourceParties.searchCustomers')}
                    emptyText={t('repairs.wizard.sourceParties.noCustomers')}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddCustomer(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('repairs.wizard.sourceParties.addNew')}
                </Button>
              </div>
              
              {formData.source === 'external' && (
                <div>
                  <Label>{t('repairs.wizard.sourceParties.howDidYouHear')}</Label>
                  <div className="mt-1 space-y-2">
                    <select
                      className="w-full p-2 border rounded-md"
                      value={formData.hearAboutUs || ''}
                      onChange={(e) => updateFormData({ hearAboutUs: e.target.value })}
                    >
                      <option value="">{t('repairs.wizard.sourceParties.selectOption')}</option>
                      {hearAboutUsOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {formData.hearAboutUs === 'other' && (
                      <Input
                        placeholder={t('repairs.wizard.sourceParties.pleaseSpecify')}
                        value={formData.hearAboutUs || ''}
                        onChange={(e) => updateFormData({ hearAboutUs: e.target.value })}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {formData.source === 'warranty' && (
            <div>
              <Label className="text-base font-medium">{t('repairs.wizard.sourceParties.warrantyCompany')}</Label>
              <div className="mt-2">
                <SelectWithSearch
                  options={warrantyCompanies}
                  value={formData.warrantyCompanyId || ''}
                  onValueChange={(value) => {
                    const company = warrantyCompanies.find(c => c.value === value);
                    updateFormData({ 
                      warrantyCompanyId: value,
                      warrantyCompanyName: company?.label
                    });
                  }}
                  placeholder={t('repairs.wizard.sourceParties.searchCompanies')}
                  searchPlaceholder={t('repairs.wizard.sourceParties.typeCompanyName')}
                  emptyText={t('repairs.wizard.sourceParties.addCustomCompany')}
                />
              </div>
            </div>
          )}

          <div>
            <Label className="text-base font-medium">{t('repairs.wizard.sourceParties.originalOrder')}</Label>
            <div className="mt-2">
              <SelectWithSearch
                options={salesOrderOptions}
                value={formData.salesOrderId || ''}
                onValueChange={handleOrderSelect}
                onSearchChange={handleOrderSearch}
                placeholder={t('repairs.wizard.sourceParties.searchOrders')}
                searchPlaceholder={t('repairs.wizard.sourceParties.typeOrderNumber')}
                emptyText={t('repairs.wizard.sourceParties.noOrders')}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('repairs.wizard.sourceParties.enhancementNote')}
            </p>
          </div>
        </div>
      </div>

      <AddCustomerModal
        open={showAddCustomer}
        onClose={() => setShowAddCustomer(false)}
        onSuccess={handleCustomerCreated}
      />
    </div>
  );
}