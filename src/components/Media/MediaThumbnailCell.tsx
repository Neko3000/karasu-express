'use client'

/**
 * MediaThumbnailCell Component
 *
 * Custom Cell component for the Media collection list view that displays
 * a thumbnail with an enlarged hover preview overlay.
 *
 * Features:
 * - Displays thumbnail in list row (existing behavior)
 * - Shows enlarged preview on hover using the 'card' image size (768x1024)
 * - Smooth fade-in/fade-out transition
 * - Smart positioning to avoid screen edge overflow
 *
 * Per Phase 9 - Asset Gallery and Management (US5)
 */

import React, { useState, useRef, useCallback, useEffect } from 'react'
import styles from './MediaThumbnailCell.module.css'
import type { MediaDocument } from './types'

// ============================================
// TYPES
// ============================================

interface MediaThumbnailCellProps {
  cellData?: string
  data?: MediaDocument
}

// ============================================
// CONSTANTS
// ============================================

const PREVIEW_WIDTH = 400
const PREVIEW_MAX_HEIGHT = 533 // 400 * (1024/768) for card aspect ratio
const SCREEN_EDGE_PADDING = 16

// ============================================
// COMPONENT
// ============================================

export const MediaThumbnailCell: React.FC<MediaThumbnailCellProps> = ({ cellData: _cellData, data }) => {
  const [showPreview, setShowPreview] = useState(false)
  const [previewPosition, setPreviewPosition] = useState({ top: 0, left: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)
  const cellRef = useRef<HTMLDivElement>(null)

  // Get thumbnail URL (use sizes.thumbnail or thumbnailURL or url)
  const thumbnailUrl =
    data?.sizes?.thumbnail?.url || data?.thumbnailURL || data?.url || ''

  // Get card URL for hover preview (use sizes.card or url)
  const cardUrl = data?.sizes?.card?.url || data?.url || ''

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

  // Handle mouse enter
  const handleMouseEnter = useCallback(() => {
    if (cardUrl) {
      calculatePreviewPosition()
      setShowPreview(true)
    }
  }, [cardUrl, calculatePreviewPosition])

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    setShowPreview(false)
    setImageLoaded(false)
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
        </div>
      )}
    </div>
  )
}

export default MediaThumbnailCell
