export interface ProductSearchItem {
  id: string;
  inventoryId?: string;
  a4lCode: string;
  type: string;
  kwCode: string;
  grade: string;
  model: string;
  inStock: boolean;
  currentStock?: number;
  availableStock?: number;
  mapPrice: number;
  sku: string;
  productName: string;
  storeName?: string;
  storeCode?: string;
  storeRegion?: string;
  loadNumber?: string;
  loadInDate?: string;
  isInStock?: boolean;
  currentLocation?: string;
}

export interface ProductSearchFilters {
  kwCode?: string;
  a4lCode?: string;
  modelNumber?: string;
  search?: string;
  storeId?: string;
  storeRegion?: string;
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