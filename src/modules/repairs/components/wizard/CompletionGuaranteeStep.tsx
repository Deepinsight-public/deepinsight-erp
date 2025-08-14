import React from 'react';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import type { RepairFormData } from '../CreateRepairModal';

interface CompletionGuaranteeStepProps {
  formData: RepairFormData;
  updateFormData: (updates: Partial<RepairFormData>) => void;
}

export function CompletionGuaranteeStep({ formData, updateFormData }: CompletionGuaranteeStepProps) {
  const { t } = useTranslation();
  const guaranteeEndDate = formData.estimatedCompletion 
    ? addDays(formData.estimatedCompletion, formData.guaranteeDays)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">{t('repairs.wizard.completion.title')}</h3>
        
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">{t('repairs.wizard.completion.estimatedDate')}</Label>
            <div className="mt-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.estimatedCompletion && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.estimatedCompletion ? (
                      format(formData.estimatedCompletion, "PPP")
                    ) : (
                      <span>{t('repairs.wizard.completion.pickDate')}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.estimatedCompletion}
                    onSelect={(date) => updateFormData({ estimatedCompletion: date })}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {t('repairs.wizard.completion.updateLater')}
            </p>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">{t('repairs.wizard.completion.guarantee')}</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('repairs.wizard.completion.guaranteeDescription')}
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold">{formData.guaranteeDays} days</div>
              </div>
            </div>
            
            {guaranteeEndDate && (
              <div className="mt-3 p-3 bg-background rounded border">
                <div className="text-sm">
                  <strong>{t('repairs.wizard.completion.guaranteePeriod')}</strong>
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('repairs.wizard.completion.fromCompletion')} {format(guaranteeEndDate, "PPP")}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}