import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';
import type { RepairFormData } from '../CreateRepairModal';

interface ProblemStepProps {
  formData: RepairFormData;
  updateFormData: (updates: Partial<RepairFormData>) => void;
}

export function ProblemStep({ formData, updateFormData }: ProblemStepProps) {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">{t('repairs.wizard.problem.title')}</h3>
        
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">{t('repairs.wizard.problem.label')}</Label>
            <div className="mt-2">
              <Textarea
                value={formData.problem}
                onChange={(e) => updateFormData({ problem: e.target.value })}
                placeholder={t('repairs.wizard.problem.placeholder')}
                rows={6}
                className="min-h-[150px]"
              />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {t('repairs.wizard.problem.description')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}