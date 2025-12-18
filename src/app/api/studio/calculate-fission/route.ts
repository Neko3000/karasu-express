/**
 * API Route: POST /api/studio/calculate-fission
 *
 * Calculate the total number of sub-tasks that will be created
 */

import { NextRequest, NextResponse } from 'next/server'
import { previewFission, type FissionCalculationInput } from '../../../../services/task-orchestrator'
import { MAX_BATCH_SIZE } from '../../../../lib/types'

interface CalculateFissionRequest {
  promptCount: number
  styleCount: number
  modelCount: number
  batchSize: number
  includeBaseStyle?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CalculateFissionRequest

    const {
      promptCount,
      styleCount,
      modelCount,
      batchSize,
      includeBaseStyle = true,
    } = body

    // Validate required fields
    if (typeof promptCount !== 'number' || promptCount <= 0) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'promptCount must be a positive number',
        },
        { status: 400 }
      )
    }

    if (typeof styleCount !== 'number' || styleCount <= 0) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'styleCount must be a positive number',
        },
        { status: 400 }
      )
    }

    if (typeof modelCount !== 'number' || modelCount <= 0) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'modelCount must be a positive number',
        },
        { status: 400 }
      )
    }

    if (typeof batchSize !== 'number' || batchSize <= 0) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'batchSize must be a positive number',
        },
        { status: 400 }
      )
    }

    if (batchSize > MAX_BATCH_SIZE) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: `batchSize cannot exceed ${MAX_BATCH_SIZE}`,
        },
        { status: 400 }
      )
    }

    // Calculate fission
    const input: FissionCalculationInput = {
      promptCount,
      styleCount,
      modelCount,
      batchSize,
    }

    const result = previewFission(input, includeBaseStyle)

    return NextResponse.json({
      success: true,
      total: result.total,
      breakdown: result.breakdown,
      warning: result.warning,
    })
  } catch (error) {
    console.error('[calculate-fission] Error calculating fission:', error)

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'Invalid JSON in request body',
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
