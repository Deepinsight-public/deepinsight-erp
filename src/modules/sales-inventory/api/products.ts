import { supabase } from '@/integrations/supabase/client';
import type { Product, ProductFilters, ProductsListResponse } from '@/modules/inventory/types/products';

// Mock data for testing when database is not available
const mockProducts: Product[] = [
  {
    id: '1',
    brand: 'Sony',
    model: 'Wireless Headphones',
    kwCode: 'WRLH-001',
    mapPrice: 129.99,
    productType: 'OTHER' as any,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    brand: 'Apple',
    model: 'USB-C Cable 6ft',
    kwCode: 'USBC-002',
    mapPrice: 24.99,
    productType: 'OTHER' as any,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    brand: 'Samsung',
    model: 'Tablet Case',
    kwCode: 'TBLC-003',
    mapPrice: 34.99,
    productType: 'OTHER' as any,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function fetchProductsForSalesOrder(searchTerm?: string) {
  try {
    // Use mock data for now since database schema may not match
    let filtered = mockProducts;
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = mockProducts.filter(product =>
        product.model.toLowerCase().includes(search) ||
        (product.kwCode || '').toLowerCase().includes(search)
      );
    }
    
    // Return ProductLookupItem format for SalesOrderForm compatibility
    return filtered.map(product => ({
      id: product.id,
      sku: product.kwCode || '',
      productName: product.model || '',
      price: product.mapPrice || 0,
      cost: 0,
      mapPrice: product.mapPrice || 0,
      isNew: false,
      availableStock: 10 // Mock available stock
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    // Return products in ProductLookupItem format
    return mockProducts.map(product => ({
      id: product.id,
      sku: product.kwCode || '',
      productName: product.model || '',
      price: product.mapPrice || 0,
      cost: 0,
      mapPrice: product.mapPrice || 0,
      isNew: false,
      availableStock: 10
    }));
  }
}

export async function searchAvailableProducts(searchTerm?: string) {
  return fetchProductsForSalesOrder(searchTerm);
}

export async function fetchProductsWithStock(filters?: ProductFilters): Promise<ProductsListResponse> {
  try {
    // Use mock data
    let filtered = mockProducts;
    
    if (filters?.searchTerm) {
      const search = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.model.toLowerCase().includes(search) ||
        (product.kwCode || '').toLowerCase().includes(search)
      );
    }
    
    const page = filters?.page || 1;
    const limit = filters?.limit || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedResults = filtered.slice(startIndex, endIndex);
    
    return {
      data: paginatedResults,
      total: filtered.length,
      page,
      totalPages: Math.ceil(filtered.length / limit)
    };
  } catch (error) {
    console.error('Error fetching products with stock:', error);
    return {
      data: mockProducts.slice(0, 25),
      total: mockProducts.length,
      page: 1,
      totalPages: 1
    };
  }
}