// Unit tests for RetailService
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RetailService } from '../../../packages/core/services/retail.service.ts';
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
                order_number: 'ORD-001',
                order_date: '2024-01-01T00:00:00Z',
                status: 'completed',
                total_amount: 100,
                customer_name: 'John Doe',
                customer_first: 'John',
                customer_last: 'Doe',
                store_id: 'store-1',
                total_gross_profit: 50,
                avg_price_map_rate: 1.1,
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
            order_number: 'ORD-002',
            order_date: '2024-01-01T00:00:00Z',
            status: 'draft',
            total_amount: 200,
            customer_name: 'Jane Doe',
            store_id: 'store-1',
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
              order_number: 'ORD-001',
              status: 'shipped',
              total_amount: 100,
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
        order_number: 'ORD-001',
        order_date: '2024-01-01T00:00:00Z',
        status: 'completed',
        total_amount: 100,
        customer_name: 'John Doe',
        customer_first: 'John',
        customer_last: 'Doe',
        store_id: 'store-1',
        total_gross_profit: 50,
        avg_price_map_rate: 1.1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      error: null
    }))
  })),
  rpc: vi.fn(() => Promise.resolve({
    data: [{
      id: '3',
      order_number: 'ORD-003',
      status: 'submitted',
      total_amount: 300,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }],
    error: null
  }))
};

// Mock createClient
(globalThis as any).createClient = vi.fn(() => mockSupabaseClient);

// Mock audit logger
const mockAuditLogger = {
  log: vi.fn(() => Promise.resolve()),
  query: vi.fn(() => Promise.resolve([]))
};

