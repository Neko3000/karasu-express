/**
 * POST /api/tasks/{id}/cancel - Cancel Task Endpoint
 *
 * Cancels an in-progress task by:
 * 1. Updating the task status to 'cancelled'
 * 2. Updating all pending sub-tasks to 'cancelled' status
 * 3. Leaving completed and in-progress sub-tasks unchanged
 *
 * Phase 7 (User Story 4): Task Monitoring and Management
 *
 * Per spec.md Session 2026-01-14 clarifications:
 * - Cancel stops new sub-tasks but completes current
 * - Already generated assets are retained
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import {
  TaskStatus,
  SubTaskStatus,
  type CancelTaskResponse,
} from '@/lib/types'
import { canCancelTask } from '@/services/task-manager'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<CancelTaskResponse | { error: string }>> {
  try {
    const { id: taskId } = await params
    const payload = await getPayload({ config: configPromise })

    // Get the task to verify it exists and can be cancelled
    const task = await payload.findByID({
      collection: 'tasks',
      id: taskId,
    })

    if (!task) {
      return NextResponse.json(
        { error: `Task ${taskId} not found` },
        { status: 404 }
      )
    }

    const currentStatus = task.status as TaskStatus

    // Check if task can be cancelled
    if (!canCancelTask(currentStatus)) {
      return NextResponse.json(
        {
          error: `Task cannot be cancelled in current status: ${currentStatus}. Only processing, expanding, or queued tasks can be cancelled.`,
        },
        { status: 400 }
      )
    }

    // Get all sub-tasks for this task
    const subTasksResult = await payload.find({
      collection: 'sub-tasks',
      where: {
        parentTask: {
          equals: taskId,
        },
      },
      limit: 10000, // Get all
    })

    // Count sub-tasks by status before cancellation
    let cancelledCount = 0
    let completedCount = 0
    let alreadyCancelledCount = 0

    // Update pending sub-tasks to cancelled
    for (const subTask of subTasksResult.docs) {
      const subTaskStatus = subTask.status as SubTaskStatus

      if (subTaskStatus === SubTaskStatus.Pending) {
        // Cancel pending sub-tasks
        await payload.update({
          collection: 'sub-tasks',
          id: String(subTask.id),
          data: {
            status: SubTaskStatus.Cancelled,
            completedAt: new Date().toISOString(),
          },
        })
        cancelledCount++
      } else if (subTaskStatus === SubTaskStatus.Success) {
        completedCount++
      } else if (subTaskStatus === SubTaskStatus.Cancelled) {
        alreadyCancelledCount++
      }
      // Processing and Failed sub-tasks are left unchanged
    }

    // Update task status to cancelled
    await payload.update({
      collection: 'tasks',
      id: taskId,
      data: {
        status: TaskStatus.Cancelled,
      },
    })

    console.log(
      `[cancel-task] Task ${taskId} cancelled. Cancelled ${cancelledCount} pending sub-tasks, ${completedCount} already completed.`
    )

    return NextResponse.json({
      message: 'Task cancelled successfully',
      cancelledSubTasks: cancelledCount,
      completedSubTasks: completedCount,
    })
  } catch (error) {
    console.error('[cancel-task] Error cancelling task:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
