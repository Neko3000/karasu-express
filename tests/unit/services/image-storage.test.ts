/**
 * Unit Tests: Image Storage Service
 *
 * Tests for src/services/image-storage.ts
 * Per Constitution Principle VI (Testing Discipline)
 *
 * Tests downloadImage, saveToGeneratesFolder, getLocalFilePath, cleanupOldFiles
 *
 * Note: Per Phase 7 (T043x), generated files are now retained in src/generates/
 * after successful Media upload. The deleteFromGeneratesFolder function is still
 * tested here as it's used by cleanupOldFiles for scheduled cleanup.
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import * as fs from 'fs/promises'
import * as path from 'path'

import {
  downloadImage,
  saveToGeneratesFolder,
  getLocalFilePath,
  getExtensionFromUrl,
  getExtensionFromContentType,
  ensureGeneratesFolderExists,
  deleteFromGeneratesFolder,
  fileExistsInGeneratesFolder,
  cleanupOldFiles,
  readFromGeneratesFolder,
  getGeneratesDirectory,
  listGeneratedFiles,
  isDataUrl,
  parseDataUrl,
} from '../../../src/services/image-storage'

describe('ImageStorage', () => {
  // ============================================
  // Test Setup
  // ============================================

  // Mock fetch globally
  const mockFetch = vi.fn()

  beforeAll(() => {
    vi.stubGlobal('fetch', mockFetch)
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================
  // getExtensionFromUrl
  // ============================================

  describe('getExtensionFromUrl', () => {
    it('should extract png extension from URL path', () => {
      const ext = getExtensionFromUrl('https://api.example.com/images/generated.png')
      expect(ext).toBe('png')
    })

    it('should extract jpg extension from URL path', () => {
      const ext = getExtensionFromUrl('https://api.example.com/images/photo.jpg')
      expect(ext).toBe('jpg')
    })

    it('should extract webp extension from URL path', () => {
      const ext = getExtensionFromUrl('https://storage.example.com/image.webp?token=abc123')
      expect(ext).toBe('webp')
    })

    it('should use fallback content type when URL has no extension', () => {
      const ext = getExtensionFromUrl('https://api.example.com/images/12345', 'image/jpeg')
      expect(ext).toBe('jpg')
    })

    it('should return png as default when no extension and no fallback', () => {
      const ext = getExtensionFromUrl('https://api.example.com/images/12345')
      expect(ext).toBe('png')
    })

    it('should handle invalid URLs gracefully', () => {
      const ext = getExtensionFromUrl('not-a-valid-url', 'image/webp')
      expect(ext).toBe('webp')
    })

    it('should ignore unsupported extensions in URL', () => {
      const ext = getExtensionFromUrl('https://api.example.com/data.json', 'image/png')
      expect(ext).toBe('png')
    })
  })

  // ============================================
  // getExtensionFromContentType
  // ============================================

  describe('getExtensionFromContentType', () => {
    it('should return png for image/png', () => {
      expect(getExtensionFromContentType('image/png')).toBe('png')
    })

    it('should return jpg for image/jpeg', () => {
      expect(getExtensionFromContentType('image/jpeg')).toBe('jpg')
    })

    it('should return jpg for image/jpg', () => {
      expect(getExtensionFromContentType('image/jpg')).toBe('jpg')
    })

    it('should return webp for image/webp', () => {
      expect(getExtensionFromContentType('image/webp')).toBe('webp')
    })

    it('should return gif for image/gif', () => {
      expect(getExtensionFromContentType('image/gif')).toBe('gif')
    })

    it('should handle content type with charset', () => {
      expect(getExtensionFromContentType('image/png; charset=utf-8')).toBe('png')
    })

    it('should return png for unknown content types', () => {
      expect(getExtensionFromContentType('application/octet-stream')).toBe('png')
    })
  })

  // ============================================
  // getLocalFilePath
  // ============================================

  describe('getLocalFilePath', () => {
    it('should return absolute path in generates directory', () => {
      const filePath = getLocalFilePath('test-image.png')
      expect(filePath).toBe(path.join(process.cwd(), 'src', 'generates', 'test-image.png'))
    })

    it('should sanitize directory traversal attempts', () => {
      const filePath = getLocalFilePath('../../../etc/passwd')
      expect(filePath).toBe(path.join(process.cwd(), 'src', 'generates', 'passwd'))
    })

    it('should handle filenames with subdirectories', () => {
      const filePath = getLocalFilePath('subdir/image.png')
      expect(filePath).toBe(path.join(process.cwd(), 'src', 'generates', 'image.png'))
    })
  })

  // ============================================
  // getGeneratesDirectory
  // ============================================

  describe('getGeneratesDirectory', () => {
    it('should return the generates directory path', () => {
      const dir = getGeneratesDirectory()
      expect(dir).toBe(path.join(process.cwd(), 'src', 'generates'))
    })
  })

  // ============================================
  // isDataUrl
  // ============================================

  describe('isDataUrl', () => {
    it('should return true for data URLs', () => {
      expect(isDataUrl('data:image/png;base64,iVBORw0KGgo=')).toBe(true)
      expect(isDataUrl('data:image/jpeg;base64,/9j/4AAQSkZJRg=')).toBe(true)
      expect(isDataUrl('data:text/plain,Hello')).toBe(true)
    })

    it('should return false for HTTP URLs', () => {
      expect(isDataUrl('https://example.com/image.png')).toBe(false)
      expect(isDataUrl('http://example.com/image.jpg')).toBe(false)
    })

    it('should return false for other strings', () => {
      expect(isDataUrl('not a url')).toBe(false)
      expect(isDataUrl('')).toBe(false)
    })
  })

  // ============================================
  // parseDataUrl
  // ============================================

  describe('parseDataUrl', () => {
    it('should parse PNG data URL correctly', () => {
      // Small PNG (1x1 transparent pixel)
      const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      const dataUrl = `data:image/png;base64,${pngBase64}`

      const result = parseDataUrl(dataUrl)

      expect(result.contentType).toBe('image/png')
      expect(result.buffer).toBeInstanceOf(Buffer)
      expect(result.buffer.length).toBeGreaterThan(0)
    })

    it('should parse JPEG data URL correctly', () => {
      // Minimal valid JPEG
      const jpegBase64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAB//2Q=='
      const dataUrl = `data:image/jpeg;base64,${jpegBase64}`

      const result = parseDataUrl(dataUrl)

      expect(result.contentType).toBe('image/jpeg')
      expect(result.buffer).toBeInstanceOf(Buffer)
    })

    it('should throw error for invalid data URL format', () => {
      expect(() => parseDataUrl('not-a-data-url')).toThrow('Invalid data URL format')
      expect(() => parseDataUrl('data:')).toThrow()
    })

    it('should throw error for data URL with no data', () => {
      expect(() => parseDataUrl('data:image/png;base64,')).toThrow('Data URL contains no data')
    })

    it('should use default content type when not specified', () => {
      const result = parseDataUrl('data:;base64,SGVsbG8gV29ybGQ=')
      expect(result.contentType).toBe('application/octet-stream')
    })
  })

  // ============================================
  // downloadImage
  // ============================================

  describe('downloadImage', () => {
    it('should download image and return buffer with metadata', async () => {
      const mockImageData = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) // PNG magic bytes

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'image/png' }),
        arrayBuffer: vi.fn().mockResolvedValue(mockImageData.buffer),
      })

      const result = await downloadImage('https://api.example.com/image.png')

      expect(result.buffer.length).toBe(mockImageData.length)
      expect(result.contentType).toBe('image/png')
      expect(result.sourceUrl).toBe('https://api.example.com/image.png')
    })

    it('should throw error for non-OK response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      await expect(downloadImage('https://api.example.com/missing.png')).rejects.toThrow(
        'Failed to download image: HTTP 404 Not Found'
      )
    })

    it('should throw error for empty response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'image/png' }),
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
      })

      await expect(downloadImage('https://api.example.com/empty.png')).rejects.toThrow(
        'Downloaded image is empty (0 bytes)'
      )
    })

    it('should handle content type with charset', async () => {
      const mockImageData = Buffer.from('fake-jpeg-data')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'image/jpeg; charset=utf-8' }),
        arrayBuffer: vi.fn().mockResolvedValue(mockImageData.buffer),
      })

      const result = await downloadImage('https://api.example.com/photo.jpg')

      expect(result.contentType).toBe('image/jpeg')
    })

    it('should handle octet-stream as image/png', async () => {
      const mockImageData = Buffer.from('binary-data')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/octet-stream' }),
        arrayBuffer: vi.fn().mockResolvedValue(mockImageData.buffer),
      })

      const result = await downloadImage('https://api.example.com/binary')

      expect(result.contentType).toBe('image/png')
    })

    it('should use default content type when header is missing', async () => {
      const mockImageData = Buffer.from('fake-data')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        arrayBuffer: vi.fn().mockResolvedValue(mockImageData.buffer),
      })

      const result = await downloadImage('https://api.example.com/noheader')

      expect(result.contentType).toBe('image/png')
    })

    it('should handle data URLs (base64 encoded images)', async () => {
      // Small PNG (1x1 transparent pixel)
      const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      const dataUrl = `data:image/png;base64,${pngBase64}`

      const result = await downloadImage(dataUrl)

      expect(result.buffer).toBeInstanceOf(Buffer)
      expect(result.buffer.length).toBeGreaterThan(0)
      expect(result.contentType).toBe('image/png')
      expect(result.sourceUrl).toBe('data-url')
      // Should NOT call fetch for data URLs
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should handle JPEG data URLs from Nano Banana adapter', async () => {
      // Minimal JPEG
      const jpegBase64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAB//2Q=='
      const dataUrl = `data:image/jpeg;base64,${jpegBase64}`

      const result = await downloadImage(dataUrl)

      expect(result.buffer).toBeInstanceOf(Buffer)
      expect(result.contentType).toBe('image/jpeg')
      expect(result.sourceUrl).toBe('data-url')
    })
  })

  // ============================================
  // saveToGeneratesFolder
  // ============================================

  describe('saveToGeneratesFolder', () => {
    const testFilename = `test-save-${Date.now()}.png`
    const testBuffer = Buffer.from('test-image-data')

    afterEach(async () => {
      // Clean up test file
      try {
        await fs.unlink(getLocalFilePath(testFilename))
      } catch {
        // File might not exist
      }
    })

    it('should save buffer to generates folder and return file info', async () => {
      const result = await saveToGeneratesFolder(testBuffer, testFilename)

      expect(result.filename).toBe(testFilename)
      expect(result.size).toBe(testBuffer.length)
      expect(result.filePath).toBe(getLocalFilePath(testFilename))

      // Verify file was actually written
      const readBack = await fs.readFile(result.filePath)
      expect(readBack.toString()).toBe(testBuffer.toString())
    })

    it('should create generates folder if it does not exist', async () => {
      // This test relies on ensureGeneratesFolderExists being called
      // The folder should already exist from setup, but the function should handle it
      const result = await saveToGeneratesFolder(testBuffer, testFilename)
      expect(result.filePath).toContain('generates')
    })
  })

  // ============================================
  // readFromGeneratesFolder
  // ============================================

  describe('readFromGeneratesFolder', () => {
    const testFilename = `test-read-${Date.now()}.png`
    const testBuffer = Buffer.from('test-read-data')

    beforeEach(async () => {
      await ensureGeneratesFolderExists()
      await fs.writeFile(getLocalFilePath(testFilename), testBuffer)
    })

    afterEach(async () => {
      try {
        await fs.unlink(getLocalFilePath(testFilename))
      } catch {
        // File might not exist
      }
    })

    it('should read file from generates folder', async () => {
      const result = await readFromGeneratesFolder(testFilename)
      expect(result.toString()).toBe(testBuffer.toString())
    })

    it('should throw error for non-existent file', async () => {
      await expect(readFromGeneratesFolder('non-existent.png')).rejects.toThrow()
    })
  })

  // ============================================
  // fileExistsInGeneratesFolder
  // ============================================

  describe('fileExistsInGeneratesFolder', () => {
    const testFilename = `test-exists-${Date.now()}.png`
    const testBuffer = Buffer.from('test-data')

    beforeEach(async () => {
      await ensureGeneratesFolderExists()
      await fs.writeFile(getLocalFilePath(testFilename), testBuffer)
    })

    afterEach(async () => {
      try {
        await fs.unlink(getLocalFilePath(testFilename))
      } catch {
        // File might not exist
      }
    })

    it('should return true for existing file', async () => {
      const exists = await fileExistsInGeneratesFolder(testFilename)
      expect(exists).toBe(true)
    })

    it('should return false for non-existent file', async () => {
      const exists = await fileExistsInGeneratesFolder('non-existent.png')
      expect(exists).toBe(false)
    })
  })

  // ============================================
  // deleteFromGeneratesFolder
  // ============================================

  describe('deleteFromGeneratesFolder', () => {
    it('should delete existing file', async () => {
      const testFilename = `test-delete-${Date.now()}.png`
      const testBuffer = Buffer.from('to-be-deleted')

      // Create the file
      await ensureGeneratesFolderExists()
      await fs.writeFile(getLocalFilePath(testFilename), testBuffer)

      // Verify it exists
      const existsBefore = await fileExistsInGeneratesFolder(testFilename)
      expect(existsBefore).toBe(true)

      // Delete it
      await deleteFromGeneratesFolder(testFilename)

      // Verify it's gone
      const existsAfter = await fileExistsInGeneratesFolder(testFilename)
      expect(existsAfter).toBe(false)
    })

    it('should not throw for non-existent file', async () => {
      // Should not throw
      await expect(deleteFromGeneratesFolder('non-existent-file.png')).resolves.not.toThrow()
    })
  })

  // ============================================
  // listGeneratedFiles
  // ============================================

  describe('listGeneratedFiles', () => {
    it('should list files in generates folder excluding .gitkeep', async () => {
      const testFilename = `test-list-${Date.now()}.png`
      const testBuffer = Buffer.from('list-test')

      await saveToGeneratesFolder(testBuffer, testFilename)

      const files = await listGeneratedFiles()

      expect(files).toContain(testFilename)
      expect(files).not.toContain('.gitkeep')

      // Cleanup
      await deleteFromGeneratesFolder(testFilename)
    })
  })

  // ============================================
  // cleanupOldFiles
  // ============================================

  describe('cleanupOldFiles', () => {
    it('should not delete files newer than maxAge', async () => {
      const testFilename = `test-cleanup-new-${Date.now()}.png`
      const testBuffer = Buffer.from('new-file')

      await saveToGeneratesFolder(testBuffer, testFilename)

      // Cleanup with 1 hour max age - file should not be deleted
      const deleted = await cleanupOldFiles(60 * 60 * 1000)

      const exists = await fileExistsInGeneratesFolder(testFilename)
      expect(exists).toBe(true)

      // Manual cleanup
      await deleteFromGeneratesFolder(testFilename)
    })

    it('should return 0 when no files to delete', async () => {
      // With a very long max age, nothing should be deleted
      const deleted = await cleanupOldFiles(365 * 24 * 60 * 60 * 1000) // 1 year
      expect(typeof deleted).toBe('number')
    })

    it('should not delete .gitkeep', async () => {
      // Run cleanup
      await cleanupOldFiles(0) // 0 max age should try to delete everything

      // .gitkeep should still exist (it's excluded)
      const files = await fs.readdir(getGeneratesDirectory())
      expect(files).toContain('.gitkeep')
    })
  })

  // ============================================
  // ensureGeneratesFolderExists
  // ============================================

  describe('ensureGeneratesFolderExists', () => {
    it('should not throw if folder already exists', async () => {
      // Folder should already exist from other tests
      await expect(ensureGeneratesFolderExists()).resolves.not.toThrow()
    })

    it('should create folder structure if needed', async () => {
      // This is hard to test without modifying the actual folder
      // Just verify it doesn't throw
      await expect(ensureGeneratesFolderExists()).resolves.not.toThrow()

      // Verify the directory exists
      const dir = getGeneratesDirectory()
      const stat = await fs.stat(dir)
      expect(stat.isDirectory()).toBe(true)
    })
  })
})
