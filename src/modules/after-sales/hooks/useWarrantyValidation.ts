import { useState, useCallback } from 'react';
import { validateWarrantyForReturn, getProductWarrantyInfo } from '../services/warrantyValidation';
import type { 
  WarrantyValidationResult, 
  WarrantyValidationRequest, 
  ProductWarrantyInfo 
} from '../types/warrantyValidation';

export const useWarrantyValidation = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<WarrantyValidationResult | null>(null);
  const [warrantyInfo, setWarrantyInfo] = useState<ProductWarrantyInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  const validateWarranty = useCallback(async (request: WarrantyValidationRequest) => {
    setIsValidating(true);
    setError(null);
    
    try {
      const result = await validateWarrantyForReturn(request);
      setValidationResult(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to validate warranty';
      setError(errorMessage);
      setValidationResult({
        isValid: false,
        status: 'not_found',
        errorMessage
      });
      return null;
    } finally {
      setIsValidating(false);
    }
  }, []);

  const getWarrantyInfo = useCallback(async (productId: string) => {
    setIsValidating(true);
    setError(null);
    
    try {
      const info = await getProductWarrantyInfo(productId);
      setWarrantyInfo(info);
      return info;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch warranty info';
      setError(errorMessage);
      setWarrantyInfo([]);
      return [];
    } finally {
      setIsValidating(false);
    }
  }, []);

  const clearValidation = useCallback(() => {
    setValidationResult(null);
    setWarrantyInfo([]);
    setError(null);
  }, []);

  return {
    isValidating,
    validationResult,
    warrantyInfo,
    error,
    validateWarranty,
    getWarrantyInfo,
    clearValidation
  };
};