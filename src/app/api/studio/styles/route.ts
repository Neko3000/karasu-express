/**
 * API Route: GET /api/studio/styles
 *
 * Returns all available imported styles for the task creation page.
 * Styles are sorted alphabetically with "base" as the first item.
 *
 * Query Parameters:
 * - search (optional): Filter styles by name
 *
 * Response:
 * {
 *   success: true,
 *   count: number,
 *   defaultStyleId: string,
 *   styles: ImportedStyle[]
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getAllStyles,
  searchStyles,
  DEFAULT_STYLE_ID,
} from '../../../../services/style-loader'
import type { StylesResponse } from '../../../../lib/style-types'

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
 * HEAD request to get style count without full payload
 */
export async function HEAD() {
  try {
    const styles = getAllStyles()
    const count = styles.length

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
