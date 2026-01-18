'use client'

/**
 * useSubmitTask Hook
 *
 * State management hook for task submission workflow. Manages:
 * - Saving the task via PayloadCMS form before submission
 * - Calling POST /api/tasks/{id}/submit endpoint
 * - Tracking submission state (idle, saving, submitting, success, error)
 * - Providing error messages for validation failures
 * - Handling redirect or success callback after submission
 *
 * Part of Phase 5: Submit Button for Task Creation Page
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { useDocumentInfo, useForm } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'

/**
 * Submission states
 */
export type SubmissionState = 'idle' | 'saving' | 'submitting' | 'success' | 'error'

/**
 * Submit response from the API
 */
interface SubmitTaskResponse {
  success?: boolean
  message?: string
  error?: string
  taskId?: string
  status?: string
}

/**
 * Hook state
 */
export interface SubmitTaskState {
  /** Current submission state */
  state: SubmissionState
  /** Error message if submission failed */
  error: string | null
  /** Task ID after successful submission */
  taskId: string | null
  /** Whether the task has been saved (has an ID) */
  isSaved: boolean
  /** Whether the form is valid for submission */
  isValid: boolean
}

/**
 * Hook actions
 */
export interface SubmitTaskActions {
  /** Start the submission process (save + submit) */
  submit: () => Promise<void>
  /** Retry after error */
  retry: () => Promise<void>
  /** Reset to initial state */
  reset: () => void
  /** Navigate to the submitted task's detail page */
  navigateToTask: () => void
  /** Navigate to create a new task */
  createNewTask: () => void
}

/**
 * Initial state
 */
const initialState: SubmitTaskState = {
  state: 'idle',
  error: null,
  taskId: null,
  isSaved: false,
  isValid: false,
}

/**
 * Validation function to check if form data is valid for submission
 */
function validateFormData(fields: Record<string, unknown>): { isValid: boolean; error?: string } {
  // Check subject
  const subject = fields.subject as string | undefined
  if (!subject || subject.trim().length < 2) {
    return { isValid: false, error: 'Subject is required (at least 2 characters)' }
  }

  // Check models
  const models = fields.models as string[] | undefined
  if (!models || models.length === 0) {
    return { isValid: false, error: 'At least one model must be selected' }
  }

  // Check styles (either from importedStyleIds or styles)
  const importedStyleIds = fields.importedStyleIds as string[] | undefined
  const styles = fields.styles as string[] | undefined
  if ((!importedStyleIds || importedStyleIds.length === 0) && (!styles || styles.length === 0)) {
    return { isValid: false, error: 'At least one style must be selected' }
  }

  return { isValid: true }
}

/**
 * useSubmitTask - Hook for managing task submission workflow
 */
export function useSubmitTask(): [SubmitTaskState, SubmitTaskActions] {
  const [state, setState] = useState<SubmitTaskState>(initialState)
  const router = useRouter()

  // Get document info from PayloadCMS
  const documentInfo = useDocumentInfo()
  const { submit: formSubmit, getFields } = useForm()

  // AbortController for cancelling in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null)

  // Track current state for use in callbacks
  const stateRef = useRef(state)
  stateRef.current = state

  // Get document ID - could be string or undefined for new documents
  const docId = documentInfo?.id as string | undefined

  // Update isSaved and validate when form changes
  useEffect(() => {
    const fields = getFields()
    const fieldValues: Record<string, unknown> = {}

    // Extract values from fields
    Object.entries(fields).forEach(([key, field]) => {
      if (field && typeof field === 'object' && 'value' in field) {
        fieldValues[key] = (field as { value: unknown }).value
      }
    })

    const validation = validateFormData(fieldValues)

    setState((prev) => ({
      ...prev,
      isSaved: !!docId,
      isValid: validation.isValid,
    }))
  }, [docId, getFields])

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    setState(initialState)
  }, [])

  /**
   * Call the submit API
   */
  const callSubmitApi = useCallback(
    async (taskId: string, signal: AbortSignal): Promise<SubmitTaskResponse> => {
      const response = await fetch(`/api/tasks/${taskId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || `Failed with status ${response.status}`)
      }

      return data
    },
    []
  )

  /**
   * Main submit function
   * 1. Save the form first (if needed)
   * 2. Call the submit API
   */
  const submit = useCallback(async () => {
    // Validate before submission
    const fields = getFields()
    const fieldValues: Record<string, unknown> = {}

    Object.entries(fields).forEach(([key, field]) => {
      if (field && typeof field === 'object' && 'value' in field) {
        fieldValues[key] = (field as { value: unknown }).value
      }
    })

    const validation = validateFormData(fieldValues)
    if (!validation.isValid) {
      setState((prev) => ({
        ...prev,
        state: 'error',
        error: validation.error || 'Form validation failed',
      }))
      return
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      // Step 1: Save the form first
      setState((prev) => ({ ...prev, state: 'saving', error: null }))

      // Use PayloadCMS form submit to save
      // This will create/update the document and give us an ID
      await formSubmit()

      // After form submit, check for the document ID
      // Note: formSubmit may redirect on success for new documents
      // For new documents, we need to handle differently
      let taskId = docId

      // If no ID yet, the form submission should have created the document
      // We need to wait a moment for the ID to be available
      if (!taskId) {
        // For new documents, formSubmit redirects to the edit page
        // We can try to extract the ID from the URL after a brief delay
        await new Promise(resolve => setTimeout(resolve, 100))

        // Check if we now have an ID
        const newDocId = documentInfo?.id as string | undefined
        if (newDocId) {
          taskId = newDocId
        } else {
          throw new Error('Failed to save task - document ID not available')
        }
      }

      // Check if aborted
      if (abortController.signal.aborted) {
        return
      }

      // Step 2: Call submit API
      setState((prev) => ({ ...prev, state: 'submitting' }))

      const response = await callSubmitApi(taskId, abortController.signal)

      // Check if aborted
      if (abortController.signal.aborted) {
        return
      }

      if (!response.success) {
        throw new Error(response.message || response.error || 'Submission failed')
      }

      // Success!
      setState((prev) => ({
        ...prev,
        state: 'success',
        taskId: response.taskId || taskId,
        error: null,
      }))

    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }

      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setState((prev) => ({
        ...prev,
        state: 'error',
        error: errorMessage,
      }))
    }
  }, [getFields, formSubmit, docId, documentInfo?.id, callSubmitApi])

  /**
   * Retry after error
   */
  const retry = useCallback(async () => {
    await submit()
  }, [submit])

  /**
   * Navigate to the submitted task's detail page
   */
  const navigateToTask = useCallback(() => {
    const taskId = stateRef.current.taskId
    if (taskId) {
      router.push(`/admin/collections/tasks/${taskId}`)
    }
  }, [router])

  /**
   * Navigate to create a new task
   */
  const createNewTask = useCallback(() => {
    router.push('/admin/collections/tasks/create')
  }, [router])

  return [
    state,
    {
      submit,
      retry,
      reset,
      navigateToTask,
      createNewTask,
    },
  ]
}

export default useSubmitTask
