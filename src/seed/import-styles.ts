/**
 * Style Import Utility
 *
 * Imports style templates from sdxl_styles_exp.json file.
 * Converts JSON format to StyleTemplateData format for database seeding.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

/**
 * JSON style format from sdxl_styles_exp.json
 */
export interface JsonStyle {
  name: string
  prompt: string
  negative_prompt: string
}

/**
 * Style template data format for database
 */
export interface StyleTemplateData {
  styleId: string
  name: string
  description: string
  positivePrompt: string
  negativePrompt: string
  isSystem: boolean
}

/**
 * Generate a kebab-case styleId from a style name.
 *
 * Examples:
 * - "3D Model" -> "3d-model"
 * - "Abstract Expressionism 2" -> "abstract-expressionism-2"
 * - "Art Nouveau" -> "art-nouveau"
 * - "ads-food photography" -> "ads-food-photography"
 *
 * @param name - The style name to convert
 * @returns A kebab-case styleId
 */
export function generateStyleId(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}

/**
 * Transform a JSON style object to StyleTemplateData format.
 *
 * @param jsonStyle - The JSON style object from sdxl_styles_exp.json
 * @returns StyleTemplateData object ready for database insertion
 */
export function transformToStyleTemplate(jsonStyle: JsonStyle): StyleTemplateData {
  const styleId = generateStyleId(jsonStyle.name)
  const isBase = styleId === 'base'

  return {
    styleId,
    name: jsonStyle.name,
    description: '', // JSON file doesn't include descriptions
    positivePrompt: jsonStyle.prompt,
    negativePrompt: jsonStyle.negative_prompt,
    isSystem: isBase, // Only "base" style is marked as system
  }
}

/**
 * Load and parse styles from the sdxl_styles_exp.json file.
 *
 * @returns Array of StyleTemplateData objects
 */
export function loadStylesFromJson(): StyleTemplateData[] {
  // Get the directory of the current module
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)

  // Path to the JSON file
  const jsonPath = path.resolve(__dirname, '../resources/original/sdxl_styles_exp.json')

  // Read and parse the JSON file
  const jsonContent = fs.readFileSync(jsonPath, 'utf-8')
  const jsonStyles: JsonStyle[] = JSON.parse(jsonContent)

  // Transform each style to StyleTemplateData format
  return jsonStyles.map(transformToStyleTemplate)
}

/**
 * Get the total count of styles in the JSON file.
 *
 * @returns Number of styles
 */
export function getStylesCount(): number {
  return loadStylesFromJson().length
}
