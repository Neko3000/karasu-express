/**
 * Adapter Registry
 *
 * Central registry for all AI provider adapters.
 * Resolves adapters by modelId for use in job handlers.
 */

import { Provider } from '../lib/types'

import type { ImageGenerationAdapter } from './types'
import { createFluxAdapter } from './flux'
import { createDalleAdapter } from './dalle'
import { createNanoBananaAdapter } from './nano-banana'

// ============================================
// ADAPTER REGISTRY
// ============================================

/**
 * Registry of all available adapters by model ID
 */
const adapterRegistry = new Map<string, ImageGenerationAdapter>()

/**
 * Initialize default adapters
 * Called on module load to register built-in adapters
 */
function initializeDefaultAdapters(): void {
  // Flux adapters
  registerAdapter(createFluxAdapter('pro'))
  registerAdapter(createFluxAdapter('dev'))
  registerAdapter(createFluxAdapter('schnell'))

  // DALL-E adapter
  registerAdapter(createDalleAdapter())

  // Nano Banana adapter
  registerAdapter(createNanoBananaAdapter())
}

// ============================================
// REGISTRY FUNCTIONS
// ============================================

/**
 * Register an adapter in the registry
 *
 * @param adapter - Adapter instance to register
 */
export function registerAdapter(adapter: ImageGenerationAdapter): void {
  adapterRegistry.set(adapter.modelId, adapter)
}

/**
 * Get an adapter by model ID
 *
 * @param modelId - Model identifier (e.g., 'flux-pro', 'dalle-3')
 * @returns Adapter instance or undefined if not found
 */
export function getAdapter(modelId: string): ImageGenerationAdapter | undefined {
  return adapterRegistry.get(modelId)
}

/**
 * Get an adapter by model ID, throwing if not found
 *
 * @param modelId - Model identifier
 * @returns Adapter instance
 * @throws Error if adapter not found
 */
export function getAdapterOrThrow(modelId: string): ImageGenerationAdapter {
  const adapter = adapterRegistry.get(modelId)
  if (!adapter) {
    throw new Error(`No adapter found for model: ${modelId}`)
  }
  return adapter
}

/**
 * Get all registered adapters
 *
 * @returns Array of all adapter instances
 */
export function getAllAdapters(): ImageGenerationAdapter[] {
  return Array.from(adapterRegistry.values())
}

/**
 * Get adapters by provider
 *
 * @param provider - Provider identifier
 * @returns Array of adapters for the specified provider
 */
export function getAdaptersByProvider(
  provider: Provider
): ImageGenerationAdapter[] {
  return getAllAdapters().filter((adapter) => adapter.providerId === provider)
}

/**
 * Get all registered model IDs
 *
 * @returns Array of all model IDs
 */
export function getRegisteredModelIds(): string[] {
  return Array.from(adapterRegistry.keys())
}

/**
 * Check if a model ID is registered
 *
 * @param modelId - Model identifier to check
 * @returns true if model is registered
 */
export function isModelRegistered(modelId: string): boolean {
  return adapterRegistry.has(modelId)
}

/**
 * Unregister an adapter (mainly for testing)
 *
 * @param modelId - Model identifier to unregister
 * @returns true if adapter was removed
 */
export function unregisterAdapter(modelId: string): boolean {
  return adapterRegistry.delete(modelId)
}

/**
 * Clear all registered adapters (mainly for testing)
 */
export function clearRegistry(): void {
  adapterRegistry.clear()
}

/**
 * Reset registry to default adapters
 */
export function resetRegistry(): void {
  clearRegistry()
  initializeDefaultAdapters()
}

// ============================================
// ADAPTER INFO
// ============================================

/**
 * Information about a registered adapter
 */
export interface AdapterInfo {
  modelId: string
  displayName: string
  providerId: Provider
  supportedFeatures: string[]
  supportedAspectRatios: string[]
}

/**
 * Get information about all registered adapters
 *
 * @returns Array of adapter info objects
 */
export function getAdapterInfo(): AdapterInfo[] {
  return getAllAdapters().map((adapter) => ({
    modelId: adapter.modelId,
    displayName: adapter.displayName,
    providerId: adapter.providerId,
    supportedFeatures: ['seed', 'negativePrompt', 'batch', 'inpainting'].filter(
      (f) => adapter.supportsFeature(f as 'seed' | 'negativePrompt' | 'batch' | 'inpainting')
    ),
    supportedAspectRatios: adapter.getSupportedAspectRatios(),
  }))
}

// ============================================
// INITIALIZE
// ============================================

// Initialize default adapters on module load
initializeDefaultAdapters()

// ============================================
// RE-EXPORTS
// ============================================

export type { ImageGenerationAdapter } from './types'
export type {
  ImageGenerationParams,
  GenerationResult,
  GeneratedImage,
  AdapterFeature,
  AdapterConfig,
} from './types'

export { FluxAdapter, createFluxAdapter, type FluxConfig } from './flux'
export { DalleAdapter, createDalleAdapter, type DalleConfig } from './dalle'
export { NanoBananaAdapter, createNanoBananaAdapter, type NanoBananaConfig } from './nano-banana'
