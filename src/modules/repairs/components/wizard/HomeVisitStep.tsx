import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import type { RepairFormData } from '../CreateRepairModal';

interface HomeVisitStepProps {
  formData: RepairFormData;
  updateFormData: (updates: Partial<RepairFormData>) => void;
}

export function HomeVisitStep({ formData, updateFormData }: HomeVisitStepProps) {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">{t('repairs.wizard.homeVisit.title')}</h3>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="homeVisit"
              checked={formData.homeVisitNeeded}
              onCheckedChange={(checked) => updateFormData({ homeVisitNeeded: checked })}
            />
            <Label htmlFor="homeVisit" className="text-base font-medium">
              {t('repairs.wizard.homeVisit.needed')}
            </Label>
          </div>

          {formData.homeVisitNeeded && (
            <div className="space-y-4 pl-4 border-l-2 border-muted">
              <div>
                <Label className="text-base font-medium">{t('repairs.wizard.homeVisit.serviceAddress')}</Label>
                <div className="mt-2">
                  <Textarea
                    value={formData.visitAddress || ''}
                    onChange={(e) => updateFormData({ visitAddress: e.target.value })}
                    placeholder={t('repairs.wizard.homeVisit.addressPlaceholder')}
                    rows={3}
                    required
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('repairs.wizard.homeVisit.addressDescription')}
                </p>
              </div>

              <div>
                <Label className="text-base font-medium">{t('repairs.wizard.homeVisit.preferredDateTime')}</Label>
                <div className="mt-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.preferredDateTime && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.preferredDateTime ? (
                          format(formData.preferredDateTime, "PPP")
                        ) : (
                          <span>{t('repairs.wizard.homeVisit.pickDate')}</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.preferredDateTime}
                        onSelect={(date) => updateFormData({ preferredDateTime: date })}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">{t('repairs.wizard.homeVisit.technician')}</Label>
                <div className="mt-2">
                  <select
                    className="w-full p-2 border rounded-md"
                    value={formData.technicianId || ''}
                    onChange={(e) => updateFormData({ technicianId: e.target.value })}
                  >
                    <option value="">{t('repairs.wizard.homeVisit.selectTechnician')}</option>
                    <option value="tech1">{t('repairs.wizard.homeVisit.tech1')}</option>
                    <option value="tech2">{t('repairs.wizard.homeVisit.tech2')}</option>
                    <option value="tech3">{t('repairs.wizard.homeVisit.tech3')}</option>
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">{t('repairs.wizard.homeVisit.onSiteNotes')}</Label>
                <div className="mt-2">
                  <Textarea
                    value={formData.onSiteNotes || ''}
                    onChange={(e) => updateFormData({ onSiteNotes: e.target.value })}
                    placeholder={t('repairs.wizard.homeVisit.notesPlaceholder')}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}