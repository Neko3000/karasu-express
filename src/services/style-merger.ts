/**
 * Style Merger Utility
 *
 * Merges user prompts with style templates.
 * Handles {prompt} placeholder substitution and negative prompt combination.
 *
 * Per research.md Style Template Merging:
 * - Template-based string interpolation with placeholder {prompt}
 * - Simple and predictable behavior
 * - Matches ComfyUI/SDXL Prompt Styler conventions
 *
 * Supports both:
 * - StyleTemplate (database styles from StyleTemplates collection)
 * - ImportedStyle (styles loaded from JSON files via style-loader)
 */

import type { ImportedStyle } from '../lib/style-types'

// ============================================
// TYPES
// ============================================

/**
 * Style template definition (database or seed styles)
 */
export interface StyleTemplate {
  /** Unique style identifier */
  styleId: string
  /** Display name */
  name: string
  /** Positive prompt template (must contain {prompt}) */
  positivePrompt: string
  /** Negative prompt additions */
  negativePrompt?: string
}

/**
 * Union type for styles that can be merged
 * Both StyleTemplate and ImportedStyle have compatible shape
 */
export type MergeableStyle = StyleTemplate | ImportedStyle

/**
 * Result of merging a prompt with a style
 */
export interface MergedPrompt {
  /** Final merged positive prompt */
  finalPrompt: string
  /** Combined negative prompt */
  negativePrompt: string
  /** Style ID used for merging */
  styleId: string
  /** Style name for display */
  styleName: string
}

// ============================================
// PLACEHOLDER CONSTANT
// ============================================

/**
 * Placeholder token that must be present in style templates
 */
export const PROMPT_PLACEHOLDER = '{prompt}'

// ============================================
// MERGING FUNCTION
// ============================================

/**
 * Merge a base prompt with a style template
 *
 * Replaces the {prompt} placeholder in the style's positivePrompt
 * with the user's base prompt, and returns the merged result.
 *
 * Works with both StyleTemplate (from database) and ImportedStyle (from JSON).
 *
 * @param basePrompt - User's expanded prompt text
 * @param style - Style template to apply (StyleTemplate or ImportedStyle)
 * @returns Merged prompt with style modifiers
 *
 * @example
 * ```typescript
 * // Using StyleTemplate
 * const result = mergeStyle('a cat in the rain', {
 *   styleId: 'ghibli',
 *   name: 'Ghibli Style',
 *   positivePrompt: '{prompt}, studio ghibli style, cel shaded',
 *   negativePrompt: '3d render, realistic'
 * });
 *
 * // Using ImportedStyle (from JSON)
 * const importedStyle = getStyleById('cyberpunk');
 * const result = mergeStyle('a cat in the rain', importedStyle);
 *
 * // result.finalPrompt = 'a cat in the rain, studio ghibli style, cel shaded'
 * // result.negativePrompt = '3d render, realistic'
 * ```
 */
export function mergeStyle(basePrompt: string, style: MergeableStyle): MergedPrompt {
  // Replace the {prompt} placeholder with the base prompt
  // Note: We only replace the first occurrence, which is the standard behavior
  const finalPrompt = style.positivePrompt.replace(PROMPT_PLACEHOLDER, basePrompt)

  // Return the negative prompt as-is (empty string if not provided)
  const negativePrompt = style.negativePrompt ?? ''

  return {
    finalPrompt,
    negativePrompt,
    styleId: style.styleId,
    styleName: style.name,
  }
}

/**
 * Validate that a style template contains the required placeholder
 *
 * @param positivePrompt - The positive prompt template to validate
 * @returns true if valid, false otherwise
 */
export function validateStyleTemplate(positivePrompt: string): boolean {
  return positivePrompt.includes(PROMPT_PLACEHOLDER)
}

/**
 * Create the base style template (no modifications)
 *
 * @returns Base style template
 */
export function createBaseStyle(): StyleTemplate {
  return {
    styleId: 'base',
    name: 'Base (No Style)',
    positivePrompt: PROMPT_PLACEHOLDER,
    negativePrompt: '',
  }
}

/**
 * Merge multiple styles with a prompt (for preview purposes)
 *
 * Works with both StyleTemplate (from database) and ImportedStyle (from JSON).
 *
 * @param basePrompt - User's base prompt
 * @param styles - Array of style templates (StyleTemplate or ImportedStyle)
 * @returns Array of merged prompts
 */
export function mergeMultipleStyles(
  basePrompt: string,
  styles: MergeableStyle[]
): MergedPrompt[] {
  return styles.map((style) => mergeStyle(basePrompt, style))
}

/**
 * Combine negative prompts from multiple sources
 *
 * @param negativePrompts - Array of negative prompt strings
 * @returns Combined negative prompt
 */
export function combineNegativePrompts(negativePrompts: string[]): string {
  return negativePrompts
    .filter((prompt) => prompt && prompt.trim().length > 0)
    .join(', ')
}
