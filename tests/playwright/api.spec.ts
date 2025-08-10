import { test, expect } from '@playwright/test';

test.describe('Store API E2E Tests', () => {
  test('should access health check endpoint', async ({ page }) => {
    const response = await page.request.get('/api/store/healthz');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toMatchObject({
      status: 'ok',
      services: {
        database: 'up',
        auth: 'up',
      },
    });
  });

  test('should access OpenAPI documentation', async ({ page }) => {
    const response = await page.request.get('/api/docs');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.openapi).toBe('3.0.0');
    expect(data.info.title).toBe('Store API');
  });

  test('should preserve existing API paths', async ({ page }) => {
    // Test that the old API client can still reach endpoints
    const healthResponse = await page.request.get('/api/store/healthz');
    expect(healthResponse.status()).toBe(200);
    
    // Test that sales orders endpoint exists (even if it requires auth)
    const salesResponse = await page.request.get('/api/store/sales-orders');
    expect([200, 401]).toContain(salesResponse.status()); // 401 is expected without auth
  });

  test('should handle validation errors properly', async ({ page }) => {
    const response = await page.request.post('/api/store/auth/login', {
      data: { email: 'invalid', password: '123' },
    });
    
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.code).toBe('VALIDATION_FAILED');
  });
});