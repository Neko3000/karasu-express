/**
 * POST /api/sub-tasks/{id}/retry - Retry SubTask Endpoint
 *
 * Retries a failed sub-task by:
 * 1. Clearing errorLog and errorCategory
 * 2. Resetting status to 'pending' and retryCount to 0
 * 3. Re-queuing the generate-image job
 *
 * Phase 7 (User Story 4): Task Monitoring and Management
 *
 * Per spec.md Session 2026-01-14 clarifications:
 * - Retry updates existing sub-task in place (clears error state)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import {
  SubTaskStatus,
  TaskStatus,
  AspectRatio,
  type RetrySubTaskResponse,
  type ExpandedPrompt,
} from '@/lib/types'
import { canRetrySubTask } from '@/services/task-manager'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<RetrySubTaskResponse | { error: string }>> {
  try {
    const { id: subTaskId } = await params
    const payload = await getPayload({ config: configPromise })

    // Get the sub-task to verify it exists and can be retried
    const subTask = await payload.findByID({
      collection: 'sub-tasks',
      id: subTaskId,
    })

    if (!subTask) {
      return NextResponse.json(
        { error: `SubTask ${subTaskId} not found` },
        { status: 404 }
      )
    }

    const currentStatus = subTask.status as SubTaskStatus

    // Check if sub-task can be retried
    if (!canRetrySubTask(currentStatus)) {
      return NextResponse.json(
        {
          error: `SubTask cannot be retried in current status: ${currentStatus}. Only failed sub-tasks can be retried.`,
        },
        { status: 400 }
      )
    }

    // Check if parent task is in a valid state for retrying sub-tasks
    const parentTaskId = typeof subTask.parentTask === 'string'
      ? subTask.parentTask
      : (subTask.parentTask as { id?: string })?.id

    if (!parentTaskId) {
      return NextResponse.json(
        { error: 'SubTask has no valid parent task reference' },
        { status: 400 }
      )
    }

    const parentTask = await payload.findByID({
      collection: 'tasks',
      id: parentTaskId,
    })

    if (!parentTask) {
      return NextResponse.json(
        { error: `Parent task ${parentTaskId} not found` },
        { status: 404 }
      )
    }

    const parentStatus = parentTask.status as TaskStatus

    // Don't allow retry if parent task is cancelled
    if (parentStatus === TaskStatus.Cancelled) {
      return NextResponse.json(
        { error: 'Cannot retry sub-task: parent task is cancelled' },
        { status: 400 }
      )
    }

    // Update sub-task: clear error state and reset to pending
    await payload.update({
      collection: 'sub-tasks',
      id: subTaskId,
      data: {
        status: SubTaskStatus.Pending,
        retryCount: 0,
        errorLog: null,
        errorCategory: null,
        startedAt: null,
        completedAt: null,
      },
    })

    // If parent task was in partial_failed or completed state, update to processing
    if (
      parentStatus === TaskStatus.PartialFailed ||
      parentStatus === TaskStatus.Completed ||
      parentStatus === TaskStatus.Failed
    ) {
      await payload.update({
        collection: 'tasks',
        id: parentTaskId,
        data: {
          status: TaskStatus.Processing,
        },
      })
    }

    // Queue the generate-image job for retry
    const expandedPrompt = subTask.expandedPrompt as ExpandedPrompt | null
    const finalPrompt = String(subTask.finalPrompt || '')
    const negativePrompt = subTask.negativePrompt ? String(subTask.negativePrompt) : undefined
    const aspectRatio = (subTask.aspectRatio as AspectRatio) || AspectRatio.Square
    const modelId = String(subTask.modelId || '')
    const seed = subTask.seed != null ? Number(subTask.seed) : undefined

    // Queue the job
    await payload.jobs.queue({
      task: 'generate-image',
      input: {
        subTaskId,
        modelId,
        finalPrompt,
        negativePrompt,
        aspectRatio,
        seed,
      },
    })

    console.log(
      `[retry-subtask] SubTask ${subTaskId} re-queued for generation. Parent task: ${parentTaskId}`
    )

    return NextResponse.json({
      message: 'SubTask re-queued',
      subTaskId,
      newStatus: SubTaskStatus.Pending,
    })
  } catch (error) {
    console.error('[retry-subtask] Error retrying sub-task:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
