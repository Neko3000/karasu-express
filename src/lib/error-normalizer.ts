/**
 * Error Normalization Utility
 *
 * Maps provider-specific errors to standardized error categories
 * for consistent error handling across all AI providers.
 */

import { ErrorCategory, ERROR_CATEGORY_RETRYABLE } from './types'

/**
 * Normalized error structure returned by all adapters
 */
export interface NormalizedError {
  category: ErrorCategory
  message: string
  retryable: boolean
  originalError: unknown
  providerCode?: string
}

/**
 * HTTP status codes and their corresponding error categories
 */
const HTTP_STATUS_CATEGORY_MAP: Record<number, ErrorCategory> = {
  400: ErrorCategory.InvalidInput,
  401: ErrorCategory.ProviderError,
  403: ErrorCategory.ContentFiltered,
  404: ErrorCategory.InvalidInput,
  408: ErrorCategory.Timeout,
  429: ErrorCategory.RateLimited,
  500: ErrorCategory.ProviderError,
  502: ErrorCategory.NetworkError,
  503: ErrorCategory.ProviderError,
  504: ErrorCategory.Timeout,
}

/**
 * Error message patterns for category detection
 */
const ERROR_MESSAGE_PATTERNS: Array<{
  pattern: RegExp
  category: ErrorCategory
}> = [
  // Rate limiting
  { pattern: /rate.?limit/i, category: ErrorCategory.RateLimited },
  { pattern: /too.?many.?requests/i, category: ErrorCategory.RateLimited },
  { pattern: /quota.?exceeded/i, category: ErrorCategory.RateLimited },

  // Content filtering
  { pattern: /content.?filter/i, category: ErrorCategory.ContentFiltered },
  { pattern: /nsfw/i, category: ErrorCategory.ContentFiltered },
  { pattern: /safety/i, category: ErrorCategory.ContentFiltered },
  { pattern: /violat/i, category: ErrorCategory.ContentFiltered },
  { pattern: /moderat/i, category: ErrorCategory.ContentFiltered },
  { pattern: /prohibited/i, category: ErrorCategory.ContentFiltered },
  { pattern: /blocked/i, category: ErrorCategory.ContentFiltered },

  // Invalid input
  { pattern: /invalid.?input/i, category: ErrorCategory.InvalidInput },
  { pattern: /invalid.?prompt/i, category: ErrorCategory.InvalidInput },
  { pattern: /invalid.?param/i, category: ErrorCategory.InvalidInput },
  { pattern: /malformed/i, category: ErrorCategory.InvalidInput },
  { pattern: /validation/i, category: ErrorCategory.InvalidInput },

  // Network errors
  { pattern: /network/i, category: ErrorCategory.NetworkError },
  { pattern: /connection/i, category: ErrorCategory.NetworkError },
  { pattern: /ECONNREFUSED/i, category: ErrorCategory.NetworkError },
  { pattern: /ENOTFOUND/i, category: ErrorCategory.NetworkError },
  { pattern: /dns/i, category: ErrorCategory.NetworkError },

  // Timeout
  { pattern: /timeout/i, category: ErrorCategory.Timeout },
  { pattern: /timed.?out/i, category: ErrorCategory.Timeout },
  { pattern: /deadline/i, category: ErrorCategory.Timeout },
]

/**
 * Extract HTTP status code from various error object shapes
 */
function extractStatusCode(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) {
    return undefined
  }

  const errorObj = error as Record<string, unknown>

  // Direct status property
  if (typeof errorObj.status === 'number') {
    return errorObj.status
  }

  // statusCode property
  if (typeof errorObj.statusCode === 'number') {
    return errorObj.statusCode
  }

  // Nested response.status
  if (
    typeof errorObj.response === 'object' &&
    errorObj.response !== null &&
    typeof (errorObj.response as Record<string, unknown>).status === 'number'
  ) {
    return (errorObj.response as Record<string, unknown>).status as number
  }

  return undefined
}

/**
 * Extract error message from various error object shapes
 */
function extractErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>

    // message property
    if (typeof errorObj.message === 'string') {
      return errorObj.message
    }

    // error.message nested
    if (
      typeof errorObj.error === 'object' &&
      errorObj.error !== null &&
      typeof (errorObj.error as Record<string, unknown>).message === 'string'
    ) {
      return (errorObj.error as Record<string, unknown>).message as string
    }

    // error as string
    if (typeof errorObj.error === 'string') {
      return errorObj.error
    }

    // Try to stringify
    try {
      return JSON.stringify(error)
    } catch {
      return 'Unknown error'
    }
  }

  return 'Unknown error'
}

/**
 * Extract provider-specific error code
 */
function extractProviderCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) {
    return undefined
  }

  const errorObj = error as Record<string, unknown>

  // code property
  if (typeof errorObj.code === 'string') {
    return errorObj.code
  }

  // error_code property
  if (typeof errorObj.error_code === 'string') {
    return errorObj.error_code
  }

  // Nested error.code
  if (
    typeof errorObj.error === 'object' &&
    errorObj.error !== null &&
    typeof (errorObj.error as Record<string, unknown>).code === 'string'
  ) {
    return (errorObj.error as Record<string, unknown>).code as string
  }

  return undefined
}

/**
 * Detect error category from message patterns
 */
function detectCategoryFromMessage(message: string): ErrorCategory | undefined {
  for (const { pattern, category } of ERROR_MESSAGE_PATTERNS) {
    if (pattern.test(message)) {
      return category
    }
  }
  return undefined
}

/**
 * Normalize any error into a standardized error structure
 *
 * @param error - The original error from any source
 * @returns Normalized error with category, message, and retryable flag
 */
export function normalizeError(error: unknown): NormalizedError {
  const message = extractErrorMessage(error)
  const statusCode = extractStatusCode(error)
  const providerCode = extractProviderCode(error)

  // Determine category by priority:
  // 1. HTTP status code
  // 2. Message pattern matching
  // 3. Default to Unknown
  let category: ErrorCategory = ErrorCategory.Unknown

  if (statusCode && HTTP_STATUS_CATEGORY_MAP[statusCode]) {
    category = HTTP_STATUS_CATEGORY_MAP[statusCode]
  } else {
    const patternCategory = detectCategoryFromMessage(message)
    if (patternCategory) {
      category = patternCategory
    }
  }

  return {
    category,
    message,
    retryable: ERROR_CATEGORY_RETRYABLE[category],
    originalError: error,
    providerCode,
  }
}

/**
 * Create a normalized error from known parameters
 *
 * @param category - Error category
 * @param message - Error message
 * @param originalError - Optional original error
 * @param providerCode - Optional provider-specific code
 */
export function createNormalizedError(
  category: ErrorCategory,
  message: string,
  originalError?: unknown,
  providerCode?: string
): NormalizedError {
  return {
    category,
    message,
    retryable: ERROR_CATEGORY_RETRYABLE[category],
    originalError,
    providerCode,
  }
}

/**
 * Check if an error should be retried based on its category
 */
export function isRetryableError(error: NormalizedError): boolean {
  return error.retryable
}

/**
 * Format normalized error for logging
 */
export function formatErrorForLog(error: NormalizedError): string {
  const parts = [
    `[${error.category}]`,
    error.message,
    error.providerCode ? `(code: ${error.providerCode})` : '',
    error.retryable ? '(retryable)' : '(not retryable)',
  ]
  return parts.filter(Boolean).join(' ')
}
