export interface WarrantyValidationResult {
  isValid: boolean;
  status: 'valid' | 'expired' | 'not_found' | 'invalid_product';
  expiryDate?: string;
  remainingDays?: number;
  salesOrderId?: string;
  invoiceDate?: string;
  errorMessage?: string;
}

export interface WarrantyValidationRequest {
  productId: string;
  customerEmail?: string;
  salesOrderId?: string;
  serialNumber?: string;
}

export interface ProductWarrantyInfo {
  productId: string;
  salesOrderId?: string;
  invoiceDate?: string;
  warrantyPeriodDays: number;
  warrantyExpiry?: string;
  warrantyType: 'std' | 'ext';
  status: 'active' | 'expired' | 'voided';
}

export interface WarrantyValidationError {
  code: 'WARRANTY_EXPIRED' | 'WARRANTY_NOT_FOUND' | 'PRODUCT_NOT_FOUND' | 'CUSTOMER_MISMATCH' | 'INVALID_REQUEST';
  message: string;
  details?: Record<string, any>;
}