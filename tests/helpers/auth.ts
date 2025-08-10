import request from 'supertest'
import { TEST_BASE_URL, TEST_USER } from '../setup'

export interface AuthResponse {
  token: string
  user: any
  profile: any
}

/**
 * Authenticate test user and return token for API calls
 */
export async function authenticateTestUser(): Promise<AuthResponse> {
  const response = await request(TEST_BASE_URL)
    .post('/api/store/auth/login')
    .send({
      email: TEST_USER.email,
      password: TEST_USER.password
    })
    .expect(200)

  return {
    token: response.body.token,
    user: response.body.user,
    profile: response.body.profile
  }
}

/**
 * Create authenticated request with proper headers
 */
export function createAuthenticatedRequest(token: string) {
  return request(TEST_BASE_URL).set('Authorization', `Bearer ${token}`)
}

/**
 * Generate test data with unique identifiers
 */
export function generateTestId(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`
}