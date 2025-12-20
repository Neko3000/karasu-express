/**
 * API Route: POST /api/studio/expand-prompt
 *
 * Expand a creative theme into detailed prompt variants using AI.
 * This is a preview endpoint for testing prompt expansion without creating a task.
 *
 * User Story 2: Intelligent Prompt Optimization
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  createPromptOptimizer,
  type PromptExpansionInput,
  type PromptExpansionResult,
  DEFAULT_VARIANT_COUNT,
} from '../../../../services/prompt-optimizer'

/**
 * Request body for expand-prompt endpoint
 */
interface ExpandPromptRequest {
  /** The user's original creative theme/subject */
  subject: string
  /** Number of variants to generate (default: 3, max: 10) */
  variantCount?: number
  /** Enable web search for trending topic context */
  webSearchEnabled?: boolean
}

/**
 * Response body for expand-prompt endpoint
 */
interface ExpandPromptResponse {
  success: boolean
  data?: PromptExpansionResult
  error?: string
  message?: string
}

/**
 * Maximum allowed variant count
 */
const MAX_VARIANT_COUNT = 10

/**
 * Minimum subject length
 */
const MIN_SUBJECT_LENGTH = 2

/**
 * Maximum subject length
 */
const MAX_SUBJECT_LENGTH = 1000

/**
 * Validate the request body
 */
function validateRequest(body: ExpandPromptRequest): { valid: boolean; error?: string } {
  // Check subject exists
  if (!body.subject || typeof body.subject !== 'string') {
    return { valid: false, error: 'subject is required and must be a string' }
  }

  // Check subject length
  const subject = body.subject.trim()
  if (subject.length < MIN_SUBJECT_LENGTH) {
    return {
      valid: false,
      error: `subject must be at least ${MIN_SUBJECT_LENGTH} characters`,
    }
  }

  if (subject.length > MAX_SUBJECT_LENGTH) {
    return {
      valid: false,
      error: `subject cannot exceed ${MAX_SUBJECT_LENGTH} characters`,
    }
  }

  // Check variantCount if provided
  if (body.variantCount !== undefined) {
    if (typeof body.variantCount !== 'number' || !Number.isInteger(body.variantCount)) {
      return { valid: false, error: 'variantCount must be an integer' }
    }

    if (body.variantCount < 1) {
      return { valid: false, error: 'variantCount must be at least 1' }
    }

    if (body.variantCount > MAX_VARIANT_COUNT) {
      return {
        valid: false,
        error: `variantCount cannot exceed ${MAX_VARIANT_COUNT}`,
      }
    }
  }

  // Check webSearchEnabled if provided
  if (
    body.webSearchEnabled !== undefined &&
    typeof body.webSearchEnabled !== 'boolean'
  ) {
    return { valid: false, error: 'webSearchEnabled must be a boolean' }
  }

  return { valid: true }
}

/**
 * POST /api/studio/expand-prompt
 *
 * Expand a creative theme into detailed prompt variants.
 */
export async function POST(request: NextRequest): Promise<NextResponse<ExpandPromptResponse>> {
  try {
    // Parse request body
    let body: ExpandPromptRequest
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          message: 'Invalid JSON in request body',
        },
        { status: 400 }
      )
    }

    // Validate request
    const validation = validateRequest(body)
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          message: validation.error,
        },
        { status: 400 }
      )
    }

    // Check for API key
    if (!process.env.GOOGLE_AI_API_KEY) {
      console.error('[expand-prompt] GOOGLE_AI_API_KEY not configured')
      return NextResponse.json(
        {
          success: false,
          error: 'Configuration error',
          message: 'AI service not configured',
        },
        { status: 503 }
      )
    }

    // Build expansion input
    const input: PromptExpansionInput = {
      subject: body.subject.trim(),
      variantCount: body.variantCount ?? DEFAULT_VARIANT_COUNT,
      webSearchEnabled: body.webSearchEnabled ?? false,
    }

    console.log(`[expand-prompt] Expanding prompt: "${input.subject.substring(0, 50)}..."`)
    console.log(`[expand-prompt] Variant count: ${input.variantCount}, Web search: ${input.webSearchEnabled}`)

    // Create optimizer and expand prompt
    const optimizer = createPromptOptimizer()
    const result = await optimizer.expandPrompt(input)

    console.log(`[expand-prompt] Generated ${result.variants.length} variants for slug "${result.subjectSlug}"`)

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('[expand-prompt] Error expanding prompt:', error)

    // Handle specific error types
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Check for rate limit errors
    if (
      errorMessage.includes('rate limit') ||
      errorMessage.includes('429') ||
      errorMessage.includes('quota')
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
        },
        { status: 429 }
      )
    }

    // Check for API errors
    if (
      errorMessage.includes('API') ||
      errorMessage.includes('authentication') ||
      errorMessage.includes('unauthorized')
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Service error',
          message: 'AI service temporarily unavailable',
        },
        { status: 503 }
      )
    }

    // Generic error
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: errorMessage,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/studio/expand-prompt
 *
 * Returns endpoint documentation.
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    endpoint: '/api/studio/expand-prompt',
    method: 'POST',
    description: 'Expand a creative theme into detailed prompt variants using AI',
    request: {
      subject: 'string (required, 2-1000 chars)',
      variantCount: `number (optional, 1-${MAX_VARIANT_COUNT}, default: ${DEFAULT_VARIANT_COUNT})`,
      webSearchEnabled: 'boolean (optional, default: false)',
    },
    response: {
      success: 'boolean',
      data: {
        variants: [
          {
            variantId: 'string',
            variantName: 'string (e.g., "Realistic", "Artistic")',
            expandedPrompt: 'string (detailed prompt)',
            suggestedNegativePrompt: 'string',
            keywords: 'string[]',
          },
        ],
        subjectSlug: 'string (URL-safe slug)',
        searchContext: 'string (if webSearchEnabled)',
      },
    },
    example: {
      request: {
        subject: 'a cat sitting on a windowsill',
        variantCount: 3,
        webSearchEnabled: false,
      },
    },
  })
}
