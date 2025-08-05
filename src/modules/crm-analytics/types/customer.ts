export interface Customer {
  id: string;
  customer_code: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  company: string | null;
  notes: string | null;
  tags: string[] | null;
  status: string;
  store_id: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  import_batch_id: string | null;
}

export interface CustomerFilters {
  search?: string;
  status?: string;
  minOrders?: number;
}