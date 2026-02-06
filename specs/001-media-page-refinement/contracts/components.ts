/**
 * Component Contracts: Media Page Experience Optimization
 *
 * This file defines TypeScript interfaces for all new components
 * to be implemented in this feature.
 *
 * Feature: 001-media-page-refinement
 * Date: 2026-02-05
 */

import type { LightGallery } from 'lightgallery/lightgallery';

// =============================================================================
// Core Types
// =============================================================================

export type ViewMode = 'list' | 'gallery';

export interface MediaDocument {
  id: string;
  filename: string;
  url: string;
  thumbnailURL?: string | null;
  width?: number;
  height?: number;
  filesize?: number;
  mimeType?: string;
  createdAt: string;
  updatedAt: string;
  assetType?: 'image' | 'video';
  relatedSubtask?: string | { id: string };
  generationMeta?: GenerationMeta | null;
  sizes?: {
    thumbnail?: ImageSize;
    card?: ImageSize;
  };
}

export interface ImageSize {
  url?: string;
  width?: number;
  height?: number;
}

export interface GenerationMeta {
  taskId: string;
  subjectSlug: string;
  styleId: string;
  modelId: string;
  batchIndex: number;
  finalPrompt: string;
  negativePrompt?: string;
  seed: number;
  aspectRatio: string;
  providerParams?: Record<string, unknown>;
}

// =============================================================================
// Hook Contracts
// =============================================================================

/**
 * useViewPreference - Persist view mode preference in localStorage
 *
 * @param defaultView - Initial view mode if not stored
 * @returns Tuple of [currentView, setView function]
 */
export interface UseViewPreferenceReturn {
  view: ViewMode;
  setView: (mode: ViewMode) => void;
}

// =============================================================================
// Utility Contracts
// =============================================================================

/**
 * copyToClipboard - Copy text to system clipboard
 *
 * @param text - Text to copy
 * @returns Promise resolving to success boolean
 */
export type CopyToClipboard = (text: string) => Promise<boolean>;

/**
 * formatFileSize - Format bytes to human-readable string
 *
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export type FormatFileSize = (bytes: number) => string;

/**
 * formatRelativeTime - Format timestamp to relative time
 *
 * @param date - Date to format
 * @returns Relative time string (e.g., "2 hours ago")
 */
export type FormatRelativeTime = (date: Date | string) => string;

// =============================================================================
// Component Props Contracts
// =============================================================================

/**
 * MediaGalleryView - Masonry grid gallery with LightGallery lightbox
 */
export interface MediaGalleryViewProps {
  /** Array of media documents to display */
  images: MediaDocument[];
  /** Callback when image is clicked (navigates to detail) */
  onImageClick?: (id: string) => void;
  /** Optional className for container */
  className?: string;
}

/**
 * MediaListHeader - Toolbar with view toggle and actions
 */
export interface MediaListHeaderProps {
  /** Current view mode */
  viewMode: ViewMode;
  /** Callback when view mode changes */
  onViewModeChange: (mode: ViewMode) => void;
  /** Total count of items */
  totalCount?: number;
  /** Optional className */
  className?: string;
}

/**
 * MediaDetailView - Restructured detail page component
 */
export interface MediaDetailViewProps {
  /** Media document to display */
  media: MediaDocument;
  /** Optional className */
  className?: string;
}

/**
 * MediaThumbnailCell - Enhanced thumbnail with hover preview
 * (Extends existing component)
 */
export interface MediaThumbnailCellProps {
  /** Cell data (legacy) */
  cellData?: string;
  /** Media document */
  data?: MediaDocument;
  /** Row data from Payload */
  rowData?: MediaDocument;
}

/**
 * ExpandableText - Collapsible text with expand/collapse toggle
 */
export interface ExpandableTextProps {
  /** Full text content */
  text: string;
  /** Character limit before truncation (default: 200) */
  maxLength?: number;
  /** Label for the text field (optional) */
  label?: string;
  /** Optional className */
  className?: string;
}

/**
 * FormattedJson - JSON display with syntax highlighting
 */
export interface FormattedJsonProps {
  /** JSON data to display */
  data: Record<string, unknown>;
  /** Whether to show collapsed by default */
  collapsed?: boolean;
  /** Optional className */
  className?: string;
}

/**
 * RelativeTime - Timestamp with relative display and full tooltip
 */
export interface RelativeTimeProps {
  /** Timestamp to display */
  timestamp: Date | string;
  /** Optional className */
  className?: string;
}

/**
 * MetadataBadge - Badge/tag display for enum values
 */
export interface MetadataBadgeProps {
  /** Badge text */
  label: string;
  /** Badge variant for styling */
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  /** Optional className */
  className?: string;
}

/**
 * ImagePreview - Main image display with zoom capability
 */
export interface ImagePreviewProps {
  /** Image source URL */
  src: string;
  /** Alt text */
  alt: string;
  /** Image width */
  width?: number;
  /** Image height */
  height?: number;
  /** Optional className */
  className?: string;
}

/**
 * ActionButton - Action button with icon
 */
export interface ActionButtonProps {
  /** Button label */
  label: string;
  /** Icon name (Lucide React) */
  icon: string;
  /** Click handler */
  onClick: () => void;
  /** Loading state */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'ghost';
  /** Optional className */
  className?: string;
}

// =============================================================================
// LightGallery Integration
// =============================================================================

/**
 * Dynamic element for LightGallery
 */
export interface LightGalleryElement {
  src: string;
  thumb: string;
  subHtml?: string;
  width?: string;
  height?: string;
}

/**
 * LightGallery ref interface
 */
export interface LightGalleryRef {
  instance: LightGallery | null;
  openGallery: (index: number) => void;
  refresh: () => void;
}

// =============================================================================
// Event Handlers
// =============================================================================

export interface CopyPromptEvent {
  prompt: string;
  mediaId: string;
}

export interface DownloadEvent {
  url: string;
  filename: string;
  mediaId: string;
}

export interface ViewToggleEvent {
  previousMode: ViewMode;
  newMode: ViewMode;
}
