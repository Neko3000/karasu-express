/**
 * SubTasks Collection
 *
 * Individual API request to an AI provider.
 * Atomic execution unit for the job queue.
 *
 * Per data-model.md specifications.
 */

import type { CollectionConfig } from 'payload'
import {
  SubTaskStatus,
  SUBTASK_STATUS_OPTIONS,
  ERROR_CATEGORY_OPTIONS,
  MAX_RETRY_ATTEMPTS,
} from '../lib/types'

export const SubTasks: CollectionConfig = {
  slug: 'sub-tasks',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['parentTask', 'status', 'styleId', 'modelId', 'batchIndex', 'createdAt'],
    group: 'Generation',
    description: 'Individual image generation sub-tasks',
  },
  access: {
    read: () => true,
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  fields: [
    // ============================================
    // Relationships
    // ============================================
    {
      name: 'parentTask',
      type: 'relationship',
      relationTo: 'tasks',
      required: true,
      index: true,
      admin: {
        description: 'Reference to parent Task',
      },
    },

    // ============================================
    // Status & Locking
    // ============================================
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: SubTaskStatus.Pending,
      options: SUBTASK_STATUS_OPTIONS,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Execution status',
      },
    },
    {
      name: 'lockedBy',
      type: 'text',
      admin: {
        description: 'Current worker ID (lock mechanism)',
        readOnly: true,
      },
    },
    {
      name: 'lockExpiresAt',
      type: 'date',
      admin: {
        description: 'Lock expiration time',
        readOnly: true,
      },
    },

    // ============================================
    // Generation Parameters
    // ============================================
    {
      name: 'styleId',
      type: 'text',
      required: true,
      admin: {
        description: 'Applied style template ID',
      },
    },
    {
      name: 'modelId',
      type: 'text',
      required: true,
      admin: {
        description: 'Target AI model ID',
      },
    },
    {
      name: 'expandedPrompt',
      type: 'json',
      required: true,
      admin: {
        description: 'Prompt variant details (variantId, variantName, expandedPrompt, subjectSlug)',
      },
    },
    {
      name: 'finalPrompt',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Merged prompt (expanded prompt + style modifiers)',
      },
    },
    {
      name: 'negativePrompt',
      type: 'textarea',
      admin: {
        description: 'Negative prompt from style template',
      },
    },
    {
      name: 'batchIndex',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Index within batch (0-based)',
      },
    },
    {
      name: 'aspectRatio',
      type: 'select',
      defaultValue: '1:1',
      options: [
        { label: 'Square (1:1)', value: '1:1' },
        { label: 'Landscape (16:9)', value: '16:9' },
        { label: 'Portrait (9:16)', value: '9:16' },
        { label: 'Standard (4:3)', value: '4:3' },
        { label: 'Standard Portrait (3:4)', value: '3:4' },
      ],
      admin: {
        description: 'Aspect ratio for generation',
      },
    },
    {
      name: 'seed',
      type: 'number',
      admin: {
        description: 'Optional seed for reproducibility',
      },
    },

    // ============================================
    // Observability - Request/Response
    // ============================================
    {
      name: 'requestPayload',
      type: 'json',
      admin: {
        description: 'Raw API request body (schema-less)',
        readOnly: true,
      },
    },
    {
      name: 'responseData',
      type: 'json',
      admin: {
        description: 'Raw API response (schema-less)',
        readOnly: true,
      },
    },

    // ============================================
    // Error Handling
    // ============================================
    {
      name: 'errorLog',
      type: 'textarea',
      admin: {
        description: 'Error message/stack trace',
        readOnly: true,
      },
    },
    {
      name: 'errorCategory',
      type: 'select',
      options: ERROR_CATEGORY_OPTIONS,
      admin: {
        description: 'Normalized error type',
        readOnly: true,
      },
    },
    {
      name: 'retryCount',
      type: 'number',
      required: true,
      defaultValue: 0,
      min: 0,
      max: MAX_RETRY_ATTEMPTS,
      admin: {
        description: `Number of retry attempts (max: ${MAX_RETRY_ATTEMPTS})`,
        readOnly: true,
      },
    },

    // ============================================
    // Timestamps
    // ============================================
    {
      name: 'startedAt',
      type: 'date',
      admin: {
        description: 'Processing start time',
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'completedAt',
      type: 'date',
      admin: {
        description: 'Processing completion time',
        readOnly: true,
        position: 'sidebar',
      },
    },
  ],
  hooks: {
    afterChange: [
      // Update parent task progress when subtask status changes
      async ({ doc, previousDoc, req, operation }) => {
        if (operation === 'update' && previousDoc?.status !== doc.status) {
          // Status changed - update parent task progress
          try {
            const parentTaskId = typeof doc.parentTask === 'string' ? doc.parentTask : doc.parentTask?.id

            if (!parentTaskId) {
              console.warn('[SubTasks] No parent task ID found for progress update')
              return doc
            }

            // Get all subtasks for this parent task
            const allSubTasks = await req.payload.find({
              collection: 'sub-tasks',
              where: {
                parentTask: { equals: parentTaskId },
              },
              limit: 10000, // Get all
            })

            const total = allSubTasks.totalDocs
            const completed = allSubTasks.docs.filter(
              (st) => st.status === SubTaskStatus.Success || st.status === SubTaskStatus.Failed
            ).length
            const failed = allSubTasks.docs.filter(
              (st) => st.status === SubTaskStatus.Failed
            ).length
            const successful = allSubTasks.docs.filter(
              (st) => st.status === SubTaskStatus.Success
            ).length

            // Calculate progress percentage
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0

            // Determine parent task status
            let taskStatus: string
            if (completed === 0) {
              taskStatus = 'processing'
            } else if (completed === total) {
              if (failed === total) {
                taskStatus = 'failed'
              } else if (failed > 0) {
                taskStatus = 'partial_failed'
              } else {
                taskStatus = 'completed'
              }
            } else {
              taskStatus = 'processing'
            }

            // Update parent task
            await req.payload.update({
              collection: 'tasks',
              id: parentTaskId,
              data: {
                progress,
                status: taskStatus,
              },
            })

            console.log(`[SubTasks] Updated parent task ${parentTaskId}: progress=${progress}%, status=${taskStatus}`)
          } catch (error) {
            console.error('[SubTasks] Error updating parent task progress:', error)
          }
        }

        return doc
      },
    ],
  },
  timestamps: true,
}
