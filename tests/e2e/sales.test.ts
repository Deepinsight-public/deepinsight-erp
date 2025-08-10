import { describe, it, expect, beforeAll } from 'vitest'
import { authenticateTestUser, createAuthenticatedRequest, generateTestId } from '../helpers/auth'
import { TEST_BASE_URL } from '../setup'
import request from 'supertest'

describe('Sales Orders E2E', () => {
  let authToken: string
  let testOrderId: string
  let testCustomerName: string

  beforeAll(async () => {
    const auth = await authenticateTestUser()
    authToken = auth.token
    testCustomerName = generateTestId('customer')
  })

  it('should create sales order with line items', async () => {
    const orderData = {
      customerName: testCustomerName,
      customerEmail: 'test@example.com',
      customerPhone: '1234567890',
      customerFirst: 'Test',
      customerLast: 'Customer',
      orderType: 'retail',
      status: 'pending',
      totalAmount: 1299.99,
      discountAmount: 50.00,
      taxAmount: 104.00,
      warrantyYears: 2,
      warrantyAmount: 199.99,
      walkInDelivery: 'delivery',
      accessory: 'Screen protector',
      otherServices: 'Setup service',
      otherFee: 29.99,
      paymentMethod: 'credit_card',
      paymentNote: 'Visa ending 1234',
      customerSource: 'walk_in',
      lines: [
        {
          productId: '00000000-0000-0000-0000-000000000001',
          quantity: 1,
          unitPrice: 999.99,
          discountAmount: 50.00,
          totalAmount: 949.99,
          mapAtSale: 1199.99,
          unitCostAtSale: 750.00
        },
        {
          productId: '00000000-0000-0000-0000-000000000002',
          quantity: 2,
          unitPrice: 150.00,
          discountAmount: 0,
          totalAmount: 300.00,
          mapAtSale: 179.99,
          unitCostAtSale: 120.00
        }
      ]
    }

    const response = await createAuthenticatedRequest(authToken)
      .post('/api/store/sales-orders')
      .send(orderData)
      .expect(201)

    expect(response.body).toHaveProperty('id')
    expect(response.body.customer_name).toBe(testCustomerName)
    expect(response.body.total_amount).toBe(1299.99)
    expect(response.body.warranty_amount).toBe(199.99)
    expect(response.body.customer_source).toBe('walk_in')
    
    testOrderId = response.body.id
  })

  it('should retrieve sales order list with complete fields', async () => {
    const response = await createAuthenticatedRequest(authToken)
      .get('/api/store/sales-orders')
      .expect(200)

    expect(Array.isArray(response.body.data)).toBe(true)
    
    const createdOrder = response.body.data.find((order: any) => order.id === testOrderId)
    expect(createdOrder).toBeDefined()
    
    // Verify Extended Warranty field
    expect(createdOrder).toHaveProperty('warranty_amount')
    expect(createdOrder.warranty_amount).toBe(199.99)
    expect(createdOrder.warranty_years).toBe(2)
    
    // Verify customer fields
    expect(createdOrder.customer_first).toBe('Test')
    expect(createdOrder.customer_last).toBe('Customer')
    
    // Verify payment and source fields
    expect(createdOrder.payment_method).toBe('credit_card')
    expect(createdOrder.customer_source).toBe('walk_in')
    expect(createdOrder.other_fee).toBe(29.99)
  })

  it('should retrieve sales order details with line items and calculated fields', async () => {
    const response = await createAuthenticatedRequest(authToken)
      .get(`/api/store/sales-orders/${testOrderId}`)
      .expect(200)

    const order = response.body
    
    // Verify order fields
    expect(order.id).toBe(testOrderId)
    expect(order.customer_name).toBe(testCustomerName)
    expect(order.total_amount).toBe(1299.99)
    
    // Verify line items exist
    expect(order.items).toBeDefined()
    expect(Array.isArray(order.items)).toBe(true)
    expect(order.items.length).toBe(2)
    
    // Verify first line item with price/MAP calculation
    const firstItem = order.items[0]
    expect(firstItem.unit_price).toBe(999.99)
    expect(firstItem.map_at_sale).toBe(1199.99)
    expect(firstItem.price_map_rate).toBeCloseTo(0.833, 3) // 999.99 / 1199.99
    expect(firstItem.gross_profit).toBe(249.99) // 999.99 - 750.00
    
    // Verify second line item
    const secondItem = order.items[1]
    expect(secondItem.quantity).toBe(2)
    expect(secondItem.total_amount).toBe(300.00)
    expect(secondItem.price_map_rate).toBeCloseTo(0.833, 3) // 150.00 / 179.99
    
    // Verify fees breakdown
    expect(order.other_fee).toBe(29.99)
    expect(order.accessory).toBe('Screen protector')
    expect(order.other_services).toBe('Setup service')
  })

  it('should support multiple payment methods', async () => {
    const orderWithMultiplePayments = {
      customerName: generateTestId('multi-pay-customer'),
      customerEmail: 'multipay@example.com',
      totalAmount: 500.00,
      paymentMethod: 'split',
      paymentNote: 'Cash: $200, Card: $300',
      lines: [
        {
          productId: '00000000-0000-0000-0000-000000000001',
          quantity: 1,
          unitPrice: 500.00,
          totalAmount: 500.00
        }
      ]
    }

    const response = await createAuthenticatedRequest(authToken)
      .post('/api/store/sales-orders')
      .send(orderWithMultiplePayments)
      .expect(201)

    expect(response.body.payment_method).toBe('split')
    expect(response.body.payment_note).toContain('Cash')
    expect(response.body.payment_note).toContain('Card')
  })
})