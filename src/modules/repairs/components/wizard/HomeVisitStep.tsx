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
import type { RepairFormData } from '../CreateRepairModal';

interface HomeVisitStepProps {
  formData: RepairFormData;
  updateFormData: (updates: Partial<RepairFormData>) => void;
}

export function HomeVisitStep({ formData, updateFormData }: HomeVisitStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Home Visit Details</h3>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="homeVisit"
              checked={formData.homeVisitNeeded}
              onCheckedChange={(checked) => updateFormData({ homeVisitNeeded: checked })}
            />
            <Label htmlFor="homeVisit" className="text-base font-medium">
              Home visit needed?
            </Label>
          </div>

          {formData.homeVisitNeeded && (
            <div className="space-y-4 pl-4 border-l-2 border-muted">
              <div>
                <Label className="text-base font-medium">Service Address *</Label>
                <div className="mt-2">
                  <Textarea
                    value={formData.visitAddress || ''}
                    onChange={(e) => updateFormData({ visitAddress: e.target.value })}
                    placeholder="Enter the address where service is needed..."
                    rows={3}
                    required
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Address will be prefilled from customer data but can be edited if service is needed at a different location.
                </p>
              </div>

              <div>
                <Label className="text-base font-medium">Preferred Date & Time *</Label>
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
                          <span>Pick a date</span>
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
                <Label className="text-base font-medium">Technician</Label>
                <div className="mt-2">
                  <select
                    className="w-full p-2 border rounded-md"
                    value={formData.technicianId || ''}
                    onChange={(e) => updateFormData({ technicianId: e.target.value })}
                  >
                    <option value="">Select a technician</option>
                    <option value="tech1">John Smith - Senior Technician</option>
                    <option value="tech2">Sarah Johnson - Appliance Specialist</option>
                    <option value="tech3">Mike Chen - Electronics Expert</option>
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">On-site Notes</Label>
                <div className="mt-2">
                  <Textarea
                    value={formData.onSiteNotes || ''}
                    onChange={(e) => updateFormData({ onSiteNotes: e.target.value })}
                    placeholder="Any special instructions or notes for the technician..."
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