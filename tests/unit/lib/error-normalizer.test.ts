/**
 * Unit Tests: Error Normalizer
 *
 * Tests for src/lib/error-normalizer.ts
 * Per Constitution Principle VI (Testing Discipline)
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeError,
  createNormalizedError,
  isRetryableError,
  formatErrorForLog,
} from '../../../src/lib/error-normalizer'
import { ErrorCategory, ERROR_CATEGORY_RETRYABLE } from '../../../src/lib/types'

describe('error-normalizer', () => {
  // ============================================
  // normalizeError - HTTP Status Code Mapping
  // ============================================

  describe('normalizeError - HTTP status code mapping', () => {
    it('should map 400 to InvalidInput', () => {
      const error = { status: 400, message: 'Bad request' }
      const result = normalizeError(error)

      expect(result.category).toBe(ErrorCategory.InvalidInput)
      expect(result.message).toBe('Bad request')
      expect(result.retryable).toBe(false)
    })

    it('should map 401 to ProviderError', () => {
      const error = { status: 401, message: 'Unauthorized' }
      const result = normalizeError(error)

      expect(result.category).toBe(ErrorCategory.ProviderError)
      expect(result.retryable).toBe(true)
    })

    it('should map 403 to ContentFiltered', () => {
      const error = { status: 403, message: 'Forbidden content' }
      const result = normalizeError(error)

      expect(result.category).toBe(ErrorCategory.ContentFiltered)
      expect(result.retryable).toBe(false)
    })

    it('should map 404 to InvalidInput', () => {
      const error = { status: 404, message: 'Not found' }
      const result = normalizeError(error)

      expect(result.category).toBe(ErrorCategory.InvalidInput)
      expect(result.retryable).toBe(false)
    })

    it('should map 408 to Timeout', () => {
      const error = { status: 408, message: 'Request timeout' }
      const result = normalizeError(error)

      expect(result.category).toBe(ErrorCategory.Timeout)
      expect(result.retryable).toBe(true)
    })

    it('should map 429 to RateLimited', () => {
      const error = { status: 429, message: 'Too many requests' }
      const result = normalizeError(error)

      expect(result.category).toBe(ErrorCategory.RateLimited)
      expect(result.retryable).toBe(true)
    })

    it('should map 500 to ProviderError', () => {
      const error = { status: 500, message: 'Internal server error' }
      const result = normalizeError(error)

      expect(result.category).toBe(ErrorCategory.ProviderError)
      expect(result.retryable).toBe(true)
    })

    it('should map 502 to NetworkError', () => {
      const error = { status: 502, message: 'Bad gateway' }
      const result = normalizeError(error)

      expect(result.category).toBe(ErrorCategory.NetworkError)
      expect(result.retryable).toBe(true)
    })

    it('should map 503 to ProviderError', () => {
      const error = { status: 503, message: 'Service unavailable' }
      const result = normalizeError(error)

      expect(result.category).toBe(ErrorCategory.ProviderError)
      expect(result.retryable).toBe(true)
    })

    it('should map 504 to Timeout', () => {
      const error = { status: 504, message: 'Gateway timeout' }
      const result = normalizeError(error)

      expect(result.category).toBe(ErrorCategory.Timeout)
      expect(result.retryable).toBe(true)
    })

    it('should handle statusCode property', () => {
      const error = { statusCode: 429, message: 'Rate limited' }
      const result = normalizeError(error)

      expect(result.category).toBe(ErrorCategory.RateLimited)
    })

    it('should handle nested response.status', () => {
      const error = {
        response: { status: 429 },
        message: 'Rate limited',
      }
      const result = normalizeError(error)

      expect(result.category).toBe(ErrorCategory.RateLimited)
    })
  })

  // ============================================
  // normalizeError - Message Pattern Matching
  // ============================================

  describe('normalizeError - message pattern matching', () => {
    // Rate limiting patterns
    it.each([
      'rate limit exceeded',
      'Rate Limit Exceeded',
      'rate_limit exceeded',
      'too many requests',
      'Too Many Requests',
      'quota exceeded',
      'Quota Exceeded',
    ])('should detect rate limiting from message: "%s"', (message) => {
      const error = { message }
      const result = normalizeError(error)

      expect(result.category).toBe(ErrorCategory.RateLimited)
      expect(result.retryable).toBe(true)
    })

    // Content filtering patterns
    it.each([
      'content filter triggered',
      'nsfw content detected',
      'NSFW detected',
      'safety system blocked',
      'safety violation',
      'policy violation',
      'violates our content policy',
      'content moderation',
      'prohibited content',
      'request blocked',
    ])('should detect content filtering from message: "%s"', (message) => {
      const error = { message }
      const result = normalizeError(error)

      expect(result.category).toBe(ErrorCategory.ContentFiltered)
      expect(result.retryable).toBe(false)
    })

    // Invalid input patterns
    it.each([
      'invalid input provided',
      'invalid prompt',
      'invalid parameter',
      'malformed request',
      'validation error',
    ])('should detect invalid input from message: "%s"', (message) => {
      const error = { message }
      const result = normalizeError(error)

      expect(result.category).toBe(ErrorCategory.InvalidInput)
      expect(result.retryable).toBe(false)
    })

    // Network error patterns
    it.each([
      'network error',
      'connection refused',
      'ECONNREFUSED',
      'ENOTFOUND',
      'dns resolution failed',
    ])('should detect network error from message: "%s"', (message) => {
      const error = { message }
      const result = normalizeError(error)

      expect(result.category).toBe(ErrorCategory.NetworkError)
      expect(result.retryable).toBe(true)
    })

    // Timeout patterns
    it.each([
      'request timeout',
      'timed out',
      'operation timed out',
      'deadline exceeded',
    ])('should detect timeout from message: "%s"', (message) => {
      const error = { message }
      const result = normalizeError(error)

      expect(result.category).toBe(ErrorCategory.Timeout)
      expect(result.retryable).toBe(true)
    })
  })

  // ============================================
  // normalizeError - Message Extraction
  // ============================================

  describe('normalizeError - message extraction', () => {
    it('should extract message from string error', () => {
      const result = normalizeError('Simple string error')
      expect(result.message).toBe('Simple string error')
    })

    it('should extract message from Error instance', () => {
      const result = normalizeError(new Error('Error instance message'))
      expect(result.message).toBe('Error instance message')
    })

    it('should extract message from object.message', () => {
      const result = normalizeError({ message: 'Object message' })
      expect(result.message).toBe('Object message')
    })

    it('should extract message from nested error.message', () => {
      const result = normalizeError({
        error: { message: 'Nested error message' },
      })
      expect(result.message).toBe('Nested error message')
    })

    it('should extract message from error string property', () => {
      const result = normalizeError({ error: 'Error string property' })
      expect(result.message).toBe('Error string property')
    })

    it('should JSON stringify unknown objects', () => {
      const result = normalizeError({ foo: 'bar', baz: 123 })
      expect(result.message).toBe('{"foo":"bar","baz":123}')
    })

    it('should return "Unknown error" for null', () => {
      const result = normalizeError(null)
      expect(result.message).toBe('Unknown error')
    })

    it('should return "Unknown error" for undefined', () => {
      const result = normalizeError(undefined)
      expect(result.message).toBe('Unknown error')
    })
  })

  // ============================================
  // normalizeError - Provider Code Extraction
  // ============================================

  describe('normalizeError - provider code extraction', () => {
    it('should extract code from error.code', () => {
      const result = normalizeError({ code: 'ERR_001', message: 'Test' })
      expect(result.providerCode).toBe('ERR_001')
    })

    it('should extract code from error.error_code', () => {
      const result = normalizeError({ error_code: 'ERR_002', message: 'Test' })
      expect(result.providerCode).toBe('ERR_002')
    })

    it('should extract code from nested error.code', () => {
      const result = normalizeError({
        error: { code: 'ERR_003' },
        message: 'Test',
      })
      expect(result.providerCode).toBe('ERR_003')
    })

    it('should return undefined if no code found', () => {
      const result = normalizeError({ message: 'No code' })
      expect(result.providerCode).toBeUndefined()
    })
  })

  // ============================================
  // normalizeError - Edge Cases
  // ============================================

  describe('normalizeError - edge cases', () => {
    it('should default to Unknown category when no pattern matches', () => {
      const result = normalizeError({ message: 'Some random error message' })

      expect(result.category).toBe(ErrorCategory.Unknown)
      expect(result.retryable).toBe(false)
    })

    it('should prioritize HTTP status over message pattern', () => {
      // Status 400 (InvalidInput) should win over rate limit message
      const error = { status: 400, message: 'rate limit exceeded' }
      const result = normalizeError(error)

      expect(result.category).toBe(ErrorCategory.InvalidInput)
    })

    it('should preserve original error reference', () => {
      const originalError = new Error('Original')
      const result = normalizeError(originalError)

      expect(result.originalError).toBe(originalError)
    })

    it('should handle circular references in error objects', () => {
      const circularError: Record<string, unknown> = { message: 'Circular' }
      circularError.self = circularError

      // Should not throw
      const result = normalizeError(circularError)
      expect(result.message).toBe('Circular')
    })
  })

  // ============================================
  // createNormalizedError
  // ============================================

  describe('createNormalizedError', () => {
    it('should create normalized error with correct category', () => {
      const result = createNormalizedError(
        ErrorCategory.RateLimited,
        'Rate limit exceeded'
      )

      expect(result.category).toBe(ErrorCategory.RateLimited)
      expect(result.message).toBe('Rate limit exceeded')
      expect(result.retryable).toBe(true)
    })

    it('should set retryable flag based on category', () => {
      // Test all categories
      for (const category of Object.values(ErrorCategory)) {
        const result = createNormalizedError(category, 'Test')
        expect(result.retryable).toBe(ERROR_CATEGORY_RETRYABLE[category])
      }
    })

    it('should include original error if provided', () => {
      const originalError = new Error('Original')
      const result = createNormalizedError(
        ErrorCategory.ProviderError,
        'Test',
        originalError
      )

      expect(result.originalError).toBe(originalError)
    })

    it('should include provider code if provided', () => {
      const result = createNormalizedError(
        ErrorCategory.ProviderError,
        'Test',
        null,
        'PROVIDER_ERR_001'
      )

      expect(result.providerCode).toBe('PROVIDER_ERR_001')
    })
  })

  // ============================================
  // isRetryableError
  // ============================================

  describe('isRetryableError', () => {
    it('should return true for retryable errors', () => {
      const error = createNormalizedError(
        ErrorCategory.RateLimited,
        'Rate limited'
      )
      expect(isRetryableError(error)).toBe(true)
    })

    it('should return false for non-retryable errors', () => {
      const error = createNormalizedError(
        ErrorCategory.ContentFiltered,
        'Content blocked'
      )
      expect(isRetryableError(error)).toBe(false)
    })
  })

  // ============================================
  // formatErrorForLog
  // ============================================

  describe('formatErrorForLog', () => {
    it('should format error with all fields', () => {
      const error = createNormalizedError(
        ErrorCategory.RateLimited,
        'Rate limit exceeded',
        null,
        'ERR_429'
      )
      const result = formatErrorForLog(error)

      expect(result).toContain('[RATE_LIMITED]')
      expect(result).toContain('Rate limit exceeded')
      expect(result).toContain('(code: ERR_429)')
      expect(result).toContain('(retryable)')
    })

    it('should format error without provider code', () => {
      const error = createNormalizedError(
        ErrorCategory.ContentFiltered,
        'Blocked'
      )
      const result = formatErrorForLog(error)

      expect(result).toContain('[CONTENT_FILTERED]')
      expect(result).toContain('Blocked')
      expect(result).not.toContain('(code:')
      expect(result).toContain('(not retryable)')
    })
  })

  // ============================================
  // ERROR_CATEGORY_RETRYABLE mapping
  // ============================================

  describe('ERROR_CATEGORY_RETRYABLE', () => {
    it('should mark RateLimited as retryable', () => {
      expect(ERROR_CATEGORY_RETRYABLE[ErrorCategory.RateLimited]).toBe(true)
    })

    it('should mark ContentFiltered as not retryable', () => {
      expect(ERROR_CATEGORY_RETRYABLE[ErrorCategory.ContentFiltered]).toBe(
        false
      )
    })

    it('should mark InvalidInput as not retryable', () => {
      expect(ERROR_CATEGORY_RETRYABLE[ErrorCategory.InvalidInput]).toBe(false)
    })

    it('should mark ProviderError as retryable', () => {
      expect(ERROR_CATEGORY_RETRYABLE[ErrorCategory.ProviderError]).toBe(true)
    })

    it('should mark NetworkError as retryable', () => {
      expect(ERROR_CATEGORY_RETRYABLE[ErrorCategory.NetworkError]).toBe(true)
    })

    it('should mark Timeout as retryable', () => {
      expect(ERROR_CATEGORY_RETRYABLE[ErrorCategory.Timeout]).toBe(true)
    })

    it('should mark Unknown as not retryable', () => {
      expect(ERROR_CATEGORY_RETRYABLE[ErrorCategory.Unknown]).toBe(false)
    })
  })
})
