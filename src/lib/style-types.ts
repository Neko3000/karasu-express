/**
 * Imported Style Types
 *
 * Type definitions for style prompts imported from external JSON files.
 * Matches the schema of src/resources/style-list/sdxl_styles_exp.json
 */

// ============================================
// RAW JSON STYLE (from file)
// ============================================

/**
 * Raw style format as stored in the JSON file
 * Matches the sdxl_styles_exp.json schema
 */
export interface RawImportedStyle {
  /** Style name (display name and identifier) */
  name: string
  /** Prompt template containing {prompt} placeholder */
  prompt: string
  /** Negative prompt additions */
  negative_prompt: string
}

// ============================================
// NORMALIZED STYLE
// ============================================

/**
 * Normalized imported style for application use
 * Converts snake_case to camelCase and adds computed fields
 */
export interface ImportedStyle {
  /** Unique identifier derived from name (lowercase, hyphens) */
  styleId: string
  /** Display name */
  name: string
  /** Positive prompt template (must contain {prompt}) */
  positivePrompt: string
  /** Negative prompt additions */
  negativePrompt: string
  /** Source indicator */
  source: 'imported'
}

// ============================================
// STYLE RESPONSE
// ============================================

/**
 * API response for styles endpoint
 */
export interface StylesResponse {
  /** Total count of available styles */
  count: number
  /** Default style ID */
  defaultStyleId: string
  /** Array of all styles */
  styles: ImportedStyle[]
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Generate a styleId from a style name
 * Converts to lowercase and replaces spaces/special chars with hyphens
 *
 * @param name - The style name to convert
 * @returns A URL-safe style identifier
 *
 * @example
 * generateStyleId('3D Model') // '3d-model'
 * generateStyleId('Abstract Expressionism 2') // 'abstract-expressionism-2'
 */
export function generateStyleId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Convert a raw imported style to a normalized ImportedStyle
 *
 * @param raw - Raw style from JSON file
 * @returns Normalized ImportedStyle
 */
export function normalizeImportedStyle(raw: RawImportedStyle): ImportedStyle {
  return {
    styleId: generateStyleId(raw.name),
    name: raw.name,
    positivePrompt: raw.prompt,
    negativePrompt: raw.negative_prompt,
    source: 'imported',
  }
}

/**
 * Type guard to check if a value is a valid RawImportedStyle
 */
export function isRawImportedStyle(value: unknown): value is RawImportedStyle {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const obj = value as Record<string, unknown>
  return (
    typeof obj.name === 'string' &&
    typeof obj.prompt === 'string' &&
    typeof obj.negative_prompt === 'string'
  )
}

/**
 * Type guard to check if a value is a valid ImportedStyle
 */
export function isImportedStyle(value: unknown): value is ImportedStyle {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const obj = value as Record<string, unknown>
  return (
    typeof obj.styleId === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.positivePrompt === 'string' &&
    typeof obj.negativePrompt === 'string' &&
    obj.source === 'imported'
  )
}
