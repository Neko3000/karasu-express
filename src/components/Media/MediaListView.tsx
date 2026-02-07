'use client'

import React, { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { DefaultListView, useListQuery } from '@payloadcms/ui'
import type { ListViewClientProps } from 'payload'
import { useViewPreference } from '@/hooks/useViewPreference'
import { MediaListHeader } from './MediaListHeader'
import { MediaGalleryView } from './MediaGalleryView'
import type { MediaDocument } from './types'

export function MediaListView(props: ListViewClientProps) {
  const { view, setView } = useViewPreference('list')
  const { data } = useListQuery()
  const router = useRouter()

  const docs = (data?.docs ?? []) as MediaDocument[]
  const totalDocs = data?.totalDocs ?? 0

  const handleImageClick = useCallback(
    (id: string) => {
      router.push(`/admin/collections/media/${id}`)
    },
    [router],
  )

  if (view === 'gallery') {
    return (
      <>
        <MediaListHeader
          viewMode={view}
          onViewModeChange={setView}
          totalCount={totalDocs}
        />
        <MediaGalleryView images={docs} onImageClick={handleImageClick} />
      </>
    )
  }

  // List mode: render header + default Payload list view
  return (
    <>
      <MediaListHeader
        viewMode={view}
        onViewModeChange={setView}
        totalCount={totalDocs}
      />
      <DefaultListView {...props} />
    </>
  )
}
