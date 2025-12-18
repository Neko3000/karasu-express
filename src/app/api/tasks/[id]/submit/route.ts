/**
 * API Route: POST /api/tasks/[id]/submit
 *
 * Submit a task for processing
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { TaskStatus, DEFAULT_VARIANT_COUNT } from '../../../../../lib/types'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await getPayload({ config })
  const { id: taskId } = await params

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

    // Validate task is in draft status
    if (task.status !== TaskStatus.Draft) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: `Task must be in draft status to submit. Current status: ${task.status}`,
        },
        { status: 400 }
      )
    }

    // Validate task has at least one style
    const styles = Array.isArray(task.styles) ? task.styles : []
    if (styles.length === 0) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'At least one style must be selected',
        },
        { status: 400 }
      )
    }

    // Validate task has at least one model
    const models = Array.isArray(task.models) ? task.models : []
    if (models.length === 0) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'At least one model must be selected',
        },
        { status: 400 }
      )
    }

    // Validate subject is not empty
    if (!task.subject || task.subject.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'Subject is required',
        },
        { status: 400 }
      )
    }

    // Update task status to queued
    await payload.update({
      collection: 'tasks',
      id: taskId,
      data: {
        status: TaskStatus.Queued,
      },
    })

    // Get batch config
    const batchConfig = task.batchConfig as { variantCount?: number } || {}
    const variantCount = batchConfig.variantCount || DEFAULT_VARIANT_COUNT
    const webSearchEnabled = (task as { webSearchEnabled?: boolean }).webSearchEnabled || false

    // Queue the expand-prompt job
    await payload.jobs.queue({
      task: 'expand-prompt',
      input: {
        taskId,
        subject: task.subject,
        variantCount,
        webSearchEnabled,
      },
    })

    console.log(`[submit-task] Task ${taskId} submitted and expand-prompt job queued`)

    return NextResponse.json({
      success: true,
      message: 'Task submitted successfully',
      taskId,
      status: TaskStatus.Queued,
    })
  } catch (error) {
    console.error(`[submit-task] Error submitting task ${taskId}:`, error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
