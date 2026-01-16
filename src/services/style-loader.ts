/**
 * Style Loader Service
 *
 * Loads and manages style prompts from the StyleTemplates collection in MongoDB.
 * Provides functions to access styles with "base" as default.
 *
 * This service reads styles from the database (populated by seed script).
 * PayloadCMS Local API is used for server-side DB queries.
 *
 * Note: For client-side components, use the /api/studio/styles endpoint instead.
 */

import type { Payload } from 'payload'
import type { ImportedStyle } from '../lib/style-types'

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
 * Cached styles after loading from DB
 * Cache invalidation happens on clearStyleCache() call
 */
let cachedStyles: ImportedStyle[] | null = null

/**
 * Payload instance for database access
 * Must be set via setPayloadInstance() before using DB functions
 */
let payloadInstance: Payload | null = null

// ============================================
// PAYLOAD INSTANCE MANAGEMENT
// ============================================

/**
 * Set the Payload instance for database access
 * This should be called once during server startup
 *
 * @param payload - The Payload CMS instance
 */
export function setPayloadInstance(payload: Payload): void {
  payloadInstance = payload
}

/**
 * Get the Payload instance
 * Throws if not initialized
 */
function getPayload(): Payload {
  if (!payloadInstance) {
    throw new Error(
      'Payload instance not initialized. Call setPayloadInstance() first or use getStylesFromDBWithPayload().'
    )
  }
  return payloadInstance
}

// ============================================
// DATABASE INTERFACE TYPE
// ============================================

/**
 * Style document from StyleTemplates collection
 */
interface StyleTemplateDoc {
  id: string
  styleId: string
  name: string
  positivePrompt: string
  negativePrompt: string
  sortOrder: number
  isSystem: boolean
}

// ============================================
// DATABASE FUNCTIONS
// ============================================

/**
 * Convert a StyleTemplates document to ImportedStyle format
 */
function docToImportedStyle(doc: StyleTemplateDoc): ImportedStyle {
  return {
    styleId: doc.styleId,
    name: doc.name,
    positivePrompt: doc.positivePrompt,
    negativePrompt: doc.negativePrompt || '',
    source: 'imported',
  }
}

/**
 * Fetch all styles from StyleTemplates collection in the database
 *
 * @param payload - PayloadCMS instance (optional, uses module instance if not provided)
 * @returns Array of ImportedStyle objects sorted by sortOrder (base first)
 */
export async function getStylesFromDB(payload?: Payload): Promise<ImportedStyle[]> {
  const pl = payload || getPayload()

  const result = await pl.find({
    collection: 'style-templates',
    limit: 0, // No limit - fetch all styles
    sort: 'sortOrder',
  })

  return (result.docs as unknown as StyleTemplateDoc[]).map(docToImportedStyle)
}

/**
 * Fetch all styles from database with a provided Payload instance
 * Use this when you have access to a Payload instance (e.g., in API routes, hooks)
 *
 * @param payload - PayloadCMS instance
 * @returns Array of ImportedStyle objects
 */
export async function getStylesFromDBWithPayload(payload: Payload): Promise<ImportedStyle[]> {
  return getStylesFromDB(payload)
}

/**
 * Fetch a single style by styleId from the database
 *
 * @param styleId - The style ID to find
 * @param payload - Optional PayloadCMS instance
 * @returns The ImportedStyle or undefined if not found
 */
export async function getStyleByIdFromDB(
  styleId: string,
  payload?: Payload
): Promise<ImportedStyle | undefined> {
  const pl = payload || getPayload()

  const result = await pl.find({
    collection: 'style-templates',
    where: {
      styleId: { equals: styleId },
    },
    limit: 1,
  })

  if (result.docs.length === 0) {
    return undefined
  }

  return docToImportedStyle(result.docs[0] as unknown as StyleTemplateDoc)
}

/**
 * Fetch multiple styles by their IDs from the database
 *
 * @param styleIds - Array of style IDs to find
 * @param payload - Optional PayloadCMS instance
 * @returns Array of found ImportedStyle objects (missing IDs are filtered out)
 */
export async function getStylesByIdsFromDB(
  styleIds: string[],
  payload?: Payload
): Promise<ImportedStyle[]> {
  if (styleIds.length === 0) return []

  const pl = payload || getPayload()

  const result = await pl.find({
    collection: 'style-templates',
    where: {
      styleId: { in: styleIds },
    },
    limit: styleIds.length,
  })

  return (result.docs as unknown as StyleTemplateDoc[]).map(docToImportedStyle)
}

// ============================================
// SYNCHRONOUS ACCESS FUNCTIONS (use cached data)
// ============================================

/**
 * Get all available styles, sorted with "base" first
 *
 * This is a synchronous function that returns cached styles.
 * Call refreshStyleCache() first to ensure cache is populated.
 *
 * @param forceReload - Deprecated, use refreshStyleCache() instead
 * @returns Array of all ImportedStyle objects (from cache)
 */
export function getAllStyles(_forceReload = false): ImportedStyle[] {
  if (!cachedStyles) {
    // Return fallback base style if cache not populated
    console.warn('[style-loader] Cache not populated. Call refreshStyleCache() first.')
    return [getDefaultStyleFallback()]
  }

  return cachedStyles
}

/**
 * Refresh the style cache from the database
 * Call this on server startup or when styles are updated
 *
 * @param payload - Optional PayloadCMS instance
 */
export async function refreshStyleCache(payload?: Payload): Promise<void> {
  cachedStyles = await getStylesFromDB(payload)
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
    return getDefaultStyleFallback()
  }

  return baseStyle
}

/**
 * Get fallback base style when cache is not available
 */
function getDefaultStyleFallback(): ImportedStyle {
  return {
    styleId: DEFAULT_STYLE_ID,
    name: DEFAULT_STYLE_NAME,
    positivePrompt: '{prompt}',
    negativePrompt: '',
    source: 'imported',
  }
}

/**
 * Get a specific style by ID (from cache)
 *
 * @param styleId - The style ID to find
 * @returns The ImportedStyle or undefined if not found
 */
export function getStyleById(styleId: string): ImportedStyle | undefined {
  const styles = getAllStyles()
  return styles.find((s) => s.styleId === styleId)
}

/**
 * Get multiple styles by their IDs (from cache)
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
 * Search styles by name (case-insensitive, from cache)
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
 * Get the total count of available styles (from cache)
 *
 * @returns Number of styles
 */
export function getStyleCount(): number {
  return getAllStyles().length
}

/**
 * Clear the cached styles (for testing or cache invalidation)
 */
export function clearStyleCache(): void {
  cachedStyles = null
}
