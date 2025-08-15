import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';
import type { RepairFormData } from '../CreateRepairModal';

interface PartsRequiredStepProps {
  formData: RepairFormData;
  updateFormData: (updates: Partial<RepairFormData>) => void;
}

export function PartsRequiredStep({ formData, updateFormData }: PartsRequiredStepProps) {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">{t('repairs.wizard.partsRequired.title')}</h3>
        
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">{t('repairs.wizard.partsRequired.label')}</Label>
            <div className="mt-2">
              <Textarea
                value={formData.partsRequired || ''}
                onChange={(e) => updateFormData({ partsRequired: e.target.value })}
                placeholder={t('repairs.wizard.partsRequired.placeholder')}
                rows={4}
                className="min-h-[120px]"
              />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {t('repairs.wizard.partsRequired.description')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}