'use client'

import { LayoutList, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ViewMode } from './types'

export interface MediaListHeaderProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  totalCount?: number
  className?: string
}

export function MediaListHeader({
  viewMode,
  onViewModeChange,
  totalCount,
  className,
}: MediaListHeaderProps) {
  return (
    <div className="twp">
      <div className={cn('twp:flex twp:items-center twp:justify-between twp:mb-4', className)}>
        <div className="twp:flex twp:items-center twp:gap-2">
          {totalCount !== undefined && (
            <span className="twp:text-sm twp:text-muted-foreground">
              {totalCount} {totalCount === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>
        <div className="twp:flex twp:items-center twp:gap-1 twp:border twp:rounded-md twp:p-0.5">
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="icon-xs"
            onClick={() => onViewModeChange('list')}
            aria-label="List view"
            aria-pressed={viewMode === 'list'}
          >
            <LayoutList className="twp:size-3.5" />
          </Button>
          <Button
            variant={viewMode === 'gallery' ? 'default' : 'ghost'}
            size="icon-xs"
            onClick={() => onViewModeChange('gallery')}
            aria-label="Gallery view"
            aria-pressed={viewMode === 'gallery'}
          >
            <LayoutGrid className="twp:size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
