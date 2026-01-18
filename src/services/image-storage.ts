/**
 * Image Storage Service
 *
 * Handles downloading generated images from external APIs and saving them
 * locally before uploading to PayloadCMS Media collection.
 *
 * Phase 7 (User Story 4): Bug fix for MissingFile error when creating Media documents.
 * The Media collection is configured as a PayloadCMS upload collection requiring actual file uploads.
 *
 * Flow:
 * 1. Download image from API response URL
 * 2. Save to src/generates/ folder temporarily
 * 3. Upload to PayloadCMS Media collection with proper file data
 */

import * as fs from 'fs/promises'
import * as path from 'path'

// ============================================
// TYPES
// ============================================

/**
 * Downloaded image data with metadata
 */
export interface DownloadedImage {
  /** Image data as Buffer */
  buffer: Buffer
  /** MIME type of the image */
  contentType: string
  /** Original URL the image was downloaded from */
  sourceUrl: string
}

/**
 * Saved file information
 */
export interface SavedFile {
  /** Absolute path to the saved file */
  filePath: string
  /** Filename (without directory) */
  filename: string
  /** Size in bytes */
  size: number
}

// ============================================
// CONSTANTS
// ============================================

/** Directory for storing downloaded images before upload */
const GENERATES_DIR = path.join(process.cwd(), 'src', 'generates')

/** Supported image MIME types */
const SUPPORTED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
])

/** Default timeout for image downloads (30 seconds) */
const DOWNLOAD_TIMEOUT_MS = 30000

// ============================================
// DIRECTORY MANAGEMENT
// ============================================

/**
 * Ensure the generates folder exists
 *
 * Creates the directory if it doesn't exist.
 * This is called before saving any files.
 */
export async function ensureGeneratesFolderExists(): Promise<void> {
  try {
    await fs.access(GENERATES_DIR)
  } catch {
    // Directory doesn't exist, create it
    await fs.mkdir(GENERATES_DIR, { recursive: true })
  }
}

/**
 * Get absolute path to a file in the generates folder
 *
 * @param filename - Filename (not path)
 * @returns Absolute path to the file
 */
export function getLocalFilePath(filename: string): string {
  // Sanitize filename to prevent directory traversal
  const sanitizedFilename = path.basename(filename)
  return path.join(GENERATES_DIR, sanitizedFilename)
}

/**
 * Get the generates directory path
 *
 * @returns Absolute path to generates directory
 */
export function getGeneratesDirectory(): string {
  return GENERATES_DIR
}

// ============================================
// URL UTILITIES
// ============================================

/**
 * Extract file extension from a URL
 *
 * Tries to get the extension from:
 * 1. URL path (e.g., /image.png)
 * 2. Content-Type header fallback
 *
 * @param url - URL to extract extension from
 * @param fallbackContentType - Fallback content type if URL doesn't have extension
 * @returns File extension (without dot)
 */
export function getExtensionFromUrl(url: string, fallbackContentType?: string): string {
  try {
    const parsedUrl = new URL(url)
    const pathname = parsedUrl.pathname
    const extMatch = pathname.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/)

    if (extMatch && extMatch[1]) {
      const ext = extMatch[1].toLowerCase()
      // Verify it's a valid image extension
      if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) {
        return ext
      }
    }
  } catch {
    // Invalid URL, fall through to content type
  }

  // Fall back to content type
  if (fallbackContentType) {
    return getExtensionFromContentType(fallbackContentType)
  }

  // Default to png
  return 'png'
}

/**
 * Get file extension from content type
 *
 * @param contentType - MIME type string
 * @returns File extension (without dot)
 */
export function getExtensionFromContentType(contentType: string): string {
  const typeMap: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
  }

  // Handle content type with charset, e.g., "image/png; charset=utf-8"
  const baseType = contentType.split(';')[0].trim().toLowerCase()
  return typeMap[baseType] || 'png'
}

// ============================================
// DATA URL UTILITIES
// ============================================

/**
 * Check if a string is a data URL
 *
 * @param url - URL to check
 * @returns True if it's a data URL
 */
export function isDataUrl(url: string): boolean {
  return url.startsWith('data:')
}

/**
 * Parse a data URL and extract the buffer and content type
 *
 * @param dataUrl - Data URL to parse (e.g., data:image/png;base64,...)
 * @returns Parsed data with buffer and content type
 * @throws Error if data URL is invalid
 */
export function parseDataUrl(dataUrl: string): { buffer: Buffer; contentType: string } {
  // Match data URL format: data:[<mediatype>][;base64],<data>
  const match = dataUrl.match(/^data:([^;,]+)?(?:;base64)?,(.*)$/)

  if (!match) {
    throw new Error('Invalid data URL format')
  }

  const contentType = match[1] || 'application/octet-stream'
  const base64Data = match[2]

  if (!base64Data) {
    throw new Error('Data URL contains no data')
  }

  // Decode base64 data
  const buffer = Buffer.from(base64Data, 'base64')

  if (buffer.length === 0) {
    throw new Error('Data URL decoded to empty buffer')
  }

  return { buffer, contentType }
}

// ============================================
// IMAGE DOWNLOAD
// ============================================

/**
 * Download an image from a remote URL or parse a data URL
 *
 * Supports both HTTP/HTTPS URLs and base64 data URLs.
 * For HTTP URLs, fetches the image and returns it as a Buffer.
 * For data URLs, extracts the base64 data directly.
 *
 * @param imageUrl - URL to download the image from (HTTP/HTTPS or data URL)
 * @returns Downloaded image data with metadata
 * @throws Error if download fails or content type is not supported
 *
 * @example
 * ```typescript
 * // HTTP URL
 * const image = await downloadImage('https://api.example.com/image.png');
 * console.log(image.contentType); // 'image/png'
 *
 * // Data URL (from Nano Banana adapter)
 * const image = await downloadImage('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...');
 * console.log(image.buffer.length); // 123456
 * ```
 */
