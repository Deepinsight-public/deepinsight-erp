import React from 'react';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import type { RepairFormData } from '../CreateRepairModal';
import { Button } from '@/components/ui/button';

interface ReviewStepProps {
  formData: RepairFormData;
  onBack: () => void;
  onSubmit: () => void;
}

export function ReviewStep({ formData, onBack, onSubmit }: ReviewStepProps) {
  const { t } = useTranslation();
  
  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'warranty': return 'Warranty';
      case 'external': return 'External Customer';
      case 'internal': return 'Internal';
      default: return source;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">{t('repairs.wizard.review.title')}</h3>
        <p className="text-muted-foreground mb-6">
          {t('repairs.wizard.review.description')}
        </p>
      </div>

      <div className="space-y-6">
        {/* Source & Parties */}
        <div>
          <h4 className="font-medium mb-3">{t('repairs.wizard.review.sourceParties')}</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-muted-foreground">{t('repairs.wizard.review.source')}</Label>
              <div>{getSourceLabel(formData.source)}</div>
            </div>
            {formData.customerName && (
              <div>
                <Label className="text-muted-foreground">{t('repairs.wizard.review.customer')}</Label>
                <div>{formData.customerName}</div>
              </div>
            )}
            {formData.warrantyCompanyName && (
              <div>
                <Label className="text-muted-foreground">{t('repairs.wizard.review.warrantyCompany')}</Label>
                <div>{formData.warrantyCompanyName}</div>
              </div>
            )}
            {formData.hearAboutUs && (
              <div>
                <Label className="text-muted-foreground">{t('repairs.wizard.review.hearAboutUs')}</Label>
                <div>{formData.hearAboutUs}</div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Product & Model */}
        <div>
          <h4 className="font-medium mb-3">{t('repairs.wizard.review.productModel')}</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-muted-foreground">{t('repairs.wizard.review.product')}</Label>
              <div>{formData.customProduct || t('repairs.wizard.review.selectedFromCatalog')}</div>
            </div>
            {formData.model && (
              <div>
                <Label className="text-muted-foreground">{t('repairs.wizard.review.model')}</Label>
                <div>{formData.model}</div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Problem */}
        <div>
          <h4 className="font-medium mb-3">{t('repairs.wizard.review.problemDescription')}</h4>
          <div className="text-sm bg-muted p-3 rounded">
            {formData.problem}
          </div>
        </div>

        {formData.partsRequired && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium mb-3">{t('repairs.wizard.review.partsRequired')}</h4>
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
              <h4 className="font-medium mb-3">{t('repairs.wizard.review.homeVisitDetails')}</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">{t('repairs.wizard.review.serviceAddress')}</Label>
                  <div>{formData.visitAddress || t('repairs.wizard.review.notSpecified')}</div>
                </div>
                {formData.preferredDateTime && (
                  <div>
                    <Label className="text-muted-foreground">{t('repairs.wizard.review.preferredDate')}</Label>
                    <div>{format(formData.preferredDateTime, 'PPP')}</div>
                  </div>
                )}
                {formData.technicianId && (
                  <div>
                    <Label className="text-muted-foreground">{t('repairs.wizard.review.technician')}</Label>
                    <div>{formData.technicianId}</div>
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

        {/* Completion & Guarantee */}
        <Separator />
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

      {/* Action Buttons */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onSubmit}>
          Create Repair Order
        </Button>
      </div>
    </div>
  );
}