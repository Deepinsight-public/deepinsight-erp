import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { SelectWithSearch } from '@/components/shared/SelectWithSearch';
import { searchCustomers, CustomerOption } from '../../api/customers';
import { searchSalesOrders } from '../../api/salesOrders';
import { AddCustomerModal } from './AddCustomerModal';
import type { RepairFormData } from '../CreateRepairModal';

interface SourceAndPartiesStepProps {
  formData: RepairFormData;
  updateFormData: (updates: Partial<RepairFormData>) => void;
}

export function SourceAndPartiesStep({ formData, updateFormData }: SourceAndPartiesStepProps) {
  const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>([]);
  const [salesOrderOptions, setSalesOrderOptions] = useState<any[]>([]);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [warrantyCompanies] = useState([
    { value: 'warranty1', label: 'ABC Warranty Services' },
    { value: 'warranty2', label: 'Global Warranty Solutions' },
    { value: 'warranty3', label: 'Premium Protection Plans' }
  ]);

  const hearAboutUsOptions = [
    { value: 'referral', label: 'Referral from friend/family' },
    { value: 'online_search', label: 'Online search' },
    { value: 'social_media', label: 'Social media' },
    { value: 'advertisement', label: 'Advertisement' },
    { value: 'walk_in', label: 'Walk-in' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    // Load initial customers
    searchCustomers('').then(setCustomerOptions).catch(console.error);
  }, []);

  const handleCustomerSearch = async (query: string) => {
    try {
      const results = await searchCustomers(query);
      setCustomerOptions(results);
    } catch (error) {
      console.error('Error searching customers:', error);
    }
  };

  const handleOrderSearch = async (query: string) => {
    if (query.length < 2) {
      setSalesOrderOptions([]);
      return;
    }
    
    try {
      const results = await searchSalesOrders(query);
      setSalesOrderOptions(results.map(order => ({
        value: order.id,
        label: `${order.order_number} - ${order.customer_name} (${new Date(order.order_date).toLocaleDateString()})`
      })));
    } catch (error) {
      console.error('Error searching orders:', error);
      setSalesOrderOptions([]);
    }
  };

  const handleCustomerCreated = (customer: any) => {
    const newOption = {
      value: customer.id,
      label: `${customer.name} (${customer.email})`,
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone
    };
    setCustomerOptions(prev => [newOption, ...prev]);
    updateFormData({ 
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email 
    });
    setShowAddCustomer(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Source & Parties</h3>
        
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">Source *</Label>
            <RadioGroup
              value={formData.source}
              onValueChange={(value) => updateFormData({ source: value as any })}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="original" id="original" />
                <Label htmlFor="original">Original customer (existing store customer)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="external" id="external" />
                <Label htmlFor="external">External customer (anyone, not necessarily prior customer)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="warranty" id="warranty" />
                <Label htmlFor="warranty">Warranty company transfer</Label>
              </div>
            </RadioGroup>
          </div>

          {formData.source && (
            <>
              <div>
                <Label className="text-base font-medium">Customer</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <SelectWithSearch
                        options={customerOptions}
                        value={formData.customerId || ''}
                        onValueChange={(value) => {
                          const customer = customerOptions.find(c => c.value === value);
                          updateFormData({ 
                            customerId: value,
                            customerName: customer?.name,
                            customerPhone: customer?.phone,
                            customerEmail: customer?.email
                          });
                        }}
                        onSearchChange={handleCustomerSearch}
                        placeholder="Search customers..."
                        searchPlaceholder="Type to search customers"
                        emptyText="No customers found"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddCustomer(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add New
                    </Button>
                  </div>
                  
                  {formData.source === 'external' && (
                    <div>
                      <Label>How did you hear about us?</Label>
                      <div className="mt-1 space-y-2">
                        <select
                          className="w-full p-2 border rounded-md"
                          value={formData.hearAboutUs || ''}
                          onChange={(e) => updateFormData({ hearAboutUs: e.target.value })}
                        >
                          <option value="">Select an option</option>
                          {hearAboutUsOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {formData.hearAboutUs === 'other' && (
                          <Input
                            placeholder="Please specify..."
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
                  <Label className="text-base font-medium">Warranty Company</Label>
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
                      placeholder="Search warranty companies..."
                      searchPlaceholder="Type company name"
                      emptyText="Type to add custom warranty company"
                    />
                  </div>
                </div>
              )}

              <div>
                <Label className="text-base font-medium">Original Order Link (optional but recommended)</Label>
                <div className="mt-2">
                  <SelectWithSearch
                    options={salesOrderOptions}
                    value={formData.salesOrderId || ''}
                    onValueChange={(value) => updateFormData({ salesOrderId: value })}
                    onSearchChange={handleOrderSearch}
                    placeholder="Search by order number..."
                    searchPlaceholder="Type order number or ID"
                    emptyText="No orders found"
                  />
                </div>
              </div>
            </>
          )}
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