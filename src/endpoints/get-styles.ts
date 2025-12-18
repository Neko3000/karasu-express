/**
 * Get Styles Endpoint
 *
 * GET /api/studio/styles
 *
 * Returns all available imported styles for the task creation page.
 * Styles are sorted alphabetically with "base" as the first item.
 *
 * This file contains the endpoint handler logic.
 * The actual route is defined in src/app/api/studio/styles/route.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getAllStyles,
  searchStyles,
  getStyleCount,
  DEFAULT_STYLE_ID,
} from '../services/style-loader'
import type { StylesResponse } from '../lib/style-types'

/**
 * GET handler for /api/studio/styles
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const searchQuery = searchParams.get('search')

    // Get styles (filtered if search query provided)
    const styles = searchQuery ? searchStyles(searchQuery) : getAllStyles()

    // Build response
    const response: StylesResponse = {
      count: styles.length,
      defaultStyleId: DEFAULT_STYLE_ID,
      styles,
    }

    return NextResponse.json({
      success: true,
      ...response,
    })
  } catch (error) {
    console.error('[get-styles] Error loading styles:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Failed to load styles',
      },
      { status: 500 }
    )
  }
}

/**
 * HEAD handler for /api/studio/styles
 * Returns style count in headers without full payload
 */
export async function HEAD() {
  try {
    const count = getStyleCount()

    return new NextResponse(null, {
      status: 200,
      headers: {
        'X-Total-Count': count.toString(),
        'X-Default-Style': DEFAULT_STYLE_ID,
      },
    })
  } catch (error) {
    console.error('[get-styles] Error getting style count:', error)

    return new NextResponse(null, {
      status: 500,
    })
  }
}
