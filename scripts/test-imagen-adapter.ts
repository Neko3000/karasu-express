/**
 * Manual Test Script for Imagen Adapter
 *
 * This script tests the Imagen adapter with a real Google AI API key.
 *
 * Usage:
 *   1. Set GOOGLE_AI_API_KEY environment variable
 *   2. Run: npx tsx scripts/test-imagen-adapter.ts
 *
 * Expected output: A generated image saved to scripts/output/test-imagen.png
 */

import { createImagenAdapter } from '../src/adapters/imagen'
import { AspectRatio } from '../src/lib/types'
import * as fs from 'fs'
import * as path from 'path'

async function main() {
  console.log('=== Imagen Adapter Manual Test ===\n')

  // Check for API key
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    console.error('ERROR: GOOGLE_AI_API_KEY environment variable is required')
    console.error('Get your API key from: https://aistudio.google.com/apikey')
    process.exit(1)
  }

  console.log('API key found: ' + apiKey.substring(0, 8) + '...')

  // Create adapter
  const adapter = createImagenAdapter({ apiKey })

  console.log('\nAdapter Info:')
  console.log('  Model ID:', adapter.modelId)
  console.log('  Display Name:', adapter.displayName)
  console.log('  Provider ID:', adapter.providerId)
  console.log('  Supported Features:', ['batch'].join(', '))
  console.log('  Supported Aspect Ratios:', adapter.getSupportedAspectRatios().join(', '))

  // Generate image
  const prompt = 'A cute robot holding a rainbow umbrella in the rain, digital art, colorful, vibrant'
  console.log('\n--- Generating Image ---')
  console.log('Prompt:', prompt)
  console.log('Aspect Ratio: Square (1:1)')
  console.log('\nPlease wait...')

  try {
    const startTime = Date.now()
    const result = await adapter.generate({
      prompt,
      aspectRatio: AspectRatio.Square,
    })
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)

    console.log(`\n--- Success! (${duration}s) ---`)
    console.log('Images generated:', result.images.length)
    console.log('Seed:', result.seed)

    // Save the image
    const outputDir = path.join(__dirname, 'output')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    for (let i = 0; i < result.images.length; i++) {
      const image = result.images[i]
      const outputPath = path.join(outputDir, `test-imagen-${i + 1}.png`)

      // Extract base64 data from data URL
      const base64Data = image.url.replace(/^data:image\/\w+;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')

      fs.writeFileSync(outputPath, buffer)
      console.log(`\nImage ${i + 1} saved to: ${outputPath}`)
      console.log(`  Size: ${image.width}x${image.height}`)
      console.log(`  Content Type: ${image.contentType}`)
    }

    console.log('\n=== Test Completed Successfully ===')
  } catch (error) {
    console.error('\n--- Error ---')
    if (error instanceof Error) {
      console.error('Message:', error.message)
    } else {
      console.error('Error:', error)
    }

    // Try to normalize the error
    const normalized = adapter.normalizeError(error)
    console.error('\nNormalized Error:')
    console.error('  Category:', normalized.category)
    console.error('  Message:', normalized.message)
    console.error('  Retryable:', normalized.retryable)
    console.error('  Provider Code:', normalized.providerCode)

    process.exit(1)
  }
}

main().catch(console.error)
