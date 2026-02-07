/**
 * Shared types for Media components.
 *
 * Single source of truth for Media-related interfaces used across
 * MediaThumbnailCell, MediaGalleryView, MediaDetailView, etc.
 *
 * Based on contracts/components.ts from 001-media-page-refinement.
 */

export type ViewMode = 'list' | 'gallery'

export interface ImageSize {
  url?: string | null
  width?: number | null
  height?: number | null
}

export interface GenerationMeta {
  taskId: string
  subjectSlug: string
  styleId: string
  modelId: string
  batchIndex: number
  finalPrompt: string
  negativePrompt?: string
  seed: number
  aspectRatio: string
  providerParams?: Record<string, unknown>
}

export interface MediaDocument {
  id: string
  filename: string
  url: string
  thumbnailURL?: string | null
  width?: number
  height?: number
  filesize?: number
  mimeType?: string
  createdAt: string
  updatedAt: string
  assetType?: 'image' | 'video'
  relatedSubtask?: string | { id: string }
  generationMeta?: GenerationMeta | null
  sizes?: {
    thumbnail?: ImageSize
    card?: ImageSize
  }
}
