/**
 * Rate Limiter Utility
 *
 * Per-provider rate limiting to prevent 429 errors
 * Uses a sliding window approach with configurable limits.
 */

import { Provider } from './types'

/**
 * Rate limit configuration for a provider
 */
export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number
  /** Time window in milliseconds */
  windowMs: number
  /** Minimum delay between requests in milliseconds */
  minDelayMs?: number
}

/**
 * Default rate limits per provider
 * These are conservative defaults that can be overridden
 */
export const DEFAULT_RATE_LIMITS: Record<Provider, RateLimitConfig> = {
  [Provider.Fal]: {
    maxRequests: 10,
    windowMs: 60000, // 1 minute
    minDelayMs: 100,
  },
  [Provider.OpenAI]: {
    maxRequests: 5,
    windowMs: 60000, // 1 minute
    minDelayMs: 200,
  },
  [Provider.Google]: {
    maxRequests: 15,
    windowMs: 60000, // 1 minute
    minDelayMs: 100,
  },
}

/**
 * Request timestamp record
 */
interface RequestRecord {
  timestamp: number
}

/**
 * Rate limiter state for a single provider
 */
interface ProviderState {
  requests: RequestRecord[]
  config: RateLimitConfig
  lastRequestTime: number
}

/**
 * Rate limiter instance managing multiple providers
 */
class RateLimiter {
  private providers: Map<string, ProviderState> = new Map()

  /**
   * Initialize or get provider state
   */
  private getProviderState(
    providerId: string,
    config?: RateLimitConfig
  ): ProviderState {
    let state = this.providers.get(providerId)

    if (!state) {
      // Use provided config or fall back to defaults
      const providerEnum = Object.values(Provider).find((p) => p === providerId)
      const defaultConfig = providerEnum
        ? DEFAULT_RATE_LIMITS[providerEnum]
        : {
            maxRequests: 10,
            windowMs: 60000,
            minDelayMs: 100,
          }

      state = {
        requests: [],
        config: config || defaultConfig,
        lastRequestTime: 0,
      }
      this.providers.set(providerId, state)
    } else if (config) {
      // Update config if provided
      state.config = config
    }

    return state
  }

  /**
   * Clean up old requests outside the time window
   */
  private cleanupOldRequests(state: ProviderState): void {
    const now = Date.now()
    const windowStart = now - state.config.windowMs

    state.requests = state.requests.filter((r) => r.timestamp > windowStart)
  }

  /**
   * Check if a request can be made immediately
   *
   * @param providerId - Provider identifier
   * @returns true if request can proceed, false if rate limited
   */
  canRequest(providerId: string): boolean {
    const state = this.getProviderState(providerId)
    this.cleanupOldRequests(state)

    const now = Date.now()

    // Check request count limit
    if (state.requests.length >= state.config.maxRequests) {
      return false
    }

    // Check minimum delay
    if (state.config.minDelayMs) {
      const timeSinceLastRequest = now - state.lastRequestTime
      if (timeSinceLastRequest < state.config.minDelayMs) {
        return false
      }
    }

    return true
  }

  /**
   * Calculate wait time until next request is allowed
   *
   * @param providerId - Provider identifier
   * @returns Milliseconds to wait, 0 if request can proceed immediately
   */
  getWaitTime(providerId: string): number {
    const state = this.getProviderState(providerId)
    this.cleanupOldRequests(state)

    const now = Date.now()
    let waitTime = 0

    // Check minimum delay
    if (state.config.minDelayMs) {
      const timeSinceLastRequest = now - state.lastRequestTime
      if (timeSinceLastRequest < state.config.minDelayMs) {
        waitTime = Math.max(
          waitTime,
          state.config.minDelayMs - timeSinceLastRequest
        )
      }
    }

    // Check if at capacity
    if (state.requests.length >= state.config.maxRequests) {
      // Find oldest request and calculate when it expires from window
      const oldestRequest = state.requests[0]
      if (oldestRequest) {
        const oldestExpiry =
          oldestRequest.timestamp + state.config.windowMs - now
        waitTime = Math.max(waitTime, oldestExpiry)
      }
    }

    return Math.max(0, Math.ceil(waitTime))
  }

