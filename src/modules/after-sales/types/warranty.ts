export interface WarrantyHeader {
  id: string;
  claimNo: string;
  status: 'draft' | 'submitted' | 'tech_reviewed' | 'approved' | 'resolved' | 'closed' | 'rejected' | 'cancelled';
  customerId?: string;
  storeId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  salesOrderId?: string;
  invoiceDate?: string;
  warrantyExpiry?: string;
  faultDesc: string;
}

export interface WarrantyLine {
  id: string;
  headerId: string;
  productId: string;
  serialNo?: string;
  qty: number;
  uom: string;
  warrantyType: 'std' | 'ext';
  attachment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WarrantyTech {
  id: string;
  headerId: string;
  diagnosis: string;
  solution: 'repair' | 'replace' | 'credit';
  estCost?: number;
  inspectedBy: string;
  inspectedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface WarrantyResolution {
  id: string;
  headerId: string;
  action: 'repair' | 'replace' | 'credit';
  replacementId?: string;
  creditAmount?: number;
  vendorRma?: string;
  approvedBy: string;
  approvedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface WarrantyAudit {
  id: string;
  headerId: string;
  action: 'submit' | 'review' | 'approve' | 'reject' | 'resolve' | 'close' | 'cancel';
  actorId: string;
  comment?: string;
  createdAt: string;
}

export interface WarrantyClaim extends WarrantyHeader {
  lines?: WarrantyLine[];
  tech?: WarrantyTech;
  resolution?: WarrantyResolution;
  audit?: WarrantyAudit[];
}

export interface CreateWarrantyData {
  customerId?: string;
  storeId: string;
  salesOrderId?: string;
  invoiceDate?: Date;
  faultDesc: string;
  lines: Omit<WarrantyLine, 'id' | 'headerId' | 'createdAt' | 'updatedAt'>[];
}