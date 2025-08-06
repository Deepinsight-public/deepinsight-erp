import { supabase } from '@/integrations/supabase/client';
import type { 
  ScrapHeader, 
  ScrapLine, 
  ScrapAudit, 
  ScrapHeaderData, 
  ScrapLineData, 
  ScrapAuditData,
  ScrapFilters,
  ScrapStatus
} from '../types/scrap';

// Get current user's store and profile info
const getCurrentUserInfo = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('store_id, role')
    .eq('user_id', user.id)
    .single();

  if (!profile?.store_id) throw new Error('Store not found for user');

  return { user, profile };
};

// Fetch all scrap headers with optional filters
export const getScrapHeaders = async (filters?: ScrapFilters): Promise<ScrapHeader[]> => {
  const { profile } = await getCurrentUserInfo();

  let query = supabase
    .from('scrap_headers')
    .select(`
      *,
      lines:scrap_lines(count)
    `)
    .eq('store_id', profile.store_id)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.dateFrom) {
    query = query.gte('created_at', filters.dateFrom);
  }

  if (filters?.dateTo) {
    query = query.lte('created_at', filters.dateTo);
  }

  if (filters?.search) {
    query = query.ilike('scrap_no', `%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching scrap headers:', error);
    throw error;
  }

  return (data || []).map(item => ({
    id: item.id,
    scrapNo: item.scrap_no,
    status: item.status as ScrapStatus,
    storeId: item.store_id,
    warehouseId: item.warehouse_id,
    createdBy: item.created_by,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    totalQty: item.total_qty,
    totalValue: Number(item.total_value),
  }));
};

// Fetch single scrap header with lines and audit trail
export const getScrapById = async (id: string): Promise<ScrapHeader | null> => {
  const { data, error } = await supabase
    .from('scrap_headers')
    .select(`
      *,
      lines:scrap_lines(
        *,
        product:products(sku, product_name, price)
      ),
      audit:scrap_audit(
        *,
        actor:profiles(full_name, role)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching scrap:', error);
    throw error;
  }

  if (!data) return null;

  return {
    id: data.id,
    scrapNo: data.scrap_no,
    status: data.status as ScrapStatus,
    storeId: data.store_id,
    warehouseId: data.warehouse_id,
    createdBy: data.created_by,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    totalQty: data.total_qty,
    totalValue: Number(data.total_value),
    lines: (data.lines || []).map((line: any) => ({
      id: line.id,
      headerId: line.header_id,
      productId: line.product_id,
      batchNo: line.batch_no,
      qty: line.qty,
      uom: line.uom,
      unitCost: Number(line.unit_cost),
      reason: line.reason,
      attachmentId: line.attachment_id,
      createdAt: line.created_at,
      updatedAt: line.updated_at,
      product: line.product ? {
        sku: line.product.sku,
        productName: line.product.product_name,
        price: Number(line.product.price || 0),
      } : undefined,
    })),
    audit: (data.audit || []).map((audit: any) => ({
      id: audit.id,
      headerId: audit.header_id,
      action: audit.action,
      actorId: audit.actor_id,
      comment: audit.comment,
      createdAt: audit.created_at,
      actor: audit.actor ? {
        fullName: audit.actor.full_name,
        role: audit.actor.role,
      } : undefined,
    })),
  };
};

// Create new scrap header with lines
export const createScrapHeader = async (data: ScrapHeaderData): Promise<ScrapHeader> => {
  const { user, profile } = await getCurrentUserInfo();

  // Generate scrap number
  const { data: scrapNo, error: numberError } = await supabase
    .rpc('generate_scrap_number');

  if (numberError) {
    console.error('Error generating scrap number:', numberError);
    throw numberError;
  }

  // Calculate totals
  const totalQty = data.lines.reduce((sum, line) => sum + line.qty, 0);
  const totalValue = data.lines.reduce((sum, line) => sum + (line.qty * line.unitCost), 0);

  // Create header
  const { data: header, error: headerError } = await supabase
    .from('scrap_headers')
    .insert([{
      scrap_no: scrapNo,
      status: data.status || 'draft',
      store_id: profile.store_id,
      warehouse_id: data.warehouseId,
      created_by: user.id,
      total_qty: totalQty,
      total_value: totalValue,
    }])
    .select()
    .single();

  if (headerError) {
    console.error('Error creating scrap header:', headerError);
    throw headerError;
  }

  // Create lines
  const lineInserts = data.lines.map(line => ({
    header_id: header.id,
    product_id: line.productId,
    batch_no: line.batchNo,
    qty: line.qty,
    uom: line.uom || 'ea',
    unit_cost: line.unitCost,
    reason: line.reason,
    attachment_id: line.attachmentId,
  }));

  const { error: linesError } = await supabase
    .from('scrap_lines')
    .insert(lineInserts);

  if (linesError) {
    console.error('Error creating scrap lines:', linesError);
    throw linesError;
  }

  // Fetch and return the complete record
  const created = await getScrapById(header.id);
  if (!created) throw new Error('Failed to fetch created scrap record');

  return created;
};

// Update scrap header
export const updateScrapHeader = async (id: string, data: Partial<ScrapHeaderData>): Promise<ScrapHeader> => {
  const updateData: any = {};

  if (data.status) updateData.status = data.status;
  if (data.warehouseId) updateData.warehouse_id = data.warehouseId;

  // If lines are provided, recalculate totals
  if (data.lines) {
    updateData.total_qty = data.lines.reduce((sum, line) => sum + line.qty, 0);
    updateData.total_value = data.lines.reduce((sum, line) => sum + (line.qty * line.unitCost), 0);

    // Delete existing lines and create new ones
    const { error: deleteError } = await supabase
      .from('scrap_lines')
      .delete()
      .eq('header_id', id);

    if (deleteError) {
      console.error('Error deleting scrap lines:', deleteError);
      throw deleteError;
    }

    // Create new lines
    const lineInserts = data.lines.map(line => ({
      header_id: id,
      product_id: line.productId,
      batch_no: line.batchNo,
      qty: line.qty,
      uom: line.uom || 'ea',
      unit_cost: line.unitCost,
      reason: line.reason,
      attachment_id: line.attachmentId,
    }));

    const { error: linesError } = await supabase
      .from('scrap_lines')
      .insert(lineInserts);

    if (linesError) {
      console.error('Error creating scrap lines:', linesError);
      throw linesError;
    }
  }

  // Update header
  const { error: headerError } = await supabase
    .from('scrap_headers')
    .update(updateData)
    .eq('id', id);

  if (headerError) {
    console.error('Error updating scrap header:', headerError);
    throw headerError;
  }

  // Fetch and return updated record
  const updated = await getScrapById(id);
  if (!updated) throw new Error('Failed to fetch updated scrap record');

  return updated;
};

// Add audit entry
export const addScrapAudit = async (headerId: string, auditData: ScrapAuditData): Promise<void> => {
  const { user } = await getCurrentUserInfo();

  const { error } = await supabase
    .from('scrap_audit')
    .insert([{
      header_id: headerId,
      action: auditData.action,
      actor_id: user.id,
      comment: auditData.comment,
    }]);

  if (error) {
    console.error('Error adding scrap audit:', error);
    throw error;
  }
};

// Submit scrap for approval
export const submitScrap = async (id: string, comment?: string): Promise<void> => {
  await updateScrapHeader(id, { status: 'submitted' });
  await addScrapAudit(id, { action: 'submit', comment });
};

// Approve scrap (L1)
export const approveScrapL1 = async (id: string, comment?: string): Promise<void> => {
  await updateScrapHeader(id, { status: 'l1_approved' });
  await addScrapAudit(id, { action: 'approve_l1', comment });
};

// Final approve scrap
export const approveScrapFinal = async (id: string, comment?: string): Promise<void> => {
  await updateScrapHeader(id, { status: 'final_approved' });
  await addScrapAudit(id, { action: 'approve_final', comment });
};

// Reject scrap
export const rejectScrap = async (id: string, comment: string): Promise<void> => {
  await updateScrapHeader(id, { status: 'rejected' });
  await addScrapAudit(id, { action: 'reject', comment });
};

// Cancel scrap
export const cancelScrap = async (id: string, comment?: string): Promise<void> => {
  await updateScrapHeader(id, { status: 'cancelled' });
  await addScrapAudit(id, { action: 'cancel', comment });
};

// Check inventory availability
export const checkInventoryAvailability = async (productId: string, storeId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('inventory')
    .select('quantity, reserved_quantity')
    .eq('product_id', productId)
    .eq('store_id', storeId)
    .single();

  if (error) {
    console.error('Error checking inventory:', error);
    return 0;
  }

  return (data?.quantity || 0) - (data?.reserved_quantity || 0);
};