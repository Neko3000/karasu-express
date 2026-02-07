/**
 * Unit tests for clipboard utility.
 *
 * Tests navigator.clipboard API and textarea fallback.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { copyToClipboard } from '@/lib/clipboard'

describe('copyToClipboard', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('copies text using navigator.clipboard API', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(globalThis, 'navigator', {
      value: { clipboard: { writeText } },
      writable: true,
      configurable: true,
    })

    const result = await copyToClipboard('test text')

    expect(result).toBe(true)
    expect(writeText).toHaveBeenCalledWith('test text')
  })

  it('falls back to textarea when clipboard API fails', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        clipboard: {
          writeText: vi.fn().mockRejectedValue(new Error('Not allowed')),
        },
      },
      writable: true,
      configurable: true,
    })

    // Mock document methods for textarea fallback
    const mockTextarea = {
      value: '',
      setAttribute: vi.fn(),
      style: {} as CSSStyleDeclaration,
      select: vi.fn(),
    }
    const appendChild = vi.fn()
    const removeChild = vi.fn()
    const createElement = vi.fn().mockReturnValue(mockTextarea)
    const execCommand = vi.fn().mockReturnValue(true)

    Object.defineProperty(globalThis, 'document', {
      value: {
        createElement,
        execCommand,
        body: { appendChild, removeChild },
      },
      writable: true,
      configurable: true,
    })

    const result = await copyToClipboard('fallback text')

    expect(result).toBe(true)
    expect(createElement).toHaveBeenCalledWith('textarea')
    expect(mockTextarea.value).toBe('fallback text')
    expect(mockTextarea.select).toHaveBeenCalled()
    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(removeChild).toHaveBeenCalledWith(mockTextarea)
  })

  it('returns false when all methods fail', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        clipboard: {
          writeText: vi.fn().mockRejectedValue(new Error('Not allowed')),
        },
      },
      writable: true,
      configurable: true,
    })

    Object.defineProperty(globalThis, 'document', {
      value: {
        createElement: vi.fn().mockImplementation(() => {
          throw new Error('Cannot create element')
        }),
        body: { appendChild: vi.fn(), removeChild: vi.fn() },
      },
      writable: true,
      configurable: true,
    })

    const result = await copyToClipboard('will fail')
    expect(result).toBe(false)
  })

  it('returns false when navigator.clipboard is unavailable and document is undefined', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: {},
      writable: true,
      configurable: true,
    })

    // Temporarily remove document
    const origDocument = globalThis.document
    // @ts-expect-error - testing SSR scenario
    delete globalThis.document

    const result = await copyToClipboard('no clipboard')
    expect(result).toBe(false)

    // Restore
    globalThis.document = origDocument
  })
})
