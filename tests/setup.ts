import { beforeAll, afterAll } from 'vitest'

// Global test environment setup
const SUPABASE_URL = 'https://teeiqfgegkshfizvzmqj.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZWlxZmdlZ2tzaGZpenZ6bXFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NjY0ODcsImV4cCI6MjA2OTU0MjQ4N30.h_FqWHJ9ArF5Ej0tdiS6qrynnWwxp_NApZ7Xbi-AQhg'

// Set environment variables for tests
process.env.SUPABASE_URL = SUPABASE_URL
process.env.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY

// Test user credentials for authentication
export const TEST_USER = {
  email: 'test@example.com',
  password: 'test123456',
  storeId: '00000000-0000-0000-0000-000000000001'
}

export const TEST_BASE_URL = 'http://localhost:54321/functions/v1'

beforeAll(async () => {
  console.log('Setting up e2e test environment...')
})

afterAll(async () => {
  console.log('Cleaning up e2e test environment...')
})