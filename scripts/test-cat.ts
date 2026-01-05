import 'dotenv/config'
import { createNanoBananaAdapter } from '../src/adapters/nano-banana'
import { AspectRatio } from '../src/lib/types'
import * as fs from 'fs'
import * as path from 'path'

async function main() {
  console.log('Testing Gemini 3 Pro Image API...')
  console.log('Model: gemini-3-pro-image-preview')
  console.log('API Key:', process.env.GOOGLE_AI_API_KEY?.substring(0, 10) + '...\n')

  const adapter = createNanoBananaAdapter()
  const prompt =
    'A cute fluffy orange cat sitting on a windowsill, looking outside at the rain, cozy atmosphere, warm lighting, digital art'

  console.log('Prompt:', prompt)
  console.log('\nGenerating image... (this may take 30-60 seconds)\n')

  try {
    const startTime = Date.now()
    const result = await adapter.generate({
      prompt,
      aspectRatio: AspectRatio.Square,
    })
    const duration = ((Date.now() - startTime) / 1000).toFixed(1)

    console.log(`Success! Generated in ${duration}s`)
    console.log('Images:', result.images.length)

    // Save image
    const outputDir = './scripts/output'
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const image = result.images[0]
    const base64Data = image.url.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    const outputPath = path.join(outputDir, 'cat-test.png')
    fs.writeFileSync(outputPath, buffer)

    console.log('\nImage saved to:', outputPath)
    console.log('Size:', image.width, 'x', image.height)
    console.log('\n✅ API is working correctly!')
  } catch (error: unknown) {
    console.error('\n❌ Error occurred:')
    console.error('Full error:', JSON.stringify(error, null, 2))
    if (error instanceof Error) {
      console.error('Message:', error.message)
      console.error('Stack:', error.stack)
    }
    const errObj = error as Record<string, unknown>
    if (errObj.category) {
      console.error('Category:', errObj.category)
      console.error('Retryable:', errObj.retryable)
      console.error('Original Error:', errObj.originalError)
    }
    process.exit(1)
  }
}

main()
