# Data Model: Media Page Experience Optimization

**Feature**: 001-media-page-refinement
**Date**: 2026-02-05

## Overview

This feature is primarily a UI enhancement. **No database schema changes are required.** All data models already exist and contain the necessary fields.

---

## Existing Data Models (Reference Only)

### Media Collection

**Location**: `src/collections/Media.ts`

| Field | Type | Description | Used In |
|-------|------|-------------|---------|
| `id` | string | Document ID | All views |
| `filename` | string | Original filename | Basic Info |
| `url` | string | Full-size image URL | Detail view, Lightbox |
| `thumbnailURL` | string | Thumbnail URL | List view |
| `sizes.thumbnail` | object | 400x300 thumbnail | Grid view |
| `sizes.card` | object | 768x1024 card image | Hover preview, Gallery |
| `width` | number | Image width (px) | Basic Info, Preview overlay |
| `height` | number | Image height (px) | Basic Info, Preview overlay |
| `filesize` | number | File size (bytes) | Basic Info |
| `mimeType` | string | MIME type | Basic Info (as format) |
| `createdAt` | Date | Creation timestamp | Basic Info |
| `relatedSubtask` | relationship | SubTask reference | Generation Info |
| `assetType` | enum | 'image' \| 'video' | Badge display |
| `generationMeta` | json | Generation parameters | Generation Info |
| `generationMeta.taskId` | string | Parent task ID | Generation Info |
| `generationMeta.finalPrompt` | string | Complete prompt | Generation Info, Copy |
| `generationMeta.negativePrompt` | string | Negative prompt | Generation Info |
| `generationMeta.styleId` | string | Style ID | Generation Info |
| `generationMeta.modelId` | string | Model ID | Generation Info, Preview |
| `generationMeta.seed` | number | Generation seed | Generation Info |
| `generationMeta.aspectRatio` | enum | Aspect ratio | Generation Info |
| `generationMeta.providerParams` | object | Provider-specific params | Generation Info (JSON) |

### SubTask Collection

**Location**: `src/collections/SubTasks.ts`

Referenced via `relatedSubtask` field. Used to link to SubTask detail page.

| Field | Type | Used For |
|-------|------|----------|
| `id` | string | Link URL |
| `status` | enum | Badge display |
| `styleId` | string | Style name lookup |
| `modelId` | string | Model name lookup |

---

## Client-Side State Models

### View Preference

**Storage**: localStorage

```typescript
// Key
const STORAGE_KEY = 'karasu-media-view-preference';

// Value
type ViewPreference = 'list' | 'gallery';
```

**Persistence Logic**:
- Read on component mount
- Write on toggle change
- Default to 'list' if not set

### Component State

```typescript
// MediaListView component state
interface MediaListViewState {
  viewMode: 'list' | 'gallery';
  isLoading: boolean;
}

// MediaDetailView component state
interface MediaDetailViewState {
  isPromptExpanded: boolean;
  isNegativePromptExpanded: boolean;
  isParamsExpanded: boolean;
  copySuccess: boolean;
}

// Hover preview state
interface HoverPreviewState {
  isVisible: boolean;
  imageLoaded: boolean;
  position: { top: number; left: number };
}
```

---

## Data Flow

### Gallery View

```
Payload API → Media documents → MediaGalleryView
                                    ↓
                              LightGallery dynamicEl
                                    ↓
                              CSS columns grid render
                                    ↓
                              Click → openGallery(index)
```

### Detail View

```
Payload API → Media document → MediaDetailView
                                    ↓
                    ┌───────────────┼───────────────┐
                    ↓               ↓               ↓
            Basic Info      Generation Info    Actions
                                    ↓               ↓
                          (if generationMeta)  Download/Copy
```

### Hover Preview

```
Mouse enter thumbnail → Debounce (100ms) → Show preview
                                              ↓
                                        Load card image
                                              ↓
                                        Calculate position
                                              ↓
                                        Show with metadata
                                              ↓
Mouse leave → Hide preview
```

---

## Field Mapping for UI

### Basic Info Section

| UI Label | Field | Format |
|----------|-------|--------|
| Filename | `filename` | As-is |
| Dimensions | `width`, `height` | `{width} × {height} px` |
| Format | `mimeType` | Extract after `/` (e.g., "png") |
| File Size | `filesize` | Format as KB/MB |
| Created | `createdAt` | Relative time with tooltip |

### Generation Info Section

| UI Label | Field | Format |
|----------|-------|--------|
| SubTask | `relatedSubtask` | Link to `/admin/collections/sub-tasks/{id}` |
| Model | `generationMeta.modelId` | Badge |
| Style | `generationMeta.styleId` | Badge |
| Prompt | `generationMeta.finalPrompt` | Expandable text |
| Negative Prompt | `generationMeta.negativePrompt` | Expandable text (if exists) |
| Seed | `generationMeta.seed` | Code/monospace |
| Aspect Ratio | `generationMeta.aspectRatio` | Badge |
| Parameters | `generationMeta.providerParams` | Formatted JSON (if exists) |

### Hover Preview Overlay

| UI Label | Field | Format |
|----------|-------|--------|
| Dimensions | `width`, `height` | `{width} × {height}` |
| Format | `mimeType` | Short (e.g., "PNG") |
| Model | `generationMeta.modelId` | Short name or "N/A" |

---

## Validation Rules

No new validation rules needed. All data is read-only in this feature.

---

## Migration

**No migration required.** This feature only adds UI components that read existing data.
