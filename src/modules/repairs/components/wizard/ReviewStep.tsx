import React from 'react';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import type { RepairFormData } from '../CreateRepairModal';

interface ReviewStepProps {
  formData: RepairFormData;
}

export function ReviewStep({ formData }: ReviewStepProps) {
  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'original': return 'Original customer';
      case 'external': return 'External customer';
      case 'warranty': return 'Warranty company transfer';
      default: return source;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Review & Submit</h3>
        <p className="text-muted-foreground mb-6">
          Please review all the information below before creating the repair order.
        </p>
      </div>

      <div className="space-y-6">
        {/* Source & Parties */}
        <div>
          <h4 className="font-medium mb-3">Source & Parties</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-muted-foreground">Source</Label>
              <div>{getSourceLabel(formData.source)}</div>
            </div>
            {formData.customerName && (
              <div>
                <Label className="text-muted-foreground">Customer</Label>
                <div>{formData.customerName}</div>
              </div>
            )}
            {formData.warrantyCompanyName && (
              <div>
                <Label className="text-muted-foreground">Warranty Company</Label>
                <div>{formData.warrantyCompanyName}</div>
              </div>
            )}
            {formData.hearAboutUs && (
              <div>
                <Label className="text-muted-foreground">How they heard about us</Label>
                <div>{formData.hearAboutUs}</div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Product & Model */}
        <div>
          <h4 className="font-medium mb-3">Product & Model</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-muted-foreground">Product</Label>
              <div>{formData.customProduct || 'Selected from catalog'}</div>
            </div>
            {formData.model && (
              <div>
                <Label className="text-muted-foreground">Model</Label>
                <div>{formData.model}</div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Problem */}
        <div>
          <h4 className="font-medium mb-3">Problem Description</h4>
          <div className="text-sm bg-muted p-3 rounded">
            {formData.problem}
          </div>
        </div>

        {formData.partsRequired && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium mb-3">Parts Required</h4>
              <div className="text-sm bg-muted p-3 rounded">
                {formData.partsRequired}
              </div>
            </div>
          </>
        )}

        {formData.homeVisitNeeded && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium mb-3">Home Visit Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Service Address</Label>
                  <div>{formData.visitAddress || 'Not specified'}</div>
                </div>
                {formData.preferredDateTime && (
                  <div>
                    <Label className="text-muted-foreground">Preferred Date</Label>
                    <div>{format(formData.preferredDateTime, 'PPP')}</div>
                  </div>
                )}
                {formData.technicianId && (
                  <div>
                    <Label className="text-muted-foreground">Technician</Label>
                    <div>Selected technician</div>
                  </div>
                )}
                {formData.onSiteNotes && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">On-site Notes</Label>
                    <div className="bg-muted p-2 rounded mt-1">{formData.onSiteNotes}</div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Completion & Guarantee */}
        <div>
          <h4 className="font-medium mb-3">Completion & Guarantee</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {formData.estimatedCompletion && (
              <div>
                <Label className="text-muted-foreground">Estimated Completion</Label>
                <div>{format(formData.estimatedCompletion, 'PPP')}</div>
              </div>
            )}
            <div>
              <Label className="text-muted-foreground">Guarantee Period</Label>
              <div>{formData.guaranteeDays} days</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}