'use client'

/**
 * StyleSelectorField Component
 *
 * Custom PayloadCMS field component that fetches and displays style options
 * from the database via the /api/studio/styles endpoint.
 *
 * Features:
 * - Fetches styles from database on mount
 * - Multi-select capability with "base" as default
 * - Selected styles displayed as removable tags
 * - Search/filter functionality
 * - Loading and error states
 * - Real-time updates to PayloadCMS form
 *
 * Part of Phase 5: Imported Style Ids Field - DB Integration
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { X, XCircle } from 'lucide-react'
import { useField, useForm } from '@payloadcms/ui'
import type { UIFieldClientComponent } from 'payload'
import { useStyleOptions } from './hooks/useStyleOptions'
import type { ImportedStyle } from '../../lib/style-types'

// ============================================
// CONSTANTS
// ============================================

const MAX_VISIBLE_STYLES = 50 // Initial number of styles to show
const MAX_VISIBLE_TAGS = 10 // Max tags to show before collapsing

// ============================================
// TYPES
// ============================================

interface StyleOptionProps {
  style: ImportedStyle
  isSelected: boolean
  onToggle: (styleId: string, selected: boolean) => void
  isDefault: boolean
}

interface SelectedStyleTagProps {
  style: ImportedStyle
  onRemove: (styleId: string) => void
  isDefault: boolean
}

// ============================================
// SUB-COMPONENTS
// ============================================

/**
 * Selected style tag with remove button
 */
function SelectedStyleTag({ style, onRemove, isDefault }: SelectedStyleTagProps) {
  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!isDefault) {
        onRemove(style.styleId)
      }
    },
    [style.styleId, onRemove, isDefault]
  )

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        backgroundColor: isDefault ? 'var(--theme-success-100)' : 'var(--theme-elevation-100)',
        border: `1px solid ${isDefault ? 'var(--theme-success-200)' : 'var(--theme-elevation-200)'}`,
        borderRadius: '4px',
        fontSize: 'calc(var(--base-body-size) * 0.85)',
        color: isDefault ? 'var(--theme-success-700)' : 'var(--theme-text)',
        whiteSpace: 'nowrap',
      }}
    >
      <span>{style.name}</span>
      {!isDefault && (
        <button
          type="button"
          onClick={handleRemove}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '16px',
            height: '16px',
            padding: 0,
            background: 'none',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            color: 'var(--theme-elevation-500)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--theme-elevation-200)'
            e.currentTarget.style.color = 'var(--theme-error-500)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = 'var(--theme-elevation-500)'
          }}
          title={`Remove ${style.name}`}
        >
          <X size={12} />
        </button>
      )}
      {isDefault && (
        <span
          style={{
            fontSize: 'calc(var(--base-body-size) * 0.7)',
            color: 'var(--theme-success-600)',
            fontStyle: 'italic',
          }}
        >
          default
        </span>
      )}
    </span>
  )
}

/**
 * Individual style option with checkbox
 */
function StyleOption({ style, isSelected, onToggle, isDefault }: StyleOptionProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onToggle(style.styleId, e.target.checked)
    },
    [style.styleId, onToggle]
  )

  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        borderRadius: 'var(--style-radius-s)',
        cursor: 'pointer',
        backgroundColor: isSelected ? 'var(--theme-elevation-100)' : 'transparent',
        border: `1px solid ${isSelected ? 'var(--theme-elevation-200)' : 'transparent'}`,
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = 'var(--theme-elevation-50)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = 'transparent'
        }
      }}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={handleChange}
        style={{
          width: '16px',
          height: '16px',
          accentColor: 'var(--theme-success-500)',
        }}
      />
      <span
        style={{
          fontSize: 'var(--base-body-size)',
          color: 'var(--theme-text)',
          flex: 1,
        }}
      >
        {style.name}
        {isDefault && (
          <span
            style={{
              marginLeft: '6px',
              fontSize: 'calc(var(--base-body-size) * 0.8)',
              color: 'var(--theme-elevation-500)',
              fontStyle: 'italic',
            }}
          >
            (default)
          </span>
        )}
      </span>
    </label>
  )
}

/**
 * Loading skeleton for style options
 */