describe('RetailService', () => {
  let retailService: RetailService;
  let mockUserContext: UserContext;

  beforeEach(() => {
    vi.clearAllMocks();
    retailService = new RetailService(
      'test-url',
      'test-key',
      mockAuditLogger as any,
      'test-token'
    );

    mockUserContext = {
      userId: 'user-1',
      role: 'store_manager',
      storeId: 'store-1',
      firstName: 'Test',
      lastName: 'User'
    };
  });

  describe('getSalesOrders', () => {
    it('should return paginated sales orders list', async () => {
      const result = await retailService.getSalesOrders(mockUserContext, {
        page: 1,
        limit: 10
      });

      expect(result).toEqual({
        orders: [
          {
            id: '1',
            orderNumber: 'ORD-001',
            orderDate: '2024-01-01T00:00:00Z',
            status: 'completed',
            totalAmount: 100,
            customerName: 'John Doe',
            customerFirst: 'John',
            customerLast: 'Doe',
            totalGrossProfit: 50,
            avgPriceMapRate: 1.1,
            lines: undefined,
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
      
      const result = await retailService.getSalesOrders(mockUserContext, {
        page: 1,
        limit: 10
      });

      // Cost-sensitive fields should be filtered out
      expect(result.orders[0]).not.toHaveProperty('totalGrossProfit');
      expect(result.orders[0]).not.toHaveProperty('avgPriceMapRate');
    });
  });

  describe('getSalesOrder', () => {
    it('should return a single sales order with lines', async () => {
      // Mock the lines query
      mockSupabaseClient.from = vi.fn((table) => {
        if (table === 'vw_sales_orders_list') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: {
                    id: '1',
                    order_number: 'ORD-001',
                    order_date: '2024-01-01T00:00:00Z',
                    status: 'completed',
                    total_amount: 100,
                    customer_name: 'John Doe',
                    store_id: 'store-1',
                    total_gross_profit: 50,
                    avg_price_map_rate: 1.1,
                    created_at: '2024-01-01T00:00:00Z',
                    updated_at: '2024-01-01T00:00:00Z'
                  },
                  error: null
                }))
              }))
            }))
          };
        } else if (table === 'sales_order_items') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({
                data: [
                  {
                    id: 'item-1',
                    product_id: 'prod-1',
                    quantity: 2,
                    unit_price: 50,
                    total_amount: 100,
                    products: {
                      sku: 'TEST-001',
                      product_name: 'Test Product'
                    }
                  }
                ],
                error: null
              }))
            }))
          };
        }
        return mockSupabaseClient;
      });

      const result = await retailService.getSalesOrder('1', mockUserContext);

      expect(result).toEqual({
        id: '1',
        orderNumber: 'ORD-001',
        orderDate: '2024-01-01T00:00:00Z',
        status: 'completed',
        totalAmount: 100,
        customerName: 'John Doe',
        customerFirst: undefined,
        customerLast: undefined,
        totalGrossProfit: 50,
        avgPriceMapRate: 1.1,
        lines: [
          {
            id: 'item-1',
            product_id: 'prod-1',
            quantity: 2,
            unit_price: 50,
            total_amount: 100,
            products: {
              sku: 'TEST-001',
              product_name: 'Test Product'
            }
          }
        ],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      });
    });
  });

  describe('createSalesOrder', () => {
    it('should create a draft sales order', async () => {
      const orderData = {
        orderDate: '2024-01-01T00:00:00Z',
        status: 'draft',
        subTotal: 200,
        discountAmount: 0,
        taxAmount: 20,
        totalAmount: 220,
        customerName: 'Jane Doe',
        lines: [
          {
            productId: 'prod-1',
            sku: 'TEST-001',
            quantity: 1,
            unitPrice: 200,
            subTotal: 200
          }
        ]
      };

      const result = await retailService.createSalesOrder(orderData as any, mockUserContext);

      expect(result).toEqual({
        id: '2',
        orderNumber: 'ORD-002',
        orderDate: '2024-01-01T00:00:00Z',
        status: 'draft',
        totalAmount: 200,
        customerName: 'Jane Doe',
        customerFirst: undefined,
        customerLast: undefined,
        totalGrossProfit: undefined,
        avgPriceMapRate: undefined,
        lines: undefined,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      });
    });

    it('should create a submitted order with stock deduction', async () => {
      const orderData = {
        orderDate: '2024-01-01T00:00:00Z',
        status: 'submitted',
        subTotal: 300,
        discountAmount: 0,
        taxAmount: 30,
        totalAmount: 330,
        customerName: 'Bob Smith',
        lines: [
          {
            productId: 'prod-1',
            sku: 'TEST-001',
            quantity: 3,
            unitPrice: 100,
            subTotal: 300
          }
        ]
      };

      const result = await retailService.createSalesOrder(orderData as any, mockUserContext);

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
        'create_sales_order_with_stock_deduction',
        expect.any(Object)
      );

      expect(result).toEqual({
        id: '3',
        orderNumber: 'ORD-003',
        orderDate: undefined,
        status: 'submitted',
        totalAmount: 300,
        customerName: undefined,
        customerFirst: undefined,
        customerLast: undefined,
        totalGrossProfit: undefined,
        avgPriceMapRate: undefined,
        lines: undefined,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      });
    });
  });

  describe('updateSalesOrderStatus', () => {
    it('should update order status', async () => {
      // Mock getSalesOrder to return existing order
      vi.spyOn(retailService, 'getSalesOrder').mockResolvedValue({
        id: '1',
        orderNumber: 'ORD-001',
        orderDate: '2024-01-01T00:00:00Z',
        status: 'completed',
        totalAmount: 100,
        customerName: 'John Doe',
        customerFirst: 'John',
        customerLast: 'Doe',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      } as any);

      const result = await retailService.updateSalesOrderStatus('1', 'shipped', mockUserContext);

      expect(result).toEqual({
        id: '1',
        orderNumber: 'ORD-001',
        orderDate: undefined,
        status: 'shipped',
        totalAmount: 100,
        customerName: undefined,
        customerFirst: undefined,
        customerLast: undefined,
        totalGrossProfit: undefined,
        avgPriceMapRate: undefined,
        lines: undefined,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      });
    });
  });
});