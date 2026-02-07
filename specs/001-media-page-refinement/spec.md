# Feature Specification: Media Page Experience Optimization

**Feature Branch**: `001-media-page-refinement`
**Created**: 2026-02-05
**Status**: Draft
**Input**: PRD Section 3 - Media 页面体验优化

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Gallery View for Visual Browsing (Priority: P1)

As a content operations specialist browsing generated images, I want to switch between table and gallery views so that I can efficiently browse and compare visual assets without navigating into individual records.

**Why this priority**: The primary use case for the Media page is visual browsing of generated images. A gallery view enables users to scan hundreds of images quickly, which is essential for quality screening and selection workflows. The current table-only view forces users to rely on small thumbnails or click into each record.

**Independent Test**: Can be fully tested by navigating to the Media list page, clicking the view toggle, and verifying images display in a masonry/grid layout with the ability to switch back to list view.

**Acceptance Scenarios**:

1. **Given** I am on the Media list page in List view, **When** I click the Gallery toggle button, **Then** the view switches to a masonry/grid layout showing images prominently
2. **Given** I am in Gallery view, **When** I click the List toggle button, **Then** the view returns to the standard table format with full metadata columns
3. **Given** I have selected Gallery view, **When** I refresh the page or return later, **Then** my view preference is remembered
4. **Given** I am in Gallery view on a desktop screen, **When** the viewport is resized to mobile width, **Then** the gallery layout adapts responsively (fewer columns)

---

### User Story 2 - Restructured Detail Page (Priority: P1)

As an administrator reviewing a generated image, I want to see organized information sections on the detail page so that I can quickly find the image metadata, generation parameters, and take actions without scrolling through a disorganized form.

**Why this priority**: The detail page is critical for understanding how an image was generated (model, prompt, parameters) and for performing actions like downloading or regenerating. A well-organized layout directly impacts user efficiency and reduces errors when copying prompts.

**Independent Test**: Can be fully tested by navigating to any Media detail page and verifying the sections are logically grouped with clear visual hierarchy.

**Acceptance Scenarios**:

1. **Given** I am on a Media detail page, **When** the page loads, **Then** I see the main image prominently displayed with zoom capability
2. **Given** I am on a Media detail page, **When** I look at the Basic Info section, **Then** I see filename, dimensions, format, and creation time grouped together
3. **Given** I am on a Media detail page with generation metadata, **When** I look at the Generation Info section, **Then** I see the associated SubTask, model, style, full prompt, negative prompt, and generation parameters (seed, guidance_scale)
4. **Given** I am on a Media detail page, **When** I click the Download button, **Then** the original image is downloaded to my device
5. **Given** I am on a Media detail page, **When** I click "Copy Prompt", **Then** the full prompt text is copied to my clipboard with a confirmation toast

---

### User Story 3 - Enhanced Hover Preview (Priority: P2)

As a content specialist quickly scanning the Media list, I want enhanced hover previews that show key metadata so that I can evaluate images without opening each detail page.

**Why this priority**: Hover previews reduce clicks and speed up browsing workflows. While the current implementation exists, adding metadata context (dimensions, model) makes the preview more actionable.

**Independent Test**: Can be fully tested by hovering over any media thumbnail in the list and verifying the enlarged preview appears with metadata overlay.

**Acceptance Scenarios**:

1. **Given** I am on the Media list page in either view mode, **When** I hover over an image thumbnail, **Then** an enlarged preview appears with smooth animation
2. **Given** the hover preview is displayed, **When** I look at the preview overlay, **Then** I see the image dimensions, format, and generation model
3. **Given** the hover preview would extend beyond the viewport edge, **When** it appears, **Then** it is repositioned to remain fully visible
4. **Given** I am using keyboard navigation, **When** I focus on an image item, **Then** the preview can be triggered via keyboard (Enter or Space)

---

### User Story 4 - Optimized Metadata Controls (Priority: P2)

As an administrator viewing long prompts and JSON data, I want collapsible text areas and formatted displays so that I can manage information density and read technical data easily.

**Why this priority**: Prompts can be hundreds of characters. Without expand/collapse controls, the page becomes unwieldy. Proper formatting for JSON and timestamps improves readability.

**Independent Test**: Can be fully tested by viewing a Media detail page with long prompts and verifying the expand/collapse functionality and formatted displays.

**Acceptance Scenarios**:

