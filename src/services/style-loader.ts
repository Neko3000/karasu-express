/**
 * Style Loader Service
 *
 * Loads and manages style prompts from embedded TypeScript data.
 * Provides functions to access imported styles with "base" as default.
 *
 * Style source: src/resources/style-list/sdxl-styles-exp.ts
 *
 * Note: This service uses pre-loaded TypeScript data instead of fs.readFileSync
 * to ensure compatibility with both server-side and client-side code.
 */

import type { ImportedStyle, RawImportedStyle } from '../lib/style-types'
import {
  normalizeImportedStyle,
  isRawImportedStyle,
} from '../lib/style-types'
import { sdxlStylesData } from '../resources/style-list/sdxl-styles-exp'

// ============================================
// CONSTANTS
// ============================================

/**
 * Default style ID - must always be first in the list
 */
export const DEFAULT_STYLE_ID = 'base'

/**
 * Default style name
 */
export const DEFAULT_STYLE_NAME = 'base'

// ============================================
// MODULE STATE
// ============================================

/**
 * Cached styles after loading
 */
let cachedStyles: ImportedStyle[] | null = null

// ============================================
// LOADING FUNCTIONS
// ============================================

/**
 * Load and parse raw styles from the embedded data
 *
 * @returns Array of raw imported styles
 */
export function loadStylesFromJson(): RawImportedStyle[] {
  // Validate each style from the embedded data
  const validStyles: RawImportedStyle[] = []
  for (const item of sdxlStylesData) {
    if (isRawImportedStyle(item)) {
      validStyles.push(item)
    } else {
      console.warn('Skipping invalid style entry:', item)
    }
  }

  return validStyles
}

/**
 * Parse and normalize raw styles into ImportedStyle format
 *
 * @param rawStyles - Array of raw styles from JSON
 * @returns Array of normalized ImportedStyle objects
 */
export function parseStyleTemplates(rawStyles: RawImportedStyle[]): ImportedStyle[] {
  return rawStyles.map(normalizeImportedStyle)
}

// ============================================
// ACCESS FUNCTIONS
// ============================================

/**
 * Get all available styles, sorted alphabetically with "base" first
 *
 * Styles are cached after first load for performance.
 *
 * @param forceReload - Force reload from file (for testing)
 * @returns Array of all ImportedStyle objects
 */
export function getAllStyles(forceReload = false): ImportedStyle[] {
  if (cachedStyles && !forceReload) {
    return cachedStyles
  }

  const rawStyles = loadStylesFromJson()
  const normalizedStyles = parseStyleTemplates(rawStyles)

  // Sort alphabetically by name, but keep "base" first
  const sorted = normalizedStyles.sort((a, b) => {
    // Base style always comes first
    if (a.styleId === DEFAULT_STYLE_ID) return -1
    if (b.styleId === DEFAULT_STYLE_ID) return 1

    // Alphabetical sort for others
    return a.name.localeCompare(b.name)
  })

  cachedStyles = sorted
  return sorted
}

/**
 * Get the default style (base)
 *
 * @returns The base style as ImportedStyle
 */
export function getDefaultStyle(): ImportedStyle {
  const styles = getAllStyles()
  const baseStyle = styles.find((s) => s.styleId === DEFAULT_STYLE_ID)

  if (!baseStyle) {
    // Return a fallback base style if not found in the JSON
    return {
      styleId: DEFAULT_STYLE_ID,
      name: DEFAULT_STYLE_NAME,
      positivePrompt: '{prompt}',
      negativePrompt: '',
      source: 'imported',
    }
  }

  return baseStyle
}

/**
 * Get a specific style by ID
 *
 * @param styleId - The style ID to find
 * @returns The ImportedStyle or undefined if not found
 */
export function getStyleById(styleId: string): ImportedStyle | undefined {
  const styles = getAllStyles()
  return styles.find((s) => s.styleId === styleId)
}

/**
 * Get multiple styles by their IDs
 *
 * @param styleIds - Array of style IDs to find
 * @returns Array of found ImportedStyle objects (missing IDs are filtered out)
 */
export function getStylesByIds(styleIds: string[]): ImportedStyle[] {
  const styles = getAllStyles()
  const styleMap = new Map(styles.map((s) => [s.styleId, s]))

  return styleIds
    .map((id) => styleMap.get(id))
    .filter((s): s is ImportedStyle => s !== undefined)
}

/**
 * Search styles by name (case-insensitive)
 *
 * @param query - Search query
 * @returns Array of matching ImportedStyle objects
 */
export function searchStyles(query: string): ImportedStyle[] {
  const styles = getAllStyles()
  const lowerQuery = query.toLowerCase()

  return styles.filter((s) => s.name.toLowerCase().includes(lowerQuery))
}

/**
 * Get the total count of available styles
 *
 * @returns Number of styles
 */
export function getStyleCount(): number {
  return getAllStyles().length
}

/**
 * Clear the cached styles (for testing)
 */
export function clearStyleCache(): void {
  cachedStyles = null
}
