export interface ProductSearchItem {
  id: string;
  a4lCode: string;
  type: string;
  kwCode: string;
  grade: string;
  model: string;
  inStock: boolean;
  mapPrice: number;
  sku: string;
  productName: string;
}

export interface ProductSearchFilters {
  kwCode?: string;
  a4lCode?: string;
  modelNumber?: string;
  search?: string;
  type?: string;
  inStock?: string;
}

export interface ProductSearchParams extends ProductSearchFilters {
  page?: number;
  limit?: number;
}

export interface ProductSearchResponse {
  data: ProductSearchItem[];
  total: number;
  page: number;
  totalPages: number;
}