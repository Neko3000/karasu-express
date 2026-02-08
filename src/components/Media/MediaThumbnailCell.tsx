'use client'

/**
 * MediaThumbnailCell Component
 *
 * Custom Cell component for the Media collection list view that displays
 * a thumbnail with an enlarged hover preview overlay.
 *
 * Features:
 * - Displays thumbnail in list row (40×40)
 * - Shows enlarged preview on hover using the 'card' image size (768x1024)
 * - Metadata overlay on preview (dimensions, format, model)
 * - 100ms debounce on hover to prevent flash on quick mouse movements
 * - Keyboard accessible (tabIndex, Enter/Space to toggle preview)
 * - Smooth fade-in/fade-out transition
 * - Smart positioning to avoid screen edge overflow
 */

import React, { useState, useRef, useCallback, useEffect } from 'react'
import styles from './MediaThumbnailCell.module.css'
import type { MediaDocument } from './types'

// ============================================
// TYPES
// ============================================

interface MediaThumbnailCellProps {
  cellData?: string
  rowData?: MediaDocument
}

// ============================================
// CONSTANTS
// ============================================

const PREVIEW_WIDTH = 400
const PREVIEW_MAX_HEIGHT = 533 // 400 * (1024/768) for card aspect ratio
const SCREEN_EDGE_PADDING = 16
const HOVER_DEBOUNCE_MS = 100

// ============================================
// HELPERS
// ============================================

/** Extract short format string from mimeType (e.g., "image/png" → "PNG") */
function extractFormat(mimeType?: string): string {
  if (!mimeType) return 'N/A'
  const parts = mimeType.split('/')
  return (parts[1] || 'N/A').toUpperCase()
}

// ============================================
// COMPONENT
// ============================================

export const MediaThumbnailCell: React.FC<MediaThumbnailCellProps> = ({ cellData: _cellData, rowData: data }) => {
  const [showPreview, setShowPreview] = useState(false)
  const [previewPosition, setPreviewPosition] = useState({ top: 0, left: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)
  const cellRef = useRef<HTMLDivElement>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Get thumbnail URL (use sizes.thumbnail or thumbnailURL or url)
  const thumbnailUrl =
    data?.sizes?.thumbnail?.url || data?.thumbnailURL || data?.url || ''

  // Get card URL for hover preview (use sizes.card or url)
  const cardUrl = data?.sizes?.card?.url || data?.url || ''

  // Metadata for overlay
  const dimensions = data?.width && data?.height ? `${data.width}×${data.height}` : null
  const format = extractFormat(data?.mimeType)
  const modelId = data?.generationMeta?.modelId || 'N/A'

  // Calculate optimal preview position to avoid screen overflow
  const calculatePreviewPosition = useCallback(() => {
    if (!cellRef.current) return

    const rect = cellRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let top = rect.top
    let left = rect.right + 12 // 12px gap from thumbnail

    // Check right edge overflow - position to left if needed
    if (left + PREVIEW_WIDTH + SCREEN_EDGE_PADDING > viewportWidth) {
      left = rect.left - PREVIEW_WIDTH - 12
    }

    // Check left edge - if still overflowing, center horizontally
    if (left < SCREEN_EDGE_PADDING) {
      left = Math.max(SCREEN_EDGE_PADDING, (viewportWidth - PREVIEW_WIDTH) / 2)
    }

    // Check bottom edge overflow
    if (top + PREVIEW_MAX_HEIGHT + SCREEN_EDGE_PADDING > viewportHeight) {
      top = Math.max(SCREEN_EDGE_PADDING, viewportHeight - PREVIEW_MAX_HEIGHT - SCREEN_EDGE_PADDING)
    }

    // Check top edge
    if (top < SCREEN_EDGE_PADDING) {
      top = SCREEN_EDGE_PADDING
    }

    setPreviewPosition({ top, left })
  }, [])

  // Open preview (shared by mouse and keyboard)
  const openPreview = useCallback(() => {
    if (cardUrl) {
      calculatePreviewPosition()
      setShowPreview(true)
    }
  }, [cardUrl, calculatePreviewPosition])

  // Close preview (shared by mouse and keyboard)
  const closePreview = useCallback(() => {
    setShowPreview(false)
    setImageLoaded(false)
  }, [])

  // Handle mouse enter with debounce
  const handleMouseEnter = useCallback(() => {
    debounceTimerRef.current = setTimeout(() => {
      openPreview()
    }, HOVER_DEBOUNCE_MS)
  }, [openPreview])

  // Handle mouse leave — cancel debounce and close
  const handleMouseLeave = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    closePreview()
  }, [closePreview])

  // Keyboard handler — Enter/Space to toggle preview
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        if (showPreview) {
          closePreview()
        } else {
          openPreview()
        }
      } else if (e.key === 'Escape') {
        closePreview()
      }
    },
    [showPreview, openPreview, closePreview],
  )

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // Recalculate position on scroll
  useEffect(() => {
    if (showPreview) {
      const handleScroll = () => calculatePreviewPosition()
      window.addEventListener('scroll', handleScroll, true)
      return () => window.removeEventListener('scroll', handleScroll, true)
    }
  }, [showPreview, calculatePreviewPosition])

  // Handle image load for fade-in effect
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true)
  }, [])

  // If no thumbnail URL, show placeholder
  if (!thumbnailUrl) {
    return (
      <div className={styles.placeholder}>
        <span className={styles.placeholderText}>No image</span>
      </div>
    )
  }

  return (
    <div
      ref={cellRef}
      className={styles.container}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Preview ${data?.filename || 'media'}`}
    >
      {/* Thumbnail */}
      <img
        src={thumbnailUrl}
        alt={data?.filename || 'Media thumbnail'}
        className={styles.thumbnail}
        loading="lazy"
      />

      {/* Hover Preview Overlay */}
      {showPreview && cardUrl && (
        <div
          className={`${styles.previewOverlay} ${imageLoaded ? styles.visible : ''}`}
          style={{
            top: previewPosition.top,
            left: previewPosition.left,
          }}
        >
          <img
            src={cardUrl}
            alt={data?.filename || 'Media preview'}
            className={styles.previewImage}
            onLoad={handleImageLoad}
          />
          {!imageLoaded && (
            <div className={styles.loadingIndicator}>
              <span className={styles.loadingSpinner} />
            </div>
          )}

          {/* Metadata Overlay */}
          {imageLoaded && (
            <div className={styles.metadataOverlay}>
              {dimensions && <span>{dimensions}</span>}
              <span>{format}</span>
              <span>{modelId}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MediaThumbnailCell
