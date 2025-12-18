/**
 * Retry Failed Endpoint
 *
 * POST /api/tasks/{id}/retry-failed
 *
 * Resets all failed sub-tasks for a task to pending
 * and re-queues generate-image jobs.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { TaskStatus, SubTaskStatus, AspectRatio } from '../../lib/types'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const payload = await getPayload({ config })
  const taskId = params.id

  try {
    // Find the task
    const task = await payload.findByID({
      collection: 'tasks',
      id: taskId,
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Not found', message: `Task with ID ${taskId} not found` },
        { status: 404 }
      )
    }

    // Validate task is not currently processing
    if (task.status === TaskStatus.Processing || task.status === TaskStatus.Expanding) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: `Cannot retry while task is ${task.status}. Wait for current processing to complete.`,
        },
        { status: 400 }
      )
    }

    // Find all failed sub-tasks for this task
    const failedSubTasks = await payload.find({
      collection: 'sub-tasks',
      where: {
        parentTask: { equals: taskId },
        status: { equals: SubTaskStatus.Failed },
      },
      limit: 10000, // Get all failed
    })

    if (failedSubTasks.totalDocs === 0) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'No failed sub-tasks to retry',
        },
        { status: 400 }
      )
    }

    console.log(`[retry-failed] Found ${failedSubTasks.totalDocs} failed sub-tasks for task ${taskId}`)

    // Reset each failed sub-task and queue new job
    let retriedCount = 0
    for (const subTask of failedSubTasks.docs) {
      // Reset the sub-task
      await payload.update({
        collection: 'sub-tasks',
        id: String(subTask.id),
        data: {
          status: SubTaskStatus.Pending,
          retryCount: 0,
          errorLog: null,
          errorCategory: null,
          startedAt: null,
          completedAt: null,
        },
      })

      // Queue generate-image job
      const aspectRatio = (subTask as { aspectRatio?: AspectRatio }).aspectRatio || AspectRatio.Square
      await payload.jobs.queue({
        task: 'generate-image',
        input: {
          subTaskId: String(subTask.id),
          modelId: (subTask as { modelId?: string }).modelId || '',
          finalPrompt: (subTask as { finalPrompt?: string }).finalPrompt || '',
          negativePrompt: (subTask as { negativePrompt?: string }).negativePrompt || '',
          aspectRatio,
        },
      })

      retriedCount++
    }

    // Update parent task status to processing
    await payload.update({
      collection: 'tasks',
      id: taskId,
      data: {
        status: TaskStatus.Processing,
      },
    })

    console.log(`[retry-failed] Retried ${retriedCount} sub-tasks for task ${taskId}`)

    return NextResponse.json({
      success: true,
      message: `Retried ${retriedCount} failed sub-tasks`,
      taskId,
      retriedCount,
    })
  } catch (error) {
    console.error(`[retry-failed] Error retrying failed sub-tasks for task ${taskId}:`, error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
