# Research: Media Page Experience Optimization

**Feature**: 001-media-page-refinement
**Date**: 2026-02-05

## Overview

This document captures research findings for implementing the Media page gallery view and detail page restructuring.

---

## 1. LightGallery Integration

### Decision: Use LightGallery v2.x with Dynamic Mode

**Rationale**:
- LightGallery is already in the constitution technology stack
- Dynamic mode (`dynamic={true}`) provides better React state management than DOM mode
- Supports programmatic control via `openGallery(index)` for custom grid layouts

**Alternatives Considered**:
- PhotoSwipe: More lightweight but less feature-complete
- Fancybox: Commercial license required for projects
- Custom lightbox: Unnecessary complexity when LightGallery is already approved

### Installation

```bash
# Already installed per constitution
npm install lightgallery
npm install react-masonry-css  # For masonry grid layout
```

### Required Imports

```typescript
// Core
import LightGallery from 'lightgallery/react';
import type { LightGallery as LightGalleryType } from 'lightgallery/lightgallery';

// CSS (core + plugins used)
import 'lightgallery/css/lightgallery.css';
import 'lightgallery/css/lg-zoom.css';
import 'lightgallery/css/lg-thumbnail.css';
import 'lightgallery/css/lg-fullscreen.css';

// Plugins
import lgZoom from 'lightgallery/plugins/zoom';
import lgThumbnail from 'lightgallery/plugins/thumbnail';
import lgFullscreen from 'lightgallery/plugins/fullscreen';
```

### Configuration

```typescript
const lightGallerySettings = {
  speed: 400,
  mode: 'lg-fade',
  controls: true,
  loop: true,
  keyPress: true,
  counter: true,
  download: false,  // We'll provide custom download in detail page
  closable: true,
  hideScrollbar: true,
  preload: 2,

  // Zoom plugin
  actualSize: true,
  showZoomInOutIcons: true,

  // Thumbnail plugin
  thumbnail: true,
  animateThumb: true,
  thumbWidth: 100,
  thumbHeight: 80,
};
```

---

## 2. Masonry Grid Layout

### Decision: Use react-masonry-css

**Rationale**:
- Lightweight CSS-based masonry (no JavaScript layout calculations)
- Works well with responsive breakpoints
- Simple integration with LightGallery dynamic mode

**Pattern**: Separate masonry grid from LightGallery, use programmatic `openGallery(index)` on click.

### Responsive Breakpoints

```typescript
const breakpointColumns = {
  default: 4,  // 4 columns on large screens
  1280: 3,     // 3 columns on xl
  1024: 3,     // 3 columns on lg
  768: 2,      // 2 columns on md
  640: 1,      // 1 column on sm
};
```

---

## 3. PayloadCMS Admin Integration

### Key Consideration: TailwindCSS Scoping

Per constitution and existing patterns, TailwindCSS uses `.twp` scope to prevent conflicts with Payload admin styles.

```typescript
// Component wrapper pattern
<div className="twp">
  {/* TailwindCSS classes work here */}
</div>
```

### Custom Component Registration

Payload supports custom components for collection admin UI:

```typescript
// src/collections/Media.ts
admin: {
  components: {
    views: {
      list: {
        // Custom list view with gallery toggle
        Component: '/components/Media/MediaListView',
      },
      edit: {
        // Custom edit/detail view
        Component: '/components/Media/MediaDetailView',
      },
    },
  },
}
```

**Alternative**: Use `BeforeList` and `AfterList` components to add toolbar without replacing entire list view.

---

## 4. View Preference Persistence

### Decision: localStorage with Custom Hook

**Rationale**:
- Constitution Principle II (Infrastructure Minimalism) - no server-side storage needed
- Client-side preference is sufficient for view mode
- Simple implementation with React hook

### Implementation Pattern

```typescript
// src/hooks/useViewPreference.ts
const STORAGE_KEY = 'media-view-preference';

export function useViewPreference(defaultView: 'list' | 'gallery' = 'list') {
  const [view, setViewState] = useState<'list' | 'gallery'>(defaultView);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'list' || stored === 'gallery') {
      setViewState(stored);
    }
  }, []);

  const setView = (newView: 'list' | 'gallery') => {
    setViewState(newView);
    localStorage.setItem(STORAGE_KEY, newView);
  };

  return [view, setView] as const;
}
```

---

## 5. Performance for 100+ Images

### Decision: Native Lazy Loading + LightGallery Internal Optimization

