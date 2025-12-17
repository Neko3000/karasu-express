/**
 * Unit Tests: Rate Limiter
 *
 * Tests for src/lib/rate-limiter.ts
 * Per Constitution Principle VI (Testing Discipline)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  rateLimiter,
  withRateLimit,
  DEFAULT_RATE_LIMITS,
  type RateLimitConfig,
} from '../../../src/lib/rate-limiter'
import { Provider } from '../../../src/lib/types'

describe('rate-limiter', () => {
  // Reset the rate limiter before each test
  beforeEach(() => {
    rateLimiter.resetAll()
    vi.useFakeTimers()
  })

  // Restore real timers after tests
  afterEach(() => {
    vi.useRealTimers()
  })

  // ============================================
  // DEFAULT_RATE_LIMITS
  // ============================================

  describe('DEFAULT_RATE_LIMITS', () => {
    it('should have configuration for Fal provider', () => {
      expect(DEFAULT_RATE_LIMITS[Provider.Fal]).toBeDefined()
      expect(DEFAULT_RATE_LIMITS[Provider.Fal].maxRequests).toBe(10)
      expect(DEFAULT_RATE_LIMITS[Provider.Fal].windowMs).toBe(60000)
    })

    it('should have configuration for OpenAI provider', () => {
      expect(DEFAULT_RATE_LIMITS[Provider.OpenAI]).toBeDefined()
      expect(DEFAULT_RATE_LIMITS[Provider.OpenAI].maxRequests).toBe(5)
      expect(DEFAULT_RATE_LIMITS[Provider.OpenAI].windowMs).toBe(60000)
    })

    it('should have configuration for Google provider', () => {
      expect(DEFAULT_RATE_LIMITS[Provider.Google]).toBeDefined()
      expect(DEFAULT_RATE_LIMITS[Provider.Google].maxRequests).toBe(15)
      expect(DEFAULT_RATE_LIMITS[Provider.Google].windowMs).toBe(60000)
    })
  })

  // ============================================
  // canRequest
  // ============================================

  describe('canRequest', () => {
    it('should return true when no requests have been made', () => {
      expect(rateLimiter.canRequest(Provider.Fal)).toBe(true)
    })

    it('should return true when under the limit', () => {
      rateLimiter.configure(Provider.Fal, {
        maxRequests: 5,
        windowMs: 60000,
      })

      // Make 4 requests
      for (let i = 0; i < 4; i++) {
        rateLimiter.recordRequest(Provider.Fal)
      }

      expect(rateLimiter.canRequest(Provider.Fal)).toBe(true)
    })

    it('should return false when at the limit', () => {
      rateLimiter.configure(Provider.Fal, {
        maxRequests: 5,
        windowMs: 60000,
      })

      // Make 5 requests (at limit)
      for (let i = 0; i < 5; i++) {
        rateLimiter.recordRequest(Provider.Fal)
      }

      expect(rateLimiter.canRequest(Provider.Fal)).toBe(false)
    })

    it('should return true after window expires', () => {
      rateLimiter.configure(Provider.Fal, {
        maxRequests: 2,
        windowMs: 1000,
      })

      // Make requests at limit
      rateLimiter.recordRequest(Provider.Fal)
      rateLimiter.recordRequest(Provider.Fal)

      expect(rateLimiter.canRequest(Provider.Fal)).toBe(false)

      // Advance time past window
      vi.advanceTimersByTime(1100)

      expect(rateLimiter.canRequest(Provider.Fal)).toBe(true)
    })

    it('should respect minDelayMs between requests', () => {
      rateLimiter.configure(Provider.Fal, {
        maxRequests: 10,
        windowMs: 60000,
        minDelayMs: 500,
      })

      rateLimiter.recordRequest(Provider.Fal)

      // Immediately after request, should be blocked by minDelay
      expect(rateLimiter.canRequest(Provider.Fal)).toBe(false)

      // After minDelay, should be allowed
      vi.advanceTimersByTime(500)
      expect(rateLimiter.canRequest(Provider.Fal)).toBe(true)
    })
  })

  // ============================================
  // getWaitTime
  // ============================================

  describe('getWaitTime', () => {
    it('should return 0 when can make request immediately', () => {
      expect(rateLimiter.getWaitTime(Provider.Fal)).toBe(0)
    })

    it('should return time until minDelay expires', () => {
      rateLimiter.configure(Provider.Fal, {
        maxRequests: 10,
        windowMs: 60000,
        minDelayMs: 500,
      })

      rateLimiter.recordRequest(Provider.Fal)

      const waitTime = rateLimiter.getWaitTime(Provider.Fal)
      expect(waitTime).toBe(500)
    })

    it('should return time until oldest request expires from window', () => {
      rateLimiter.configure(Provider.Fal, {
        maxRequests: 2,
        windowMs: 10000,
      })

      rateLimiter.recordRequest(Provider.Fal)
      vi.advanceTimersByTime(1000)
      rateLimiter.recordRequest(Provider.Fal)

      // At limit, wait time should be ~9000ms until first request expires
      const waitTime = rateLimiter.getWaitTime(Provider.Fal)
      expect(waitTime).toBeGreaterThanOrEqual(8900)
      expect(waitTime).toBeLessThanOrEqual(9100)
    })

    it('should return max of minDelay and window expiry', () => {
      rateLimiter.configure(Provider.Fal, {
        maxRequests: 1,
        windowMs: 500,
        minDelayMs: 1000,
      })

      rateLimiter.recordRequest(Provider.Fal)

      // minDelay (1000) > window expiry (500), so should return ~1000
      const waitTime = rateLimiter.getWaitTime(Provider.Fal)
      expect(waitTime).toBe(1000)
    })
  })

  // ============================================
  // recordRequest
  // ============================================

  describe('recordRequest', () => {
    it('should record request and update state', () => {
      rateLimiter.configure(Provider.Fal, {
        maxRequests: 5,
        windowMs: 60000,
      })

      const status1 = rateLimiter.getStatus(Provider.Fal)
      expect(status1.currentRequests).toBe(0)

      rateLimiter.recordRequest(Provider.Fal)

      const status2 = rateLimiter.getStatus(Provider.Fal)
      expect(status2.currentRequests).toBe(1)
    })

    it('should update lastRequestTime', () => {
      rateLimiter.configure(Provider.Fal, {
        maxRequests: 10,
        windowMs: 60000,
        minDelayMs: 100,
      })

      rateLimiter.recordRequest(Provider.Fal)
      expect(rateLimiter.canRequest(Provider.Fal)).toBe(false)

      vi.advanceTimersByTime(100)
      expect(rateLimiter.canRequest(Provider.Fal)).toBe(true)
    })
  })

  // ============================================
  // tryAcquire
  // ============================================

  describe('tryAcquire', () => {
    it('should return true and record request when allowed', () => {
      rateLimiter.configure(Provider.Fal, {
        maxRequests: 5,
        windowMs: 60000,
      })

      const result = rateLimiter.tryAcquire(Provider.Fal)
      expect(result).toBe(true)

      const status = rateLimiter.getStatus(Provider.Fal)
      expect(status.currentRequests).toBe(1)
    })

    it('should return false when rate limited', () => {
      rateLimiter.configure(Provider.Fal, {
        maxRequests: 1,
        windowMs: 60000,
      })

      rateLimiter.recordRequest(Provider.Fal)
      const result = rateLimiter.tryAcquire(Provider.Fal)
      expect(result).toBe(false)
    })
  })

  // ============================================
  // acquire (async)
  // ============================================

  describe('acquire', () => {
    it('should resolve immediately when can request', async () => {
      const start = Date.now()
      await rateLimiter.acquire(Provider.Fal)
      const elapsed = Date.now() - start

      expect(elapsed).toBeLessThan(100)
    })

    it('should wait and resolve when rate limited', async () => {
      rateLimiter.configure(Provider.Fal, {
        maxRequests: 1,
        windowMs: 1000,
        minDelayMs: 0,
      })

      rateLimiter.recordRequest(Provider.Fal)

      const acquirePromise = rateLimiter.acquire(Provider.Fal, 5000)

      // Advance time to allow the request
      vi.advanceTimersByTime(1100)

      await acquirePromise
      // Should resolve without throwing
      expect(true).toBe(true)
    })

    it('should throw on timeout', async () => {
      rateLimiter.configure(Provider.Fal, {
        maxRequests: 1,
        windowMs: 60000,
      })

      rateLimiter.recordRequest(Provider.Fal)

      const acquirePromise = rateLimiter.acquire(Provider.Fal, 100)

      // Advance timer but not enough to clear rate limit
      vi.advanceTimersByTime(200)

      await expect(acquirePromise).rejects.toThrow(/Rate limit timeout/)
    })
  })

  // ============================================
  // configure
  // ============================================

  describe('configure', () => {
    it('should set custom rate limits for provider', () => {
      const customConfig: RateLimitConfig = {
        maxRequests: 3,
        windowMs: 5000,
        minDelayMs: 200,
      }

      rateLimiter.configure(Provider.Fal, customConfig)

      const status = rateLimiter.getStatus(Provider.Fal)
      expect(status.maxRequests).toBe(3)
      expect(status.windowMs).toBe(5000)
    })

    it('should update existing configuration', () => {
      rateLimiter.configure(Provider.Fal, {
        maxRequests: 10,
        windowMs: 60000,
      })

      rateLimiter.configure(Provider.Fal, {
        maxRequests: 5,
        windowMs: 30000,
      })

      const status = rateLimiter.getStatus(Provider.Fal)
      expect(status.maxRequests).toBe(5)
      expect(status.windowMs).toBe(30000)
    })
  })

  // ============================================
  // getStatus
  // ============================================

  describe('getStatus', () => {
    it('should return current status', () => {
      rateLimiter.configure(Provider.Fal, {
        maxRequests: 5,
        windowMs: 60000,
      })

      rateLimiter.recordRequest(Provider.Fal)
      rateLimiter.recordRequest(Provider.Fal)

      const status = rateLimiter.getStatus(Provider.Fal)

      expect(status.currentRequests).toBe(2)
      expect(status.maxRequests).toBe(5)
      expect(status.windowMs).toBe(60000)
    })

    it('should use default config for unknown provider', () => {
      const status = rateLimiter.getStatus('custom-provider')

      expect(status.maxRequests).toBe(10) // Default
      expect(status.windowMs).toBe(60000) // Default
    })
  })

  // ============================================
  // reset
  // ============================================

  describe('reset', () => {
    it('should reset single provider state', () => {
      rateLimiter.configure(Provider.Fal, {
        maxRequests: 5,
        windowMs: 60000,
      })

      rateLimiter.recordRequest(Provider.Fal)
      rateLimiter.recordRequest(Provider.Fal)

      rateLimiter.reset(Provider.Fal)

      const status = rateLimiter.getStatus(Provider.Fal)
      expect(status.currentRequests).toBe(0)
    })

    it('should not affect other providers', () => {
      rateLimiter.recordRequest(Provider.Fal)
      rateLimiter.recordRequest(Provider.OpenAI)

      rateLimiter.reset(Provider.Fal)

      expect(rateLimiter.getStatus(Provider.Fal).currentRequests).toBe(0)
      expect(rateLimiter.getStatus(Provider.OpenAI).currentRequests).toBe(1)
    })
  })

  // ============================================
  // resetAll
  // ============================================

  describe('resetAll', () => {
    it('should reset all providers', () => {
      rateLimiter.recordRequest(Provider.Fal)
      rateLimiter.recordRequest(Provider.OpenAI)
      rateLimiter.recordRequest(Provider.Google)

      rateLimiter.resetAll()

      // After resetAll, providers start fresh with default limits
      expect(rateLimiter.canRequest(Provider.Fal)).toBe(true)
      expect(rateLimiter.canRequest(Provider.OpenAI)).toBe(true)
      expect(rateLimiter.canRequest(Provider.Google)).toBe(true)
    })
  })

  // ============================================
  // withRateLimit helper
  // ============================================

  describe('withRateLimit', () => {
    it('should execute operation after acquiring', async () => {
      const mockOperation = vi.fn().mockResolvedValue('result')

      const result = await withRateLimit(Provider.Fal, mockOperation)

      expect(mockOperation).toHaveBeenCalledOnce()
      expect(result).toBe('result')
    })

    it('should record request before executing', async () => {
      rateLimiter.configure(Provider.Fal, {
        maxRequests: 1,
        windowMs: 60000,
      })

      const mockOperation = vi.fn().mockResolvedValue('result')

      await withRateLimit(Provider.Fal, mockOperation)

      // Should have recorded the request
      expect(rateLimiter.canRequest(Provider.Fal)).toBe(false)
    })

    it('should propagate operation errors', async () => {
      const mockOperation = vi
        .fn()
        .mockRejectedValue(new Error('Operation failed'))

      await expect(withRateLimit(Provider.Fal, mockOperation)).rejects.toThrow(
        'Operation failed'
      )
    })

    it('should respect timeout parameter', async () => {
      rateLimiter.configure(Provider.Fal, {
        maxRequests: 1,
        windowMs: 60000,
      })

      rateLimiter.recordRequest(Provider.Fal)

      const mockOperation = vi.fn()
      const withRateLimitPromise = withRateLimit(Provider.Fal, mockOperation, 100)

      vi.advanceTimersByTime(200)

      await expect(withRateLimitPromise).rejects.toThrow(/Rate limit timeout/)
      expect(mockOperation).not.toHaveBeenCalled()
    })
  })

  // ============================================
  // Sliding Window Behavior
  // ============================================

  describe('sliding window behavior', () => {
    it('should clean up old requests outside window', () => {
      rateLimiter.configure(Provider.Fal, {
        maxRequests: 2,
        windowMs: 5000,
      })

      // Make first request
      rateLimiter.recordRequest(Provider.Fal)
      vi.advanceTimersByTime(3000)

      // Make second request
      rateLimiter.recordRequest(Provider.Fal)

      // At limit
      expect(rateLimiter.canRequest(Provider.Fal)).toBe(false)

      // Advance past first request's window
      vi.advanceTimersByTime(2100)

      // First request should be cleaned up, allowing new request
      expect(rateLimiter.canRequest(Provider.Fal)).toBe(true)
    })

    it('should allow burst followed by waiting', () => {
      rateLimiter.configure(Provider.Fal, {
        maxRequests: 3,
        windowMs: 10000,
      })

      // Burst 3 requests
      rateLimiter.recordRequest(Provider.Fal)
      rateLimiter.recordRequest(Provider.Fal)
      rateLimiter.recordRequest(Provider.Fal)

      expect(rateLimiter.canRequest(Provider.Fal)).toBe(false)

      // Wait for window to expire
      vi.advanceTimersByTime(10100)

      // All old requests cleaned up
      expect(rateLimiter.canRequest(Provider.Fal)).toBe(true)
      expect(rateLimiter.getStatus(Provider.Fal).currentRequests).toBe(0)
    })
  })
})
