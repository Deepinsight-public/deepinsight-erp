// Unit tests for ProductService
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProductService } from '../../../packages/core/services/product.service.ts';
import { createAuditLogger } from '../../../packages/core/audit.ts';
import { UserContext } from '../../../packages/shared/src/index.ts';

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          range: vi.fn(() => Promise.resolve({
            data: [
              {
                id: '1',
                sku: 'TEST-001',
                product_name: 'Test Product',
                brand: 'Test Brand',
                model: 'Test Model',
                category: 'Test Category',
                price: 100,
                cost: 50,
                map_price: 90,
                is_active: true,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z'
              }
            ],
            error: null,
            count: 1
          }))
        }))
      }))
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({
          data: {
            id: '2',
            sku: 'TEST-002',
            product_name: 'New Product',
            brand: 'New Brand',
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          },
          error: null
        }))
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: '1',
              sku: 'TEST-001',
              product_name: 'Updated Product',
              brand: 'Test Brand',
              is_active: true,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z'
            },
            error: null
          }))
        }))
      }))
    })),
    single: vi.fn(() => Promise.resolve({
      data: {
        id: '1',
        sku: 'TEST-001',
        product_name: 'Test Product',
        brand: 'Test Brand',
        model: 'Test Model',
        category: 'Test Category',
        price: 100,
        cost: 50,
        map_price: 90,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      error: null
    }))
  }))
};

// Mock createClient
(globalThis as any).createClient = vi.fn(() => mockSupabaseClient);

// Mock audit logger
const mockAuditLogger = {
  log: vi.fn(() => Promise.resolve()),
  query: vi.fn(() => Promise.resolve([]))
};

describe('ProductService', () => {
  let productService: ProductService;
  let mockUserContext: UserContext;

  beforeEach(() => {
    vi.clearAllMocks();
    productService = new ProductService(
      'test-url',
      'test-key', 
      mockAuditLogger as any,
      'test-token'
    );

    mockUserContext = {
      userId: 'user-1',
      role: 'hq_admin',
      storeId: 'store-1',
      firstName: 'Test',
      lastName: 'User'
    };
  });

  describe('getProducts', () => {
    it('should return paginated products list', async () => {
      const result = await productService.getProducts(mockUserContext, {
        page: 1,
        limit: 10
      });

      expect(result).toEqual({
        products: [
          {
            id: '1',
            sku: 'TEST-001',
            productName: 'Test Product',
            brand: 'Test Brand',
            model: 'Test Model',
            category: 'Test Category',
            price: 100,
            cost: 50,
            mapPrice: 90,
            barcode: undefined,
            kwCode: undefined,
            description: undefined,
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1
        }
      });
    });

    it('should filter cost data for store employees', async () => {
      mockUserContext.role = 'store_employee';
      
      const result = await productService.getProducts(mockUserContext, {
        page: 1,
        limit: 10
      });

      // Cost field should be filtered out
      expect(result.products[0]).not.toHaveProperty('cost');
    });
  });

  describe('getProduct', () => {
    it('should return a single product', async () => {
      const result = await productService.getProduct('1', mockUserContext);

      expect(result).toEqual({
        id: '1',
        sku: 'TEST-001',
        productName: 'Test Product',
        brand: 'Test Brand',
        model: 'Test Model',
        category: 'Test Category',
        price: 100,
        cost: 50,
        mapPrice: 90,
        barcode: undefined,
        kwCode: undefined,
        description: undefined,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      });
    });
  });

  describe('createProduct', () => {
    it('should create a new product', async () => {
      const productData = {
        sku: 'TEST-002',
        productName: 'New Product',
        brand: 'New Brand'
      };

      const result = await productService.createProduct(productData, mockUserContext);

      expect(result).toEqual({
        id: '2',
        sku: 'TEST-002',
        productName: 'New Product',
        brand: 'New Brand',
        model: undefined,
        category: undefined,
        description: undefined,
        price: undefined,
        cost: undefined,
        mapPrice: undefined,
        barcode: undefined,
        kwCode: undefined,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('products');
    });
  });

  describe('updateProduct', () => {
    it('should update an existing product', async () => {
      const updates = {
        productName: 'Updated Product'
      };

      const result = await productService.updateProduct('1', updates, mockUserContext);

      expect(result).toEqual({
        id: '1',
        sku: 'TEST-001',
        productName: 'Updated Product',
        brand: 'Test Brand',
        model: undefined,
        category: undefined,
        description: undefined,
        price: undefined,
        cost: undefined,
        mapPrice: undefined,
        barcode: undefined,
        kwCode: undefined,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      });
    });
  });

  describe('deleteProduct', () => {
    it('should soft delete a product', async () => {
      await productService.deleteProduct('1', mockUserContext);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('products');
    });
  });
});