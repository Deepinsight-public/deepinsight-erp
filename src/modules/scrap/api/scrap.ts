import { supabase } from '@/integrations/supabase/client';
import type { ScrapItem, ScrapFilters } from '../types';

export async function getScrapItems(filters?: ScrapFilters): Promise<ScrapItem[]> {
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

  return (data || []).map(item => ({
    id: item.id,
    scrapNo: item.scrap_no,
    createdAt: item.created_at,
    status: item.status,
    totalQty: item.total_qty,
    totalValue: item.total_value,
    product: undefined, // Will need to fetch product details separately if needed
    reason: item.scrap_lines?.[0]?.reason || ''
  }));
}