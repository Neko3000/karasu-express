'use client'

import React, { useCallback } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { Download, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import { formatFileSize } from '@/lib/format'
import { copyToClipboard } from '@/lib/clipboard'
import { ImagePreview } from './ImagePreview'
import { MetadataBadge } from './MetadataBadge'
import { RelativeTime } from './RelativeTime'
import type { MediaDocument } from './types'
import styles from './MediaDetailView.module.css'

function extractFormat(mimeType?: string): string {
  if (!mimeType) return 'Unknown'
  const parts = mimeType.split('/')
  return (parts[1] || mimeType).toUpperCase()
}

function getSubtaskId(relatedSubtask?: string | { id: string }): string | null {
  if (!relatedSubtask) return null
  if (typeof relatedSubtask === 'string') return relatedSubtask
  return relatedSubtask.id
}

export function MediaDetailView() {
  const { data, isInitializing } = useDocumentInfo()

  const media = data as MediaDocument | undefined

  const handleDownload = useCallback(() => {
    if (!media?.url || !media?.filename) return
    const link = document.createElement('a')
    link.href = media.url
    link.download = media.filename
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [media?.url, media?.filename])

  const handleCopyPrompt = useCallback(async () => {
    const prompt = media?.generationMeta?.finalPrompt
    if (!prompt) return
    const success = await copyToClipboard(prompt)
    if (success) {
      toast.success('Prompt copied to clipboard')
    } else {
      toast.error('Failed to copy prompt')
    }
  }, [media?.generationMeta?.finalPrompt])

  if (isInitializing || !media) {
    return null
  }

  // Don't render on create-new pages (no ID yet)
  if (!media.id) {
    return null
  }

  const generationMeta = media.generationMeta
  const subtaskId = getSubtaskId(media.relatedSubtask)

  return (
    <div className="twp">
      <div className={styles.container}>
        {/* Image Preview Section */}
        <div className={styles.previewSection}>
          <ImagePreview
            src={media.url}
            alt={media.filename}
            width={media.width}
            height={media.height}
          />
        </div>

        <hr className={styles.divider} />

        {/* Basic Info Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Basic Info</h2>
          <div className={styles.infoGrid}>
            <span className={styles.infoLabel}>Filename</span>
            <span className={styles.infoValue}>{media.filename}</span>

            {media.width && media.height && (
              <>
                <span className={styles.infoLabel}>Dimensions</span>
                <span className={styles.infoValue}>
                  {media.width} × {media.height} px
                </span>
              </>
            )}

            <span className={styles.infoLabel}>Format</span>
            <span className={styles.infoValue}>{extractFormat(media.mimeType)}</span>

            {media.filesize != null && (
              <>
                <span className={styles.infoLabel}>File Size</span>
                <span className={styles.infoValue}>{formatFileSize(media.filesize)}</span>
              </>
            )}

            <span className={styles.infoLabel}>Created</span>
            <span className={styles.infoValue}>
              <RelativeTime timestamp={media.createdAt} />
            </span>
          </div>
        </div>

        {/* Generation Info Section (conditionally rendered) */}
        {generationMeta && (
          <>
            <hr className={styles.divider} />
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Generation Info</h2>
              <div className={styles.infoGrid}>
                {subtaskId && (
                  <>
                    <span className={styles.infoLabel}>SubTask</span>
                    <span className={styles.infoValue}>
                      <a
                        href={`/admin/collections/sub-tasks/${subtaskId}`}
                        className={styles.subtaskLink}
                      >
                        {subtaskId}
                      </a>
                    </span>
                  </>
                )}

                <span className={styles.infoLabel}>Model / Style</span>
                <div className={styles.badgeRow}>
                  <MetadataBadge label={generationMeta.modelId} variant="primary" />
                  <MetadataBadge label={generationMeta.styleId} variant="secondary" />
                  <MetadataBadge label={generationMeta.aspectRatio} variant="default" />
                </div>

                <span className={styles.infoLabel}>Prompt</span>
                <div className={styles.promptText}>
                  {generationMeta.finalPrompt}
                </div>

                {generationMeta.negativePrompt && (
                  <>
                    <span className={styles.infoLabel}>Negative Prompt</span>
                    <div className={styles.promptText}>
                      {generationMeta.negativePrompt}
                    </div>
                  </>
                )}

                <span className={styles.infoLabel}>Seed</span>
                <span className={styles.infoValue}>
                  <code className={styles.mono}>{generationMeta.seed}</code>
                </span>

                {generationMeta.providerParams &&
                  Object.keys(generationMeta.providerParams).length > 0 && (
                    <>
                      <span className={styles.infoLabel}>Parameters</span>
                      <pre className={styles.jsonBlock}>
                        {JSON.stringify(generationMeta.providerParams, null, 2)}
                      </pre>
                    </>
                  )}
              </div>
            </div>
          </>
        )}

        <hr className={styles.divider} />

        {/* Actions Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Actions</h2>
          <div className={styles.actions}>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="twp:size-4" />
              Download
            </Button>
            {generationMeta?.finalPrompt && (
              <Button variant="outline" size="sm" onClick={handleCopyPrompt}>
                <Copy className="twp:size-4" />
                Copy Prompt
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Toast notifications */}
      <Toaster position="bottom-right" />
    </div>
  )
}