**Rationale**:
- LightGallery internally loads only 3 slides at a time
- Native `loading="lazy"` sufficient for grid thumbnails
- Media collection already uses `card` (768x1024) and `thumbnail` (400x300) image sizes
- Default pagination of 100 items per page is reasonable

**When to Add Virtualization**:
- If users report performance issues with 100 items
- For 500+ items, consider `@tanstack/react-virtual`

### Current Image Sizes (from Media.ts)

```typescript
imageSizes: [
  { name: 'thumbnail', width: 400, height: 300 },  // List view
  { name: 'card', width: 768, height: 1024 },      // Hover preview / Gallery
]
```

These sizes are optimal for gallery view - no changes needed.

---

## 6. Hover Preview Enhancement

### Current Implementation Analysis

The existing `MediaThumbnailCell` component already implements:
- Hover trigger with mouse enter/leave
- Fixed position overlay with `card` size image (768x1024)
- Smart positioning (viewport edge detection)
- Loading spinner
- CSS transitions

### Enhancements Needed

1. **Add metadata overlay**: Show dimensions, format, model
2. **Debounce hover**: Prevent flash on quick mouse movements
3. **Keyboard accessibility**: Focus trigger with Enter/Space

### Metadata Display Pattern

```typescript
// Overlay structure
<div className="preview-metadata">
  <span>{width} × {height}</span>
  <span>{format}</span>
  <span>{modelId || 'N/A'}</span>
</div>
```

---

## 7. Detail Page Structure

### Decision: Custom React Component with Sections

Following Constitution Principle VII (Admin Panel UI Standards):

| Section | Heading Level | Content |
|---------|---------------|---------|
| Page Title | H1 | Filename |
| Image Preview | (visual) | Large image with zoom |
| Basic Info | H2 | Filename, dimensions, format, size, created |
| Generation Info | H2 | SubTask link, model, style, prompt, negative prompt, params |
| Actions | H2 | Download, Copy Prompt |

### Section Visibility Logic

```typescript
// Only show Generation Info if generationMeta exists
{generationMeta && (
  <section>
    <h2>Generation Info</h2>
    {/* ... */}
  </section>
)}
```

---

## 8. Utility Components

### Expandable Text

For prompts >200 characters:

```typescript
interface ExpandableTextProps {
  text: string;
  maxLength?: number;  // default 200
}

// Shows truncated text with "Expand" button
// Expanded state shows full text with "Collapse" button
```

### Formatted JSON

```typescript
interface FormattedJsonProps {
  data: object;
  collapsible?: boolean;
}

// Renders JSON in <pre><code> with syntax highlighting
// Uses TailwindCSS prose classes for styling
```

### Relative Time

```typescript
interface RelativeTimeProps {
  timestamp: string | Date;
}

// Shows "2 hours ago" with full timestamp on hover (title attribute)
// Uses Intl.RelativeTimeFormat for localization
```

### Clipboard Utility

```typescript
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    // ... fallback implementation
  }
}
```

---

## 9. Testing Strategy

Per Constitution Principle VI:

| Component | Test Type | Priority |
|-----------|-----------|----------|
| useViewPreference | Unit | High |
| copyToClipboard | Unit | High |
| ExpandableText | Unit | Medium |
| RelativeTime | Unit | Medium |
| MediaGalleryView | Integration | High |

### Mock Considerations

- Mock `localStorage` for useViewPreference tests
- Mock `navigator.clipboard` for clipboard tests
- Use Testing Library for component tests

---

## 10. Implementation Order

1. **Phase 1 - Utilities**: useViewPreference hook, clipboard utility
2. **Phase 2 - Reusable Components**: ExpandableText, FormattedJson, RelativeTime, MetadataBadge
3. **Phase 3 - Gallery View**: MediaGalleryView with LightGallery + Masonry
4. **Phase 4 - List Header**: View toggle toolbar
5. **Phase 5 - Enhanced Hover**: Metadata overlay, debounce, keyboard
6. **Phase 6 - Detail Page**: MediaDetailView with sections
7. **Phase 7 - Integration**: Wire up to Media collection config

---

## References

- [LightGallery React Documentation](https://www.lightgalleryjs.com/docs/react-image-video-gallery/)
- [LightGallery Settings](https://www.lightgalleryjs.com/docs/settings/)
- [react-masonry-css](https://github.com/paulcollett/react-masonry-css)
- [PayloadCMS Custom Components](https://payloadcms.com/docs/admin/components)
- [TailwindCSS with PayloadCMS](https://payloadcms.com/posts/guides/how-to-theme-the-payload-admin-panel-with-tailwind-css-4)
