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
import type { ScrapItem } from '../types';

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

// Fetch scrap items for the list page
export async function getScrapItems(filters?: ScrapFilters): Promise<ScrapItem[]> {
  try {
    const { profile } = await getCurrentUserInfo();

    let query = supabase
      .from('scrap_headers')
      .select(`
        id,
        scrap_no,
        created_at,
        status,
        total_qty,
        total_value,
        scrap_lines(
          reason,
          product_id
        )
      `)
      .eq('store_id', profile.store_id)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.search) {
      query = query.or(`scrap_no.ilike.%${filters.search}%`);
    }

    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }

    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching scrap items:', error);
      throw error;
    }

    // Collect all unique product IDs first
    const allProductIds = new Set<string>();
    for (const item of data || []) {
      if (item.scrap_lines) {
        for (const line of item.scrap_lines) {
          if (line.product_id) {
            allProductIds.add(line.product_id);
          }
        }
      }
    }

    // Fetch all products in one query
    let productMap = new Map();
    if (allProductIds.size > 0) {
      const { data: productsData } = await supabase
        .from('products')
        .select('id, sku, product_name')
        .in('id', Array.from(allProductIds));
      
      if (productsData) {
        for (const product of productsData) {
          productMap.set(product.id, {
            sku: product.sku,
            productName: product.product_name
          });
        }
      }
    }

    // Map the scrap items with product information
    const items = (data || []).map(item => {
      const firstLine = item.scrap_lines && item.scrap_lines.length > 0 ? item.scrap_lines[0] : null;
      const product = firstLine?.product_id ? productMap.get(firstLine.product_id) : undefined;

      return {
        id: item.id,
        scrapNo: item.scrap_no,
        createdAt: item.created_at,
        status: item.status,
        totalQty: item.total_qty,
        totalValue: item.total_value,
        product,
        reason: firstLine?.reason || ''
      };
    });

    return items;
  } catch (error) {
    console.error('Error in getScrapItems:', error);
    return []; // Return empty array instead of throwing
  }
}

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
  try {
    // First get the header
    const { data: headerData, error: headerError } = await supabase
      .from('scrap_headers')
      .select('*')
      .eq('id', id)
      .single();

    if (headerError) {
      if (headerError.code === 'PGRST116') return null;
      console.error('Error fetching scrap header:', headerError);
      throw headerError;
    }

    if (!headerData) return null;

    // Get the lines separately
    const { data: linesData, error: linesError } = await supabase
      .from('scrap_lines')
      .select('*')
      .eq('header_id', id);

    if (linesError) {
      console.error('Error fetching scrap lines:', linesError);
      throw linesError;
    }

    // Get audit trail
    const { data: auditData, error: auditError } = await supabase
      .from('scrap_audit')
      .select(`
        *,
        actor:profiles(full_name, role)
      `)
      .eq('header_id', id);

    if (auditError) {
      console.error('Error fetching scrap audit:', auditError);
      // Don't throw error for audit, just log it
    }

    // Get product details for each line
    const linesWithProducts = [];
    for (const line of linesData || []) {
      let productData = null;
      if (line.product_id) {
        const { data: product } = await supabase
          .from('products')
          .select('sku, product_name, price')
          .eq('id', line.product_id)
          .single();
        productData = product;
      }

      linesWithProducts.push({
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
        product: productData ? {
          sku: productData.sku,
          productName: productData.product_name,
          price: Number(productData.price || 0),
        } : undefined,
      });
    }

    return {
      id: headerData.id,
      scrapNo: headerData.scrap_no,
      status: headerData.status as ScrapStatus,
      storeId: headerData.store_id,
      warehouseId: headerData.warehouse_id,
      createdBy: headerData.created_by,
      createdAt: headerData.created_at,
      updatedAt: headerData.updated_at,
      totalQty: headerData.total_qty,
      totalValue: Number(headerData.total_value),
      lines: linesWithProducts,
      audit: (auditData || []).map((audit: any) => ({
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
  } catch (error) {
    console.error('Error in getScrapById:', error);
    throw error;
  }
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

  // Return the created header data directly instead of fetching again
  return {
    id: header.id,
    scrapNo: header.scrap_no,
    status: header.status as ScrapStatus,
    storeId: header.store_id,
    warehouseId: header.warehouse_id,
    createdBy: header.created_by,
    createdAt: header.created_at,
    updatedAt: header.updated_at,
    totalQty: header.total_qty,
    totalValue: Number(header.total_value),
    lines: [],
    audit: [],
  };
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
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('quantity, reserved_quantity')
      .eq('product_id', productId)
      .eq('store_id', storeId)
      .maybeSingle(); // Use maybeSingle instead of single to handle no results

    if (error) {
      console.error('Error checking inventory:', error);
      return 0;
    }

    // If no inventory record exists, return 0
    if (!data) {
      return 0;
    }

    return (data.quantity || 0) - (data.reserved_quantity || 0);
  } catch (error) {
    console.error('Error checking inventory:', error);
    return 0;
  }
};