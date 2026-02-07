'use client'

import React, { useCallback, useRef } from 'react'
import LightGallery from 'lightgallery/react'
import type { LightGallery as LightGalleryType } from 'lightgallery/lightgallery'
import lgZoom from 'lightgallery/plugins/zoom'
import lgThumbnail from 'lightgallery/plugins/thumbnail'
import lgFullscreen from 'lightgallery/plugins/fullscreen'
import { ExternalLink, ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MediaDocument } from './types'
import styles from './MediaGalleryView.module.css'

// LightGallery CSS
import 'lightgallery/css/lightgallery.css'
import 'lightgallery/css/lg-zoom.css'
import 'lightgallery/css/lg-thumbnail.css'
import 'lightgallery/css/lg-fullscreen.css'

export interface MediaGalleryViewProps {
  images: MediaDocument[]
  onImageClick?: (id: string) => void
  className?: string
}

export function MediaGalleryView({ images, onImageClick, className }: MediaGalleryViewProps) {
  const lightGalleryRef = useRef<LightGalleryType | null>(null)

  const onInit = useCallback((detail: { instance: LightGalleryType }) => {
    lightGalleryRef.current = detail.instance
  }, [])

  const openGallery = useCallback((index: number) => {
    lightGalleryRef.current?.openGallery(index)
  }, [])

  // Build dynamic elements for LightGallery
  const dynamicElements = images.map((img) => ({
    src: img.url,
    thumb: img.sizes?.thumbnail?.url || img.thumbnailURL || img.url,
    subHtml: `<h4>${img.filename}</h4>${img.width && img.height ? `<p>${img.width} × ${img.height} px</p>` : ''}`,
  }))

  if (images.length === 0) {
    return (
      <div className="twp">
        <div className={cn('twp:flex twp:flex-col twp:items-center twp:justify-center twp:py-16 twp:text-muted-foreground', className)}>
          <ImageOff className="twp:size-12 twp:mb-3 twp:opacity-50" />
          <p className="twp:text-sm">No media items to display</p>
        </div>
      </div>
    )
  }

  return (
    <div className="twp">
      <div className={cn(styles.galleryGrid, className)}>
        {images.map((img, index) => {
          const thumbUrl = img.sizes?.thumbnail?.url || img.thumbnailURL || img.url
          return (
            <div key={img.id} className={styles.galleryItem}>
              <div className={styles.imageWrapper}>
                <img
                  src={thumbUrl}
                  alt={img.filename}
                  loading="lazy"
                  className={styles.image}
                  onClick={() => openGallery(index)}
                />
                <div className={styles.overlay}>
                  <button
                    type="button"
                    className={styles.detailLink}
                    onClick={(e) => {
                      e.stopPropagation()
                      onImageClick?.(img.id)
                    }}
                    title="Open detail page"
                    aria-label={`Open detail page for ${img.filename}`}
                  >
                    <ExternalLink className="twp:size-4" />
                  </button>
                </div>
                {img.filename && (
                  <div className={styles.caption}>
                    <span className={styles.captionText}>{img.filename}</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Hidden LightGallery instance for dynamic mode */}
      <LightGallery
        dynamic
        dynamicEl={dynamicElements}
        onInit={onInit}
        plugins={[lgZoom, lgThumbnail, lgFullscreen]}
        speed={400}
        mode="lg-fade"
        controls
        loop
        keyPress
        counter
        download={false}
        closable
        hideScrollbar
        preload={2}
        actualSize
        showZoomInOutIcons
        thumbnail
        animateThumb
        thumbWidth={100}
        thumbHeight="80"
      />
    </div>
  )
}
