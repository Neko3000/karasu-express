/**
 * Vitest Test Setup
 *
 * Common test utilities, mocks, and setup for all tests.
 * Per Constitution Principle VI (Testing Discipline).
 */

import { beforeAll, afterAll, vi } from 'vitest'
import { ErrorCategory } from '../src/lib/types'

// ============================================
// ENVIRONMENT SETUP
// ============================================

// Set test environment variables
process.env.NODE_ENV = 'test'

// Mock environment variables for AI providers
// These are only used for tests, not for actual API calls
beforeAll(() => {
  process.env.FAL_API_KEY = 'test-fal-api-key'
  process.env.OPENAI_API_KEY = 'test-openai-api-key'
  process.env.GOOGLE_CLOUD_PROJECT = 'test-project'
  process.env.GOOGLE_CLOUD_LOCATION = 'us-central1'
  process.env.MONGODB_URI = 'mongodb://localhost:27017/test'
})

// ============================================
// CLEANUP
// ============================================

afterAll(() => {
  vi.restoreAllMocks()
})

// ============================================
// MOCK FACTORIES
// ============================================

/**
 * Create a mock for Fal.ai client
 */
export function createMockFalClient() {
  return {
    config: vi.fn(),
    subscribe: vi.fn(),
  }
}

/**
 * Create a mock for OpenAI client
 */
export function createMockOpenAIClient() {
  return {
    images: {
      generate: vi.fn(),
    },
  }
}

/**
 * Create a mock for Google Auth
 */
export function createMockGoogleAuth() {
  return {
    getClient: vi.fn().mockResolvedValue({
      getAccessToken: vi.fn().mockResolvedValue({ token: 'mock-access-token' }),
    }),
  }
}

// ============================================
// TEST UTILITIES
// ============================================

/**
 * Wait for a specified amount of time
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Create a mock generation result
 */
export function createMockGenerationResult(overrides = {}) {
  return {
    images: [
      {
        url: 'https://example.com/test-image.png',
        width: 1024,
        height: 1024,
        contentType: 'image/png',
      },
    ],
    seed: 12345,
    timing: { inference: 1000 },
    metadata: {},
    ...overrides,
  }
}

/**
 * Create a mock normalized error
 */
export function createMockNormalizedError(overrides = {}) {
  return {
    category: ErrorCategory.Unknown,
    message: 'Test error message',
    retryable: false,
    originalError: new Error('Original error'),
    ...overrides,
  }
}
