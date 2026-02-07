'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ViewMode } from '@/components/Media/types'

const STORAGE_KEY = 'karasu-media-view-preference'

function isValidViewMode(value: unknown): value is ViewMode {
  return value === 'list' || value === 'gallery'
}

export interface UseViewPreferenceReturn {
  view: ViewMode
  setView: (mode: ViewMode) => void
}

export function useViewPreference(defaultView: ViewMode = 'list'): UseViewPreferenceReturn {
  const [view, setViewState] = useState<ViewMode>(defaultView)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (isValidViewMode(stored)) {
        setViewState(stored)
      }
    } catch {
      // localStorage unavailable (SSR, privacy mode)
    }
  }, [])

  const setView = useCallback((newView: ViewMode) => {
    setViewState(newView)
    try {
      localStorage.setItem(STORAGE_KEY, newView)
    } catch {
      // localStorage unavailable
    }
  }, [])

  return { view, setView }
}
