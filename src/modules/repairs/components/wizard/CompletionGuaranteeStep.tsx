import React from 'react';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import type { RepairFormData } from '../CreateRepairModal';

interface CompletionGuaranteeStepProps {
  formData: RepairFormData;
  updateFormData: (updates: Partial<RepairFormData>) => void;
}

export function CompletionGuaranteeStep({ formData, updateFormData }: CompletionGuaranteeStepProps) {
  const guaranteeEndDate = formData.estimatedCompletion 
    ? addDays(formData.estimatedCompletion, formData.guaranteeDays)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Completion & Guarantee</h3>
        
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">Estimated Completion Date</Label>
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
                      <span>Pick a completion date</span>
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
              This can be updated later as the repair progresses.
            </p>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">90-Day Guarantee</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  All repairs come with a standard 90-day guarantee
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold">{formData.guaranteeDays} days</div>
              </div>
            </div>
            
            {guaranteeEndDate && (
              <div className="mt-3 p-3 bg-background rounded border">
                <div className="text-sm">
                  <strong>Guarantee Period:</strong>
                </div>
                <div className="text-sm text-muted-foreground">
                  From completion date until {format(guaranteeEndDate, "PPP")}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}