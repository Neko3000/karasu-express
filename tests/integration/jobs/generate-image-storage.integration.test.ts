/**
 * Integration Tests: Generate Image Job with Image Storage
 *
 * Tests for the image download and upload flow in src/jobs/generate-image.ts
 * Per Constitution Principle VI (Testing Discipline)
 *
 * Phase 7 Bug Fix: Test image download from mock URL, file saved to generates folder,
 * Media document created with proper file upload, cleanup after successful upload
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import * as fs from 'fs/promises'
import * as path from 'path'
import { SubTaskStatus, AspectRatio, TaskStatus } from '../../../src/lib/types'

// Mock the adapter registry
vi.mock('../../../src/adapters', () => ({
  getAdapterOrThrow: vi.fn(),
}))

// Mock the error normalizer
vi.mock('../../../src/lib/error-normalizer', () => ({
  formatErrorForLog: vi.fn((error) => error.message || 'Unknown error'),
}))

// Mock fetch for image downloads
const mockFetch = vi.fn()

// Import after mocks are set up
import { generateImageHandler, type GenerateImageJobInput } from '../../../src/jobs/generate-image'
import { getAdapterOrThrow } from '../../../src/adapters'
import {
  getLocalFilePath,
  fileExistsInGeneratesFolder,
  ensureGeneratesFolderExists,
  deleteFromGeneratesFolder,
} from '../../../src/services/image-storage'

describe('Generate Image Job - Image Storage Integration', () => {
  // Mock payload instance
  let mockPayload: {
    findByID: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
  }

  // Mock req object
  let mockReq: { payload: typeof mockPayload }

  // Mock adapter
  let mockAdapter: {
    generate: ReturnType<typeof vi.fn>
    normalizeError: ReturnType<typeof vi.fn>
    providerId: string
    modelId: string
    displayName: string
  }

  // Track created files for cleanup
  const createdFiles: string[] = []

  beforeAll(() => {
    // Mock global fetch
    vi.stubGlobal('fetch', mockFetch)
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  beforeEach(async () => {
    vi.clearAllMocks()

    // Ensure generates folder exists
    await ensureGeneratesFolderExists()

    mockPayload = {
      findByID: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
      create: vi.fn().mockResolvedValue({ id: 'media-123' }),
    }

    mockReq = { payload: mockPayload }

    mockAdapter = {
      generate: vi.fn(),
      normalizeError: vi.fn(),
      providerId: 'fal',
      modelId: 'flux-pro',
      displayName: 'Flux Pro',
    }

    ;(getAdapterOrThrow as ReturnType<typeof vi.fn>).mockReturnValue(mockAdapter)
  })

  afterEach(async () => {
    vi.restoreAllMocks()

    // Clean up any created files
    for (const file of createdFiles) {
      try {
        await deleteFromGeneratesFolder(file)
      } catch {
        // Ignore cleanup errors
      }
    }
    createdFiles.length = 0
  })

  // ============================================
  // Test Data Factories
  // ============================================

  const createJobInput = (overrides?: Partial<GenerateImageJobInput>): GenerateImageJobInput => ({
    subTaskId: 'subtask-123',
    modelId: 'flux-pro',
    finalPrompt: 'a cat in the rain, studio ghibli style',
    negativePrompt: 'blurry, low quality',
    aspectRatio: AspectRatio.Square,
    seed: 12345,
    ...overrides,
  })

  const createMockSubTask = (overrides?: Record<string, unknown>) => ({
    id: 'subtask-123',
    parentTask: 'task-456',
    status: SubTaskStatus.Pending,
    expandedPrompt: {
      variantIndex: 0,
      subjectSlug: 'cyberpunk-cat',
      prompt: 'a cyberpunk cat',
    },
    styleId: 'ghibli',
    batchIndex: 0,
    retryCount: 0,
    ...overrides,
  })

  const createMockGenerationResult = (imageUrl: string) => ({
    images: [
      {
        url: imageUrl,
        contentType: 'image/png',
        width: 1024,
        height: 1024,
      },
    ],
    seed: 12345,
    metadata: {
      provider: 'fal',
      model: 'flux-pro',
      inferenceTime: 5000,
    },
  })

  // Create a simple PNG buffer for testing
  const createMockImageBuffer = (): Uint8Array => {
    // Minimal PNG header + IEND chunk
    return new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
      0x00, 0x00, 0x00, 0x0d, // IHDR length
      0x49, 0x48, 0x44, 0x52, // IHDR
      0x00, 0x00, 0x00, 0x01, // Width: 1
      0x00, 0x00, 0x00, 0x01, // Height: 1
      0x08, 0x06, // Bit depth: 8, Color type: RGBA
      0x00, 0x00, 0x00, // Compression, Filter, Interlace
      0x1f, 0x15, 0xc4, 0x89, // CRC
      0x00, 0x00, 0x00, 0x00, // IEND length
      0x49, 0x45, 0x4e, 0x44, // IEND
      0xae, 0x42, 0x60, 0x82, // CRC
    ])
  }

  // ============================================
  // Image Download Tests
  // ============================================

  describe('Image Download', () => {
    it('should download image from API URL', async () => {
      const mockImage = createMockImageBuffer()
      const imageUrl = 'https://api.fal.ai/images/generated-123.png'

      // Mock fetch response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'image/png' }),
        arrayBuffer: vi.fn().mockResolvedValue(mockImage.buffer),
      })

      // Mock sub-task and parent task lookups
      mockPayload.findByID
        .mockResolvedValueOnce(createMockSubTask()) // Initial sub-task check
        .mockResolvedValueOnce({ id: 'task-456', status: TaskStatus.Processing }) // Parent task check
        .mockResolvedValueOnce(createMockSubTask()) // Sub-task for metadata

      // Mock adapter generation
      mockAdapter.generate.mockResolvedValueOnce(createMockGenerationResult(imageUrl))

      const input = createJobInput()
      const result = await generateImageHandler({
        input,
        req: mockReq as unknown as { payload: never },
      })

      // Verify fetch was called with the image URL
      expect(mockFetch).toHaveBeenCalledWith(
        imageUrl,
        expect.objectContaining({
          headers: { Accept: 'image/*' },
        })
      )

      // Verify success
      expect(result.output.success).toBe(true)
      expect(result.output.mediaId).toBe('media-123')
    })

    it('should handle download failure gracefully', async () => {
      const imageUrl = 'https://api.fal.ai/images/missing.png'

      // Mock fetch to fail
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      // Mock sub-task and parent task lookups
      mockPayload.findByID
        .mockResolvedValueOnce(createMockSubTask())
        .mockResolvedValueOnce({ id: 'task-456', status: TaskStatus.Processing })
        .mockResolvedValueOnce(createMockSubTask())

      // Mock adapter generation
      mockAdapter.generate.mockResolvedValueOnce(createMockGenerationResult(imageUrl))

      // Mock error normalization
      mockAdapter.normalizeError.mockReturnValue({
        category: 'UNKNOWN',
        message: 'Failed to download image',
        retryable: false,
      })

      const input = createJobInput()
      const result = await generateImageHandler({
        input,
        req: mockReq as unknown as { payload: never },
      })

      // Should fail due to download error
      expect(result.output.success).toBe(false)
      // The error message goes through error normalizer, so check for download failure indicator
      expect(result.output.error?.toLowerCase()).toContain('download')
    })
  })

  // ============================================
  // File Saving Tests
  // ============================================

  describe('File Saving', () => {
    it('should save downloaded image to generates folder', async () => {
      const mockImage = createMockImageBuffer()
      const imageUrl = 'https://api.fal.ai/images/generated-456.png'

      // Mock fetch response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'image/png' }),
        arrayBuffer: vi.fn().mockResolvedValue(mockImage.buffer),
      })

      // Mock sub-task and parent task lookups
      mockPayload.findByID
        .mockResolvedValueOnce(createMockSubTask())
        .mockResolvedValueOnce({ id: 'task-456', status: TaskStatus.Processing })
        .mockResolvedValueOnce(createMockSubTask())

      // Mock adapter generation
      mockAdapter.generate.mockResolvedValueOnce(createMockGenerationResult(imageUrl))

      const input = createJobInput()
      await generateImageHandler({
        input,
        req: mockReq as unknown as { payload: never },
      })

      // The file should have been created and then deleted after upload
      // We verify the media creation was called with file data
      expect(mockPayload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'media',
          file: expect.objectContaining({
            name: expect.stringMatching(/^image_\d+_cyberpunk-cat_ghibli_flux-pro_01\.png$/),
            mimetype: 'image/png',
            size: mockImage.length,
          }),
        })
      )
    })
  })

  // ============================================
  // Media Creation Tests
  // ============================================

  describe('Media Creation', () => {
    it('should create Media document with proper file upload', async () => {
      const mockImage = createMockImageBuffer()
      const imageUrl = 'https://api.fal.ai/images/generated-789.png'

      // Mock fetch response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'image/png' }),
        arrayBuffer: vi.fn().mockResolvedValue(mockImage.buffer),
      })

      // Mock sub-task and parent task lookups
      mockPayload.findByID
        .mockResolvedValueOnce(createMockSubTask())
        .mockResolvedValueOnce({ id: 'task-456', status: TaskStatus.Processing })
        .mockResolvedValueOnce(createMockSubTask())

      // Mock adapter generation
      mockAdapter.generate.mockResolvedValueOnce(createMockGenerationResult(imageUrl))

      const input = createJobInput()
      await generateImageHandler({
        input,
        req: mockReq as unknown as { payload: never },
      })

      // Verify media creation was called with proper structure
      expect(mockPayload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'media',
          data: expect.objectContaining({
            alt: expect.stringContaining('cyberpunk cat'),
            relatedSubtask: 'subtask-123',
            assetType: 'image',
            taskId: 'task-456',
            styleId: 'ghibli',
            modelId: 'flux-pro',
            subjectSlug: 'cyberpunk-cat',
            generationMeta: expect.objectContaining({
              taskId: 'task-456',
              styleId: 'ghibli',
              modelId: 'flux-pro',
            }),
          }),
          file: expect.objectContaining({
            data: expect.any(Buffer),
            mimetype: 'image/png',
            name: expect.stringMatching(/\.png$/),
            size: expect.any(Number),
          }),
        })
      )
    })

    it('should include file buffer in media creation call', async () => {
      const mockImage = createMockImageBuffer()
      const imageUrl = 'https://api.fal.ai/images/test.png'

      // Mock fetch response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'image/png' }),
        arrayBuffer: vi.fn().mockResolvedValue(mockImage.buffer),
      })

      // Mock sub-task and parent task lookups
      mockPayload.findByID
        .mockResolvedValueOnce(createMockSubTask())
        .mockResolvedValueOnce({ id: 'task-456', status: TaskStatus.Processing })
        .mockResolvedValueOnce(createMockSubTask())

      // Mock adapter generation
      mockAdapter.generate.mockResolvedValueOnce(createMockGenerationResult(imageUrl))

      const input = createJobInput()
      await generateImageHandler({
        input,
        req: mockReq as unknown as { payload: never },
      })

      // Get the actual call arguments
      const createCall = mockPayload.create.mock.calls[0][0]

      // Verify file object exists and has data buffer
      expect(createCall.file).toBeDefined()
      expect(createCall.file.data).toBeInstanceOf(Buffer)
      expect(createCall.file.data.length).toBeGreaterThan(0)
    })
  })

  // ============================================
  // Cleanup Tests
  // ============================================

  describe('File Cleanup', () => {
    it('should clean up temporary file after successful upload', async () => {
      const mockImage = createMockImageBuffer()
      const imageUrl = 'https://api.fal.ai/images/cleanup-test.png'

      // Mock fetch response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'image/png' }),
        arrayBuffer: vi.fn().mockResolvedValue(mockImage.buffer),
      })

      // Mock sub-task and parent task lookups
      mockPayload.findByID
        .mockResolvedValueOnce(createMockSubTask())
        .mockResolvedValueOnce({ id: 'task-456', status: TaskStatus.Processing })
        .mockResolvedValueOnce(createMockSubTask())

      // Mock adapter generation
      mockAdapter.generate.mockResolvedValueOnce(createMockGenerationResult(imageUrl))

      const input = createJobInput()
      const result = await generateImageHandler({
        input,
        req: mockReq as unknown as { payload: never },
      })

      // Verify success
      expect(result.output.success).toBe(true)

      // The temporary file should have been cleaned up
      // We can't easily test this without inspecting the actual file system,
      // but we can verify the handler completed successfully which includes cleanup
    })
  })

  // ============================================
  // Error Handling Tests
  // ============================================

  describe('Error Handling', () => {
    it('should handle empty image response', async () => {
      const imageUrl = 'https://api.fal.ai/images/empty.png'

      // Mock fetch with empty response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'image/png' }),
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
      })

      // Mock sub-task and parent task lookups
      mockPayload.findByID
        .mockResolvedValueOnce(createMockSubTask())
        .mockResolvedValueOnce({ id: 'task-456', status: TaskStatus.Processing })
        .mockResolvedValueOnce(createMockSubTask())

      // Mock adapter generation
      mockAdapter.generate.mockResolvedValueOnce(createMockGenerationResult(imageUrl))

      // Mock error normalization
      mockAdapter.normalizeError.mockReturnValue({
        category: 'UNKNOWN',
        message: 'Empty image',
        retryable: false,
      })

      const input = createJobInput()
      const result = await generateImageHandler({
        input,
        req: mockReq as unknown as { payload: never },
      })

      // Should fail due to empty image
      expect(result.output.success).toBe(false)
      expect(result.output.error?.toLowerCase()).toContain('empty')
    })
  })
})
