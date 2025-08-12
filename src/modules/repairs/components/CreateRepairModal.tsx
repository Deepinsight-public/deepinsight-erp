import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { StepIndicator } from './wizard/StepIndicator';
import { SourceAndPartiesStep } from './wizard/SourceAndPartiesStep';
import { ProductAndModelStep } from './wizard/ProductAndModelStep';
import { ProblemStep } from './wizard/ProblemStep';
import { PartsRequiredStep } from './wizard/PartsRequiredStep';
import { HomeVisitStep } from './wizard/HomeVisitStep';
import { CompletionGuaranteeStep } from './wizard/CompletionGuaranteeStep';
import { ReviewStep } from './wizard/ReviewStep';
import { createRepair } from '../api/repairs';
import { useToastService } from '@/components/shared/ToastService';

interface CreateRepairModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export interface RepairFormData {
  // Step A - Source & Parties
  source: 'original' | 'external' | 'warranty' | '';
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  hearAboutUs?: string;
  warrantyCompanyId?: string;
  warrantyCompanyName?: string;
  salesOrderId?: string;
  
  // Step B - Product & Model
  productId?: string;
  customProduct?: string;
  model?: string;
  
  // Step C - Problem
  problem: string;
  
  // Step D - Parts Required
  partsRequired?: string;
  
  // Step E - Home Visit
  homeVisitNeeded: boolean;
  visitAddress?: string;
  preferredDateTime?: Date;
  technicianId?: string;
  onSiteNotes?: string;
  
  // Step F - Completion & Guarantee
  estimatedCompletion?: Date;
  guaranteeDays: number;
}

const steps = [
  'Source & Parties',
  'Product & Model', 
  'Problem',
  'Parts Required',
  'Home Visit Details',
  'Completion & Guarantee',
  'Review & Submit'
];

export function CreateRepairModal({ open, onClose, onSuccess }: CreateRepairModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showSuccess, showError } = useToastService();
  
  const [formData, setFormData] = useState<RepairFormData>({
    source: '',
    problem: '',
    homeVisitNeeded: false,
    guaranteeDays: 90
  });

  const updateFormData = (updates: Partial<RepairFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Transform form data to match API expectations
      const repairData = {
        type: formData.source === 'warranty' ? 'warranty' : 'paid',
        productId: formData.productId || '',
        customerId: formData.customerId,
        customerName: formData.customerName,
        salesOrderId: formData.salesOrderId,
        description: formData.problem,
        cost: 0,
        estimatedCompletion: formData.estimatedCompletion,
        warrantyStatus: formData.source === 'warranty' ? 'active' : 'unknown',
        warrantyExpiresAt: formData.source === 'warranty' && formData.estimatedCompletion ? 
          new Date(formData.estimatedCompletion.getTime() + (formData.guaranteeDays * 24 * 60 * 60 * 1000)) : 
          undefined
      };

      await createRepair(repairData);
      showSuccess('Repair created successfully');
      onSuccess();
      
      // Reset form
      setFormData({
        source: '',
        problem: '',
        homeVisitNeeded: false,
        guaranteeDays: 90
      });
      setCurrentStep(0);
    } catch (error) {
      console.error('Error creating repair:', error);
      showError('Failed to create repair. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      source: '',
      problem: '',
      homeVisitNeeded: false,
      guaranteeDays: 90
    });
    setCurrentStep(0);
    onClose();
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0: // Source & Parties
        return formData.source !== '';
      case 1: // Product & Model
        return formData.productId || formData.customProduct;
      case 2: // Problem
        return formData.problem.trim() !== '';
      case 3: // Parts Required
        return true; // Optional step
      case 4: // Home Visit
        return true; // Optional step
      case 5: // Completion & Guarantee
        return true; // Optional step
      case 6: // Review
        return true;
      default:
        return false;
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return <SourceAndPartiesStep formData={formData} updateFormData={updateFormData} />;
      case 1:
        return <ProductAndModelStep formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <ProblemStep formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <PartsRequiredStep formData={formData} updateFormData={updateFormData} />;
      case 4:
        return <HomeVisitStep formData={formData} updateFormData={updateFormData} />;
      case 5:
        return <CompletionGuaranteeStep formData={formData} updateFormData={updateFormData} />;
      case 6:
        return <ReviewStep formData={formData} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Create New Repair</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <StepIndicator steps={steps} currentStep={currentStep} />
          
          <div className="min-h-[400px]">
            {renderCurrentStep()}
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              
              {currentStep === steps.length - 1 ? (
                <Button 
                  onClick={handleSubmit}
                  disabled={!isStepValid() || isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Repair'}
                </Button>
              ) : (
                <Button 
                  onClick={handleNext}
                  disabled={!isStepValid()}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}