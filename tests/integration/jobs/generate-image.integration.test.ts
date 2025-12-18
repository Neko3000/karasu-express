/**
 * Integration Tests: Generate Image Job
 *
 * Tests for src/jobs/generate-image.ts
 * Per Constitution Principle VI (Testing Discipline)
 *
 * Mock adapter, test subtask status, asset creation, progress updates
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SubTaskStatus, AspectRatio, ErrorCategory } from '../../../src/lib/types'

// Mock the adapter registry
vi.mock('../../../src/adapters', () => ({
  getAdapterOrThrow: vi.fn(),
}))

// Mock the error normalizer
vi.mock('../../../src/lib/error-normalizer', () => ({
  formatErrorForLog: vi.fn((error) => error.message || 'Unknown error'),
}))

// Import after mocks are set up
import { generateImageHandler, type GenerateImageJobInput } from '../../../src/jobs/generate-image'
import { getAdapterOrThrow } from '../../../src/adapters'

describe('Generate Image Job Integration', () => {
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
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockPayload = {
      findByID: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    }

    mockReq = { payload: mockPayload }

    mockAdapter = {
      generate: vi.fn(),
      normalizeError: vi.fn(),
      providerId: 'fal',
      modelId: 'flux-pro',
    }

    ;(getAdapterOrThrow as ReturnType<typeof vi.fn>).mockReturnValue(mockAdapter)
  })

  afterEach(() => {
    vi.restoreAllMocks()
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
    providerOptions: {},
    ...overrides,
  })

  const createMockSubTask = (overrides = {}) => ({
    id: 'subtask-123',
    parentTask: 'task-123',
    status: SubTaskStatus.Pending,
    styleId: 'ghibli',
    modelId: 'flux-pro',
    finalPrompt: 'a cat in the rain',
    batchIndex: 0,
    retryCount: 0,
    ...overrides,
  })

  const createMockGenerationResult = (overrides = {}) => ({
    images: [
      {
        url: 'https://example.com/generated-image.png',
        width: 1024,
        height: 1024,
        contentType: 'image/png',
      },
    ],
    seed: 12345,
    timing: { inference: 1500 },
    metadata: { raw: 'provider metadata' },
    ...overrides,
  })

  // ============================================
  // Status Transitions
  // ============================================

  describe('status transitions', () => {
    it('should transition subtask to processing at start', async () => {
      const input = createJobInput()
      mockPayload.update.mockResolvedValue({ id: 'subtask-123' })
      mockPayload.findByID.mockResolvedValue(createMockSubTask())
      mockPayload.create.mockResolvedValue({ id: 'media-123' })
      mockAdapter.generate.mockResolvedValue(createMockGenerationResult())

      await generateImageHandler({ input, req: mockReq })

      // First update should set status to processing
      expect(mockPayload.update).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'sub-tasks',
          id: 'subtask-123',
          data: expect.objectContaining({
            status: 'processing',
          }),
        })
      )
    })

    it('should set startedAt timestamp when processing begins', async () => {
      const input = createJobInput()
      mockPayload.update.mockResolvedValue({ id: 'subtask-123' })
      mockPayload.findByID.mockResolvedValue(createMockSubTask())
      mockPayload.create.mockResolvedValue({ id: 'media-123' })
      mockAdapter.generate.mockResolvedValue(createMockGenerationResult())

      await generateImageHandler({ input, req: mockReq })

      expect(mockPayload.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            startedAt: expect.any(String),
          }),
        })
      )
    })

    it('should transition subtask to success on successful generation', async () => {
      const input = createJobInput()
      mockPayload.update.mockResolvedValue({ id: 'subtask-123' })
      mockPayload.findByID.mockResolvedValue(createMockSubTask())
      mockPayload.create.mockResolvedValue({ id: 'media-123' })
      mockAdapter.generate.mockResolvedValue(createMockGenerationResult())

      await generateImageHandler({ input, req: mockReq })

      // Final update should set status to success
      const updateCalls = mockPayload.update.mock.calls
      const successCall = updateCalls.find(
        (call) => call[0].data?.status === 'success'
      )

      expect(successCall).toBeDefined()
      expect(successCall![0].data.completedAt).toBeDefined()
    })

    it('should transition subtask to failed on error after retries exhausted', async () => {
      const input = createJobInput()
      mockPayload.update.mockResolvedValue({ id: 'subtask-123' })
      mockPayload.findByID.mockResolvedValue(createMockSubTask({ retryCount: 3 }))

      mockAdapter.generate.mockRejectedValue(new Error('Generation failed'))
      mockAdapter.normalizeError.mockReturnValue({
        category: ErrorCategory.ProviderError,
        message: 'Provider error',
        retryable: true,
        originalError: new Error('Generation failed'),
      })

      await generateImageHandler({ input, req: mockReq })

      const updateCalls = mockPayload.update.mock.calls
      const failedCall = updateCalls.find(
        (call) => call[0].data?.status === 'failed'
      )

      expect(failedCall).toBeDefined()
    })

    it('should keep subtask pending for retry on retryable error', async () => {
      const input = createJobInput()
      mockPayload.update.mockResolvedValue({ id: 'subtask-123' })
      mockPayload.findByID.mockResolvedValue(createMockSubTask({ retryCount: 0 }))

      mockAdapter.generate.mockRejectedValue(new Error('Rate limited'))
      mockAdapter.normalizeError.mockReturnValue({
        category: ErrorCategory.RateLimited,
        message: 'Rate limited',
        retryable: true,
        originalError: new Error('Rate limited'),
      })

      // Should throw to trigger job retry mechanism
      await expect(
        generateImageHandler({ input, req: mockReq })
      ).rejects.toThrow()

      const updateCalls = mockPayload.update.mock.calls
      const pendingCall = updateCalls.find(
        (call) => call[0].data?.status === 'pending'
      )

      expect(pendingCall).toBeDefined()
      expect(pendingCall![0].data.retryCount).toBe(1)
    })
  })

  // ============================================
  // Request/Response Storage (Observability)
  // ============================================

  describe('observability', () => {
    it('should store request payload before generation', async () => {
      const input = createJobInput({
        finalPrompt: 'test prompt',
        negativePrompt: 'bad quality',
        aspectRatio: AspectRatio.Landscape,
        seed: 42,
      })
      mockPayload.update.mockResolvedValue({ id: 'subtask-123' })
      mockPayload.findByID.mockResolvedValue(createMockSubTask())
      mockPayload.create.mockResolvedValue({ id: 'media-123' })
      mockAdapter.generate.mockResolvedValue(createMockGenerationResult())

      await generateImageHandler({ input, req: mockReq })

      expect(mockPayload.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            requestPayload: expect.objectContaining({
              prompt: 'test prompt',
              negativePrompt: 'bad quality',
              aspectRatio: AspectRatio.Landscape,
              seed: 42,
            }),
          }),
        })
      )
    })

    it('should store response data after generation', async () => {
      const input = createJobInput()
      mockPayload.update.mockResolvedValue({ id: 'subtask-123' })
      mockPayload.findByID.mockResolvedValue(createMockSubTask())
      mockPayload.create.mockResolvedValue({ id: 'media-123' })
      mockAdapter.generate.mockResolvedValue(
        createMockGenerationResult({
          metadata: { custom: 'metadata' },
        })
      )

      await generateImageHandler({ input, req: mockReq })

      const updateCalls = mockPayload.update.mock.calls
      const responseCall = updateCalls.find(
        (call) => call[0].data?.responseData !== undefined
      )

      expect(responseCall).toBeDefined()
    })

    it('should store error log on failure', async () => {
      const input = createJobInput()
      mockPayload.update.mockResolvedValue({ id: 'subtask-123' })
      mockPayload.findByID.mockResolvedValue(createMockSubTask({ retryCount: 3 }))

      mockAdapter.generate.mockRejectedValue(new Error('Test error'))
      mockAdapter.normalizeError.mockReturnValue({
        category: ErrorCategory.Unknown,
        message: 'Test error',
        retryable: false,
        originalError: new Error('Test error'),
      })

      await generateImageHandler({ input, req: mockReq })

      expect(mockPayload.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            errorLog: expect.any(String),
            errorCategory: ErrorCategory.Unknown,
          }),
        })
      )
    })
  })

  // ============================================
  // Adapter Integration
  // ============================================

  describe('adapter integration', () => {
    it('should get correct adapter for model ID', async () => {
      const input = createJobInput({ modelId: 'dalle-3' })
      mockPayload.update.mockResolvedValue({ id: 'subtask-123' })
      mockPayload.findByID.mockResolvedValue(createMockSubTask())
      mockPayload.create.mockResolvedValue({ id: 'media-123' })
      mockAdapter.generate.mockResolvedValue(createMockGenerationResult())

      await generateImageHandler({ input, req: mockReq })

      expect(getAdapterOrThrow).toHaveBeenCalledWith('dalle-3')
    })

    it('should call adapter.generate with correct params', async () => {
      const input = createJobInput({
        finalPrompt: 'my prompt',
        negativePrompt: 'negative',
        aspectRatio: AspectRatio.Portrait,
        seed: 99,
        providerOptions: { custom: 'option' },
      })
      mockPayload.update.mockResolvedValue({ id: 'subtask-123' })
      mockPayload.findByID.mockResolvedValue(createMockSubTask())
      mockPayload.create.mockResolvedValue({ id: 'media-123' })
      mockAdapter.generate.mockResolvedValue(createMockGenerationResult())

      await generateImageHandler({ input, req: mockReq })

      expect(mockAdapter.generate).toHaveBeenCalledWith({
        prompt: 'my prompt',
        negativePrompt: 'negative',
        aspectRatio: AspectRatio.Portrait,
        seed: 99,
        providerOptions: { custom: 'option' },
      })
    })

    it('should use adapter.normalizeError for error handling', async () => {
      const input = createJobInput()
      const testError = new Error('Provider error')
      mockPayload.update.mockResolvedValue({ id: 'subtask-123' })
      mockPayload.findByID.mockResolvedValue(createMockSubTask({ retryCount: 3 }))

      mockAdapter.generate.mockRejectedValue(testError)
      mockAdapter.normalizeError.mockReturnValue({
        category: ErrorCategory.ContentFiltered,
        message: 'Content filtered',
        retryable: false,
        originalError: testError,
      })

      await generateImageHandler({ input, req: mockReq })

      expect(mockAdapter.normalizeError).toHaveBeenCalledWith(testError)
    })
  })

  // ============================================
  // Output
  // ============================================

  describe('job output', () => {
    it('should return success with image URL on success', async () => {
      const input = createJobInput()
      mockPayload.update.mockResolvedValue({ id: 'subtask-123' })
      mockPayload.findByID.mockResolvedValue(createMockSubTask())
      mockPayload.create.mockResolvedValue({ id: 'media-123' })
      mockAdapter.generate.mockResolvedValue(
        createMockGenerationResult({
          images: [{ url: 'https://example.com/image.png', width: 1024, height: 1024, contentType: 'image/png' }],
          seed: 54321,
        })
      )

      const result = await generateImageHandler({ input, req: mockReq })

      expect(result.output.success).toBe(true)
      expect(result.output.imageUrl).toBe('https://example.com/image.png')
      expect(result.output.seed).toBe(54321)
    })

    it('should return error details on failure', async () => {
      const input = createJobInput()
      mockPayload.update.mockResolvedValue({ id: 'subtask-123' })
      mockPayload.findByID.mockResolvedValue(createMockSubTask({ retryCount: 3 }))

      mockAdapter.generate.mockRejectedValue(new Error('Test failure'))
      mockAdapter.normalizeError.mockReturnValue({
        category: ErrorCategory.ProviderError,
        message: 'Provider error occurred',
        retryable: false,
        originalError: new Error('Test failure'),
      })

      const result = await generateImageHandler({ input, req: mockReq })

      expect(result.output.success).toBe(false)
      expect(result.output.error).toBeDefined()
      expect(result.output.errorCategory).toBe(ErrorCategory.ProviderError)
    })

    it('should handle no image returned from generation', async () => {
      const input = createJobInput()
      mockPayload.update.mockResolvedValue({ id: 'subtask-123' })
      mockPayload.findByID.mockResolvedValue(createMockSubTask({ retryCount: 3 }))

      mockAdapter.generate.mockResolvedValue({
        images: [], // No images
        seed: 0,
        metadata: {},
      })
      mockAdapter.normalizeError.mockReturnValue({
        category: ErrorCategory.Unknown,
        message: 'No image returned',
        retryable: false,
        originalError: new Error('No image'),
      })

      const result = await generateImageHandler({ input, req: mockReq })

      expect(result.output.success).toBe(false)
    })
  })

  // ============================================
  // Retry Logic
  // ============================================

  describe('retry logic', () => {
    it('should increment retry count on retryable error', async () => {
      const input = createJobInput()
      mockPayload.update.mockResolvedValue({ id: 'subtask-123' })
      mockPayload.findByID.mockResolvedValue(createMockSubTask({ retryCount: 1 }))

      mockAdapter.generate.mockRejectedValue(new Error('Rate limited'))
      mockAdapter.normalizeError.mockReturnValue({
        category: ErrorCategory.RateLimited,
        message: 'Rate limited',
        retryable: true,
        originalError: new Error('Rate limited'),
      })

      await expect(
        generateImageHandler({ input, req: mockReq })
      ).rejects.toThrow()

      expect(mockPayload.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            retryCount: 2,
          }),
        })
      )
    })

    it('should not retry on non-retryable error', async () => {
      const input = createJobInput()
      mockPayload.update.mockResolvedValue({ id: 'subtask-123' })
      mockPayload.findByID.mockResolvedValue(createMockSubTask({ retryCount: 0 }))

      mockAdapter.generate.mockRejectedValue(new Error('Content filtered'))
      mockAdapter.normalizeError.mockReturnValue({
        category: ErrorCategory.ContentFiltered,
        message: 'Content policy violation',
        retryable: false,
        originalError: new Error('Content filtered'),
      })

      const result = await generateImageHandler({ input, req: mockReq })

      // Should NOT throw (no retry)
      expect(result.output.success).toBe(false)

      // Should mark as failed directly
      expect(mockPayload.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'failed',
          }),
        })
      )
    })

    it('should mark as failed after max retries', async () => {
      const input = createJobInput()
      mockPayload.update.mockResolvedValue({ id: 'subtask-123' })
      mockPayload.findByID.mockResolvedValue(createMockSubTask({ retryCount: 2 })) // Already at 2

      mockAdapter.generate.mockRejectedValue(new Error('Rate limited'))
      mockAdapter.normalizeError.mockReturnValue({
        category: ErrorCategory.RateLimited,
        message: 'Rate limited',
        retryable: true,
        originalError: new Error('Rate limited'),
      })

      const result = await generateImageHandler({ input, req: mockReq })

      // Should NOT throw after max retries
      expect(result.output.success).toBe(false)

      // Should be marked as failed
      expect(mockPayload.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'failed',
          }),
        })
      )
    })
  })

  // ============================================
  // Logging
  // ============================================

  describe('logging', () => {
    let consoleLogSpy: ReturnType<typeof vi.spyOn>
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
      consoleLogSpy.mockRestore()
      consoleErrorSpy.mockRestore()
    })

    it('should log job start with subtask ID and model', async () => {
      const input = createJobInput({
        subTaskId: 'test-subtask',
        modelId: 'test-model',
      })
      mockPayload.update.mockResolvedValue({ id: 'test-subtask' })
      mockPayload.findByID.mockResolvedValue(createMockSubTask({ id: 'test-subtask' }))
      mockPayload.create.mockResolvedValue({ id: 'media-123' })
      mockAdapter.generate.mockResolvedValue(createMockGenerationResult())

      await generateImageHandler({ input, req: mockReq })

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[generate-image]')
      )
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('test-subtask')
      )
    })

    it('should log success on completion', async () => {
      const input = createJobInput({ subTaskId: 'success-subtask' })
      mockPayload.update.mockResolvedValue({ id: 'success-subtask' })
      mockPayload.findByID.mockResolvedValue(createMockSubTask({ id: 'success-subtask' }))
      mockPayload.create.mockResolvedValue({ id: 'media-123' })
      mockAdapter.generate.mockResolvedValue(createMockGenerationResult())

      await generateImageHandler({ input, req: mockReq })

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('success-subtask')
      )
    })

    it('should log errors on failure', async () => {
      const input = createJobInput()
      mockPayload.update.mockResolvedValue({ id: 'subtask-123' })
      mockPayload.findByID.mockResolvedValue(createMockSubTask({ retryCount: 3 }))

      mockAdapter.generate.mockRejectedValue(new Error('Test error'))
      mockAdapter.normalizeError.mockReturnValue({
        category: ErrorCategory.Unknown,
        message: 'Test error',
        retryable: false,
        originalError: new Error('Test error'),
      })

      await generateImageHandler({ input, req: mockReq })

      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })
})
