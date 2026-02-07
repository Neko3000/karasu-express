/**
 * Unit tests for useViewPreference hook.
 *
 * Tests localStorage persistence for view mode preference.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useViewPreference } from '@/hooks/useViewPreference'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  }
})()

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true })

describe('useViewPreference', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('returns default value when localStorage is empty', () => {
    const { result } = renderHook(() => useViewPreference())
    expect(result.current.view).toBe('list')
  })

  it('uses custom default value', () => {
    const { result } = renderHook(() => useViewPreference('gallery'))
    expect(result.current.view).toBe('gallery')
  })

  it('reads stored value from localStorage on mount', async () => {
    localStorageMock.setItem('karasu-media-view-preference', 'gallery')

    const { result } = renderHook(() => useViewPreference())

    // Wait for useEffect to run
    await vi.waitFor(() => {
      expect(result.current.view).toBe('gallery')
    })
  })

  it('writes to localStorage when setView is called', () => {
    const { result } = renderHook(() => useViewPreference())

    act(() => {
      result.current.setView('gallery')
    })

    expect(result.current.view).toBe('gallery')
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'karasu-media-view-preference',
      'gallery'
    )
  })

  it('falls back to default for invalid stored value', async () => {
    localStorageMock.setItem('karasu-media-view-preference', 'invalid-value')

    const { result } = renderHook(() => useViewPreference())

    // useEffect runs, finds invalid value, stays with default
    await vi.waitFor(() => {
      expect(result.current.view).toBe('list')
    })
  })

  it('handles localStorage errors gracefully', () => {
    const errorStorage = {
      ...localStorageMock,
      getItem: vi.fn(() => {
        throw new Error('Access denied')
      }),
      setItem: vi.fn(() => {
        throw new Error('Access denied')
      }),
    }
    Object.defineProperty(globalThis, 'localStorage', { value: errorStorage, writable: true })

    const { result } = renderHook(() => useViewPreference())

    // Should not throw, just use default
    expect(result.current.view).toBe('list')

    // setView should still update state even if storage fails
    act(() => {
      result.current.setView('gallery')
    })
    expect(result.current.view).toBe('gallery')

    // Restore original mock
    Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true })
  })
})
