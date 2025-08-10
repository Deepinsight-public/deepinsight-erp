import { describe, it, expect, beforeAll } from 'vitest'
import { authenticateTestUser, createAuthenticatedRequest, generateTestId } from '../helpers/auth'

describe('Returns E2E', () => {
  let authToken: string
  let testItemId: string
  let testReturnId: string
  let testReturnLineId: string

  beforeAll(async () => {
    const auth = await authenticateTestUser()
    authToken = auth.token
    
    // Create test item for return flow
    testItemId = generateTestId('item')
  })

  it('should create customer return order', async () => {
    const returnData = {
      originalOrderId: '00000000-0000-0000-0000-000000000001',
      isCustomerReturn: true,
      refundMode: 'ADJUSTED_PRICE',
      lines: [
        {
          originalLineId: '00000000-0000-0000-0000-000000000001',
          itemId: testItemId,
          productBarcode: 'TEST-BARCODE-001',
          reason: 'Customer changed mind',
          restockStatus: 'PENDING'
        }
      ]
    }

    const response = await createAuthenticatedRequest(authToken)
      .post('/api/store/after-sales/returns')
      .send(returnData)
      .expect(201)

    expect(response.body).toHaveProperty('id')
    expect(response.body.isCustomerReturn).toBe(true)
    expect(response.body.status).toBe('DRAFT')
    expect(response.body.refundMode).toBe('ADJUSTED_PRICE')
    
    testReturnId = response.body.id
    
    // Verify return lines were created
    expect(response.body.lines).toBeDefined()
    expect(response.body.lines.length).toBe(1)
    expect(response.body.lines[0].restockStatus).toBe('PENDING')
    
    testReturnLineId = response.body.lines[0].id
  })

  it('should receive return and set status to PENDING', async () => {
    const receiveData = {
      receivedById: 'test-user-id',
      receivedOn: new Date().toISOString()
    }

    const response = await createAuthenticatedRequest(authToken)
      .put(`/api/store/after-sales/returns/${testReturnId}/receive`)
      .send(receiveData)
      .expect(200)

    expect(response.body.success).toBe(true)
    
    // Verify return line status is still PENDING (waiting for restock)
    const returnDetailsResponse = await createAuthenticatedRequest(authToken)
      .get(`/api/store/after-sales/returns/${testReturnId}`)
      .expect(200)

    const returnLine = returnDetailsResponse.body.lines.find((line: any) => line.id === testReturnLineId)
    expect(returnLine.restockStatus).toBe('PENDING')
    expect(returnLine.receivedById).toBeDefined()
    expect(returnLine.receivedOn).toBeDefined()
  })

  it('should scan EPC and restock item to IN_STOCK status', async () => {
    const restockData = {
      epc: `EPC-${testItemId}`,
      restockedById: 'test-user-id',
      restockedOn: new Date().toISOString()
    }

    const response = await createAuthenticatedRequest(authToken)
      .put(`/api/store/after-sales/returns/${testReturnId}/restock-line/${testReturnLineId}`)
      .send(restockData)
      .expect(200)

    expect(response.body.success).toBe(true)
    expect(response.body.message).toContain('restocked successfully')
    
    // Verify return line status changed to IN_STOCK
    const returnDetailsResponse = await createAuthenticatedRequest(authToken)
      .get(`/api/store/after-sales/returns/${testReturnId}`)
      .expect(200)

    const returnLine = returnDetailsResponse.body.lines.find((line: any) => line.id === testReturnLineId)
    expect(returnLine.restockStatus).toBe('IN_STOCK')
    expect(returnLine.restockedById).toBeDefined()
    expect(returnLine.restockedOn).toBeDefined()
  })

  it('should assert Item status is back to in_stock', async () => {
    // Query the Item table directly to verify status change
    // Note: This would typically be done through a dedicated endpoint for item status
    const itemStatusResponse = await createAuthenticatedRequest(authToken)
      .get(`/api/store/inventory/items/${testItemId}`)
      .expect(200)

    expect(itemStatusResponse.body.status).toBe('in_stock')
    expect(itemStatusResponse.body.currentStoreId).toBeDefined()
  })

  it('should create ItemEvent log for return restock', async () => {
    // Verify that ItemEvent was created during restock process
    const itemEventsResponse = await createAuthenticatedRequest(authToken)
      .get(`/api/store/inventory/items/${testItemId}/events`)
      .expect(200)

    const restockEvent = itemEventsResponse.body.find((event: any) => 
      event.type === 'RETURN_RESTOCKED' && 
      event.docType === 'RETURN' &&
      event.docId === testReturnId
    )

    expect(restockEvent).toBeDefined()
    expect(restockEvent.payload).toHaveProperty('returnLineId', testReturnLineId)
    expect(restockEvent.payload).toHaveProperty('restockStatus', 'IN_STOCK')
    expect(restockEvent.createdById).toBeDefined()
  })

  it('should support both customer returns and store-to-warehouse returns', async () => {
    // Test store-to-warehouse return (isCustomerReturn: false)
    const storeReturnData = {
      originalOrderId: '00000000-0000-0000-0000-000000000002',
      isCustomerReturn: false,
      refundMode: 'FULL_REFUND',
      returnWHId: '00000000-0000-0000-0000-000000000001', // Warehouse ID
      lines: [
        {
          originalLineId: '00000000-0000-0000-0000-000000000002',
          itemId: generateTestId('store-return-item'),
          productBarcode: 'TEST-BARCODE-002',
          reason: 'Defective product',
          restockStatus: 'PENDING'
        }
      ]
    }

    const response = await createAuthenticatedRequest(authToken)
      .post('/api/store/after-sales/returns')
      .send(storeReturnData)
      .expect(201)

    expect(response.body.isCustomerReturn).toBe(false)
    expect(response.body.returnWHId).toBeDefined()
    expect(response.body.refundMode).toBe('FULL_REFUND')
  })
})