export async function downloadImage(imageUrl: string): Promise<DownloadedImage> {
  // Handle data URLs (base64 encoded images from some APIs like Nano Banana)
  if (isDataUrl(imageUrl)) {
    console.log(`[image-storage] Processing data URL (base64 encoded image)`)

    const { buffer, contentType } = parseDataUrl(imageUrl)

    console.log(`[image-storage] Extracted ${buffer.length} bytes from data URL, content-type: ${contentType}`)

    return {
      buffer,
      contentType,
      sourceUrl: 'data-url',
    }
  }

  // Handle HTTP/HTTPS URLs
  console.log(`[image-storage] Downloading image from: ${imageUrl.substring(0, 100)}${imageUrl.length > 100 ? '...' : ''}`)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS)

  try {
    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'image/*',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to download image: HTTP ${response.status} ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type') || 'image/png'
    const baseContentType = contentType.split(';')[0].trim().toLowerCase()

    // Validate content type (be lenient - some APIs return octet-stream for images)
    if (!SUPPORTED_MIME_TYPES.has(baseContentType) && baseContentType !== 'application/octet-stream') {
      console.warn(`[image-storage] Unexpected content type: ${contentType}, proceeding anyway`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    if (buffer.length === 0) {
      throw new Error('Downloaded image is empty (0 bytes)')
    }

    console.log(`[image-storage] Downloaded ${buffer.length} bytes, content-type: ${contentType}`)

    return {
      buffer,
      contentType: baseContentType === 'application/octet-stream' ? 'image/png' : baseContentType,
      sourceUrl: imageUrl,
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

// ============================================
// FILE OPERATIONS
// ============================================

/**
 * Save an image buffer to the generates folder
 *
 * Creates the generates folder if it doesn't exist.
 * Returns the absolute path to the saved file.
 *
 * @param buffer - Image data as Buffer
 * @param filename - Filename to save as (will be sanitized)
 * @returns Information about the saved file
 *
 * @example
 * ```typescript
 * const saved = await saveToGeneratesFolder(imageBuffer, 'image_123_cat_ghibli_flux_01.png');
 * console.log(saved.filePath); // '/path/to/project/src/generates/image_123_cat_ghibli_flux_01.png'
 * ```
 */
export async function saveToGeneratesFolder(buffer: Buffer, filename: string): Promise<SavedFile> {
  // Ensure directory exists
  await ensureGeneratesFolderExists()

  // Get full path
  const filePath = getLocalFilePath(filename)

  // Write file
  await fs.writeFile(filePath, buffer)

  console.log(`[image-storage] Saved image to: ${filePath} (${buffer.length} bytes)`)

  return {
    filePath,
    filename: path.basename(filePath),
    size: buffer.length,
  }
}

/**
 * Read an image file from the generates folder
 *
 * @param filename - Filename to read
 * @returns Image data as Buffer
 * @throws Error if file doesn't exist
 */
export async function readFromGeneratesFolder(filename: string): Promise<Buffer> {
  const filePath = getLocalFilePath(filename)
  return fs.readFile(filePath)
}

/**
 * Delete a file from the generates folder
 *
 * Silently ignores if file doesn't exist.
 *
 * @param filename - Filename to delete
 */
export async function deleteFromGeneratesFolder(filename: string): Promise<void> {
  const filePath = getLocalFilePath(filename)
  try {
    await fs.unlink(filePath)
    console.log(`[image-storage] Deleted file: ${filePath}`)
  } catch (error) {
    // File might not exist, that's OK
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.warn(`[image-storage] Failed to delete file ${filePath}:`, error)
    }
  }
}

/**
 * Check if a file exists in the generates folder
 *
 * @param filename - Filename to check
 * @returns True if file exists
 */
export async function fileExistsInGeneratesFolder(filename: string): Promise<boolean> {
  const filePath = getLocalFilePath(filename)
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

// ============================================
// CLEANUP
// ============================================

/**
 * Clean up old files from the generates folder
 *
 * Deletes files older than the specified age.
 * This helps prevent disk space issues from accumulated temporary files.
 *
 * @param maxAgeMs - Maximum age in milliseconds (default: 24 hours)
 * @returns Number of files deleted
 */
export async function cleanupOldFiles(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<number> {
  let deletedCount = 0

  try {
    await ensureGeneratesFolderExists()
    const files = await fs.readdir(GENERATES_DIR)
    const now = Date.now()

    for (const file of files) {
      // Skip .gitkeep
      if (file === '.gitkeep') continue

      const filePath = path.join(GENERATES_DIR, file)
      try {
        const stat = await fs.stat(filePath)
        const age = now - stat.mtimeMs

        if (age > maxAgeMs) {
          await fs.unlink(filePath)
          deletedCount++
          console.log(`[image-storage] Cleaned up old file: ${file}`)
        }
      } catch (error) {
        console.warn(`[image-storage] Error checking file ${file}:`, error)
      }
    }
  } catch (error) {
    console.warn(`[image-storage] Error during cleanup:`, error)
  }

  return deletedCount
}

/**
 * Get list of all files in the generates folder
 *
 * @returns Array of filenames (excluding .gitkeep)
 */
export async function listGeneratedFiles(): Promise<string[]> {
  try {
    await ensureGeneratesFolderExists()
    const files = await fs.readdir(GENERATES_DIR)
    return files.filter((f) => f !== '.gitkeep')
  } catch {
    return []
  }
}
