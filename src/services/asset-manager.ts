/**
 * Asset Manager Service
 *
 * Handles asset file naming, upload, and metadata management.
 * Generates standardized filenames for OSS storage.
 *
 * Per research.md Asset Naming Convention:
 * image_{timestamp}_{subject}_{style}_{model}_{index}.{ext}
 */

// ============================================
// TYPES
// ============================================

/**
 * Parameters for generating a filename
 */
export interface FilenameParams {
  /** Subject slug (English, lowercase, hyphenated) */
  subjectSlug: string
  /** Style ID */
  styleId: string
  /** Model ID */
  modelId: string
  /** Batch index (0-based) */
  batchIndex: number
  /** File extension (without dot) */
  extension: string
}

/**
 * Parsed filename components
 */
export interface ParsedFilename {
  /** Unix timestamp in seconds */
  timestamp: number
  /** Subject slug */
  subjectSlug: string
  /** Style ID */
  styleId: string
  /** Model ID */
  modelId: string
  /** Batch index (0-based) */
  batchIndex: number
  /** File extension */
  extension: string
}

// ============================================
// CONSTANTS
// ============================================

/** Maximum length for subject slug in filename */
const MAX_SUBJECT_SLUG_LENGTH = 50

/** Prefix for all generated image filenames */
const FILENAME_PREFIX = 'image'

/** Regex pattern for valid filename characters */
const VALID_CHARS_REGEX = /[^a-z0-9-]/g

/** Regex pattern for multiple consecutive hyphens */
const MULTIPLE_HYPHENS_REGEX = /-+/g

/** Regex pattern for parsing filenames */
const FILENAME_PARSE_REGEX = /^image_(\d+)_(.+)_(.+)_(.+)_(\d+)\.(\w+)$/

// ============================================
// SANITIZATION FUNCTIONS
// ============================================

/**
 * Sanitize a string for use in filenames
 *
 * - Converts to lowercase
 * - Removes special characters
 * - Replaces spaces with hyphens
 * - Collapses multiple hyphens
 * - Trims leading/trailing hyphens
 *
 * @param input - String to sanitize
 * @returns Sanitized string safe for filenames
 */
function sanitizeForFilename(input: string): string {
  if (!input || input.trim().length === 0) {
    return 'unknown'
  }

  return input
    .toLowerCase()
    .normalize('NFD') // Normalize unicode
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(VALID_CHARS_REGEX, '') // Remove invalid chars
    .replace(MULTIPLE_HYPHENS_REGEX, '-') // Collapse multiple hyphens
    .replace(/^-+|-+$/g, '') // Trim leading/trailing hyphens
    || 'unknown' // Fallback if empty after sanitization
}

/**
 * Truncate a string to a maximum length, preserving word boundaries
 *
 * @param input - String to truncate
 * @param maxLength - Maximum length
 * @returns Truncated string
 */
function truncateSlug(input: string, maxLength: number): string {
  if (input.length <= maxLength) {
    return input
  }

  // Cut at max length
  let truncated = input.substring(0, maxLength)

  // Remove trailing hyphen if present
  if (truncated.endsWith('-')) {
    truncated = truncated.slice(0, -1)
  }

  return truncated
}

// ============================================
// FILENAME GENERATION
// ============================================

/**
 * Generate a standardized filename for an asset
 *
 * Format: image_{timestamp}_{subject}_{style}_{model}_{index}.{ext}
 *
 * @param params - Filename parameters
 * @returns Generated filename
 *
 * @example
 * ```typescript
 * const filename = generateFilename({
 *   subjectSlug: 'cyberpunk-cat',
 *   styleId: 'ghibli',
 *   modelId: 'flux-pro',
 *   batchIndex: 0,
 *   extension: 'png'
 * });
 * // Returns: 'image_1702761234_cyberpunk-cat_ghibli_flux-pro_01.png'
 * ```
 */
export function generateFilename(params: FilenameParams): string {
  const {
    subjectSlug,
    styleId,
    modelId,
    batchIndex,
    extension,
  } = params

  // Get current timestamp in seconds
  const timestamp = Math.floor(Date.now() / 1000)

  // Sanitize all components
  const sanitizedSubject = truncateSlug(
    sanitizeForFilename(subjectSlug),
    MAX_SUBJECT_SLUG_LENGTH
  )
  const sanitizedStyle = sanitizeForFilename(styleId)
  const sanitizedModel = sanitizeForFilename(modelId)

  // Pad batch index (1-based in filename for human readability)
  const paddedIndex = String(batchIndex + 1).padStart(2, '0')

  // Sanitize extension (remove dot if present)
  const sanitizedExt = extension.replace(/^\./, '').toLowerCase()

  return `${FILENAME_PREFIX}_${timestamp}_${sanitizedSubject}_${sanitizedStyle}_${sanitizedModel}_${paddedIndex}.${sanitizedExt}`
}

// ============================================
// FILENAME PARSING
// ============================================

/**
 * Parse a filename back into its components
 *
 * @param filename - Filename to parse
 * @returns Parsed components or null if invalid format
 *
 * @example
 * ```typescript
 * const parsed = parseFilename('image_1702761234_cyberpunk-cat_ghibli_flux-pro_01.png');
 * // Returns: {
 * //   timestamp: 1702761234,
 * //   subjectSlug: 'cyberpunk-cat',
 * //   styleId: 'ghibli',
 * //   modelId: 'flux-pro',
 * //   batchIndex: 0,
 * //   extension: 'png'
 * // }
 * ```
 */
export function parseFilename(filename: string): ParsedFilename | null {
  const match = filename.match(FILENAME_PARSE_REGEX)

  if (!match) {
    return null
  }

  const [, timestamp, subjectSlug, styleId, modelId, index, extension] = match

  return {
    timestamp: parseInt(timestamp, 10),
    subjectSlug,
    styleId,
    modelId,
    batchIndex: parseInt(index, 10) - 1, // Convert back to 0-based
    extension,
  }
}

// ============================================
// CONTENT TYPE UTILITIES
// ============================================

/**
 * Get file extension from MIME type
 *
 * @param mimeType - MIME type string
 * @returns File extension
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
  }

  return mimeToExt[mimeType.toLowerCase()] || 'bin'
}

/**
 * Get MIME type from file extension
 *
 * @param extension - File extension (with or without dot)
 * @returns MIME type
 */
export function getMimeTypeFromExtension(extension: string): string {
  const ext = extension.replace(/^\./, '').toLowerCase()

  const extToMime: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    gif: 'image/gif',
    mp4: 'video/mp4',
    webm: 'video/webm',
  }

  return extToMime[ext] || 'application/octet-stream'
}

// ============================================
// ALT TEXT GENERATION
// ============================================

/**
 * Generate alt text for an asset
 *
 * @param subjectSlug - Subject slug
 * @param styleName - Style name
 * @param modelName - Model name
 * @returns Alt text string
 */
export function generateAltText(
  subjectSlug: string,
  styleName: string,
  modelName: string
): string {
  // Convert slug back to readable text
  const subject = subjectSlug.replace(/-/g, ' ')

  return `AI-generated image: ${subject} in ${styleName} style, created with ${modelName}`
}