  /**
   * Record a request being made
   *
   * @param providerId - Provider identifier
   */
  recordRequest(providerId: string): void {
    const state = this.getProviderState(providerId)
    const now = Date.now()

    state.requests.push({ timestamp: now })
    state.lastRequestTime = now
  }

  /**
   * Acquire permission to make a request, waiting if necessary
   *
   * @param providerId - Provider identifier
   * @param timeoutMs - Maximum time to wait for permission (default: 30s)
   * @returns Promise that resolves when request can proceed
   * @throws Error if timeout is exceeded
   */
  async acquire(providerId: string, timeoutMs = 30000): Promise<void> {
    const startTime = Date.now()

    while (true) {
      if (this.canRequest(providerId)) {
        this.recordRequest(providerId)
        return
      }

      const waitTime = this.getWaitTime(providerId)
      const elapsed = Date.now() - startTime

      if (elapsed + waitTime > timeoutMs) {
        throw new Error(
          `Rate limit timeout for provider ${providerId}: waited ${elapsed}ms, need ${waitTime}ms more`
        )
      }

      // Wait before checking again
      await this.sleep(Math.min(waitTime, 1000))
    }
  }

  /**
   * Try to acquire permission without waiting
   *
   * @param providerId - Provider identifier
   * @returns true if acquired, false if rate limited
   */
  tryAcquire(providerId: string): boolean {
    if (this.canRequest(providerId)) {
      this.recordRequest(providerId)
      return true
    }
    return false
  }

  /**
   * Configure rate limits for a provider
   *
   * @param providerId - Provider identifier
   * @param config - Rate limit configuration
   */
  configure(providerId: string, config: RateLimitConfig): void {
    this.getProviderState(providerId, config)
  }

  /**
   * Get current status for a provider
   *
   * @param providerId - Provider identifier
   * @returns Status object with current request count and limits
   */
  getStatus(providerId: string): {
    currentRequests: number
    maxRequests: number
    windowMs: number
    waitTimeMs: number
  } {
    const state = this.getProviderState(providerId)
    this.cleanupOldRequests(state)

    return {
      currentRequests: state.requests.length,
      maxRequests: state.config.maxRequests,
      windowMs: state.config.windowMs,
      waitTimeMs: this.getWaitTime(providerId),
    }
  }

  /**
   * Reset rate limiter state for a provider
   *
   * @param providerId - Provider identifier
   */
  reset(providerId: string): void {
    const state = this.providers.get(providerId)
    if (state) {
      state.requests = []
      state.lastRequestTime = 0
    }
  }

  /**
   * Reset all providers
   */
  resetAll(): void {
    this.providers.clear()
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

/**
 * Singleton rate limiter instance
 */
export const rateLimiter = new RateLimiter()

/**
 * Helper function to wrap an async operation with rate limiting
 *
 * @param providerId - Provider identifier
 * @param operation - Async operation to execute
 * @param timeoutMs - Maximum time to wait for rate limit (default: 30s)
 * @returns Result of the operation
 */
export async function withRateLimit<T>(
  providerId: string,
  operation: () => Promise<T>,
  timeoutMs = 30000
): Promise<T> {
  await rateLimiter.acquire(providerId, timeoutMs)
  return operation()
}

/**
 * Decorator for rate-limited methods
 * Usage: @rateLimit('openai')
 */
export function rateLimit(providerId: string, timeoutMs = 30000) {
  return function <T>(
    _target: unknown,
    _propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: unknown[]) => Promise<T>>
  ): TypedPropertyDescriptor<(...args: unknown[]) => Promise<T>> {
    const originalMethod = descriptor.value!

    descriptor.value = async function (
      this: unknown,
      ...args: unknown[]
    ): Promise<T> {
      await rateLimiter.acquire(providerId, timeoutMs)
      return originalMethod.apply(this, args)
    }

    return descriptor
  }
}
