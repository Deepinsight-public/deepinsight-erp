import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { RepairFormData } from '../CreateRepairModal';

interface ProblemStepProps {
  formData: RepairFormData;
  updateFormData: (updates: Partial<RepairFormData>) => void;
}

export function ProblemStep({ formData, updateFormData }: ProblemStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Problem Description</h3>
        
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">Problem / Repair Description *</Label>
            <div className="mt-2">
              <Textarea
                value={formData.problem}
                onChange={(e) => updateFormData({ problem: e.target.value })}
                placeholder="Describe the problem or repair needed in detail..."
                rows={6}
                className="min-h-[150px]"
              />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Please provide as much detail as possible about the issue, including symptoms, when it started, and any relevant circumstances.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}