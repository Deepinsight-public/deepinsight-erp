export interface ScrapItem {
  id: string;
  scrapNo: string;
  createdAt: string;
  status: string;
  product?: {
    sku: string;
    productName: string;
  };
  reason: string;
  totalQty: number;
  totalValue: number;
}

export interface ScrapFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface ScrapSearchParams extends ScrapFilters {
  page?: number;
  limit?: number;
}

export interface ScrapResponse {
  data: ScrapItem[];
  total: number;
  page: number;
  totalPages: number;
}