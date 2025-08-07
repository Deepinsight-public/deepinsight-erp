import { supabase } from '@/integrations/supabase/client';
import { WarrantyClaim, WarrantyHeader, CreateWarrantyData } from '../types/warranty';

export const getWarrantyClaims = async (params?: { 
  status?: string; 
  page?: number; 
  pageSize?: number; 
}): Promise<WarrantyHeader[]> => {
  let query = supabase
    .from('warranty_headers')
    .select('*')
    .order('created_at', { ascending: false });

  if (params?.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }

  if (params?.page && params?.pageSize) {
    const from = (params.page - 1) * params.pageSize;
    const to = from + params.pageSize - 1;
    query = query.range(from, to);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(item => ({
    id: item.id,
    claimNo: item.claim_no,
    status: item.status as WarrantyHeader['status'],
    customerId: item.customer_id,
    storeId: item.store_id,
    createdBy: item.created_by,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    salesOrderId: item.sales_order_id,
    invoiceDate: item.invoice_date,
    warrantyExpiry: item.warranty_expiry,
    faultDesc: item.fault_desc
  }));
};

export const getWarrantyClaim = async (id: string): Promise<WarrantyClaim | null> => {
  const { data: header, error: headerError } = await supabase
    .from('warranty_headers')
    .select('*')
    .eq('id', id)
    .single();

  if (headerError) {
    throw new Error(headerError.message);
  }

  if (!header) return null;

  // Fetch related data
  const [linesResult, techResult, resolutionResult, auditResult] = await Promise.all([
    supabase.from('warranty_lines').select('*').eq('header_id', id),
    supabase.from('warranty_tech').select('*').eq('header_id', id).maybeSingle(),
    supabase.from('warranty_resolution').select('*').eq('header_id', id).maybeSingle(),
    supabase.from('warranty_audit').select('*').eq('header_id', id).order('created_at', { ascending: false })
  ]);

  return {
    id: header.id,
    claimNo: header.claim_no,
    status: header.status as WarrantyHeader['status'],
    customerId: header.customer_id,
    storeId: header.store_id,
    createdBy: header.created_by,
    createdAt: header.created_at,
    updatedAt: header.updated_at,
    salesOrderId: header.sales_order_id,
    invoiceDate: header.invoice_date,
    warrantyExpiry: header.warranty_expiry,
    faultDesc: header.fault_desc,
    lines: (linesResult.data || []).map(line => ({
      id: line.id,
      headerId: line.header_id,
      productId: line.product_id,
      serialNo: line.serial_no,
      qty: line.qty,
      uom: line.uom,
      warrantyType: line.warranty_type as 'std' | 'ext',
      attachment: line.attachment,
      createdAt: line.created_at,
      updatedAt: line.updated_at
    })),
    tech: techResult.data ? {
      id: techResult.data.id,
      headerId: techResult.data.header_id,
      diagnosis: techResult.data.diagnosis,
      solution: techResult.data.solution as 'repair' | 'replace' | 'credit',
      estCost: techResult.data.est_cost,
      inspectedBy: techResult.data.inspected_by,
      inspectedAt: techResult.data.inspected_at,
      createdAt: techResult.data.created_at,
      updatedAt: techResult.data.updated_at
    } : undefined,
    resolution: resolutionResult.data ? {
      id: resolutionResult.data.id,
      headerId: resolutionResult.data.header_id,
      action: resolutionResult.data.action as 'repair' | 'replace' | 'credit',
      replacementId: resolutionResult.data.replacement_id,
      creditAmount: resolutionResult.data.credit_amount,
      vendorRma: resolutionResult.data.vendor_rma,
      approvedBy: resolutionResult.data.approved_by,
      approvedAt: resolutionResult.data.approved_at,
      createdAt: resolutionResult.data.created_at,
      updatedAt: resolutionResult.data.updated_at
    } : undefined,
    audit: (auditResult.data || []).map(audit => ({
      id: audit.id,
      headerId: audit.header_id,
      action: audit.action as any,
      actorId: audit.actor_id,
      comment: audit.comment,
      createdAt: audit.created_at
    }))
  };
};

export const createWarrantyClaim = async (data: CreateWarrantyData): Promise<WarrantyHeader> => {
  // Generate claim number
  const { data: claimNo, error: claimNoError } = await supabase
    .rpc('generate_warranty_claim_no');

  if (claimNoError) {
    throw new Error(claimNoError.message);
  }

  // Create header
  const { data: header, error: headerError } = await supabase
    .from('warranty_headers')
    .insert({
      claim_no: claimNo,
      customer_id: data.customerId,
      store_id: data.storeId,
      sales_order_id: data.salesOrderId,
      invoice_date: data.invoiceDate?.toISOString(),
      warranty_expiry: data.invoiceDate ? new Date(data.invoiceDate.getTime() + (365 * 24 * 60 * 60 * 1000)).toISOString() : undefined,
      fault_desc: data.faultDesc,
      created_by: (await supabase.auth.getUser()).data.user?.id || ''
    })
    .select()
    .single();

  if (headerError) {
    throw new Error(headerError.message);
  }

  // Create lines
  if (data.lines.length > 0) {
    const { error: linesError } = await supabase
      .from('warranty_lines')
      .insert(
        data.lines.map(line => ({
          header_id: header.id,
          product_id: line.productId,
          serial_no: line.serialNo,
          qty: line.qty,
          uom: line.uom,
          warranty_type: line.warrantyType,
          attachment: line.attachment
        }))
      );

    if (linesError) {
      throw new Error(linesError.message);
    }
  }

  // Create audit entry
  await supabase
    .from('warranty_audit')
    .insert({
      header_id: header.id,
      action: 'submit',
      actor_id: (await supabase.auth.getUser()).data.user?.id || '',
      comment: 'Warranty claim created'
    });

  return {
    id: header.id,
    claimNo: header.claim_no,
    status: header.status as WarrantyHeader['status'],
    customerId: header.customer_id,
    storeId: header.store_id,
    createdBy: header.created_by,
    createdAt: header.created_at,
    updatedAt: header.updated_at,
    salesOrderId: header.sales_order_id,
    invoiceDate: header.invoice_date,
    warrantyExpiry: header.warranty_expiry,
    faultDesc: header.fault_desc
  };
};

export const updateWarrantyClaim = async (id: string, updates: Partial<WarrantyHeader>): Promise<WarrantyHeader> => {
  const { data, error } = await supabase
    .from('warranty_headers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    id: data.id,
    claimNo: data.claim_no,
    status: data.status as WarrantyHeader['status'],
    customerId: data.customer_id,
    storeId: data.store_id,
    createdBy: data.created_by,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    salesOrderId: data.sales_order_id,
    invoiceDate: data.invoice_date,
    warrantyExpiry: data.warranty_expiry,
    faultDesc: data.fault_desc
  };
};

export const submitWarrantyClaim = async (id: string): Promise<void> => {
  await updateWarrantyClaim(id, { status: 'submitted' });
  
  await supabase
    .from('warranty_audit')
    .insert({
      header_id: id,
      action: 'submit',
      actor_id: (await supabase.auth.getUser()).data.user?.id || '',
      comment: 'Warranty claim submitted for review'
    });
};