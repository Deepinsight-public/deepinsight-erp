import { describe, it, expect, beforeAll } from 'vitest'
import { authenticateTestUser, createAuthenticatedRequest, generateTestId } from '../helpers/auth'

describe('Transfers E2E', () => {
  let authToken: string
  let testItemStoreToHQ: string
  let testItemHQToStore: string
  let transferStoreToHQId: string
  let transferHQToStoreId: string
  let storeId: string
  let hqStoreId: string

  beforeAll(async () => {
    const auth = await authenticateTestUser()
    authToken = auth.token
    
    // Set up test data
    testItemStoreToHQ = generateTestId('item-s2h')
    testItemHQToStore = generateTestId('item-h2s')
    storeId = '00000000-0000-0000-0000-000000000001' // Test store
    hqStoreId = '00000000-0000-0000-0000-000000000002' // HQ store
  })

  it('should create STORE_TO_HQ transfer', async () => {
    const transferData = {
      kind: 'STORE_TO_HQ',
      toStoreId: hqStoreId,
      reason: 'Excess inventory transfer to HQ',
      items: [
        {
          itemId: testItemStoreToHQ,
          epc: `EPC-${testItemStoreToHQ}`,
          productId: '00000000-0000-0000-0000-000000000001'
        }
      ]
    }

    const response = await createAuthenticatedRequest(authToken)
      .post('/api/store/inventory/transfer-out')
      .send(transferData)
      .expect(201)

    expect(response.body).toHaveProperty('id')
    expect(response.body.kind).toBe('STORE_TO_HQ')
    expect(response.body.toStoreId).toBe(hqStoreId)
    expect(response.body.status).toBe('DRAFT')
    expect(response.body.reason).toBe('Excess inventory transfer to HQ')
    
    transferStoreToHQId = response.body.id
    
    // Verify transfer lines were created
    expect(response.body.lines).toBeDefined()
    expect(response.body.lines.length).toBe(1)
    expect(response.body.lines[0].itemId).toBe(testItemStoreToHQ)
  })

  it('should create HQ_TO_STORE transfer', async () => {
    const transferData = {
      kind: 'HQ_TO_STORE',
      fromStoreId: hqStoreId,
      toStoreId: storeId,
      reason: 'Stock replenishment from HQ',
      items: [
        {
          itemId: testItemHQToStore,
          epc: `EPC-${testItemHQToStore}`,
          productId: '00000000-0000-0000-0000-000000000002'
        }
      ]
    }

    const response = await createAuthenticatedRequest(authToken)
      .post('/api/store/inventory/transfer-out')
      .send(transferData)
      .expect(201)

    expect(response.body).toHaveProperty('id')
    expect(response.body.kind).toBe('HQ_TO_STORE')
    expect(response.body.fromStoreId).toBe(hqStoreId)
    expect(response.body.toStoreId).toBe(storeId)
    expect(response.body.status).toBe('DRAFT')
    
    transferHQToStoreId = response.body.id
  })

  it('should ship STORE_TO_HQ transfer', async () => {
    const shipData = {
      shippedById: 'test-user-id',
      shippedOn: new Date().toISOString()
    }

    const response = await createAuthenticatedRequest(authToken)
      .put(`/api/store/transfers/${transferStoreToHQId}/ship`)
      .send(shipData)
      .expect(200)

    expect(response.body.success).toBe(true)
    expect(response.body.message).toContain('shipped successfully')
    
    // Verify transfer status changed to SHIPPED
    const transferResponse = await createAuthenticatedRequest(authToken)
      .get(`/api/store/inventory/transfer-out`)
      .expect(200)

    const shippedTransfer = transferResponse.body.find((transfer: any) => transfer.id === transferStoreToHQId)
    expect(shippedTransfer.status).toBe('SHIPPED')
  })

  it('should ship HQ_TO_STORE transfer', async () => {
    const shipData = {
      shippedById: 'hq-user-id',
      shippedOn: new Date().toISOString()
    }

    const response = await createAuthenticatedRequest(authToken)
      .put(`/api/store/transfers/${transferHQToStoreId}/ship`)
      .send(shipData)
      .expect(200)

    expect(response.body.success).toBe(true)
    
    // Verify transfer status changed to SHIPPED
    const transferResponse = await createAuthenticatedRequest(authToken)
      .get(`/api/store/inventory/transfer-in`)
      .expect(200)

    const shippedTransfer = transferResponse.body.find((transfer: any) => transfer.id === transferHQToStoreId)
    expect(shippedTransfer.status).toBe('SHIPPED')
  })

  it('should receive STORE_TO_HQ transfer and update Item.currentStoreId', async () => {
    const receiveData = {
      receivedById: 'hq-user-id',
      receivedOn: new Date().toISOString(),
      items: [
        {
          itemId: testItemStoreToHQ,
          epc: `EPC-${testItemStoreToHQ}`,
          condition: 'good'
        }
      ]
    }

    const response = await createAuthenticatedRequest(authToken)
      .put(`/api/store/transfers/${transferStoreToHQId}/receive`)
      .send(receiveData)
      .expect(200)

    expect(response.body.success).toBe(true)
    expect(response.body.message).toContain('received successfully')
    
    // Verify Item.currentStoreId was updated to HQ
    const itemResponse = await createAuthenticatedRequest(authToken)
      .get(`/api/store/inventory/items/${testItemStoreToHQ}`)
      .expect(200)

    expect(itemResponse.body.currentStoreId).toBe(hqStoreId)
    expect(itemResponse.body.status).toBe('in_stock')
  })

  it('should receive HQ_TO_STORE transfer and update Item.currentStoreId', async () => {
    const receiveData = {
      receivedById: 'store-user-id',
      receivedOn: new Date().toISOString(),
      items: [
        {
          itemId: testItemHQToStore,
          epc: `EPC-${testItemHQToStore}`,
          condition: 'good'
        }
      ]
    }

    const response = await createAuthenticatedRequest(authToken)
      .put(`/api/store/transfers/${transferHQToStoreId}/receive`)
      .send(receiveData)
      .expect(200)

    expect(response.body.success).toBe(true)
    
    // Verify Item.currentStoreId was updated to store
    const itemResponse = await createAuthenticatedRequest(authToken)
      .get(`/api/store/inventory/items/${testItemHQToStore}`)
      .expect(200)

    expect(itemResponse.body.currentStoreId).toBe(storeId)
    expect(itemResponse.body.status).toBe('in_stock')
  })

  it('should create ItemEvent logs for transfer operations', async () => {
    // Verify ItemEvent for STORE_TO_HQ transfer
    const s2hEventsResponse = await createAuthenticatedRequest(authToken)
      .get(`/api/store/inventory/items/${testItemStoreToHQ}/events`)
      .expect(200)

    const transferEvent = s2hEventsResponse.body.find((event: any) => 
      event.type === 'TRANSFER_RECEIVED' && 
      event.docType === 'TRANSFER' &&
      event.docId === transferStoreToHQId
    )

    expect(transferEvent).toBeDefined()
    expect(transferEvent.storeId).toBe(hqStoreId)
    expect(transferEvent.payload).toHaveProperty('condition', 'good')
    
    // Verify ItemEvent for HQ_TO_STORE transfer
    const h2sEventsResponse = await createAuthenticatedRequest(authToken)
      .get(`/api/store/inventory/items/${testItemHQToStore}/events`)
      .expect(200)

    const h2sTransferEvent = h2sEventsResponse.body.find((event: any) => 
      event.type === 'TRANSFER_RECEIVED' && 
      event.docType === 'TRANSFER' &&
      event.docId === transferHQToStoreId
    )

    expect(h2sTransferEvent).toBeDefined()
    expect(h2sTransferEvent.storeId).toBe(storeId)
  })

  it('should support different transfer kinds', async () => {
    // Test STORE_TO_STORE transfer
    const storeToStoreData = {
      kind: 'STORE_TO_STORE',
      toStoreId: '00000000-0000-0000-0000-000000000003', // Another store
      reason: 'Store balance adjustment',
      items: [
        {
          itemId: generateTestId('item-s2s'),
          epc: `EPC-${generateTestId('item-s2s')}`,
          productId: '00000000-0000-0000-0000-000000000003'
        }
      ]
    }

    const response = await createAuthenticatedRequest(authToken)
      .post('/api/store/inventory/transfer-out')
      .send(storeToStoreData)
      .expect(201)

    expect(response.body.kind).toBe('STORE_TO_STORE')
    expect(response.body.fromStoreId).toBe(storeId)
    expect(response.body.toStoreId).toBe('00000000-0000-0000-0000-000000000003')
  })
})