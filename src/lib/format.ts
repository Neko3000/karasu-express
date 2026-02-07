/**
 * Format a file size in bytes to a human-readable string.
 *
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  if (bytes < 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB']
  const k = 1024
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1)
  const size = bytes / Math.pow(k, i)

  // No decimals for bytes, 1 decimal for KB, 2 for MB+
  if (i === 0) return `${Math.round(size)} B`
  if (i === 1) return `${size.toFixed(1)} KB`
  return `${size.toFixed(2)} ${units[i]}`
}

/**
 * Format a date to a relative time string (e.g., "2 hours ago").
 *
 * Uses Intl.RelativeTimeFormat for localization.
 *
 * @param date - Date to format (Date object or ISO string)
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date | string): string {
  const target = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = target.getTime() - now.getTime()
  const diffSeconds = Math.round(diffMs / 1000)

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

  const absDiff = Math.abs(diffSeconds)

  if (absDiff < 60) {
    return rtf.format(diffSeconds, 'second')
  }

  const diffMinutes = Math.round(diffSeconds / 60)
  if (Math.abs(diffMinutes) < 60) {
    return rtf.format(diffMinutes, 'minute')
  }

  const diffHours = Math.round(diffSeconds / 3600)
  if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, 'hour')
  }

  const diffDays = Math.round(diffSeconds / 86400)
  return rtf.format(diffDays, 'day')
}
