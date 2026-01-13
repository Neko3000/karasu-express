/**
 * Get Styles Endpoint
 *
 * GET /api/studio/styles
 *
 * Returns all available styles from the StyleTemplates collection in the database.
 * Styles are sorted by sortOrder with "base" as the first item.
 *
 * This file contains the endpoint handler logic.
 * The actual route is defined in src/app/api/studio/styles/route.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  getStylesFromDB,
  searchStyles,
  DEFAULT_STYLE_ID,
  refreshStyleCache,
} from '../services/style-loader'
import type { StylesResponse } from '../lib/style-types'

/**
 * GET handler for /api/studio/styles
 *
 * Fetches all styles from the StyleTemplates collection in the database.
 * Supports optional search query parameter for filtering.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const searchQuery = searchParams.get('search')

    // Get Payload instance
    const payload = await getPayload({ config })

    // Refresh cache from database
    await refreshStyleCache(payload)

    // Get styles (filtered if search query provided)
    let styles
    if (searchQuery) {
      styles = searchStyles(searchQuery)
    } else {
      styles = await getStylesFromDB(payload)
    }

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
    // Get Payload instance
    const payload = await getPayload({ config })

    // Count styles in database
    const result = await payload.count({
      collection: 'style-templates',
    })

    return new NextResponse(null, {
      status: 200,
      headers: {
        'X-Total-Count': result.totalDocs.toString(),
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