function LoadingSkeleton() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '12px',
      }}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
          }}
        >
          <div
            style={{
              width: '16px',
              height: '16px',
              backgroundColor: 'var(--theme-elevation-150)',
              borderRadius: '4px',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
          <div
            style={{
              flex: 1,
              height: '16px',
              backgroundColor: 'var(--theme-elevation-150)',
              borderRadius: '4px',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        </div>
      ))}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

/**
 * Error display with retry button
 */
function ErrorDisplay({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: 'var(--theme-error-50)',
        border: '1px solid var(--theme-error-200)',
        borderRadius: 'var(--style-radius-s)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <XCircle size={20} style={{ color: 'var(--theme-error-500)', flexShrink: 0 }} />
        <span style={{ fontSize: 'var(--base-body-size)', color: 'var(--theme-error-600)' }}>
          {message}
        </span>
      </div>
      <button
        type="button"
        onClick={onRetry}
        style={{
          padding: '6px 12px',
          fontSize: 'calc(var(--base-body-size) * 0.9)',
          backgroundColor: 'var(--theme-error-500)',
          color: 'white',
          border: 'none',
          borderRadius: 'var(--style-radius-s)',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        Retry
      </button>
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * StyleSelectorField - Custom field for PayloadCMS Tasks collection
 * Fetches styles from database and provides multi-select UI
 */
export const StyleSelectorField: UIFieldClientComponent = () => {
  // Get the importedStyleIds field from PayloadCMS
  const styleField = useField<string[]>({
    path: 'importedStyleIds',
  })

  // Get form context for dispatching updates
  const { dispatchFields } = useForm()

  // Fetch styles from the API
  const { styles, isLoading, error, refetch, defaultStyleId, totalCount } = useStyleOptions()

  // Local state for search, visible styles, and expanded tags
  const [searchQuery, setSearchQuery] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [showAllTags, setShowAllTags] = useState(false)

  // Get current selected style IDs (from form or default)
  const selectedStyleIds = useMemo(() => {
    const value = styleField.value
    if (Array.isArray(value) && value.length > 0) {
      return new Set(value)
    }
    // Default to 'base' if nothing selected
    return new Set([defaultStyleId])
  }, [styleField.value, defaultStyleId])

  // Get selected styles with full data
  const selectedStyles = useMemo(() => {
    if (styles.length === 0) return []
    const styleMap = new Map(styles.map((s) => [s.styleId, s]))
    return Array.from(selectedStyleIds)
      .map((id) => styleMap.get(id))
      .filter((s): s is ImportedStyle => s !== undefined)
  }, [styles, selectedStyleIds])

  // Filter styles based on search query
  const filteredStyles = useMemo(() => {
    if (!searchQuery.trim()) {
      return styles
    }
    const query = searchQuery.toLowerCase()
    return styles.filter((s) => s.name.toLowerCase().includes(query))
  }, [styles, searchQuery])

  // Limit visible styles unless "show all" is clicked
  const visibleStyles = useMemo(() => {
    if (showAll || filteredStyles.length <= MAX_VISIBLE_STYLES) {
      return filteredStyles
    }
    return filteredStyles.slice(0, MAX_VISIBLE_STYLES)
  }, [filteredStyles, showAll])

  // Visible tags (limited unless expanded)
  const visibleTags = useMemo(() => {
    if (showAllTags || selectedStyles.length <= MAX_VISIBLE_TAGS) {
      return selectedStyles
    }
    return selectedStyles.slice(0, MAX_VISIBLE_TAGS)
  }, [selectedStyles, showAllTags])

  // Handle style selection toggle
  const handleToggle = useCallback(
    (styleId: string, selected: boolean) => {
      const newSelection = new Set(selectedStyleIds)

      if (selected) {
        newSelection.add(styleId)
      } else {
        newSelection.delete(styleId)
        // Ensure at least one style is selected (default to base)
        if (newSelection.size === 0) {
          newSelection.add(defaultStyleId)
        }
      }

      const newValue = Array.from(newSelection)
      styleField.setValue(newValue)

      // Also dispatch to form for reactive updates
      dispatchFields({
        type: 'UPDATE',
        path: 'importedStyleIds',
        value: newValue,
      })
    },
    [selectedStyleIds, styleField, dispatchFields, defaultStyleId]
  )

  // Handle removing a style from selection
  const handleRemoveStyle = useCallback(
    (styleId: string) => {
      handleToggle(styleId, false)
    },
    [handleToggle]
  )

  // Handle search input change with debouncing
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setShowAll(false) // Reset show all when searching
  }, [])

  // Handle clear search
  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
    setShowAll(false)
  }, [])

  // Handle select all visible
  const handleSelectAll = useCallback(() => {
    const allIds = visibleStyles.map((s) => s.styleId)
    const newSelection = new Set([...selectedStyleIds, ...allIds])
    const newValue = Array.from(newSelection)
    styleField.setValue(newValue)
    dispatchFields({
      type: 'UPDATE',
      path: 'importedStyleIds',
      value: newValue,
    })
  }, [visibleStyles, selectedStyleIds, styleField, dispatchFields])

  // Handle clear all (reset to default)
  const handleClearAll = useCallback(() => {
    const newValue = [defaultStyleId]
    styleField.setValue(newValue)
    dispatchFields({
      type: 'UPDATE',
      path: 'importedStyleIds',
      value: newValue,
    })
    setShowAllTags(false)
  }, [styleField, dispatchFields, defaultStyleId])

  // Initialize default value if not set
  useEffect(() => {
    if (!styleField.value || (Array.isArray(styleField.value) && styleField.value.length === 0)) {
      if (!isLoading && styles.length > 0) {
        styleField.setValue([defaultStyleId])
      }
    }
  }, [isLoading, styles.length, styleField, defaultStyleId])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--base) * 0.5)' }}>
      {/* Field Label */}
      <div>
        <label
          style={{
            display: 'block',
            fontSize: 'var(--base-body-size)',
            fontWeight: 500,
            color: 'var(--theme-text)',
            marginBottom: 'calc(var(--base) * 0.25)',
          }}
        >
          Style Templates
          <span style={{ color: 'var(--theme-error-500)', marginLeft: '4px' }}>*</span>
        </label>
        <p
          style={{
            fontSize: 'calc(var(--base-body-size) * 0.85)',
            color: 'var(--theme-elevation-500)',
            margin: 0,
          }}
        >
          Select style templates to apply to your generated prompts
        </p>
      </div>

      {/* Selected Styles Display */}
      {selectedStyles.length > 0 && (
        <div
          style={{
            padding: '12px',
            backgroundColor: 'var(--theme-elevation-50)',
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: 'var(--style-radius-s)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <span
              style={{
                fontSize: 'calc(var(--base-body-size) * 0.85)',
                fontWeight: 500,
                color: 'var(--theme-elevation-600)',
              }}
            >
              Selected ({selectedStyles.length})
            </span>
            {selectedStyles.length > 1 && (
              <button
                type="button"
                onClick={handleClearAll}
                style={{
                  padding: '2px 8px',
                  fontSize: 'calc(var(--base-body-size) * 0.8)',
                  backgroundColor: 'transparent',
                  color: 'var(--theme-elevation-500)',
                  border: '1px solid var(--theme-elevation-200)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--theme-error-50)'
                  e.currentTarget.style.borderColor = 'var(--theme-error-200)'
                  e.currentTarget.style.color = 'var(--theme-error-500)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.borderColor = 'var(--theme-elevation-200)'
                  e.currentTarget.style.color = 'var(--theme-elevation-500)'
                }}
              >
                Clear all
              </button>
            )}
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
            }}
          >
            {visibleTags.map((style) => (
              <SelectedStyleTag
                key={style.styleId}
                style={style}
                onRemove={handleRemoveStyle}
                isDefault={style.styleId === defaultStyleId && selectedStyles.length === 1}
              />
            ))}
            {!showAllTags && selectedStyles.length > MAX_VISIBLE_TAGS && (
              <button
                type="button"
                onClick={() => setShowAllTags(true)}
                style={{
                  padding: '4px 8px',
                  backgroundColor: 'var(--theme-elevation-100)',
                  border: '1px solid var(--theme-elevation-200)',
                  borderRadius: '4px',
                  fontSize: 'calc(var(--base-body-size) * 0.85)',
                  color: 'var(--theme-text)',
                  cursor: 'pointer',
                }}
              >
                +{selectedStyles.length - MAX_VISIBLE_TAGS} more
              </button>
            )}
            {showAllTags && selectedStyles.length > MAX_VISIBLE_TAGS && (
              <button
                type="button"
                onClick={() => setShowAllTags(false)}
                style={{
                  padding: '4px 8px',
                  backgroundColor: 'var(--theme-elevation-100)',
                  border: '1px solid var(--theme-elevation-200)',
                  borderRadius: '4px',
                  fontSize: 'calc(var(--base-body-size) * 0.85)',
                  color: 'var(--theme-text)',
                  cursor: 'pointer',
                }}
              >
                Show less
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search and Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '4px',
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search styles..."
            style={{
              width: '100%',
              padding: '8px 32px 8px 12px',
              fontSize: 'var(--base-body-size)',
              border: '1px solid var(--theme-elevation-150)',
              borderRadius: 'var(--style-radius-s)',
              backgroundColor: 'var(--theme-input-bg)',
              color: 'var(--theme-text)',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--theme-elevation-400)',
                padding: '4px',
              }}
            >
              <XCircle size={14} />
            </button>
          )}
        </div>

        {/* Bulk Actions */}
        <button
          type="button"
          onClick={handleSelectAll}
          disabled={isLoading || visibleStyles.length === 0}
          style={{
            padding: '8px 12px',
            fontSize: 'calc(var(--base-body-size) * 0.9)',
            backgroundColor: 'var(--theme-elevation-100)',
            color: 'var(--theme-text)',
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: 'var(--style-radius-s)',
            cursor: isLoading || visibleStyles.length === 0 ? 'not-allowed' : 'pointer',
            opacity: isLoading || visibleStyles.length === 0 ? 0.5 : 1,
          }}
        >
          Select All
        </button>
        <button
          type="button"
          onClick={handleClearAll}
          disabled={isLoading || selectedStyleIds.size <= 1}
          style={{
            padding: '8px 12px',
            fontSize: 'calc(var(--base-body-size) * 0.9)',
            backgroundColor: 'var(--theme-elevation-100)',
            color: 'var(--theme-text)',
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: 'var(--style-radius-s)',
            cursor: isLoading || selectedStyleIds.size <= 1 ? 'not-allowed' : 'pointer',
            opacity: isLoading || selectedStyleIds.size <= 1 ? 0.5 : 1,
          }}
        >
          Clear
        </button>
      </div>

      {/* Style Options Container */}
      <div
        style={{
          border: '1px solid var(--theme-elevation-150)',
          borderRadius: 'var(--style-radius-s)',
          backgroundColor: 'var(--theme-input-bg)',
          maxHeight: '300px',
          overflowY: 'auto',
        }}
      >
        {/* Loading State */}
        {isLoading && <LoadingSkeleton />}

        {/* Error State */}
        {error && !isLoading && <ErrorDisplay message={error} onRetry={refetch} />}

        {/* Style Options */}
        {!isLoading && !error && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              padding: '8px',
            }}
          >
            {visibleStyles.length === 0 ? (
              <div
                style={{
                  padding: '16px',
                  textAlign: 'center',
                  color: 'var(--theme-elevation-500)',
                  fontSize: 'var(--base-body-size)',
                }}
              >
                {searchQuery ? `No styles found matching "${searchQuery}"` : 'No styles available'}
              </div>
            ) : (
              visibleStyles.map((style) => (
                <StyleOption
                  key={style.styleId}
                  style={style}
                  isSelected={selectedStyleIds.has(style.styleId)}
                  onToggle={handleToggle}
                  isDefault={style.styleId === defaultStyleId}
                />
              ))
            )}

            {/* Show More Button */}
            {!showAll && filteredStyles.length > MAX_VISIBLE_STYLES && (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                style={{
                  padding: '12px',
                  marginTop: '8px',
                  fontSize: 'var(--base-body-size)',
                  backgroundColor: 'var(--theme-elevation-50)',
                  color: 'var(--theme-text)',
                  border: '1px solid var(--theme-elevation-150)',
                  borderRadius: 'var(--style-radius-s)',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                Show {filteredStyles.length - MAX_VISIBLE_STYLES} more styles...
              </button>
            )}
          </div>
        )}
      </div>

      {/* Selection Summary */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 'calc(var(--base-body-size) * 0.9)',
          color: 'var(--theme-elevation-500)',
          marginTop: '4px',
        }}
      >
        <span>
          <strong style={{ color: 'var(--theme-success-500)' }}>{selectedStyleIds.size}</strong> style(s)
          selected
        </span>
        <span>
          {totalCount} total available
        </span>
      </div>
    </div>
  )
}

export default StyleSelectorField
