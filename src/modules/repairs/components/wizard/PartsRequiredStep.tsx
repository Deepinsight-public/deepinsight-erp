import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { RepairFormData } from '../CreateRepairModal';

interface PartsRequiredStepProps {
  formData: RepairFormData;
  updateFormData: (updates: Partial<RepairFormData>) => void;
}

export function PartsRequiredStep({ formData, updateFormData }: PartsRequiredStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Parts Required</h3>
        
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">Parts Required</Label>
            <div className="mt-2">
              <Textarea
                value={formData.partsRequired || ''}
                onChange={(e) => updateFormData({ partsRequired: e.target.value })}
                placeholder="List the parts required for this repair (comma-separated or free text)..."
                rows={4}
                className="min-h-[120px]"
              />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              List any specific parts, components, or materials needed for the repair. This helps with inventory planning and cost estimation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}