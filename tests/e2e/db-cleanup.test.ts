import { test, expect } from '@playwright/test';
import { authenticateTestUser } from '../helpers/auth';

test.describe('Database Cleanup Compatibility', () => {
  let authToken: string;

  test.beforeAll(async () => {
    authToken = await authenticateTestUser();
  });

  test('sales orders API remains functional after cleanup', async ({ request }) => {
    const response = await request.get('/api/store/sales-orders', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    expect(response.status()).toBe(200);
  });

  test('inventory API remains functional after cleanup', async ({ request }) => {
    const response = await request.get('/api/store/inventory', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    expect(response.status()).toBe(200);
  });

  test('returns API remains functional after cleanup', async ({ request }) => {
    const response = await request.get('/api/store/returns', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    expect(response.status()).toBe(200);
  });
});