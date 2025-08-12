import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SelectWithSearch } from '@/components/shared/SelectWithSearch';
import { searchProducts, ProductOption } from '../../api/products';
import type { RepairFormData } from '../CreateRepairModal';

interface ProductAndModelStepProps {
  formData: RepairFormData;
  updateFormData: (updates: Partial<RepairFormData>) => void;
}

export function ProductAndModelStep({ formData, updateFormData }: ProductAndModelStepProps) {
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [useCustomProduct, setUseCustomProduct] = useState(false);

  useEffect(() => {
    // Load initial products
    searchProducts('').then(setProductOptions).catch(console.error);
  }, []);

  const handleProductSearch = async (query: string) => {
    setSearchQuery(query);
    try {
      const results = await searchProducts(query);
      setProductOptions(results);
    } catch (error) {
      console.error('Error searching products:', error);
    }
  };

  const handleUseCustomProduct = () => {
    setUseCustomProduct(true);
    updateFormData({ 
      productId: undefined,
      customProduct: searchQuery 
    });
  };

  const handleProductSelect = (value: string) => {
    setUseCustomProduct(false);
    updateFormData({ 
      productId: value,
      customProduct: undefined 
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Product & Model</h3>
        
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">Product *</Label>
            <div className="mt-2 space-y-2">
              {!useCustomProduct ? (
                <>
                  <SelectWithSearch
                    options={productOptions}
                    value={formData.productId || ''}
                    onValueChange={handleProductSelect}
                    onSearchChange={handleProductSearch}
                    placeholder="Search products..."
                    searchPlaceholder="Type to search products"
                    emptyText="No products found"
                  />
                  
                  {searchQuery && productOptions.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground mb-2">No products found for "{searchQuery}"</p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleUseCustomProduct}
                      >
                        Use '{searchQuery}' as custom product
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  <Input
                    value={formData.customProduct || ''}
                    onChange={(e) => updateFormData({ customProduct: e.target.value })}
                    placeholder="Enter custom product name"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setUseCustomProduct(false);
                      updateFormData({ customProduct: undefined });
                    }}
                  >
                    Switch back to product search
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label className="text-base font-medium">Model</Label>
            <div className="mt-2">
              <Input
                value={formData.model || ''}
                onChange={(e) => updateFormData({ model: e.target.value })}
                placeholder="Enter product model"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}