/**
 * Unit tests for format utilities.
 *
 * Tests formatFileSize and formatRelativeTime functions.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatFileSize, formatRelativeTime } from '@/lib/format'

describe('formatFileSize', () => {
  it('returns "0 B" for 0 bytes', () => {
    expect(formatFileSize(0)).toBe('0 B')
  })

  it('returns "0 B" for negative values', () => {
    expect(formatFileSize(-100)).toBe('0 B')
  })

  it('formats bytes correctly', () => {
    expect(formatFileSize(500)).toBe('500 B')
    expect(formatFileSize(1)).toBe('1 B')
  })

  it('formats kilobytes correctly', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB')
    expect(formatFileSize(1536)).toBe('1.5 KB')
    expect(formatFileSize(10240)).toBe('10.0 KB')
  })

  it('formats megabytes correctly', () => {
    expect(formatFileSize(1048576)).toBe('1.00 MB')
    expect(formatFileSize(1572864)).toBe('1.50 MB')
    expect(formatFileSize(5242880)).toBe('5.00 MB')
  })

  it('formats gigabytes correctly', () => {
    expect(formatFileSize(1073741824)).toBe('1.00 GB')
    expect(formatFileSize(2684354560)).toBe('2.50 GB')
  })
})

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-07T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('formats seconds ago', () => {
    const date = new Date('2026-02-07T11:59:30Z') // 30 seconds ago
    const result = formatRelativeTime(date)
    expect(result).toMatch(/30 seconds ago/)
  })

  it('formats minutes ago', () => {
    const date = new Date('2026-02-07T11:55:00Z') // 5 minutes ago
    const result = formatRelativeTime(date)
    expect(result).toMatch(/5 minutes ago/)
  })

  it('formats hours ago', () => {
    const date = new Date('2026-02-07T10:00:00Z') // 2 hours ago
    const result = formatRelativeTime(date)
    expect(result).toMatch(/2 hours ago/)
  })

  it('formats days ago', () => {
    const date = new Date('2026-02-04T12:00:00Z') // 3 days ago
    const result = formatRelativeTime(date)
    expect(result).toMatch(/3 days ago/)
  })

  it('accepts ISO string input', () => {
    const result = formatRelativeTime('2026-02-07T11:55:00Z')
    expect(result).toMatch(/5 minutes ago/)
  })

  it('handles "just now" for very recent timestamps', () => {
    const date = new Date('2026-02-07T11:59:58Z') // 2 seconds ago
    const result = formatRelativeTime(date)
    expect(result).toMatch(/2 seconds ago|now/)
  })
})
