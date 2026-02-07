'use client'

import React, { useCallback, useRef } from 'react'
import LightGallery from 'lightgallery/react'
import type { LightGallery as LightGalleryType } from 'lightgallery/lightgallery'
import lgZoom from 'lightgallery/plugins/zoom'
import lgFullscreen from 'lightgallery/plugins/fullscreen'
import { cn } from '@/lib/utils'

import 'lightgallery/css/lightgallery.css'
import 'lightgallery/css/lg-zoom.css'
import 'lightgallery/css/lg-fullscreen.css'

export interface ImagePreviewProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
}

export function ImagePreview({ src, alt, width, height, className }: ImagePreviewProps) {
  const lightGalleryRef = useRef<LightGalleryType | null>(null)

  const onInit = useCallback((detail: { instance: LightGalleryType }) => {
    lightGalleryRef.current = detail.instance
  }, [])

  const handleClick = useCallback(() => {
    lightGalleryRef.current?.openGallery(0)
  }, [])

  const dynamicElements = [
    {
      src,
      thumb: src,
      subHtml: `<h4>${alt}</h4>${width && height ? `<p>${width} × ${height} px</p>` : ''}`,
    },
  ]

  return (
    <div className="twp">
      <div className={cn('twp:relative twp:cursor-zoom-in twp:inline-block twp:max-w-full', className)}>
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          onClick={handleClick}
          className="twp:max-w-full twp:h-auto twp:rounded-lg twp:shadow-md twp:transition-shadow twp:hover:shadow-lg"
        />
      </div>

      <LightGallery
        dynamic
        dynamicEl={dynamicElements}
        onInit={onInit}
        plugins={[lgZoom, lgFullscreen]}
        speed={400}
        mode="lg-fade"
        download={false}
        closable
        hideScrollbar
        actualSize
        showZoomInOutIcons
      />
    </div>
  )
}
