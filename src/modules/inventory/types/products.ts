// Product Types based on Prisma model
export interface Product {
  id: string;
  brand?: string;
  model: string;
  kwCode?: string;
  description?: string;
  mapPrice: number;
  productType: ProductType;
  dimensions?: string;
  features?: string;
  createdAt: string;
  updatedAt: string;
  delete?: boolean;
  delete_by?: string;
  delete_on?: string;
}

export enum ProductType {
  WASHER = 'WASHER',
  DRYER = 'DRYER',
  REFRIGERATOR = 'REFRIGERATOR',
  DISHWASHER = 'DISHWASHER',
  RANGE = 'RANGE',
  MICROWAVE = 'MICROWAVE',
  FREEZER = 'FREEZER',
  COOKTOP = 'COOKTOP',
  OVEN = 'OVEN',
  HOOD = 'HOOD',
  DISPOSAL = 'DISPOSAL',
  WINE_COOLER = 'WINE_COOLER',
  ICE_MAKER = 'ICE_MAKER',
  COMPACTOR = 'COMPACTOR',
  OTHER = 'OTHER'
}

export interface ProductFilters {
  searchTerm?: string;
  productType?: ProductType | 'all';
  brand?: string;
  priceMin?: number;
  priceMax?: number;
  hasFeatures?: boolean;
  page?: number;
  limit?: number;
}

export interface ProductsListResponse {
  data: Product[];
  total: number;
  page: number;
  totalPages: number;
}