1. **Given** I am viewing a Media detail page with a long prompt, **When** the prompt exceeds 200 characters, **Then** it is initially collapsed with an "Expand" button
2. **Given** a collapsed prompt area, **When** I click "Expand", **Then** the full prompt is revealed and the button changes to "Collapse"
3. **Given** there is JSON data (generation parameters), **When** I view it, **Then** it is displayed in a formatted code block with syntax highlighting
4. **Given** a SubTask ID is associated with the media, **When** I view the Generation Info section, **Then** the SubTask ID is a clickable link to the SubTask detail page
5. **Given** timestamps are displayed, **When** I view them, **Then** I see relative time format ("2 hours ago") with full timestamp on hover

---

### Edge Cases

- **Empty generation metadata**: Media items uploaded manually (not AI-generated) should hide the Generation Info section entirely rather than showing empty fields
- **Very long prompts**: Prompts exceeding 2000 characters should still be expandable without breaking layout
- **Missing SubTask reference**: If a media item's associated SubTask has been deleted, display "SubTask not found" rather than a broken link
- **Gallery view with zero items**: Display an appropriate empty state message in gallery view
- **Hover preview timeout**: If the user moves the cursor away quickly, the preview should not flash briefly (debounce hover events)

## Requirements *(mandatory)*

### Functional Requirements

#### List Page Requirements

- **FR-001**: System MUST provide a toggle control to switch between List view (table) and Gallery view (masonry grid)
- **FR-002**: System MUST persist the user's view preference in browser local storage
- **FR-003**: Gallery view MUST display images in a responsive masonry/grid layout that adapts to viewport width
- **FR-004**: Gallery view MUST support navigating to an image's detail page (via a detail-link icon on each card); clicking the image itself opens a lightbox for quick browsing
- **FR-005**: Hover preview MUST display an enlarged image with metadata overlay (dimensions, format, model)
- **FR-006**: Hover preview MUST use smart positioning to avoid viewport overflow
- **FR-007**: Hover preview MUST be accessible via keyboard navigation

#### Detail Page Requirements

- **FR-008**: Detail page MUST display the main image prominently with zoom/full-size view capability
- **FR-009**: Detail page MUST organize information into distinct sections: Image Preview, Basic Info, Generation Info, Actions
- **FR-010**: Basic Info section MUST display: filename, dimensions (width × height), format, file size, creation timestamp
- **FR-011**: Generation Info section MUST display (when available): SubTask ID (linked), model name, style name, full prompt, negative prompt, generation parameters
- **FR-012**: Generation Info section MUST be hidden when the media item has no generation metadata
- **FR-013**: Actions section MUST include: Download original, Copy prompt to clipboard
- **FR-014**: Long prompts (>200 characters) MUST use expandable/collapsible text areas
- **FR-015**: JSON data MUST be displayed in formatted code blocks
- **FR-016**: Related entity references (SubTask) MUST be clickable links
- **FR-017**: Timestamps MUST display in relative format with full timestamp available on hover
- **FR-018**: Enum values (status, format) MUST display as badges/tags

### Key Entities

- **Media**: The primary entity representing generated images. Contains file metadata, generation parameters, and relationship to SubTask
- **SubTask**: Related entity that triggered the image generation. Contains model, style, prompt information
- **User Preference (view mode)**: Client-side stored preference for List vs Gallery view

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can switch between List and Gallery views within 1 second (instant toggle)
- **SC-002**: Users can visually scan 50+ images in Gallery view without pagination (within default page size of 100)
- **SC-003**: Users can access full image details from Gallery view in 2 clicks or fewer (click image → detail page)
- **SC-004**: Users can copy a prompt to clipboard in 1 click from the detail page
- **SC-005**: Users can download an original image in 1 click from the detail page
- **SC-006**: Page load time for Media list page remains under 2 seconds for 100 items
- **SC-007**: View preference persists across browser sessions (localStorage reliability)
- **SC-008**: Detail page content is organized into no more than 4 major sections for clarity

## Assumptions

- The existing Media collection already contains the necessary fields for generation metadata (subTask relationship, prompt, negativePrompt, model, style, generationParams)
- LightGallery library (per constitution technology stack) is suitable for implementing the gallery view and image zoom functionality
- The current hover preview implementation in `MediaThumbnailCell` can be extended rather than replaced
- Browser localStorage is sufficient for view preference persistence (no need for server-side user settings)
- The 200-character threshold for prompt collapse is a reasonable default for balancing information visibility
