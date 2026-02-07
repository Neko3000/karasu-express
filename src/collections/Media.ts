/**
 * Media Collection
 *
 * PayloadCMS Upload Collection for generated images/videos.
 * Stores generated assets with metadata linking back to generation context.
 *
 * Per data-model.md specifications.
 */

import type { CollectionConfig } from 'payload'
import { ASSET_TYPE_OPTIONS, AssetType } from '../lib/types'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['preview', 'filename', 'assetType', 'relatedSubtask', 'createdAt'],
    group: 'Generation',
    description: 'Generated images and videos',
    pagination: {
      defaultLimit: 100,
      limits: [25, 50, 100, 200],
    },
    components: {
      views: {
        list: {
          Component: '/components/Media/MediaListView#MediaListView',
        },
      },
    },
  },
  access: {
    read: () => true,
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  fields: [
    // ============================================
    // Preview Field (List View Cell only)
    // ============================================
    {
      name: 'preview',
      type: 'ui',
      admin: {
        components: {
          Cell: '/components/Media/MediaThumbnailCell#MediaThumbnailCell',
        },
      },
    },

    // ============================================
    // Detail View (Rendered in Edit Page Main Content)
    // ============================================
    {
      name: 'mediaDetail',
      type: 'ui',
      admin: {
        components: {
          Field: '/components/Media/MediaDetailView#MediaDetailView',
        },
      },
    },

    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description: 'Alt text for accessibility',
        hidden: true,
      },
    },

    // ============================================
    // Generation Context
    // ============================================
    {
      name: 'relatedSubtask',
      type: 'relationship',
      relationTo: 'sub-tasks',
      admin: {
        description: 'Source SubTask reference',
        hidden: true,
      },
      index: true,
    },
    {
      name: 'assetType',
      type: 'select',
      options: ASSET_TYPE_OPTIONS,
      defaultValue: AssetType.Image,
      admin: {
        description: 'Asset type (image or video)',
        hidden: true,
      },
    },

    // ============================================
    // Generation Metadata
    // ============================================
    {
      name: 'generationMeta',
      type: 'json',
      admin: {
        description: 'Generation parameters snapshot',
        readOnly: true,
        hidden: true,
      },
    },

    // ============================================
    // Quick Access Fields (denormalized for filtering)
    // ============================================
    {
      name: 'taskId',
      type: 'text',
      admin: {
        description: 'Parent task ID for quick filtering',
        readOnly: true,
        hidden: true,
      },
      index: true,
    },
    {
      name: 'styleId',
      type: 'text',
      admin: {
        description: 'Style ID for quick filtering',
        readOnly: true,
        hidden: true,
      },
      index: true,
    },
    {
      name: 'modelId',
      type: 'text',
      admin: {
        description: 'Model ID for quick filtering',
        readOnly: true,
        hidden: true,
      },
      index: true,
    },
    {
      name: 'subjectSlug',
      type: 'text',
      admin: {
        description: 'Subject slug for quick filtering',
        readOnly: true,
        hidden: true,
      },
      index: true,
    },
  ],
  upload: {
    staticDir: 'media',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 768,
        height: 1024,
        position: 'centre',
      },
    ],
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*', 'video/*'],
  },
}
