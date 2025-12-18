/**
 * Style Loader Service
 *
 * Loads and manages style prompts from external JSON files.
 * Provides functions to access imported styles with "base" as default.
 *
 * Style source: src/resources/style-list/sdxl_styles_exp.json
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

import type { ImportedStyle, RawImportedStyle } from '../lib/style-types'
import {
  normalizeImportedStyle,
  isRawImportedStyle,
} from '../lib/style-types'

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
// PATH RESOLUTION
// ============================================

/**
 * Get the path to the styles JSON file
 */
function getStylesFilePath(): string {
  // Handle both ESM and CommonJS environments
  try {
    // ESM environment
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    return resolve(__dirname, '../resources/style-list/sdxl_styles_exp.json')
  } catch {
    // CommonJS fallback
    return resolve(__dirname, '../resources/style-list/sdxl_styles_exp.json')
  }
}

// ============================================
// LOADING FUNCTIONS
// ============================================

/**
 * Load and parse raw styles from the JSON file
 *
 * @param filePath - Optional custom file path (for testing)
 * @returns Array of raw imported styles
 * @throws Error if file cannot be read or parsed
 */
export function loadStylesFromJson(filePath?: string): RawImportedStyle[] {
  const path = filePath ?? getStylesFilePath()

  try {
    const fileContent = readFileSync(path, 'utf-8')
    const parsed = JSON.parse(fileContent)

    if (!Array.isArray(parsed)) {
      throw new Error('Styles file must contain an array')
    }

    // Validate each style
    const validStyles: RawImportedStyle[] = []
    for (const item of parsed) {
      if (isRawImportedStyle(item)) {
        validStyles.push(item)
      } else {
        console.warn('Skipping invalid style entry:', item)
      }
    }

    return validStyles
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse styles JSON: ${error.message}`)
    }
    throw error
  }
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
