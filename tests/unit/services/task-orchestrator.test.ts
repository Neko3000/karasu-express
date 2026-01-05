/**
 * Unit Tests: Task Orchestrator Service
 *
 * Tests for src/services/task-orchestrator.ts
 * Per Constitution Principle VI (Testing Discipline)
 *
 * Test calculateFission with various inputs, createSubTasks logic
 */

import { describe, it, expect, vi } from 'vitest'
import {
  calculateFission,
  calculateTotalSubTasks,
  createSubTaskSpecs,
  type TaskConfig,
  type SubTaskSpec,
} from '../../../src/services/task-orchestrator'
import type { ExpandedPrompt } from '../../../src/lib/types'

describe('TaskOrchestrator', () => {
  // ============================================
  // Test Data Factories
  // ============================================

  const createExpandedPrompt = (overrides?: Partial<ExpandedPrompt>): ExpandedPrompt => ({
    variantId: 'variant-1',
    variantName: 'Realistic',
    originalPrompt: 'a cat',
    expandedPrompt: 'a cat, high quality, detailed',
    subjectSlug: 'a-cat',
    ...overrides,
  })

  const createTaskConfig = (overrides?: Partial<TaskConfig>): TaskConfig => ({
    taskId: 'task-123',
    expandedPrompts: [createExpandedPrompt()],
    selectedStyles: ['ghibli', 'cyberpunk'],
    selectedModels: ['flux-pro', 'dalle-3'],
    batchSize: 2,
    includeBaseStyle: true,
    ...overrides,
  })

  // ============================================
  // calculateTotalSubTasks
  // ============================================

  describe('calculateTotalSubTasks', () => {
    it('should calculate total with formula: prompts * styles * models * batch', () => {
      // 2 prompts * 3 styles * 2 models * 2 batch = 24
      const total = calculateTotalSubTasks({
        promptCount: 2,
        styleCount: 3,
        modelCount: 2,
        batchSize: 2,
      })

      expect(total).toBe(24)
    })

    it('should handle single values', () => {
      const total = calculateTotalSubTasks({
        promptCount: 1,
        styleCount: 1,
        modelCount: 1,
        batchSize: 1,
      })

      expect(total).toBe(1)
    })

    it('should return 0 if any count is 0', () => {
      const total = calculateTotalSubTasks({
        promptCount: 3,
        styleCount: 0,
        modelCount: 2,
        batchSize: 2,
      })

      expect(total).toBe(0)
    })

    it('should handle large batch sizes', () => {
      // 3 prompts * 5 styles * 3 models * 50 batch = 2250
      const total = calculateTotalSubTasks({
        promptCount: 3,
        styleCount: 5,
        modelCount: 3,
        batchSize: 50,
      })

      expect(total).toBe(2250)
    })
  })

  // ============================================
  // calculateFission
  // ============================================

  describe('calculateFission', () => {
    it('should return correct total with includeBaseStyle=true', () => {
      const config = createTaskConfig({
        expandedPrompts: [createExpandedPrompt()],
        selectedStyles: ['ghibli', 'cyberpunk'],
        selectedModels: ['flux-pro'],
        batchSize: 1,
        includeBaseStyle: true,
      })

      // 1 prompt * (2 selected + 1 base) styles * 1 model * 1 batch = 3
      const result = calculateFission(config)

      expect(result.total).toBe(3)
      expect(result.breakdown.promptCount).toBe(1)
      expect(result.breakdown.styleCount).toBe(3) // includes base
      expect(result.breakdown.modelCount).toBe(1)
    })

    it('should return correct total with includeBaseStyle=false', () => {
      const config = createTaskConfig({
        expandedPrompts: [createExpandedPrompt()],
        selectedStyles: ['ghibli', 'cyberpunk'],
        selectedModels: ['flux-pro'],
        batchSize: 1,
        includeBaseStyle: false,
      })

      // 1 prompt * 2 styles * 1 model * 1 batch = 2
      const result = calculateFission(config)

      expect(result.total).toBe(2)
      expect(result.breakdown.styleCount).toBe(2)
    })

    it('should include warning when total exceeds 500', () => {
      const config = createTaskConfig({
        expandedPrompts: [
          createExpandedPrompt({ variantId: 'v1' }),
          createExpandedPrompt({ variantId: 'v2' }),
          createExpandedPrompt({ variantId: 'v3' }),
        ],
        selectedStyles: ['ghibli', 'cyberpunk', 'watercolor', 'noir'],
        selectedModels: ['flux-pro', 'dalle-3', 'nano-banana'],
        batchSize: 20,
        includeBaseStyle: true,
      })

      // 3 prompts * 5 styles * 3 models * 20 batch = 900
      const result = calculateFission(config)

      expect(result.total).toBe(900)
      expect(result.warning).toBeDefined()
      expect(result.warning).toContain('Large batch')
    })

    it('should not include warning when total is at or below 500', () => {
      const config = createTaskConfig({
        expandedPrompts: [createExpandedPrompt()],
        selectedStyles: ['ghibli'],
        selectedModels: ['flux-pro'],
        batchSize: 100,
        includeBaseStyle: true,
      })

      // 1 * 2 * 1 * 100 = 200
      const result = calculateFission(config)

      expect(result.total).toBe(200)
      expect(result.warning).toBeUndefined()
    })

    it('should not duplicate base style if already included', () => {
      const config = createTaskConfig({
        expandedPrompts: [createExpandedPrompt()],
        selectedStyles: ['base', 'ghibli'], // base already selected
        selectedModels: ['flux-pro'],
        batchSize: 1,
        includeBaseStyle: true,
      })

      // 1 prompt * 2 styles (base already there) * 1 model * 1 batch = 2
      const result = calculateFission(config)

      expect(result.total).toBe(2)
      expect(result.breakdown.styleCount).toBe(2)
    })
  })

  // ============================================
  // createSubTaskSpecs
  // ============================================

  describe('createSubTaskSpecs', () => {
    it('should generate correct number of sub-tasks', () => {
      const config = createTaskConfig({
        expandedPrompts: [createExpandedPrompt()],
        selectedStyles: ['ghibli'],
        selectedModels: ['flux-pro'],
        batchSize: 2,
        includeBaseStyle: true,
      })

      // 1 * 2 * 1 * 2 = 4
      const specs = createSubTaskSpecs(config)

      expect(specs).toHaveLength(4)
    })

    it('should create sub-tasks for all combinations', () => {
      const config = createTaskConfig({
        expandedPrompts: [
          createExpandedPrompt({ variantId: 'v1', variantName: 'Realistic' }),
          createExpandedPrompt({ variantId: 'v2', variantName: 'Abstract' }),
        ],
        selectedStyles: ['ghibli'],
        selectedModels: ['flux-pro'],
        batchSize: 1,
        includeBaseStyle: true,
      })

      // 2 prompts * 2 styles * 1 model * 1 batch = 4
      const specs = createSubTaskSpecs(config)

      expect(specs).toHaveLength(4)

      // Check that we have all combinations
      const combinations = specs.map(
        (s) => `${s.expandedPrompt.variantId}-${s.styleId}-${s.modelId}-${s.batchIndex}`
      )

      expect(combinations).toContain('v1-base-flux-pro-0')
      expect(combinations).toContain('v1-ghibli-flux-pro-0')
      expect(combinations).toContain('v2-base-flux-pro-0')
      expect(combinations).toContain('v2-ghibli-flux-pro-0')
    })

    it('should include taskId in each sub-task spec', () => {
      const config = createTaskConfig({
        taskId: 'my-task-id',
        expandedPrompts: [createExpandedPrompt()],
        selectedStyles: ['ghibli'],
        selectedModels: ['flux-pro'],
        batchSize: 1,
        includeBaseStyle: false,
      })

      const specs = createSubTaskSpecs(config)

      specs.forEach((spec) => {
        expect(spec.taskId).toBe('my-task-id')
      })
    })

    it('should correctly set batch indices', () => {
      const config = createTaskConfig({
        expandedPrompts: [createExpandedPrompt()],
        selectedStyles: ['ghibli'],
        selectedModels: ['flux-pro'],
        batchSize: 3,
        includeBaseStyle: false,
      })

      // 1 * 1 * 1 * 3 = 3
      const specs = createSubTaskSpecs(config)

      expect(specs).toHaveLength(3)
      expect(specs[0].batchIndex).toBe(0)
      expect(specs[1].batchIndex).toBe(1)
      expect(specs[2].batchIndex).toBe(2)
    })

    it('should include expanded prompt data in each spec', () => {
      const prompt = createExpandedPrompt({
        variantId: 'test-variant',
        variantName: 'Test',
        expandedPrompt: 'test expanded prompt',
        subjectSlug: 'test-slug',
      })

      const config = createTaskConfig({
        expandedPrompts: [prompt],
        selectedStyles: ['ghibli'],
        selectedModels: ['flux-pro'],
        batchSize: 1,
        includeBaseStyle: false,
      })

      const specs = createSubTaskSpecs(config)

      expect(specs[0].expandedPrompt).toEqual(prompt)
    })

    it('should handle base style inclusion correctly', () => {
      const config = createTaskConfig({
        expandedPrompts: [createExpandedPrompt()],
        selectedStyles: ['ghibli', 'cyberpunk'],
        selectedModels: ['flux-pro'],
        batchSize: 1,
        includeBaseStyle: true,
      })

      const specs = createSubTaskSpecs(config)

      const styleIds = [...new Set(specs.map((s) => s.styleId))]

      expect(styleIds).toContain('base')
      expect(styleIds).toContain('ghibli')
      expect(styleIds).toContain('cyberpunk')
      expect(styleIds).toHaveLength(3)
    })

    it('should not duplicate base if already in selected styles', () => {
      const config = createTaskConfig({
        expandedPrompts: [createExpandedPrompt()],
        selectedStyles: ['base', 'ghibli'],
        selectedModels: ['flux-pro'],
        batchSize: 1,
        includeBaseStyle: true,
      })

      const specs = createSubTaskSpecs(config)

      const styleIds = [...new Set(specs.map((s) => s.styleId))]

      expect(styleIds).toContain('base')
      expect(styleIds).toContain('ghibli')
      expect(styleIds).toHaveLength(2)
    })

    it('should generate multiple model combinations', () => {
      const config = createTaskConfig({
        expandedPrompts: [createExpandedPrompt()],
        selectedStyles: ['ghibli'],
        selectedModels: ['flux-pro', 'dalle-3', 'nano-banana'],
        batchSize: 1,
        includeBaseStyle: false,
      })

      const specs = createSubTaskSpecs(config)

      const modelIds = specs.map((s) => s.modelId)

      expect(modelIds).toContain('flux-pro')
      expect(modelIds).toContain('dalle-3')
      expect(modelIds).toContain('nano-banana')
    })
  })
})
